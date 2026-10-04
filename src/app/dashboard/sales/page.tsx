'use client'

import { useEffect, useState } from 'react'
import { useFilter } from '@/components/FilterContext'
import { AccountFilter } from '@/components/AccountFilter'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ColumnPicker, useColunas, type Coluna } from '@/components/ColumnPicker'

/** Pedido fica fora do padrão: era ela que empurrava o status para fora. */
const COLUNAS: Coluna[] = [
  { chave: 'data', rotulo: 'Data', padrao: true },
  { chave: 'produto', rotulo: 'Produto', padrao: true },
  { chave: 'loja', rotulo: 'Loja', padrao: false },
  { chave: 'origem', rotulo: 'Origem', padrao: true },
  { chave: 'categoria', rotulo: 'Categoria', padrao: false },
  { chave: 'dispositivo', rotulo: 'Dispositivo', padrao: false },
  { chave: 'comprador', rotulo: 'Comprador', padrao: false },
  { chave: 'pedido', rotulo: 'Pedido', padrao: false },
  { chave: 'valor', rotulo: 'Valor', padrao: true },
  { chave: 'comissao', rotulo: 'Comissão', padrao: true },
  { chave: 'status', rotulo: 'Status', padrao: true },
]

const DISPOSITIVO: Record<string, string> = { APP: 'Aplicativo', WEB: 'Navegador' }
const COMPRADOR: Record<string, string> = { NEW: 'Novo', EXISTING: 'Recorrente' }

interface Sale {
  id: string
  orderNumber?: string
  amount: number
  commission: number
  status: string
  purchasedAt: string
  confirmedAt?: string
  productName?: string | null
  shopName?: string | null
  channelType?: string | null
  referrer?: string | null
  categoryName?: string | null
  device?: string | null
  buyerType?: string | null
  product?: { name: string }
  link?: { shortCode: string }
  shopeeAccount?: { accountName: string }
}

interface Resumo {
  total: number
  receitaConfirmada: number
  comissaoConfirmada: number
  comissaoPendente: number
  porStatus: Record<string, number>
}

const STATUS_INFO: Record<string, { rotulo: string; classe: string }> = {
  confirmed: { rotulo: 'Confirmada', classe: 'bg-green-500/10 text-green-400' },
  pending: { rotulo: 'Aguardando liberação', classe: 'bg-yellow-500/10 text-yellow-400' },
  unpaid: { rotulo: 'Aguardando pagamento', classe: 'bg-sky-500/10 text-sky-400' },
  cancelled: { rotulo: 'Cancelada', classe: 'bg-red-500/10 text-red-400' },
}

/**
 * Datas no formato do input type="date", montadas a partir dos componentes
 * locais. toISOString() daria a data em UTC, e à noite no Brasil isso já é o
 * dia seguinte — "Hoje" selecionaria amanhã.
 */
function iso(data: Date) {
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')

  return `${data.getFullYear()}-${mes}-${dia}`
}

function diasAtras(dias: number) {
  return iso(new Date(Date.now() - dias * 24 * 60 * 60 * 1000))
}

/**
 * O servidor roda em UTC, então enviar só "2026-10-04" faria ele recortar o
 * dia em UTC enquanto a tela mostra horário local — venda das 21h de ontem
 * apareceria como sendo de hoje. Convertendo aqui, o recorte usa o fuso de
 * quem está olhando.
 */
function instanteLocal(data: string, fimDoDia: boolean) {
  const [ano, mes, dia] = data.split('-').map(Number)

  return fimDoDia
    ? new Date(ano, mes - 1, dia, 23, 59, 59, 999).toISOString()
    : new Date(ano, mes - 1, dia, 0, 0, 0, 0).toISOString()
}

const PERIODOS = [
  { rotulo: 'Hoje', dias: 0 },
  { rotulo: '7 dias', dias: 7 },
  { rotulo: '30 dias', dias: 30 },
  { rotulo: '90 dias', dias: 90 },
]

export default function SalesPage() {
  const { selectedAccountId } = useFilter()
  const [sales, setSales] = useState<Sale[]>([])
  const [resumo, setResumo] = useState<Resumo>({
    total: 0,
    receitaConfirmada: 0,
    comissaoConfirmada: 0,
    comissaoPendente: 0,
    porStatus: {},
  })
  const [from, setFrom] = useState(diasAtras(30))
  const [to, setTo] = useState(iso(new Date()))
  const [status, setStatus] = useState('all')
  const [loading, setLoading] = useState(true)
  const { visiveis, alternar, mostra } = useColunas('afiliadoflow:colunas-vendas', COLUNAS)

  useEffect(() => {
    let cancelado = false

    async function loadSales() {
      setLoading(true)

      try {
        const params = new URLSearchParams()
        if (selectedAccountId) params.set('accountId', selectedAccountId)
        if (from) params.set('from', instanteLocal(from, false))
        if (to) params.set('to', instanteLocal(to, true))
        if (status !== 'all') params.set('status', status)

        const res = await fetch(`/api/sales?${params}`)
        const data = await res.json()

        // Respostas de filtros antigos chegando fora de ordem sobrescreveriam
        // o resultado do filtro atual.
        if (cancelado) return

        setSales(Array.isArray(data.sales) ? data.sales : [])
        if (data.resumo) setResumo(data.resumo)
      } catch (error) {
        console.error('Error loading sales:', error)
      } finally {
        if (!cancelado) setLoading(false)
      }
    }

    loadSales()

    return () => {
      cancelado = true
    }
  }, [selectedAccountId, from, to, status])

  function aplicarPeriodo(dias: number) {
    setFrom(diasAtras(dias))
    setTo(iso(new Date()))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Vendas &amp; Comissões</h1>
          <p className="text-slate-400 mt-1">Acompanhe suas vendas e ganhos</p>
        </div>
        <AccountFilter />
      </div>

      {/* Filtros */}
      <div className="bg-[#1E293B] rounded-lg border border-slate-800 p-4 flex flex-wrap items-end gap-4">
        <div className="flex gap-2">
          {PERIODOS.map((periodo) => (
            <button
              key={periodo.rotulo}
              onClick={() => aplicarPeriodo(periodo.dias)}
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

        <div>
          <label htmlFor="status" className="block text-xs font-medium text-slate-400 mb-1">
            Status
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 bg-[#0F172A] border border-slate-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
          >
            <option value="all">Todos</option>
            <option value="confirmed">Confirmada</option>
            <option value="pending">Aguardando liberação</option>
            <option value="unpaid">Aguardando pagamento</option>
            <option value="cancelled">Cancelada</option>
          </select>
        </div>

        {loading && <span className="text-sm text-slate-400 pb-2">Atualizando...</span>}

        <div className="ml-auto">
          <ColumnPicker colunas={COLUNAS} visiveis={visiveis} onAlternar={alternar} />
        </div>
      </div>

      {/* Totais do período filtrado */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#1E293B] rounded-lg border border-slate-800 p-6">
          <p className="text-slate-400 text-sm font-medium mb-2">Vendas no período</p>
          <p className="text-3xl font-bold text-white">{resumo.total}</p>
          <p className="text-sm text-slate-400 mt-2">
            {resumo.porStatus.confirmed || 0} confirmadas ·{' '}
            {resumo.porStatus.unpaid || 0} aguardando pagamento
          </p>
        </div>

        <div className="bg-[#1E293B] rounded-lg border border-slate-800 p-6">
          <p className="text-slate-400 text-sm font-medium mb-2">Comissões Confirmadas</p>
          <p className="text-3xl font-bold text-white">
            {formatCurrency(resumo.comissaoConfirmada)}
          </p>
          <p className="text-sm text-green-400 mt-2">
            Receita: {formatCurrency(resumo.receitaConfirmada)}
          </p>
        </div>

        <div className="bg-[#1E293B] rounded-lg border border-slate-800 p-6">
          <p className="text-slate-400 text-sm font-medium mb-2">Comissões a receber</p>
          <p className="text-3xl font-bold text-white">
            {formatCurrency(resumo.comissaoPendente)}
          </p>
          <p className="text-sm text-slate-400 mt-2">
            {(resumo.porStatus.pending || 0) + (resumo.porStatus.unpaid || 0)} vendas ainda não
            confirmadas
          </p>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-[#1E293B] rounded-lg border border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800">
          <h2 className="text-lg font-semibold text-white">Histórico de Vendas</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#0F172A] border-b border-slate-800">
              <tr>
                {COLUNAS.filter((c) => mostra(c.chave)).map((coluna) => (
                  <th
                    key={coluna.chave}
                    className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider"
                  >
                    {coluna.rotulo}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {sales.length === 0 && !loading && (
                <tr>
                  <td
                    colSpan={visiveis.length}
                    className="px-6 py-10 text-center text-slate-400 text-sm"
                  >
                    Nenhuma venda no período selecionado.
                  </td>
                </tr>
              )}

              {sales.map((sale) => {
                const info = STATUS_INFO[sale.status] || {
                  rotulo: sale.status,
                  classe: 'bg-slate-500/10 text-slate-400',
                }

                /* O número do pedido vai no title do produto, para continuar
                   acessível mesmo com a coluna desligada. */
                const celulas: Record<string, React.ReactNode> = {
                  data: (
                    <>
                      <p className="text-sm text-white">{formatDate(sale.purchasedAt)}</p>
                      {sale.confirmedAt && (
                        <p className="text-xs text-slate-400">
                          Conf: {formatDate(sale.confirmedAt)}
                        </p>
                      )}
                    </>
                  ),
                  pedido: <p className="text-sm text-white font-mono">{sale.orderNumber || '-'}</p>,
                  produto: (
                    <p
                      className="text-sm text-white truncate max-w-[22rem]"
                      title={`${sale.productName || ''}${
                        sale.orderNumber ? ` — pedido ${sale.orderNumber}` : ''
                      }`}
                    >
                      {sale.productName || sale.product?.name || '-'}
                    </p>
                  ),
                  loja: (
                    <p className="text-sm text-slate-300 truncate max-w-[12rem]">
                      {sale.shopName || '-'}
                    </p>
                  ),
                  origem: (
                    <>
                      <p className="text-sm text-slate-300">
                        {sale.channelType || sale.referrer || '-'}
                      </p>
                      {sale.link && (
                        <p className="text-xs text-slate-500 font-mono">/{sale.link.shortCode}</p>
                      )}
                    </>
                  ),
                  categoria: (
                    <p className="text-sm text-slate-300 truncate max-w-[12rem]">
                      {sale.categoryName || '-'}
                    </p>
                  ),
                  dispositivo: (
                    <p className="text-sm text-slate-300">
                      {DISPOSITIVO[sale.device || ''] || sale.device || '-'}
                    </p>
                  ),
                  comprador: (
                    <p className="text-sm text-slate-300">
                      {COMPRADOR[sale.buyerType || ''] || sale.buyerType || '-'}
                    </p>
                  ),
                  valor: (
                    <p className="text-sm text-white font-medium">{formatCurrency(sale.amount)}</p>
                  ),
                  comissao: (
                    <p className="text-sm text-green-400 font-medium">
                      {formatCurrency(sale.commission)}
                    </p>
                  ),
                  status: (
                    <span className={`px-2 py-1 text-xs rounded whitespace-nowrap ${info.classe}`}>
                      {info.rotulo}
                    </span>
                  ),
                }

                return (
                  <tr key={sale.id} className="hover:bg-[#0F172A] transition-colors">
                    {COLUNAS.filter((c) => mostra(c.chave)).map((coluna) => (
                      <td
                        key={coluna.chave}
                        className={`px-4 py-4 ${
                          coluna.chave === 'produto' ? '' : 'whitespace-nowrap'
                        }`}
                      >
                        {celulas[coluna.chave]}
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
