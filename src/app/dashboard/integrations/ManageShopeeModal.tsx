'use client'

import { useState } from 'react'
import ManageShopeeModal from './ManageShopeeModal'

interface ShopeeAccount {
  id: string
  accountName: string
  partnerId: string
  status: string
}

export default function ManageShopeeModal({
  accounts,
  onClose,
  onUpdate,
}: {
  accounts: ShopeeAccount[]
  onClose: () => void
  onUpdate: () => void
}) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    accountName: '',
    partnerId: '',
    partnerKey: '',
    shopId: '',
  })
  const [loading, setLoading] = useState(false)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      await fetch('/api/integrations/shopee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      setFormData({ accountName: '', partnerId: '', partnerKey: '', shopId: '' })
      setShowAddForm(false)
      onUpdate()
    } catch (error) {
      alert('Erro ao adicionar conta')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir esta conta?')) return

    try {
      await fetch(`/api/integrations/shopee/${id}`, {
        method: 'DELETE',
      })
      onUpdate()
    } catch (error) {
      alert('Erro ao excluir conta')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1E293B] rounded-lg border border-slate-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-[#1E293B]">
          <div>
            <h2 className="text-xl font-semibold text-white">Contas Shopee</h2>
            <p className="text-sm text-slate-400 mt-1">Gerencie suas contas de afiliado</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          {accounts.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-[#0F172A] rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🛍️</span>
              </div>
              <p className="text-slate-400 text-sm mb-4">Nenhuma conta Shopee conectada</p>
            </div>
          ) : (
            <div className="space-y-3">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="bg-[#0F172A] border border-slate-700 rounded-lg p-4 flex items-center justify-between"
                >
                  <div>
                    <h3 className="text-white font-medium">{account.accountName}</h3>
                    <p className="text-sm text-slate-400">Partner ID: {account.partnerId}</p>
                    <span
                      className={`inline-block mt-2 px-2 py-1 text-xs rounded ${
                        account.status === 'connected'
                          ? 'bg-green-500/10 text-green-400'
                          : account.status === 'error'
                          ? 'bg-red-500/10 text-red-400'
                          : 'bg-yellow-500/10 text-yellow-400'
                      }`}
                    >
                      {account.status === 'connected'
                        ? 'Conectada'
                        : account.status === 'error'
                        ? 'Erro'
                        : 'Pendente'}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDelete(account.id)}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    Excluir
                  </button>
                </div>
              ))}
            </div>
          )}

          {!showAddForm ? (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full px-4 py-2 bg-[#0F172A] border border-slate-700 text-white rounded-lg hover:bg-[#1E293B] transition-colors"
            >
              + Adicionar Conta Shopee
            </button>
          ) : (
            <form
              onSubmit={handleAdd}
              className="bg-[#0F172A] border border-slate-700 rounded-lg p-4 space-y-3"
            >
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Nome da Conta
                </label>
                <input
                  type="text"
                  value={formData.accountName}
                  onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                  className="w-full px-3 py-2 bg-[#1E293B] border border-slate-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
                  placeholder="Shopee Principal"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Partner ID
                </label>
                <input
                  type="text"
                  value={formData.partnerId}
                  onChange={(e) => setFormData({ ...formData, partnerId: e.target.value })}
                  className="w-full px-3 py-2 bg-[#1E293B] border border-slate-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
                  placeholder="123456"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Partner Key
                </label>
                <input
                  type="password"
                  value={formData.partnerKey}
                  onChange={(e) => setFormData({ ...formData, partnerKey: e.target.value })}
                  className="w-full px-3 py-2 bg-[#1E293B] border border-slate-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
                  placeholder="••••••••••••••••"
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
                  className="w-full px-3 py-2 bg-[#1E293B] border border-slate-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
                  placeholder="789012"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-[#38BDF8] text-white rounded hover:bg-[#0EA5E9] transition-colors text-sm disabled:opacity-50"
                >
                  {loading ? 'Adicionando...' : 'Adicionar'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false)
                    setFormData({ accountName: '', partnerId: '', partnerKey: '', shopId: '' })
                  }}
                  className="px-4 py-2 bg-[#1E293B] border border-slate-700 text-white rounded hover:bg-[#334155] transition-colors text-sm"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}

          <div className="bg-[#0F172A] border border-slate-700 rounded-lg p-4 text-sm">
            <h3 className="text-white font-medium mb-2">Como obter credenciais Shopee:</h3>
            <ol className="text-slate-400 text-xs space-y-1 list-decimal list-inside">
              <li>Acesse affiliate.shopee.com.br</li>
              <li>Faça login na sua conta de afiliado</li>
              <li>Vá em Configurações → API/Integração</li>
              <li>Copie seu Partner ID e Partner Key</li>
              <li>Cole as credenciais acima</li>
            </ol>
          </div>
        </div>

        <div className="p-6 border-t border-slate-800 bg-[#1E293B]">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-[#0F172A] border border-slate-700 text-white rounded-lg hover:bg-[#1E293B] transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
