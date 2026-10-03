'use client'

import { useFilter } from './FilterContext'

export function AccountFilter() {
  const { selectedAccountId, setSelectedAccountId, accounts, loading } = useFilter()

  if (loading || accounts.length === 0) {
    return null
  }

  return (
    <div className="flex items-center gap-3">
      <label className="text-sm text-slate-400 font-medium">Conta Shopee:</label>
      <select
        value={selectedAccountId || 'all'}
        onChange={(e) => setSelectedAccountId(e.target.value === 'all' ? null : e.target.value)}
        className="px-4 py-2 bg-[#0F172A] border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#38BDF8] min-w-[200px]"
      >
        <option value="all">📊 Todas as Contas</option>
        {accounts.map((account) => (
          <option key={account.id} value={account.id}>
            {account.accountName}
          </option>
        ))}
      </select>
    </div>
  )
}
