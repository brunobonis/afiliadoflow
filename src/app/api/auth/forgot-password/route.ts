import { NextRequest, NextResponse } from 'next/server'
import { createHash, randomBytes } from 'crypto'
import { prisma } from '@/lib/prisma'
import { enviarEmail, emailConfigurado, montarEmailDeRecuperacao } from '@/lib/email'

const VALIDADE_MINUTOS = 60
const MAX_PEDIDOS = 3
const JANELA_MINUTOS = 15

/** Só o hash vai para o banco; o token em claro existe apenas no e-mail. */
function hashDe(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    const normalizado = String(email || '').trim().toLowerCase()

    if (!normalizado) {
      return NextResponse.json({ error: 'Informe o email' }, { status: 400 })
    }

    if (!emailConfigurado()) {
      return NextResponse.json(
        { error: 'Envio de email não configurado no servidor.' },
        { status: 503 }
      )
    }

    const user = await prisma.user.findUnique({ where: { email: normalizado } })

    /**
     * A resposta é a mesma exista ou não a conta. Dizer "email não encontrado"
     * transformaria esta rota num verificador de quem tem conta aqui.
     */
    const respostaPadrao = NextResponse.json({
      success: true,
      message: 'Se existir uma conta com este email, o link de recuperação foi enviado.',
    })

    if (!user) return respostaPadrao

    // Impede que alguém use a rota para inundar a caixa de entrada de outra
    // pessoa, ou para gastar a cota de envio do servidor.
    const recentes = await prisma.passwordResetToken.count({
      where: {
        userId: user.id,
        createdAt: { gte: new Date(Date.now() - JANELA_MINUTOS * 60 * 1000) },
      },
    })

    if (recentes >= MAX_PEDIDOS) return respostaPadrao

    const token = randomBytes(32).toString('base64url')

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashDe(token),
        expiresAt: new Date(Date.now() + VALIDADE_MINUTOS * 60 * 1000),
      },
    })

    const base =
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || new URL(request.url).origin

    const { texto, html } = montarEmailDeRecuperacao(
      `${base}/reset-password?token=${token}`,
      VALIDADE_MINUTOS
    )

    try {
      await enviarEmail(user.email, 'Redefinir sua senha no AfiliadoFlow', html, texto)
    } catch (error) {
      // O erro de envio não volta detalhado para a tela, para não revelar a
      // existência da conta por meio da diferença de resposta.
      console.error('Falha ao enviar email de recuperação:', error)
    }

    return respostaPadrao
  } catch (error) {
    console.error('Forgot password error:', error)

    return NextResponse.json({ error: 'Erro ao processar o pedido' }, { status: 500 })
  }
}
