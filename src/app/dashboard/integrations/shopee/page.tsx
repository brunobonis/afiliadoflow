'use client'

import { useState, useEffect } from 'react'

interface ShopeeAccount {
  id: string
  accountName: string
  partnerId: string
  shopId?: string
  status: string
  lastSyncAt?: string
  createdAt: string
}

export default function ShopeeIntegrationsPage() {
  const [accounts, setAccounts] = useState<ShopeeAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingAccount, setEditingAccount] = useState<ShopeeAccount | null>(null)

  const [formData, setFormData] = useState({
    accountName: '',
    partnerId: '',
    partnerKey: '',
    shopId: '',
  })

  useEffect(() => {
    loadAccounts()
  }, [])

  async function loadAccounts() {
    try {
      const res = await fetch('/api/integrations/shopee')
      const data = await res.json()
      setAccounts(data)
    } catch (error) {
      console.error('Error loading accounts:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    try {
      if (editingAccount) {
        // Update
        await fetch(`/api/integrations/shopee/${editingAccount.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
      } else {
        // Create
        await fetch('/api/integrations/shopee', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
      }

      setFormData({ accountName: '', partnerId: '', partnerKey: '', shopId: '' })
      setShowForm(false)
      setEditingAccount(null)
      loadAccounts()
    } catch (error) {
      console.error('Error saving account:', error)
      alert('Erro ao salvar conta')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir esta conta?')) return

    try {
      await fetch(`/api/integrations/shopee/${id}`, {
        method: 'DELETE',
      })
      loadAccounts()
    } catch (error) {
      console.error('Error deleting account:', error)
      alert('Erro ao excluir conta')
    }
  }

  function handleEdit(account: ShopeeAccount) {
    setEditingAccount(account)
    setFormData({
      accountName: account.accountName,
      partnerId: account.partnerId,
      partnerKey: '••••••••', // Don't show real key
      shopId: account.shopId || '',
    })
    setShowForm(true)
  }

  function handleCancel() {
    setShowForm(false)
    setEditingAccount(null)
    setFormData({ accountName: '', partnerId: '', partnerKey: '', shopId: '' })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center">
        <div className="text-white">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Contas Shopee</h1>
          <p className="text-slate-400 mt-1">Gerencie suas contas de afiliado Shopee</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-gradient-to-r from-[#38BDF8] to-[#22D3EE] text-white rounded-lg hover:from-[#0EA5E9] hover:to-[#06B6D4] transition-all shadow-lg shadow-[#38BDF8]/20"
          >
            + Adicionar Conta Shopee
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-[#1E293B] rounded-lg border border-slate-800 p-6">
          <h2 className="text-lg font-semibold text-white mb-6">
            {editingAccount ? 'Editar Conta Shopee' : 'Nova Conta Shopee'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Nome da Conta *
              </label>
              <input
                type="text"
                value={formData.accountName}
                onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                className="w-full px-4 py-2 bg-[#0F172A] border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
                placeholder="Ex: Shopee Principal"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Partner ID *
                </label>
                <input
                  type="text"
                  value={formData.partnerId}
                  onChange={(e) => setFormData({ ...formData, partnerId: e.target.value })}
                  className="w-full px-4 py-2 bg-[#0F172A] border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
                  placeholder="1234567"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Shop ID (opcional)
                </label>
                <input
                  type="text"
                  value={formData.shopId}
                  onChange={(e) => setFormData({ ...formData, shopId: e.target.value })}
                  className="w-full px-4 py-2 bg-[#0F172A] border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
                  placeholder="123456"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Partner Key *
              </label>
              <input
                type="password"
                value={formData.partnerKey}
                onChange={(e) => setFormData({ ...formData, partnerKey: e.target.value })}
                className="w-full px-4 py-2 bg-[#0F172A] border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
                placeholder="••••••••••••••••"
                required
              />
              <p className="text-xs text-slate-500 mt-1">
                Sua chave secreta será armazenada de forma segura
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="px-4 py-2 bg-[#38BDF8] text-white rounded-lg hover:bg-[#0EA5E9] transition-colors"
              >
                {editingAccount ? 'Salvar Alterações' : 'Adicionar Conta'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 bg-[#0F172A] border border-slate-700 text-white rounded-lg hover:bg-[#1E293B] transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Accounts List */}
      <div className="grid grid-cols-1 gap-4">
        {accounts.map((account) => (
          <div key={account.id} className="bg-[#1E293B] rounded-lg border border-slate-800 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#EE4D2D] rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">S</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{account.accountName}</h3>
                  <p className="text-slate-400 text-sm">
                    Partner ID: {account.partnerId}
                  </p>
                </div>
              </div>
              <span
                className={`px-3 py-1 text-sm rounded-lg ${
                  account.status === 'active'
                    ? 'bg-green-500/10 text-green-400'
                    : account.status === 'pending'
                    ? 'bg-yellow-500/10 text-yellow-400'
                    : 'bg-red-500/10 text-red-400'
                }`}
              >
                {account.status === 'active'
                  ? 'Conectada'
                  : account.status === 'pending'
                  ? 'Pendente'
                  : 'Erro'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              {account.shopId && (
                <div className="bg-[#0F172A] rounded-lg p-3">
                  <p className="text-slate-400 text-sm mb-1">Shop ID</p>
                  <p className="text-white font-mono">{account.shopId}</p>
                </div>
              )}
              {account.lastSyncAt && (
                <div className="bg-[#0F172A] rounded-lg p-3">
                  <p className="text-slate-400 text-sm mb-1">Última Sincronização</p>
                  <p className="text-white">
                    {new Date(account.lastSyncAt).toLocaleString('pt-BR')}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button className="px-4 py-2 bg-[#38BDF8] text-white rounded-lg hover:bg-[#0EA5E9] transition-colors text-sm">
                Sincronizar Agora
              </button>
              <button
                onClick={() => handleEdit(account)}
                className="px-4 py-2 bg-[#0F172A] border border-slate-700 text-white rounded-lg hover:bg-[#1E293B] transition-colors text-sm"
              >
                Editar
              </button>
              <button
                onClick={() => handleDelete(account.id)}
                className="px-4 py-2 bg-[#0F172A] border border-slate-700 text-red-400 rounded-lg hover:bg-[#1E293B] transition-colors text-sm"
              >
                Desconectar
              </button>
            </div>
          </div>
        ))}
      </div>

      {accounts.length === 0 && !showForm && (
        <div className="bg-[#1E293B] rounded-lg border border-slate-800 p-12 text-center">
          <div className="w-16 h-16 bg-[#EE4D2D]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-[#EE4D2D] font-bold text-2xl">S</span>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            Nenhuma conta Shopee conectada
          </h3>
          <p className="text-slate-400 text-sm mb-6">
            Adicione sua primeira conta de afiliado Shopee para começar
          </p>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-[#1E293B] rounded-lg border border-slate-800 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Como obter suas credenciais Shopee
        </h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-slate-400">
          <li>Acesse o <a href="https://affiliate.shopee.com.br" target="_blank" rel="noopener" className="text-[#38BDF8] hover:underline">Painel de Afiliados Shopee</a></li>
          <li>Vá em <strong className="text-white">Configurações → API de Desenvolvedor</strong></li>
          <li>Copie seu <strong className="text-white">Partner ID</strong> e <strong className="text-white">Partner Key</strong></li>
          <li>Cole as credenciais no formulário acima</li>
          <li>Clique em "Adicionar Conta" e teste a conexão</li>
        </ol>
      </div>
    </div>
  )
}
