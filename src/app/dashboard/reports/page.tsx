'use client'

import { useEffect, useState } from 'react'
import { formatCurrency } from '@/lib/utils'

interface Agrupamento {
  chave: string
  vendas: number
  itens: number
  receita: number
  comissao: number
  comissaoConfirmada: number
}

interface Relatorio {
  totais: {
    vendas: number
    canceladas: number
    receita: number
    comissao: number
    comissaoConfirmada: number
    comissaoPendente: number
  }
  porProduto: Agrupamento[]
  porOrigem: Agrupamento[]
  porCategoria: Agrupamento[]
  porLoja: Agrupamento[]
  porDispositivo: Agrupamento[]
  porComprador: Agrupamento[]
  porDia: Agrupamento[]
}

function iso(data: Date) {
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')

  return `${data.getFullYear()}-${mes}-${dia}`
}

function diasAtras(dias: number) {
  return iso(new Date(Date.now() - dias * 24 * 60 * 60 * 1000))
}

/** O servidor roda em UTC; o recorte precisa ser o dia de quem está olhando. */
function instanteLocal(data: string, fimDoDia: boolean) {
  const [ano, mes, dia] = data.split('-').map(Number)

  return fimDoDia
    ? new Date(ano, mes - 1, dia, 23, 59, 59, 999).toISOString()
    : new Date(ano, mes - 1, dia, 0, 0, 0, 0).toISOString()
}

const ROTULOS: Record<string, string> = {
  APP: 'Aplicativo',
  WEB: 'Navegador',
  NEW: 'Comprador novo',
  EXISTING: 'Comprador recorrente',
}

function Tabela({
  titulo,
  descricao,
  dados,
  rotuloColuna,
}: {
  titulo: string
  descricao: string
  dados: Agrupamento[]
  rotuloColuna: string
}) {
  const maior = Math.max(...dados.map((d) => d.comissao), 0)

  return (
    <div className="bg-[#1E293B] rounded-lg border border-slate-800 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-800">
        <h2 className="text-lg font-semibold text-white">{titulo}</h2>
        <p className="text-sm text-slate-400 mt-1">{descricao}</p>
      </div>

      {dados.length === 0 ? (
        <p className="px-6 py-10 text-center text-slate-400 text-sm">
          Nenhum dado no período selecionado.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#0F172A] border-b border-slate-800">
              <tr>
                {[rotuloColuna, 'Vendas', 'Itens', 'Receita', 'Comissão', 'Confirmada'].map((c) => (
                  <th
                    key={c}
                    className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider"
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {dados.map((linha) => (
                <tr key={linha.chave} className="hover:bg-[#0F172A] transition-colors">
                  <td className="px-4 py-3 max-w-md">
                    <p className="text-sm text-white truncate" title={linha.chave}>
                      {ROTULOS[linha.chave] || linha.chave}
                    </p>
                    {/* Barra proporcional: a ordem por si só não mostra se o
                        primeiro lidera por pouco ou domina o período. */}
                    <div className="mt-1 h-1 bg-[#0F172A] rounded overflow-hidden">
                      <div
                        className="h-full bg-[#38BDF8]"
                        style={{ width: `${maior ? (linha.comissao / maior) * 100 : 0}%` }}
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-300 whitespace-nowrap">
                    {linha.vendas}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-300 whitespace-nowrap">
                    {linha.itens}
                  </td>
                  <td className="px-4 py-3 text-sm text-white whitespace-nowrap">
                    {formatCurrency(linha.receita)}
                  </td>
                  <td className="px-4 py-3 text-sm text-green-400 font-medium whitespace-nowrap">
                    {formatCurrency(linha.comissao)}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-400 whitespace-nowrap">
                    {formatCurrency(linha.comissaoConfirmada)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default function ReportsPage() {
  const [from, setFrom] = useState(diasAtras(30))
  const [to, setTo] = useState(iso(new Date()))
  const [relatorio, setRelatorio] = useState<Relatorio | null>(null)
  const [loading, setLoading] = useState(true)
  const [exportando, setExportando] = useState(false)

  useEffect(() => {
    let cancelado = false

    async function carregar() {
      setLoading(true)

      try {
        const params = new URLSearchParams({
          from: instanteLocal(from, false),
          to: instanteLocal(to, true),
        })

        const res = await fetch(`/api/reports?${params}`)
        const data = await res.json()

        // Resposta de um filtro antigo não pode sobrescrever o atual.
        if (cancelado) return

        setRelatorio(data.totais ? data : null)
      } catch (error) {
        console.error('Error loading report:', error)
      } finally {
        if (!cancelado) setLoading(false)
      }
    }

    carregar()

    return () => {
      cancelado = true
    }
  }, [from, to])

  /** Exporta as vendas do mesmo período, não os agrupamentos. */
  async function exportarCSV() {
    setExportando(true)

    try {
      const params = new URLSearchParams({
        from: instanteLocal(from, false),
        to: instanteLocal(to, true),
      })

      const res = await fetch(`/api/sales?${params}`)
      const data = await res.json()
      const vendas = Array.isArray(data.sales) ? data.sales : []

      const colunas = [
        'Data',
        'Pedido',
        'Produto',
        'Loja',
        'Categoria',
        'Origem',
        'Dispositivo',
        'Comprador',
        'Quantidade',
        'Valor',
        'Comissao',
        'Status',
      ]

      // Aspas internas dobradas e campo entre aspas: nome de produto com
      // vírgula é a regra, não a exceção, e quebraria as colunas.
      const escapar = (valor: unknown) => `"${String(valor ?? '').replace(/"/g, '""')}"`

      const linhas = vendas.map((v: any) =>
        [
          new Date(v.purchasedAt).toLocaleString('pt-BR'),
          v.orderNumber,
          v.productName,
          v.shopName,
          v.categoryName,
          v.channelType || v.referrer,
          v.device,
          v.buyerType,
          v.quantity,
          // Vírgula decimal, que é o que o Excel em português espera.
          String(v.amount ?? 0).replace('.', ','),
          String(v.commission ?? 0).replace('.', ','),
          v.status,
        ]
          .map(escapar)
          .join(';')
      )

      // BOM para o Excel reconhecer UTF-8 e não estropiar os acentos.
      const csv = '﻿' + [colunas.map(escapar).join(';'), ...linhas].join('\n')
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))

      const link = document.createElement('a')
      link.href = url
      link.download = `vendas-${from}-a-${to}.csv`
      link.click()

      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting:', error)
    } finally {
      setExportando(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Relatórios</h1>
        <p className="text-slate-400 mt-1">Análises por produto, origem e período</p>
      </div>

      {/* Filtros */}
      <div className="bg-[#1E293B] rounded-lg border border-slate-800 p-4 flex flex-wrap items-end gap-4">
        <div className="flex gap-2">
          {[
            { rotulo: '7 dias', dias: 7 },
            { rotulo: '30 dias', dias: 30 },
            { rotulo: '90 dias', dias: 90 },
          ].map((periodo) => (
            <button
              key={periodo.rotulo}
              onClick={() => {
                setFrom(diasAtras(periodo.dias))
                setTo(iso(new Date()))
              }}
              className="px-3 py-2 bg-[#0F172A] border border-slate-700 text-slate-300 rounded text-sm hover:bg-[#334155] hover:text-white transition-colors"
            >
              {periodo.rotulo}
            </button>
          ))}
        </div>

        <div>
          <label htmlFor="from" className="block text-xs font-medium text-slate-400 mb-1">
            De
          </label>
          <input
            id="from"
            type="date"
            value={from}
            max={to}
            onChange={(e) => setFrom(e.target.value)}
            className="px-3 py-2 bg-[#0F172A] border border-slate-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
          />
        </div>

        <div>
          <label htmlFor="to" className="block text-xs font-medium text-slate-400 mb-1">
            Até
          </label>
          <input
            id="to"
            type="date"
            value={to}
            min={from}
            onChange={(e) => setTo(e.target.value)}
            className="px-3 py-2 bg-[#0F172A] border border-slate-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
          />
        </div>

        {loading && <span className="text-sm text-slate-400 pb-2">Carregando...</span>}

        <button
          onClick={exportarCSV}
          disabled={exportando}
          className="ml-auto px-4 py-2 bg-[#38BDF8] text-white rounded text-sm hover:bg-[#0EA5E9] transition-colors disabled:opacity-50"
        >
          {exportando ? 'Gerando...' : 'Exportar vendas (CSV)'}
        </button>
      </div>

      {relatorio && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-[#1E293B] rounded-lg border border-slate-800 p-6">
              <p className="text-slate-400 text-sm font-medium mb-2">Vendas</p>
              <p className="text-3xl font-bold text-white">{relatorio.totais.vendas}</p>
              {relatorio.totais.canceladas > 0 && (
                <p className="text-sm text-red-400 mt-2">
                  {relatorio.totais.canceladas} canceladas
                </p>
              )}
            </div>

            <div className="bg-[#1E293B] rounded-lg border border-slate-800 p-6">
              <p className="text-slate-400 text-sm font-medium mb-2">Receita gerada</p>
              <p className="text-3xl font-bold text-white">
                {formatCurrency(relatorio.totais.receita)}
              </p>
            </div>

            <div className="bg-[#1E293B] rounded-lg border border-slate-800 p-6">
              <p className="text-slate-400 text-sm font-medium mb-2">Comissão confirmada</p>
              <p className="text-3xl font-bold text-green-400">
                {formatCurrency(relatorio.totais.comissaoConfirmada)}
              </p>
            </div>

            <div className="bg-[#1E293B] rounded-lg border border-slate-800 p-6">
              <p className="text-slate-400 text-sm font-medium mb-2">Comissão a receber</p>
              <p className="text-3xl font-bold text-white">
                {formatCurrency(relatorio.totais.comissaoPendente)}
              </p>
              <p className="text-xs text-slate-500 mt-2">
                Liberada quando o comprador confirma o recebimento
              </p>
            </div>
          </div>

          <Tabela
            titulo="Desempenho por produto"
            descricao="Qual produto gera mais comissão no período"
            dados={relatorio.porProduto}
            rotuloColuna="Produto"
          />

          <Tabela
            titulo="Origem do tráfego"
            descricao="De onde vieram as vendas, segundo a Shopee"
            dados={relatorio.porOrigem}
            rotuloColuna="Origem"
          />

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Tabela
              titulo="Por categoria"
              descricao="Categorias que mais rendem"
              dados={relatorio.porCategoria}
              rotuloColuna="Categoria"
            />

            <Tabela
              titulo="Por loja"
              descricao="Lojas com mais vendas suas"
              dados={relatorio.porLoja}
              rotuloColuna="Loja"
            />

            <Tabela
              titulo="Por dispositivo"
              descricao="Aplicativo contra navegador"
              dados={relatorio.porDispositivo}
              rotuloColuna="Dispositivo"
            />

            <Tabela
              titulo="Por tipo de comprador"
              descricao="Novos contra recorrentes na Shopee"
              dados={relatorio.porComprador}
              rotuloColuna="Comprador"
            />
          </div>

          <Tabela
            titulo="Evolução diária"
            descricao="Comissão por dia de compra"
            dados={relatorio.porDia}
            rotuloColuna="Dia"
          />
        </>
      )}

      <div className="bg-[#1E293B] rounded-lg border border-amber-900/50 p-6">
        <h3 className="text-sm font-semibold text-amber-400 mb-2">
          O que ainda não dá para calcular
        </h3>
        <p className="text-sm text-slate-400">
          ROAS, CPA e retorno por anúncio dependem do <strong>gasto</strong>, que viria da conta
          de anúncios do Meta. Como os anúncios são turbinados pelo Instagram sem conta de
          anúncios vinculada, esse dado não está disponível pela API — então nenhum número de
          retorno é exibido aqui, em vez de mostrar um cálculo pela metade.
        </p>
      </div>
    </div>
  )
}
