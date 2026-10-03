'use client'

import { useState, useEffect } from 'react'

interface CreateLinkModalProps {
  onClose: () => void
  onSuccess: () => void
}

export function CreateLinkModal({ onClose, onSuccess }: CreateLinkModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [products, setProducts] = useState<any[]>([])

  const [formData, setFormData] = useState({
    productId: '',
    shortCode: '',
    destination: '',
    title: '',
    utmSource: '',
    utmMedium: '',
    utmCampaign: '',
    utmContent: '',
    utmTerm: '',
  })

  useEffect(() => {
    loadProducts()
  }, [])

  async function loadProducts() {
    const res = await fetch('/api/products')
    const data = await res.json()
    setProducts(data)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Erro ao criar link')
        return
      }

      onSuccess()
      onClose()
    } catch (err) {
      setError('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1E293B] rounded-lg border border-slate-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Criar Link Rastreável</h2>
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Produto (opcional)
            </label>
            <select
              value={formData.productId}
              onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
              className="w-full px-4 py-2 bg-[#0F172A] border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
            >
              <option value="">Nenhum produto vinculado</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              URL de Destino *
            </label>
            <input
              type="url"
              value={formData.destination}
              onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
              className="w-full px-4 py-2 bg-[#0F172A] border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
              placeholder="https://shopee.com.br/product/123456"
              required
            />
            <p className="text-xs text-slate-500 mt-1">
              Link de afiliado da Shopee ou qualquer outro URL
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Código Curto (opcional)
              </label>
              <input
                type="text"
                value={formData.shortCode}
                onChange={(e) => setFormData({ ...formData, shortCode: e.target.value })}
                className="w-full px-4 py-2 bg-[#0F172A] border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
                placeholder="promo-black"
              />
              <p className="text-xs text-slate-500 mt-1">Deixe vazio para gerar automaticamente</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Título do Link
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 bg-[#0F172A] border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
                placeholder="Promoção Black Friday"
              />
            </div>
          </div>

          <div className="border-t border-slate-800 pt-4">
            <h3 className="text-white font-medium mb-3">Parâmetros UTM (opcional)</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  utm_source
                </label>
                <input
                  type="text"
                  value={formData.utmSource}
                  onChange={(e) => setFormData({ ...formData, utmSource: e.target.value })}
                  className="w-full px-4 py-2 bg-[#0F172A] border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
                  placeholder="instagram"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  utm_medium
                </label>
                <input
                  type="text"
                  value={formData.utmMedium}
                  onChange={(e) => setFormData({ ...formData, utmMedium: e.target.value })}
                  className="w-full px-4 py-2 bg-[#0F172A] border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
                  placeholder="social"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  utm_campaign
                </label>
                <input
                  type="text"
                  value={formData.utmCampaign}
                  onChange={(e) => setFormData({ ...formData, utmCampaign: e.target.value })}
                  className="w-full px-4 py-2 bg-[#0F172A] border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
                  placeholder="black-friday"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  utm_content
                </label>
                <input
                  type="text"
                  value={formData.utmContent}
                  onChange={(e) => setFormData({ ...formData, utmContent: e.target.value })}
                  className="w-full px-4 py-2 bg-[#0F172A] border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
                  placeholder="stories"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-[#38BDF8] to-[#22D3EE] text-white rounded-lg hover:from-[#0EA5E9] hover:to-[#06B6D4] transition-all disabled:opacity-50"
            >
              {loading ? 'Criando...' : 'Criar Link'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#0F172A] border border-slate-700 text-white rounded-lg hover:bg-[#1E293B] transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
