'use client'

import { useState, useEffect } from 'react'

interface Workspace {
  id: string
  name: string
  slug: string
}

export default function SettingsPage() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    try {
      // TODO: Create settings API endpoint
      setWorkspace({
        id: '1',
        name: 'Meu Workspace',
        slug: 'meu-workspace',
      })
    } catch (error) {
      console.error('Error loading settings:', error)
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
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-white">Configurações</h1>
        <p className="text-slate-400 mt-1">Gerencie workspace e preferências</p>
      </div>

      {/* Workspace Settings */}
      <div className="bg-[#1E293B] rounded-lg border border-slate-800 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Workspace</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Nome do Workspace
            </label>
            <input
              type="text"
              defaultValue={workspace?.name}
              className="w-full px-4 py-2 bg-[#0F172A] border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              URL do Workspace
            </label>
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-sm">afiliadoflow.com/</span>
              <input
                type="text"
                defaultValue={workspace?.slug}
                className="flex-1 px-4 py-2 bg-[#0F172A] border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
              />
            </div>
          </div>

          <button className="px-4 py-2 bg-[#38BDF8] text-white rounded-lg hover:bg-[#0EA5E9] transition-colors">
            Salvar Alterações
          </button>
        </div>
      </div>

      {/* Profile Settings */}
      <div className="bg-[#1E293B] rounded-lg border border-slate-800 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Perfil</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Nome</label>
            <input
              type="text"
              defaultValue="Fabiana Silva"
              className="w-full px-4 py-2 bg-[#0F172A] border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
            <input
              type="email"
              defaultValue="fabiana@demo.com"
              className="w-full px-4 py-2 bg-[#0F172A] border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
            />
          </div>

          <button className="px-4 py-2 bg-[#38BDF8] text-white rounded-lg hover:bg-[#0EA5E9] transition-colors">
            Atualizar Perfil
          </button>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-[#1E293B] rounded-lg border border-slate-800 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Notificações</h2>
        <div className="space-y-4">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              defaultChecked
              className="w-4 h-4 bg-[#0F172A] border-slate-700 rounded text-[#38BDF8] focus:ring-2 focus:ring-[#38BDF8]"
            />
            <span className="text-sm text-slate-300">
              Notificar sobre novas vendas
            </span>
          </label>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              defaultChecked
              className="w-4 h-4 bg-[#0F172A] border-slate-700 rounded text-[#38BDF8] focus:ring-2 focus:ring-[#38BDF8]"
            />
            <span className="text-sm text-slate-300">
              Relatório semanal por email
            </span>
          </label>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              className="w-4 h-4 bg-[#0F172A] border-slate-700 rounded text-[#38BDF8] focus:ring-2 focus:ring-[#38BDF8]"
            />
            <span className="text-sm text-slate-300">
              Alertas de campanhas com baixo desempenho
            </span>
          </label>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-[#1E293B] rounded-lg border border-red-900/50 p-6">
        <h2 className="text-lg font-semibold text-red-400 mb-4">Zona de Perigo</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-white mb-1">Excluir Workspace</h3>
            <p className="text-xs text-slate-400 mb-3">
              Esta ação não pode ser desfeita. Todos os dados serão perdidos permanentemente.
            </p>
            <button className="px-4 py-2 bg-red-500/10 border border-red-500/50 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors">
              Excluir Workspace
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
