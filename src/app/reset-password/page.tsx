'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import PasswordInput from '@/components/PasswordInput'

function ResetForm() {
  const router = useRouter()
  const token = useSearchParams().get('token') || ''

  const [password, setPassword] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [error, setError] = useState('')
  const [pronto, setPronto] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password !== confirmacao) {
      setError('A confirmação não confere com a nova senha')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Erro ao redefinir a senha')
        return
      }

      setPronto(true)
      // Dá tempo de ler a confirmação antes de sair da tela.
      setTimeout(() => router.push('/login'), 2500)
    } catch (err) {
      setError('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="space-y-6">
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded text-sm">
          Link inválido: o endereço não traz o código de recuperação.
        </div>
        <Link
          href="/forgot-password"
          className="block text-center text-sm text-[#38BDF8] hover:underline"
        >
          Pedir um novo link
        </Link>
      </div>
    )
  }

  if (pronto) {
    return (
      <div className="space-y-6">
        <div className="bg-green-500/10 border border-green-500/50 text-green-400 px-4 py-3 rounded text-sm">
          Senha alterada. Redirecionando para o login...
        </div>
        <Link href="/login" className="block text-center text-sm text-[#38BDF8] hover:underline">
          Ir agora
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded text-sm">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
          Nova senha
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

      <div>
        <label htmlFor="confirmacao" className="block text-sm font-medium text-slate-300 mb-2">
          Confirmar nova senha
        </label>
        <PasswordInput
          id="confirmacao"
          value={confirmacao}
          onChange={setConfirmacao}
          autoComplete="new-password"
          required
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-[#38BDF8] to-[#22D3EE] hover:from-[#0EA5E9] hover:to-[#06B6D4] text-white font-medium py-2.5 px-4 rounded-lg transition-all disabled:opacity-50"
      >
        {loading ? 'Salvando...' : 'Salvar nova senha'}
      </button>
    </form>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0B0E14] via-[#0F172A] to-[#111827] px-4">
      <div className="w-full max-w-md">
        <div className="bg-[#1E293B] rounded-lg border border-slate-700 p-8 shadow-2xl">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-white">Nova senha</h1>
            <p className="text-slate-400 text-sm mt-2">Escolha a senha de acesso da sua conta</p>
          </div>

          {/* useSearchParams exige Suspense na renderização estática do Next. */}
          <Suspense fallback={<p className="text-sm text-slate-400 text-center">Carregando...</p>}>
            <ResetForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
