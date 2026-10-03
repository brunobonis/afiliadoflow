'use client'

import { useState, useEffect } from 'react'
import ManageShopeeModal from './ManageShopeeModal'
import ManageMetaModal from './ManageMetaModal'

interface ShopeeAccount {
  id: string
  accountName: string
  partnerId: string
  status: string
}

export default function IntegrationsPage() {
  const [shopeeAccounts, setShopeeAccounts] = useState<ShopeeAccount[]>([])
  const [metaAccounts, setMetaAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showShopeeModal, setShowShopeeModal] = useState(false)
  const [showMetaModal, setShowMetaModal] = useState(false)

  useEffect(() => {
    loadIntegrations()
  }, [])

  async function loadIntegrations() {
    try {
      const [shopeeRes, metaRes] = await Promise.all([
        fetch('/api/integrations/shopee'),
        fetch('/api/integrations/meta'),
      ])
      const shopeeData = await shopeeRes.json()
      const metaData = await metaRes.json()
      setShopeeAccounts(shopeeData)
      setMetaAccounts(metaData)
    } catch (error) {
      console.error('Error loading integrations:', error)
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
      <div>
        <h1 className="text-3xl font-bold text-white">Integrações</h1>
        <p className="text-slate-400 mt-1">Conecte suas contas Shopee e Meta Ads</p>
      </div>

      {/* Shopee Integration */}
      <div className="bg-[#1E293B] rounded-lg border border-slate-800 p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-[#EE4D2D] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-2xl">S</span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Shopee Afiliados</h2>
              <p className="text-slate-400 text-sm mt-1">
                Sincronize produtos, links e comissões
              </p>
            </div>
          </div>
          <span
            className={`px-3 py-1 text-sm rounded-lg ${
              shopeeAccounts.length > 0
                ? 'bg-green-500/10 text-green-400'
                : 'bg-slate-500/10 text-slate-400'
            }`}
          >
            {shopeeAccounts.length > 0
              ? `${shopeeAccounts.length} conta${shopeeAccounts.length > 1 ? 's' : ''} conectada${
                  shopeeAccounts.length > 1 ? 's' : ''
                }`
              : 'Não conectada'}
          </span>
        </div>

        <p className="text-slate-400 text-sm mb-6">
          Gerencie múltiplas contas de afiliado Shopee. Cada conta pode ter seus próprios produtos,
          links e comissões rastreados separadamente.
        </p>

        <button
          onClick={() => setShowShopeeModal(true)}
          className="px-4 py-2 bg-[#38BDF8] text-white rounded-lg hover:bg-[#0EA5E9] transition-colors"
        >
          Gerenciar Contas Shopee
        </button>
      </div>

      {/* Meta Ads Integration */}
      <div className="bg-[#1E293B] rounded-lg border border-slate-800 p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-[#0866FF] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-2xl">f</span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Meta Ads</h2>
              <p className="text-slate-400 text-sm mt-1">
                Importe campanhas e métricas do Facebook/Instagram
              </p>
            </div>
          </div>
          <span
            className={`px-3 py-1 text-sm rounded-lg ${
              metaAccounts.length > 0
                ? 'bg-green-500/10 text-green-400'
                : 'bg-slate-500/10 text-slate-400'
            }`}
          >
            {metaAccounts.length > 0
              ? `${metaAccounts.length} conta${metaAccounts.length > 1 ? 's' : ''} conectada${
                  metaAccounts.length > 1 ? 's' : ''
                }`
              : 'Não conectada'}
          </span>
        </div>

        <p className="text-slate-400 text-sm mb-6">
          Conecte suas contas Meta para sincronizar automaticamente campanhas, anúncios e métricas
          de performance.
        </p>

        <div className="bg-[#0F172A] rounded-lg p-4 mb-6">
          <h3 className="text-white font-medium mb-3">O que será sincronizado:</h3>
          <ul className="space-y-2 text-sm text-slate-400">
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-[#38BDF8] rounded-full" />
              Campanhas ativas e métricas de performance
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-[#38BDF8] rounded-full" />
              Gastos, impressões, cliques e conversões
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-[#38BDF8] rounded-full" />
              Contas de anúncios selecionadas
            </li>
          </ul>
        </div>

        <button
          onClick={() => setShowMetaModal(true)}
          className="px-6 py-3 bg-[#0866FF] text-white rounded-lg hover:bg-[#0552CC] transition-colors font-medium"
        >
          {metaAccounts.length > 0 ? 'Gerenciar Contas Meta' : 'Conectar Meta Ads'}
        </button>
      </div>

      {/* Configuration Instructions */}
      <div className="bg-[#1E293B] rounded-lg border border-slate-800 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">
          Como configurar as integrações
        </h2>

        <div className="space-y-4 text-sm text-slate-400">
          <div>
            <h3 className="text-white font-medium mb-2">Shopee Afiliados</h3>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Acesse o painel de afiliados Shopee</li>
              <li>Vá em Configurações → API</li>
              <li>Copie seu Partner ID e Partner Key</li>
              <li>Cole as credenciais aqui e teste a conexão</li>
            </ol>
          </div>

          <div>
            <h3 className="text-white font-medium mb-2">Meta Ads</h3>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Clique em "Gerenciar Contas Meta"</li>
              <li>Obtenha seu Access Token no Graph API Explorer</li>
              <li>Cole as credenciais e adicione sua conta</li>
              <li>Sincronize campanhas e métricas automaticamente</li>
            </ol>
          </div>
        </div>
      </div>

      {showShopeeModal && (
        <ManageShopeeModal
          accounts={shopeeAccounts}
          onClose={() => setShowShopeeModal(false)}
          onUpdate={loadIntegrations}
        />
      )}

      {showMetaModal && (
        <ManageMetaModal
          accounts={metaAccounts}
          onClose={() => setShowMetaModal(false)}
          onUpdate={loadIntegrations}
        />
      )}
    </div>
  )
}
