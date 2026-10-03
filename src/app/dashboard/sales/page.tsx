'use client'

import { useEffect, useState } from 'react'
import { useFilter } from '@/components/FilterContext'
import { AccountFilter } from '@/components/AccountFilter'
import { formatCurrency, formatDate } from '@/lib/utils'

interface Sale {
  id: string
  orderNumber?: string
  amount: number
  commission: number
  status: string
  purchasedAt: string
  confirmedAt?: string
  product?: { name: string }
  link?: { shortCode: string }
  shopeeAccount?: { accountName: string }
}

interface Stats {
  total: number
  totalRevenue: number
  totalCommission: number
  pendingCommission: number
  confirmedCount: number
  pendingCount: number
}

export default function SalesPage() {
  const { selectedAccountId } = useFilter()
  const [sales, setSales] = useState<Sale[]>([])
  const [stats, setStats] = useState<Stats>({
    total: 0,
    totalRevenue: 0,
    totalCommission: 0,
    pendingCommission: 0,
    confirmedCount: 0,
    pendingCount: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSales()
  }, [selectedAccountId])

  async function loadSales() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedAccountId) params.set('accountId', selectedAccountId)

      const res = await fetch(`/api/sales?${params}`)
      const data = await res.json()

      setSales(data)

      // Calculate stats
      const confirmedSales = data.filter((s: Sale) => s.status === 'confirmed')
      const pendingSales = data.filter((s: Sale) => s.status === 'pending')

      setStats({
        total: data.length,
        totalRevenue: confirmedSales.reduce((acc: number, s: Sale) => acc + s.amount, 0),
        totalCommission: confirmedSales.reduce((acc: number, s: Sale) => acc + s.commission, 0),
        pendingCommission: pendingSales.reduce((acc: number, s: Sale) => acc + s.commission, 0),
        confirmedCount: confirmedSales.length,
        pendingCount: pendingSales.length,
      })
    } catch (error) {
      console.error('Error loading sales:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-white">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Vendas & Comissões</h1>
          <p className="text-slate-400 mt-1">Acompanhe suas vendas e ganhos</p>
        </div>
        <AccountFilter />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#1E293B] rounded-lg border border-slate-800 p-6">
          <p className="text-slate-400 text-sm font-medium mb-2">Total de Vendas</p>
          <p className="text-3xl font-bold text-white">{stats.total}</p>
          <p className="text-sm text-slate-400 mt-2">{stats.confirmedCount} confirmadas</p>
        </div>

        <div className="bg-[#1E293B] rounded-lg border border-slate-800 p-6">
          <p className="text-slate-400 text-sm font-medium mb-2">Comissões Confirmadas</p>
          <p className="text-3xl font-bold text-white">{formatCurrency(stats.totalCommission)}</p>
          <p className="text-sm text-green-400 mt-2">
            Receita: {formatCurrency(stats.totalRevenue)}
          </p>
        </div>

        <div className="bg-[#1E293B] rounded-lg border border-slate-800 p-6">
          <p className="text-slate-400 text-sm font-medium mb-2">Comissões Pendentes</p>
          <p className="text-3xl font-bold text-white">
            {formatCurrency(stats.pendingCommission)}
          </p>
          <p className="text-sm text-slate-400 mt-2">
            {stats.pendingCount} aguardando confirmação
          </p>
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-[#1E293B] rounded-lg border border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800">
          <h2 className="text-lg font-semibold text-white">Histórico de Vendas</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#0F172A] border-b border-slate-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Pedido
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Produto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Conta
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Link
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Comissão
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {sales.map((sale) => (
                <tr key={sale.id} className="hover:bg-[#0F172A] transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="text-sm text-white">{formatDate(sale.purchasedAt)}</p>
                      {sale.confirmedAt && (
                        <p className="text-xs text-slate-400">
                          Conf: {formatDate(sale.confirmedAt)}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm text-white font-mono">{sale.orderNumber}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-white">{sale.product?.name || '-'}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm text-slate-300">{sale.shopeeAccount?.accountName || '-'}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm text-slate-400 font-mono">
                      {sale.link ? `/${sale.link.shortCode}` : '-'}
                    </p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm text-white font-medium">
                      {formatCurrency(sale.amount)}
                    </p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm text-green-400 font-medium">
                      {formatCurrency(sale.commission)}
                    </p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        sale.status === 'confirmed'
                          ? 'bg-green-500/10 text-green-400'
                          : sale.status === 'pending'
                          ? 'bg-yellow-500/10 text-yellow-400'
                          : 'bg-red-500/10 text-red-400'
                      }`}
                    >
                      {sale.status === 'confirmed'
                        ? 'Confirmada'
                        : sale.status === 'pending'
                        ? 'Pendente'
                        : 'Cancelada'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
