import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { MIN_PASSWORD_LENGTH } from '@/lib/auth'

function hashDe(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json()

    if (!token || !password) {
      return NextResponse.json({ error: 'Token e senha são obrigatórios' }, { status: 400 })
    }

    if (String(password).length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: `A senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres` },
        { status: 400 }
      )
    }

    const registro = await prisma.passwordResetToken.findUnique({
      where: { tokenHash: hashDe(String(token)) },
    })

    // Mensagem única para token inexistente, expirado ou já usado: distinguir
    // os casos só ajudaria quem está testando tokens.
    if (!registro || registro.usedAt || registro.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Link inválido ou expirado. Peça um novo.' },
        { status: 400 }
      )
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: registro.userId },
        data: { passwordHash: await bcrypt.hash(String(password), 10) },
      }),
      prisma.passwordResetToken.update({
        where: { id: registro.id },
        data: { usedAt: new Date() },
      }),
      // Qualquer outro link em aberto perde a validade: se o pedido partiu de
      // alguém que invadiu a caixa de entrada, trocar a senha corta os demais.
      prisma.passwordResetToken.updateMany({
        where: { userId: registro.userId, usedAt: null },
        data: { usedAt: new Date() },
      }),
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Reset password error:', error)

    return NextResponse.json({ error: 'Erro ao redefinir a senha' }, { status: 500 })
  }
}
