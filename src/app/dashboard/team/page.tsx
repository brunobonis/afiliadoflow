'use client'

import { useState, useEffect } from 'react'

interface Member {
  id: string
  role: string
  user: {
    id: string
    name: string
    email: string
  }
  createdAt: string
}

export default function TeamPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    loadMembers()
  }, [])

  async function loadMembers() {
    try {
      const res = await fetch('/api/team')
      const data = await res.json()
      setMembers(data)
    } catch (error) {
      console.error('Error loading members:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleRoleChange(memberId: string, newRole: string) {
    try {
      await fetch(`/api/team/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })
      loadMembers()
    } catch (error) {
      alert('Erro ao alterar permissão')
    }
  }

  async function handleRemove(memberId: string) {
    if (!confirm('Tem certeza que deseja remover este membro?')) return

    try {
      await fetch(`/api/team/${memberId}`, {
        method: 'DELETE',
      })
      loadMembers()
    } catch (error) {
      alert('Erro ao remover membro')
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
          <h1 className="text-3xl font-bold text-white">Equipe</h1>
          <p className="text-slate-400 mt-1">Gerencie membros e permissões</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-gradient-to-r from-[#38BDF8] to-[#22D3EE] text-white rounded-lg hover:from-[#0EA5E9] hover:to-[#06B6D4] transition-all shadow-lg shadow-[#38BDF8]/20"
        >
          Adicionar Membro
        </button>
      </div>

      {/* Members Table */}
      <div className="bg-[#1E293B] rounded-lg border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#0F172A] border-b border-slate-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Membro
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Função
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {members.map((member) => (
                <tr key={member.id} className="hover:bg-[#0F172A] transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#38BDF8] to-[#22D3EE] rounded-full flex items-center justify-center text-white font-semibold">
                        {member.user.name?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <p className="text-sm font-medium text-white">{member.user.name}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                    {member.user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={member.role}
                      onChange={(e) => handleRoleChange(member.id, e.target.value)}
                      className="px-3 py-1 bg-[#0F172A] border border-slate-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
                    >
                      <option value="admin">Administrador</option>
                      <option value="manager">Gerente</option>
                      <option value="member">Membro</option>
                      <option value="viewer">Visualizador</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleRemove(member.id)}
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      Remover
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Permissions Guide */}
      <div className="bg-[#1E293B] rounded-lg border border-slate-800 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Níveis de Permissão</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium text-white mb-2">👑 Administrador</h3>
            <p className="text-xs text-slate-400">
              Acesso total: gerenciar equipe, configurações, integrações e billing
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-white mb-2">⚙️ Gerente</h3>
            <p className="text-xs text-slate-400">
              Criar produtos, links, campanhas e visualizar relatórios
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-white mb-2">👤 Membro</h3>
            <p className="text-xs text-slate-400">
              Criar links e visualizar dados básicos
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-white mb-2">👁️ Visualizador</h3>
            <p className="text-xs text-slate-400">
              Apenas visualização de dashboards e relatórios
            </p>
          </div>
        </div>
      </div>

      {showModal && (
        <AddMemberModal
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false)
            loadMembers()
          }}
        />
      )}
    </div>
  )
}

function AddMemberModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void
  onSuccess: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    email: '',
    role: 'member',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Erro ao adicionar membro')
        return
      }

      if (data.message) {
        alert(data.message)
      }

      onSuccess()
    } catch (err) {
      setError('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1E293B] rounded-lg border border-slate-800 w-full max-w-md">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Adicionar Membro</h2>
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
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 bg-[#0F172A] border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
              placeholder="usuario@exemplo.com"
              required
            />
            <p className="text-xs text-slate-500 mt-1">
              Se o usuário não existe, enviaremos um convite
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Função *
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-4 py-2 bg-[#0F172A] border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
            >
              <option value="admin">Administrador</option>
              <option value="manager">Gerente</option>
              <option value="member">Membro</option>
              <option value="viewer">Visualizador</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-[#38BDF8] to-[#22D3EE] text-white rounded-lg hover:from-[#0EA5E9] hover:to-[#06B6D4] transition-all disabled:opacity-50"
            >
              {loading ? 'Adicionando...' : 'Adicionar Membro'}
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
