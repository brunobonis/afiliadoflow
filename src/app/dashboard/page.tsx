'use client'

import { useEffect, useState } from 'react'
import { useFilter } from '@/components/FilterContext'
import { AccountFilter } from '@/components/AccountFilter'
import { formatCurrency } from '@/lib/utils'

interface DashboardData {
  workspace: any
  totalRevenue: number
  totalCommission: number
  avgOrderValue: number
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

  const { workspace, totalRevenue, totalCommission, avgOrderValue, recentSales, topProducts, salesCount } = data
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICard title="Receita Total" value={formatCurrency(totalRevenue)} />
        <KPICard title="Ticket Médio" value={formatCurrency(avgOrderValue)} />
        <KPICard
          title="Comissões"
          value={formatCurrency(totalCommission)}
          subtitle={`${salesCount} vendas confirmadas`}
        />
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
  subtitle,
}: {
  title: string
  value: string
  subtitle?: string
}) {
  return (
    <div className="bg-[#1E293B] rounded-lg border border-slate-800 p-6">
      <p className="text-slate-400 text-sm font-medium mb-2">{title}</p>
      <p className="text-3xl font-bold text-white">{value}</p>
      {subtitle && <p className="text-sm text-slate-400 mt-2">{subtitle}</p>}
    </div>
  )
}


