'use client'

import { useState } from 'react'
import PasswordInput from '@/components/PasswordInput'

interface ShopeeAccount {
  id: string
  accountName: string | null
  appId: string | null
  status: string
  errorMessage?: string | null
  lastSyncAt?: string | null
}

interface SyncResult {
  fetched: number
  created: number
  updated: number
  truncated?: boolean
  selecao?: string
  sample: unknown
}

function StatusBadge({ status }: { status: string }) {
  const estilos: Record<string, string> = {
    active: 'bg-green-500/10 text-green-400',
    error: 'bg-red-500/10 text-red-400',
  }

  const rotulos: Record<string, string> = {
    active: 'Conectada',
    error: 'Erro',
  }

  return (
    <span
      className={`inline-block mt-2 px-2 py-1 text-xs rounded ${
        estilos[status] || 'bg-yellow-500/10 text-yellow-400'
      }`}
    >
      {rotulos[status] || 'Pendente'}
    </span>
  )
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
  const [accountName, setAccountName] = useState('')
  const [appId, setAppId] = useState('')
  const [appSecret, setAppSecret] = useState('')
  const [error, setError] = useState('')
  const [errorDetail, setErrorDetail] = useState('')
  const [loading, setLoading] = useState(false)
  const [syncingId, setSyncingId] = useState<string | null>(null)
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null)

  function resetForm() {
    setAccountName('')
    setAppId('')
    setAppSecret('')
    setError('')
    setErrorDetail('')
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setErrorDetail('')
    setLoading(true)

    try {
      const res = await fetch('/api/integrations/shopee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountName, appId, appSecret }),
      })

      const data = await res.json()

      // A versão anterior ignorava a resposta: erro fechava o formulário igual
      // a sucesso, e a conta simplesmente não aparecia, sem explicação.
      if (!res.ok) {
        setError(data.error || 'Erro ao adicionar conta')
        setErrorDetail(data.detail ? JSON.stringify(data.detail, null, 2) : '')
        return
      }

      resetForm()
      setShowAddForm(false)
      onUpdate()
    } catch (err) {
      setError('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  async function handleSync(id: string) {
    setSyncingId(id)
    setSyncResult(null)
    setError('')
    setErrorDetail('')

    try {
      const res = await fetch(`/api/integrations/shopee/${id}/sync?days=30`, { method: 'POST' })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Erro ao sincronizar')
        return
      }

      setSyncResult(data)
      onUpdate()
    } catch (err) {
      setError('Erro de conexão')
    } finally {
      setSyncingId(null)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir esta conta? As vendas já importadas continuam no histórico.')) return

    try {
      const res = await fetch(`/api/integrations/shopee/${id}`, { method: 'DELETE' })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Erro ao excluir conta')
        return
      }

      onUpdate()
    } catch (err) {
      setError('Erro de conexão')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1E293B] rounded-lg border border-slate-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-[#1E293B] z-10">
          <div>
            <h2 className="text-xl font-semibold text-white">Contas Shopee</h2>
            <p className="text-sm text-slate-400 mt-1">Gerencie suas contas de afiliado</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded text-sm space-y-2">
              <p>{error}</p>
              {errorDetail && (
                <details>
                  <summary className="cursor-pointer text-xs text-red-300/80">
                    Ver resposta completa da Shopee
                  </summary>
                  <pre className="mt-2 text-[10px] leading-relaxed text-slate-300 bg-[#0F172A] p-3 rounded overflow-x-auto max-h-64">
                    {errorDetail}
                  </pre>
                </details>
              )}
            </div>
          )}

          {syncResult && (
            <div className="bg-green-500/10 border border-green-500/50 text-green-300 px-4 py-3 rounded text-sm space-y-2">
              <p>
                {syncResult.fetched} conversões recebidas · {syncResult.created} novas ·{' '}
                {syncResult.updated} atualizadas
              </p>
              {syncResult.selecao && syncResult.selecao !== 'completa' && (
                <p className="text-amber-400 text-xs">
                  A Shopee recusou parte dos campos — usei a seleção{' '}
                  <strong>{syncResult.selecao}</strong>.
                  {syncResult.selecao === 'sem itens'
                    ? ' As vendas vieram sem nome de produto.'
                    : ' Algumas colunas podem vir vazias.'}
                </p>
              )}
              {syncResult.truncated && (
                <p className="text-amber-400 text-xs">
                  ⚠️ A coleta bateu no limite de páginas — pode haver vendas além destas.
                  Sincronize um período menor para garantir o total.
                </p>
              )}
              {syncResult.sample ? (
                <details>
                  <summary className="cursor-pointer text-xs text-green-400/80">
                    Ver primeiro registro cru
                  </summary>
                  <pre className="mt-2 text-[10px] leading-relaxed text-slate-300 bg-[#0F172A] p-3 rounded overflow-x-auto max-h-64">
                    {JSON.stringify(syncResult.sample, null, 2)}
                  </pre>
                </details>
              ) : (
                <p className="text-xs text-green-400/80">
                  Nenhuma conversão no período — credenciais funcionando, sem vendas ainda.
                </p>
              )}
            </div>
          )}

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
                <div key={account.id} className="bg-[#0F172A] border border-slate-700 rounded-lg p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="text-white font-medium">{account.accountName}</h3>
                      <p className="text-sm text-slate-400">AppId: {account.appId}</p>
                      {account.lastSyncAt && (
                        <p className="text-xs text-slate-500 mt-1">
                          Última sincronização:{' '}
                          {new Date(account.lastSyncAt).toLocaleString('pt-BR')}
                        </p>
                      )}
                      <StatusBadge status={account.status} />
                      {account.errorMessage && (
                        <p className="text-xs text-red-400 mt-2">{account.errorMessage}</p>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 shrink-0">
                      <button
                        onClick={() => handleSync(account.id)}
                        disabled={syncingId === account.id}
                        className="px-3 py-1.5 bg-[#38BDF8] text-white rounded text-sm hover:bg-[#0EA5E9] transition-colors disabled:opacity-50"
                      >
                        {syncingId === account.id ? 'Sincronizando...' : 'Sincronizar'}
                      </button>
                      <button
                        onClick={() => handleDelete(account.id)}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
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
            <form onSubmit={handleAdd} className="bg-[#0F172A] border border-slate-700 rounded-lg p-4 space-y-3">
              <div>
                <label htmlFor="accountName" className="block text-sm font-medium text-slate-300 mb-2">
                  Nome da conta
                </label>
                <input
                  id="accountName"
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1E293B] border border-slate-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
                  placeholder="Shopee Afiliados"
                />
              </div>

              <div>
                <label htmlFor="appId" className="block text-sm font-medium text-slate-300 mb-2">
                  AppId
                </label>
                <input
                  id="appId"
                  type="text"
                  value={appId}
                  onChange={(e) => setAppId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1E293B] border border-slate-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
                  placeholder="18300000000"
                  required
                />
              </div>

              <div>
                <label htmlFor="appSecret" className="block text-sm font-medium text-slate-300 mb-2">
                  Secret
                </label>
                <PasswordInput
                  id="appSecret"
                  value={appSecret}
                  onChange={setAppSecret}
                  autoComplete="off"
                  required
                />
                <p className="text-xs text-slate-500 mt-1">
                  Guardado cifrado. As credenciais são testadas na Shopee antes de salvar.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-[#38BDF8] text-white rounded hover:bg-[#0EA5E9] transition-colors text-sm disabled:opacity-50"
                >
                  {loading ? 'Testando credenciais...' : 'Adicionar'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false)
                    resetForm()
                  }}
                  className="px-4 py-2 bg-[#1E293B] border border-slate-700 text-white rounded hover:bg-[#334155] transition-colors text-sm"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}

          <div className="bg-[#0F172A] border border-slate-700 rounded-lg p-4 text-sm">
            <h3 className="text-white font-medium mb-2">Onde achar AppId e Secret:</h3>
            <ol className="text-slate-400 text-xs space-y-1 list-decimal list-inside">
              <li>Acesse affiliate.shopee.com.br e faça login</li>
              <li>Abra a seção Open API / API de Afiliados</li>
              <li>Copie o AppId (numérico) e o Secret</li>
              <li>Cole acima — a conexão é testada antes de salvar</li>
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
