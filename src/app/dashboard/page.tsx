'use client'

import { useEffect, useState } from 'react'
import { useFilter } from '@/components/FilterContext'
import { AccountFilter } from '@/components/AccountFilter'
import { formatCurrency, formatNumber, formatPercent } from '@/lib/utils'

interface DashboardData {
  workspace: any
  totalRevenue: number
  totalCommission: number
  avgOrderValue: number
  clicks: number
  conversionRate: number
  recentSales: any[]
  topProducts: any[]
  salesCount: number
}

export default function DashboardPage() {
  const { selectedAccountId } = useFilter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [selectedAccountId])

  async function loadData() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedAccountId) params.set('accountId', selectedAccountId)

      const res = await fetch(`/api/dashboard?${params}`)
      const result = await res.json()
      setData(result)
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-white">Carregando...</div>
      </div>
    )
  }

  const { workspace, totalRevenue, totalCommission, avgOrderValue, clicks, conversionRate, recentSales, topProducts, salesCount } = data
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Visão Geral</h1>
          <p className="text-slate-400 mt-1">Dashboard operacional - {workspace?.name}</p>
        </div>
        <AccountFilter />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Receita Total"
          value={formatCurrency(totalRevenue)}
          change="+14.2%"
          positive
          subtitle="vs Q1 2026"
        />
        <KPICard
          title="Taxa de Conversão"
          value={formatPercent(conversionRate, 2)}
          change="+0.38%"
          positive
          subtitle={`Benchmark: 3.10%`}
        />
        <KPICard
          title="Ticket Médio"
          value={formatCurrency(avgOrderValue)}
          change="+5.8%"
          positive
          subtitle={`Meta: R$ 138 em 2026`}
        />
        <KPICard
          title="Comissões"
          value={formatCurrency(totalCommission)}
          change="+12.4%"
          positive
          subtitle={`${salesCount} vendas confirmadas`}
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Funnel */}
        <div className="lg:col-span-2 bg-[#1E293B] rounded-lg border border-slate-800 p-6">
          <h2 className="text-lg font-semibold text-white mb-6">Funil de Conversão</h2>

          <div className="space-y-3">
            <FunnelStep
              label="1. Cliques Totais"
              value={clicks}
              percent={100}
              color="bg-[#38BDF8]"
            />
            <FunnelStep
              label="2. Produtos Visualizados"
              value={Math.floor(clicks * 0.58)}
              percent={58}
              color="bg-[#38BDF8]"
              drop="-42.0% drop"
            />
            <FunnelStep
              label="3. Add to Cart"
              value={Math.floor(clicks * 0.196)}
              percent={19.6}
              color="bg-[#22D3EE]"
              drop="-66.2% drop"
            />
            <FunnelStep
              label="4. Checkout"
              value={Math.floor(clicks * 0.034)}
              percent={3.4}
              color="bg-[#4FD1C5]"
              drop="-82.7% drop"
            />
            <FunnelStep
              label="5. Vendas"
              value={salesCount}
              percent={conversionRate}
              color="bg-[#10B981]"
              highlight={`${formatNumber(salesCount)} confirmadas`}
            />
          </div>

          <p className="text-xs text-slate-500 mt-4">
            Velocidade do Funil: Média de 3.8 dias da sessão até compra final em 2026
          </p>
        </div>

        {/* Device Split */}
        <div className="bg-[#1E293B] rounded-lg border border-slate-800 p-6">
          <h2 className="text-lg font-semibold text-white mb-6">Divisão por Dispositivo</h2>

          <div className="relative w-48 h-48 mx-auto mb-6">
            <svg viewBox="0 0 100 100" className="transform -rotate-90">
              <circle cx="50" cy="50" r="40" fill="none" stroke="#0F172A" strokeWidth="20" />
              <circle
                cx="50" cy="50" r="40"
                fill="none"
                stroke="#38BDF8"
                strokeWidth="20"
                strokeDasharray="157"
                strokeDashoffset="31.4"
              />
              <circle
                cx="50" cy="50" r="40"
                fill="none"
                stroke="#22D3EE"
                strokeWidth="20"
                strokeDasharray="157"
                strokeDashoffset="94.2"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-3xl font-bold text-white">{formatNumber(clicks)}</p>
              <p className="text-sm text-slate-400">Total Cliques</p>
            </div>
          </div>

          <div className="space-y-3">
            <DeviceStat label="Mobile (58%)" value={formatCurrency(totalRevenue * 0.58)} color="bg-[#38BDF8]" />
            <DeviceStat label="Desktop (34%)" value={formatCurrency(totalRevenue * 0.34)} color="bg-[#22D3EE]" />
            <DeviceStat label="Tablet (8%)" value={formatCurrency(totalRevenue * 0.08)} color="bg-[#F97316]" />
          </div>

          <p className="text-xs text-slate-500 mt-4">
            Mobile CR: 2.91% | Desktop CR: 4.82%
          </p>
        </div>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales */}
        <div className="bg-[#1E293B] rounded-lg border border-slate-800 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Vendas Recentes</h2>

          <div className="space-y-3">
            {recentSales.map((sale) => (
              <div key={sale.id} className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">{sale.product?.name}</p>
                  <p className="text-xs text-slate-400">{sale.orderNumber}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-white font-medium">{formatCurrency(sale.amount)}</p>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    sale.status === 'confirmed'
                      ? 'bg-green-500/10 text-green-400'
                      : 'bg-yellow-500/10 text-yellow-400'
                  }`}>
                    {sale.status === 'confirmed' ? 'Confirmada' : 'Pendente'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-[#1E293B] rounded-lg border border-slate-800 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Produtos Top</h2>

          <div className="space-y-3">
            {topProducts.map((product, index) => (
              <div key={product.id} className="flex items-center gap-4 py-2 border-b border-slate-800 last:border-0">
                <div className="text-slate-400 font-mono text-sm w-6">#{index + 1}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">{product.name}</p>
                  <p className="text-xs text-slate-400">{product._count.sales} vendas</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-white font-medium">{formatCurrency(product.commission || 0)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function KPICard({
  title,
  value,
  change,
  positive,
  subtitle
}: {
  title: string
  value: string
  change: string
  positive: boolean
  subtitle: string
}) {
  return (
    <div className="bg-[#1E293B] rounded-lg border border-slate-800 p-6">
      <p className="text-slate-400 text-sm font-medium mb-2">{title}</p>
      <p className="text-3xl font-bold text-white mb-2">{value}</p>
      <div className="flex items-center gap-2 text-xs">
        <span className={positive ? 'text-green-400' : 'text-red-400'}>{change}</span>
        <span className="text-slate-500">{subtitle}</span>
      </div>
    </div>
  )
}

function FunnelStep({
  label,
  value,
  percent,
  color,
  drop,
  highlight,
}: {
  label: string
  value: number
  percent: number
  color: string
  drop?: string
  highlight?: string
}) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-slate-300">{label}</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white">{formatNumber(value)}</span>
            <span className="text-xs text-slate-500">{formatPercent(percent, 1)}</span>
          </div>
        </div>
        <div className="h-2 bg-[#0F172A] rounded-full overflow-hidden">
          <div className={`h-full ${color}`} style={{ width: `${percent}%` }} />
        </div>
      </div>
      {drop && <span className="text-xs text-red-400 w-24 text-right">{drop}</span>}
      {highlight && <span className="text-xs text-green-400 w-24 text-right">{highlight}</span>}
    </div>
  )
}

function DeviceStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${color}`} />
        <span className="text-sm text-slate-300">{label}</span>
      </div>
      <span className="text-sm font-semibold text-white">{value}</span>
    </div>
  )
}
