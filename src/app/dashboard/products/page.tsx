'use client'

import { useEffect, useState } from 'react'
import { useFilter } from '@/components/FilterContext'
import { AccountFilter } from '@/components/AccountFilter'
import { CreateProductModal } from '@/components/CreateProductModal'
import { CreateLinkModal } from '@/components/CreateLinkModal'

interface Product {
  id: string
  externalId?: string
  name: string
  imageUrl?: string
  price?: number
  commission?: number
  commissionRate?: number
  status: string
  shopeeAccount?: { accountName: string }
  _count: { links: number; sales: number }
}

interface Link {
  id: string
  shortCode: string
  title?: string
  destination: string
  status: string
  utmSource?: string
  utmMedium?: string
  product?: { name: string }
  _count: { events: number; sales: number }
}

export default function ProductsPage() {
  const { selectedAccountId } = useFilter()
  const [products, setProducts] = useState<Product[]>([])
  const [links, setLinks] = useState<Link[]>([])
  const [loading, setLoading] = useState(true)
  const [showProductModal, setShowProductModal] = useState(false)
  const [showLinkModal, setShowLinkModal] = useState(false)

  useEffect(() => {
    loadData()
  }, [selectedAccountId])

  async function loadData() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedAccountId) params.set('accountId', selectedAccountId)

      const [productsRes, linksRes] = await Promise.all([
        fetch(`/api/products?${params}`),
        fetch(`/api/links?${params}`),
      ])

      const productsData = await productsRes.json()
      const linksData = await linksRes.json()

      setProducts(productsData)
      setLinks(linksData)
    } catch (error) {
      console.error('Error loading data:', error)
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
          <h1 className="text-3xl font-bold text-white">Produtos & Links</h1>
          <p className="text-slate-400 mt-1">Gerencie produtos e links rastreáveis</p>
        </div>
        <div className="flex items-center gap-3">
          <AccountFilter />
          <button
            onClick={() => setShowProductModal(true)}
            className="px-4 py-2 bg-[#1E293B] border border-slate-700 text-white rounded-lg hover:bg-[#334155] transition-colors"
          >
            Adicionar Produto
          </button>
          <button
            onClick={() => setShowLinkModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-[#38BDF8] to-[#22D3EE] text-white rounded-lg hover:from-[#0EA5E9] hover:to-[#06B6D4] transition-all shadow-lg shadow-[#38BDF8]/20"
          >
            Criar Link
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-[#1E293B] rounded-lg border border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800">
          <h2 className="text-lg font-semibold text-white">Produtos ({products.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#0F172A] border-b border-slate-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Produto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Conta
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Preço
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Comissão
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Links
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Vendas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-[#0F172A] transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      {product.imageUrl && (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      )}
                      <div>
                        <p className="text-sm font-medium text-white">{product.name}</p>
                        <p className="text-xs text-slate-400">{product.externalId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                    {product.shopeeAccount?.accountName || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    {product.price ? `R$ ${product.price.toFixed(2)}` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="text-sm text-white font-medium">
                        {product.commission ? `R$ ${product.commission.toFixed(2)}` : '-'}
                      </p>
                      {product.commissionRate && (
                        <p className="text-xs text-slate-400">{product.commissionRate}%</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    {product._count.links}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    {product._count.sales}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs rounded bg-green-500/10 text-green-400">
                      {product.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Links Table */}
      <div className="bg-[#1E293B] rounded-lg border border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800">
          <h2 className="text-lg font-semibold text-white">Links Rastreáveis ({links.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#0F172A] border-b border-slate-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Link
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Produto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  UTM
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Cliques
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Vendas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {links.map((link) => (
                <tr key={link.id} className="hover:bg-[#0F172A] transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-white font-mono">/{link.shortCode}</p>
                      <p className="text-xs text-slate-400 truncate max-w-xs">{link.title}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    {link.product?.name || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {link.utmSource && (
                        <span className="px-2 py-0.5 text-xs bg-[#38BDF8]/10 text-[#38BDF8] rounded">
                          {link.utmSource}
                        </span>
                      )}
                      {link.utmMedium && (
                        <span className="px-2 py-0.5 text-xs bg-[#22D3EE]/10 text-[#22D3EE] rounded">
                          {link.utmMedium}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    {link._count.events}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    {link._count.sales}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        link.status === 'active'
                          ? 'bg-green-500/10 text-green-400'
                          : 'bg-yellow-500/10 text-yellow-400'
                      }`}
                    >
                      {link.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {showProductModal && (
        <CreateProductModal
          onClose={() => setShowProductModal(false)}
          onSuccess={() => loadData()}
        />
      )}

      {showLinkModal && (
        <CreateLinkModal
          onClose={() => setShowLinkModal(false)}
          onSuccess={() => loadData()}
        />
      )}
    </div>
  )
}
