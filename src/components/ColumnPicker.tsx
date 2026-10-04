'use client'

import { useEffect, useRef, useState } from 'react'

export interface Coluna {
  chave: string
  rotulo: string
  padrao: boolean
}

/**
 * A escolha de colunas é conveniência de quem está olhando, não dado do
 * sistema, então vive no navegador. Toda leitura é protegida: em aba anônima
 * ou com armazenamento bloqueado o acesso lança, e a tabela tem que continuar
 * aparecendo com o padrão.
 */
function carregar(chaveArmazenamento: string, colunas: Coluna[]): string[] {
  const padrao = colunas.filter((c) => c.padrao).map((c) => c.chave)

  try {
    const salvo = localStorage.getItem(chaveArmazenamento)
    if (!salvo) return padrao

    const lista = JSON.parse(salvo)
    if (!Array.isArray(lista) || !lista.length) return padrao

    // Descarta chaves que não existem mais, senão uma coluna removida do
    // código deixaria a seleção salva apontando para o vazio.
    const validas = lista.filter((chave) => colunas.some((c) => c.chave === chave))

    return validas.length ? validas : padrao
  } catch {
    return padrao
  }
}

export function useColunas(chaveArmazenamento: string, colunas: Coluna[]) {
  const [visiveis, setVisiveis] = useState<string[]>(() =>
    colunas.filter((c) => c.padrao).map((c) => c.chave)
  )

  // Só depois da montagem, porque localStorage não existe na renderização do
  // servidor e leria undefined.
  useEffect(() => {
    setVisiveis(carregar(chaveArmazenamento, colunas))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chaveArmazenamento])

  function alternar(chave: string) {
    setVisiveis((atual) => {
      const proximo = atual.includes(chave)
        ? atual.filter((c) => c !== chave)
        : [...atual, chave]

      // Sem nenhuma coluna a tabela fica inutilizável.
      if (!proximo.length) return atual

      try {
        localStorage.setItem(chaveArmazenamento, JSON.stringify(proximo))
      } catch {
        // Armazenamento indisponível: vale para esta sessão e pronto.
      }

      return proximo
    })
  }

  return { visiveis, alternar, mostra: (chave: string) => visiveis.includes(chave) }
}

export function ColumnPicker({
  colunas,
  visiveis,
  onAlternar,
}: {
  colunas: Coluna[]
  visiveis: string[]
  onAlternar: (chave: string) => void
}) {
  const [aberto, setAberto] = useState(false)
  const container = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!aberto) return

    function aoClicarFora(evento: MouseEvent) {
      if (!container.current?.contains(evento.target as Node)) setAberto(false)
    }

    document.addEventListener('mousedown', aoClicarFora)

    return () => document.removeEventListener('mousedown', aoClicarFora)
  }, [aberto])

  return (
    <div className="relative" ref={container}>
      <button
        onClick={() => setAberto((a) => !a)}
        className="px-3 py-2 bg-[#0F172A] border border-slate-700 text-slate-300 rounded text-sm hover:bg-[#334155] hover:text-white transition-colors"
      >
        Colunas ({visiveis.length})
      </button>

      {aberto && (
        <div className="absolute right-0 mt-2 w-56 bg-[#0F172A] border border-slate-700 rounded-lg shadow-xl z-20 p-2 max-h-80 overflow-y-auto">
          {colunas.map((coluna) => (
            <label
              key={coluna.chave}
              className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#1E293B] cursor-pointer"
            >
              <input
                type="checkbox"
                checked={visiveis.includes(coluna.chave)}
                onChange={() => onAlternar(coluna.chave)}
                className="w-4 h-4 bg-[#1E293B] border-slate-700 rounded text-[#38BDF8] focus:ring-2 focus:ring-[#38BDF8]"
              />
              <span className="text-sm text-slate-300">{coluna.rotulo}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}
