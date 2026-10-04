'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import PasswordInput from '@/components/PasswordInput'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [workspaceName, setWorkspaceName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, workspaceName }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Erro ao criar a conta')
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0B0E14] via-[#0F172A] to-[#111827] px-4 py-10">
      <div className="w-full max-w-md">
        <div className="bg-[#1E293B] rounded-lg border border-slate-700 p-8 shadow-2xl">
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#38BDF8] to-[#22D3EE] rounded-lg mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white">Criar conta</h1>
            <p className="text-slate-400 text-sm mt-2">Seu workspace é criado junto</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
                Seu nome
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                className="w-full px-4 py-2 bg-[#0F172A] border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#38BDF8] focus:border-transparent"
                placeholder="Bruno"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="w-full px-4 py-2 bg-[#0F172A] border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#38BDF8] focus:border-transparent"
                placeholder="seu@email.com"
                required
              />
            </div>

            <div>
              <label htmlFor="workspaceName" className="block text-sm font-medium text-slate-300 mb-2">
                Nome do workspace <span className="text-slate-500 font-normal">(opcional)</span>
              </label>
              <input
                id="workspaceName"
                type="text"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                className="w-full px-4 py-2 bg-[#0F172A] border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#38BDF8] focus:border-transparent"
                placeholder="Minha operação"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                Senha
              </label>
              <PasswordInput
                id="password"
                value={password}
                onChange={setPassword}
                autoComplete="new-password"
                required
              />
              <p className="text-xs text-slate-500 mt-1">Mínimo de 8 caracteres</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#38BDF8] to-[#22D3EE] hover:from-[#0EA5E9] hover:to-[#06B6D4] text-white font-medium py-2.5 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#38BDF8]/20"
            >
              {loading ? 'Criando...' : 'Criar conta'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-400">
            Já tem conta?{' '}
            <Link href="/login" className="text-[#38BDF8] hover:underline">
              Entrar
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
