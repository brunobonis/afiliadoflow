'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Link {
  id: string
  shortCode: string
  destination: string
  nickname: string | null
  productName: string | null
  status: string
  createdAt: string
  lastAccessAt: string | null
  _count: {
    events: number
    sales: number
  }
}

export default function MyLinksPage() {
  const router = useRouter()
  const [links, setLinks] = useState<Link[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLinks()
  }, [])

  async function loadLinks() {
    try {
      const res = await fetch('/api/links')
      const data = await res.json()
      setLinks(data)
    } catch (error) {
      console.error('Error loading links:', error)
    } finally {
      setLoading(false)
    }
  }

  function copyLink(shortCode: string) {
    const fullUrl = `${window.location.origin}/go/${shortCode}`
    navigator.clipboard.writeText(fullUrl)
    alert('Link copiado!')
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
          <h1 className="text-3xl font-bold text-white">Meus Links</h1>
          <p className="text-slate-400 mt-1">Gerencie seus links rastreáveis</p>
        </div>
        <button
          onClick={() => router.push('/dashboard/links/create')}
          className="px-6 py-3 bg-gradient-to-r from-[#38BDF8] to-[#22D3EE] text-white rounded-lg hover:from-[#0EA5E9] hover:to-[#06B6D4] transition-all shadow-lg shadow-[#38BDF8]/20 font-medium"
        >
          + Criar Link
        </button>
      </div>

      {links.length === 0 ? (
        <div className="bg-[#1E293B] rounded-lg border border-slate-800 p-12 text-center">
          <div className="w-16 h-16 bg-[#0F172A] rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            Nenhum link criado ainda
          </h3>
          <p className="text-slate-400 text-sm mb-6">
            Crie seu primeiro link rastreável para começar a acompanhar seus resultados
          </p>
          <button
            onClick={() => router.push('/dashboard/links/create')}
            className="inline-block px-6 py-3 bg-[#38BDF8] text-white rounded-lg hover:bg-[#0EA5E9] transition-colors font-medium"
          >
            Criar Primeiro Link
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {links.map((link) => (
            <div
              key={link.id}
              className="bg-[#1E293B] rounded-lg border border-slate-800 p-6 hover:border-[#38BDF8]/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-white">
                      {link.nickname || 'Link Shopee'}
                    </h3>
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        link.status === 'active'
                          ? 'bg-green-500/10 text-green-400'
                          : 'bg-slate-500/10 text-slate-400'
                      }`}
                    >
                      {link.status === 'active' ? 'Ativo' : 'Pausado'}
                    </span>
                  </div>
                  {link.productName && (
                    <p className="text-sm text-slate-400 mb-2">
                      Produto: {link.productName}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>Criado em {new Date(link.createdAt).toLocaleDateString('pt-BR')}</span>
                    {link.lastAccessAt && (
                      <>
                        <span>•</span>
                        <span>Último acesso: {new Date(link.lastAccessAt).toLocaleDateString('pt-BR')}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => copyLink(link.shortCode)}
                    className="px-4 py-2 bg-[#38BDF8] text-white rounded hover:bg-[#0EA5E9] transition-colors text-sm font-medium"
                  >
                    Copiar Link
                  </button>
                </div>
              </div>

              <div className="bg-[#0F172A] rounded-lg p-4 mb-4">
                <p className="text-xs text-slate-400 mb-2">Seu link rastreável:</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm text-[#38BDF8] bg-[#1E293B] px-3 py-2 rounded border border-slate-700">
                    {`/go/${link.shortCode}`}
                  </code>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-[#0F172A] rounded-lg p-4">
                  <p className="text-xs text-slate-400 mb-1">Acessos</p>
                  <p className="text-2xl font-bold text-white">{link._count.events}</p>
                </div>

                <div className="bg-[#0F172A] rounded-lg p-4">
                  <p className="text-xs text-slate-400 mb-1">Vendas</p>
                  <p className="text-2xl font-bold text-white">{link._count.sales}</p>
                </div>

                <div className="bg-[#0F172A] rounded-lg p-4">
                  <p className="text-xs text-slate-400 mb-1">Conversão</p>
                  <p className="text-2xl font-bold text-white">
                    {link._count.events > 0
                      ? ((link._count.sales / link._count.events) * 100).toFixed(1)
                      : '0.0'}%
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <button
                  onClick={() => router.push(`/dashboard/links/${link.shortCode}`)}
                  className="text-sm text-[#38BDF8] hover:text-[#22D3EE] transition-colors"
                >
                  Ver detalhes →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
