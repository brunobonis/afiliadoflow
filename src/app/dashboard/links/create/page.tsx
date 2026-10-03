'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CreateLinkSimplified() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [generatedLink, setGeneratedLink] = useState('')

  const [formData, setFormData] = useState({
    shopeeLink: '',
    nickname: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    setSuccess(false)

    try {
      // Validate Shopee link
      if (!formData.shopeeLink.includes('shopee.com')) {
        setError('Por favor, insira um link válido da Shopee')
        return
      }

      const res = await fetch('/api/links/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: formData.shopeeLink,
          nickname: formData.nickname || null,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Erro ao criar link')
        return
      }

      setSuccess(true)
      setGeneratedLink(`${window.location.origin}/go/${data.shortCode}`)

      // Clear form
      setFormData({ shopeeLink: '', nickname: '' })
    } catch (err) {
      setError('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  function copyLink() {
    navigator.clipboard.writeText(generatedLink)
    alert('Link copiado!')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Criar Link Rastreável</h1>
        <p className="text-slate-400 mt-1">
          Cole seu link da Shopee e comece a rastrear seus acessos
        </p>
      </div>

      {/* Success State */}
      {success && generatedLink && (
        <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-semibold text-green-400">Link criado com sucesso!</h3>
          </div>

          <div className="bg-[#0F172A] rounded-lg p-4 mb-4">
            <p className="text-xs text-slate-400 mb-2">Seu link rastreável:</p>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={generatedLink}
                readOnly
                className="flex-1 px-4 py-2 bg-[#1E293B] border border-slate-700 rounded text-white text-sm"
              />
              <button
                onClick={copyLink}
                className="px-4 py-2 bg-[#38BDF8] text-white rounded hover:bg-[#0EA5E9] transition-colors whitespace-nowrap"
              >
                Copiar Link
              </button>
            </div>
          </div>

          <p className="text-sm text-slate-300">
            Compartilhe este link em qualquer canal. Todos os acessos serão registrados automaticamente.
          </p>

          <button
            onClick={() => {
              setSuccess(false)
              setGeneratedLink('')
            }}
            className="mt-4 text-sm text-[#38BDF8] hover:text-[#22D3EE]"
          >
            Criar outro link →
          </button>
        </div>
      )}

      {/* Form */}
      {!success && (
        <div className="bg-[#1E293B] rounded-lg border border-slate-800 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Link da Shopee *
              </label>
              <input
                type="url"
                value={formData.shopeeLink}
                onChange={(e) => setFormData({ ...formData, shopeeLink: e.target.value })}
                className="w-full px-4 py-3 bg-[#0F172A] border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
                placeholder="https://shope.ee/xyz123 ou https://shopee.com.br/..."
                required
              />
              <p className="text-xs text-slate-500 mt-2">
                Cole o link de afiliado curto ou completo da Shopee
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Apelido (opcional)
              </label>
              <input
                type="text"
                value={formData.nickname}
                onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                className="w-full px-4 py-3 bg-[#0F172A] border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
                placeholder="Ex: Promoção Black Friday"
              />
              <p className="text-xs text-slate-500 mt-2">
                Um nome para você identificar este link facilmente
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-gradient-to-r from-[#38BDF8] to-[#22D3EE] text-white rounded-lg hover:from-[#0EA5E9] hover:to-[#06B6D4] transition-all font-medium disabled:opacity-50"
            >
              {loading ? 'Gerando link...' : 'Gerar Link Rastreável'}
            </button>
          </form>
        </div>
      )}

      {/* How it works */}
      <div className="bg-[#1E293B] rounded-lg border border-slate-800 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Como funciona</h2>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-[#38BDF8]/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs text-[#38BDF8] font-bold">1</span>
            </div>
            <div>
              <p className="text-sm text-slate-300">
                <strong className="text-white">Cole seu link:</strong> Use qualquer link de afiliado da Shopee
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-[#38BDF8]/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs text-[#38BDF8] font-bold">2</span>
            </div>
            <div>
              <p className="text-sm text-slate-300">
                <strong className="text-white">Compartilhe:</strong> Use o link gerado em qualquer canal (WhatsApp, Instagram, Facebook, etc)
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-[#38BDF8]/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs text-[#38BDF8] font-bold">3</span>
            </div>
            <div>
              <p className="text-sm text-slate-300">
                <strong className="text-white">Acompanhe:</strong> Veja todos os acessos, origens e resultados no painel
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-[#0F172A] rounded-lg border border-slate-700">
          <p className="text-xs text-slate-400">
            <strong className="text-slate-300">💡 Dica:</strong> O mesmo link pode ser usado em vários canais.
            Conecte suas contas Shopee e Meta em <a href="/dashboard/integrations" className="text-[#38BDF8] hover:underline">Integrações</a> para
            enriquecer os dados automaticamente.
          </p>
        </div>
      </div>
    </div>
  )
}
