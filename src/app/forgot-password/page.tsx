'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [enviado, setEnviado] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Erro ao enviar o link')
        return
      }

      setEnviado(data.message)
    } catch (err) {
      setError('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0B0E14] via-[#0F172A] to-[#111827] px-4">
      <div className="w-full max-w-md">
        <div className="bg-[#1E293B] rounded-lg border border-slate-700 p-8 shadow-2xl">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-white">Esqueci minha senha</h1>
            <p className="text-slate-400 text-sm mt-2">
              Enviamos um link para você escolher uma nova
            </p>
          </div>

          {enviado ? (
            <div className="space-y-6">
              <div className="bg-green-500/10 border border-green-500/50 text-green-400 px-4 py-3 rounded text-sm">
                {enviado}
              </div>
              <p className="text-sm text-slate-400">
                Confira também a caixa de spam. O link vale por 1 hora e só pode ser usado uma vez.
              </p>
              <Link
                href="/login"
                className="block text-center text-sm text-[#38BDF8] hover:underline"
              >
                Voltar para o login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded text-sm">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                  Email da conta
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

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#38BDF8] to-[#22D3EE] hover:from-[#0EA5E9] hover:to-[#06B6D4] text-white font-medium py-2.5 px-4 rounded-lg transition-all disabled:opacity-50"
              >
                {loading ? 'Enviando...' : 'Enviar link de recuperação'}
              </button>

              <Link
                href="/login"
                className="block text-center text-sm text-slate-400 hover:text-white"
              >
                Voltar para o login
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
