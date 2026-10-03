'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

interface LinkDetails {
  id: string
  shortCode: string
  destination: string
  nickname: string | null
  productName: string | null
  createdAt: string
  lastAccessAt: string | null
  _count: {
    events: number
    sales: number
  }
}

interface ClickEvent {
  id: string
  clickedAt: string
  device: string | null
  browser: string | null
  originType: string | null
  originConfidence: string | null
  referer: string | null
}

interface OriginStats {
  originType: string
  count: number
  percentage: number
}

export default function LinkDetailsPage() {
  const params = useParams()
  const shortCode = params?.shortCode as string

  const [link, setLink] = useState<LinkDetails | null>(null)
  const [clicks, setClicks] = useState<ClickEvent[]>([])
  const [originStats, setOriginStats] = useState<OriginStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (shortCode) {
      loadLinkDetails()
    }
  }, [shortCode])

  async function loadLinkDetails() {
    try {
      const [linkRes, clicksRes, statsRes] = await Promise.all([
        fetch(`/api/links/${shortCode}`),
        fetch(`/api/links/${shortCode}/clicks`),
        fetch(`/api/links/${shortCode}/origin-stats`),
      ])

      const linkData = await linkRes.json()
      const clicksData = await clicksRes.json()
      const statsData = await statsRes.json()

      setLink(linkData)
      setClicks(clicksData)
      setOriginStats(statsData)
    } catch (error) {
      console.error('Error loading link details:', error)
    } finally {
      setLoading(false)
    }
  }

  function copyLink() {
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

  if (!link) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">Link não encontrado</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <a
            href="/dashboard/links"
            className="text-slate-400 hover:text-white transition-colors"
          >
            ← Voltar
          </a>
        </div>
        <h1 className="text-3xl font-bold text-white">
          {link.nickname || 'Link Shopee'}
        </h1>
        <p className="text-slate-400 mt-1">Detalhes e estatísticas do link</p>
      </div>

      {/* Link Card */}
      <div className="bg-[#1E293B] rounded-lg border border-slate-800 p-6">
        <div className="bg-[#0F172A] rounded-lg p-4 mb-4">
          <p className="text-xs text-slate-400 mb-2">Seu link rastreável:</p>
          <div className="flex items-center gap-3">
            <code className="flex-1 text-sm text-[#38BDF8] bg-[#1E293B] px-3 py-2 rounded border border-slate-700">
              {`${window.location.origin}/go/${shortCode}`}
            </code>
            <button
              onClick={copyLink}
              className="px-4 py-2 bg-[#38BDF8] text-white rounded hover:bg-[#0EA5E9] transition-colors"
            >
              Copiar
            </button>
          </div>
        </div>

        <div className="text-sm text-slate-400">
          <p>Destino: <span className="text-slate-300">{link.destination}</span></p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#1E293B] rounded-lg border border-slate-800 p-6">
          <p className="text-slate-400 text-sm mb-2">Total de Acessos</p>
          <p className="text-4xl font-bold text-white">{link._count.events}</p>
        </div>

        <div className="bg-[#1E293B] rounded-lg border border-slate-800 p-6">
          <p className="text-slate-400 text-sm mb-2">Vendas Atribuídas</p>
          <p className="text-4xl font-bold text-white">{link._count.sales}</p>
        </div>

        <div className="bg-[#1E293B] rounded-lg border border-slate-800 p-6">
          <p className="text-slate-400 text-sm mb-2">Taxa de Conversão</p>
          <p className="text-4xl font-bold text-white">
            {link._count.events > 0
              ? ((link._count.sales / link._count.events) * 100).toFixed(1)
              : '0.0'}%
          </p>
        </div>
      </div>

      {/* Origin Stats */}
      {originStats.length > 0 && (
        <div className="bg-[#1E293B] rounded-lg border border-slate-800 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Origens dos Acessos</h2>
          <div className="space-y-3">
            {originStats.map((stat) => (
              <div key={stat.originType} className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-white capitalize">
                      {stat.originType === 'unknown'
                        ? 'Origem não identificada'
                        : stat.originType === 'meta_ad'
                        ? 'Anúncio Meta'
                        : stat.originType === 'organic_social'
                        ? 'Redes sociais (orgânico)'
                        : stat.originType.replace('_', ' ')}
                    </span>
                    <span className="text-sm text-slate-400">
                      {stat.count} ({stat.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-[#0F172A] rounded-full h-2">
                    <div
                      className="bg-[#38BDF8] h-2 rounded-full"
                      style={{ width: `${stat.percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Clicks */}
      <div className="bg-[#1E293B] rounded-lg border border-slate-800 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Acessos Recentes</h2>
        {clicks.length === 0 ? (
          <p className="text-slate-400 text-sm">Nenhum acesso registrado ainda</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-700">
                <tr>
                  <th className="text-left py-3 px-4 text-xs text-slate-400 font-medium">Data/Hora</th>
                  <th className="text-left py-3 px-4 text-xs text-slate-400 font-medium">Dispositivo</th>
                  <th className="text-left py-3 px-4 text-xs text-slate-400 font-medium">Origem</th>
                  <th className="text-left py-3 px-4 text-xs text-slate-400 font-medium">Confiança</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {clicks.slice(0, 10).map((click) => (
                  <tr key={click.id} className="hover:bg-[#0F172A]">
                    <td className="py-3 px-4 text-sm text-white">
                      {new Date(click.clickedAt).toLocaleString('pt-BR')}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-300">
                      {click.device || 'Desconhecido'}
                      {click.browser && ` / ${click.browser}`}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-300">
                      {click.originType === 'unknown'
                        ? 'Não identificada'
                        : click.originType || 'Desconhecido'}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          click.originConfidence === 'confirmed'
                            ? 'bg-green-500/10 text-green-400'
                            : click.originConfidence === 'inferred'
                            ? 'bg-yellow-500/10 text-yellow-400'
                            : 'bg-slate-500/10 text-slate-400'
                        }`}
                      >
                        {click.originConfidence === 'confirmed'
                          ? 'Confirmada'
                          : click.originConfidence === 'inferred'
                          ? 'Inferida'
                          : 'Desconhecida'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
