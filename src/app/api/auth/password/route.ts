import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { requireAuth, MIN_PASSWORD_LENGTH } from '@/lib/auth'

export async function PATCH(request: NextRequest) {
  let session

  try {
    session = await requireAuth()
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { currentPassword, newPassword } = await request.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Senha atual e nova senha são obrigatórias' },
        { status: 400 }
      )
    }

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: `A nova senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres` },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    const validPassword = await bcrypt.compare(currentPassword, user.passwordHash)

    if (!validPassword) {
      return NextResponse.json({ error: 'Senha atual incorreta' }, { status: 400 })
    }

    if (await bcrypt.compare(newPassword, user.passwordHash)) {
      return NextResponse.json(
        { error: 'A nova senha precisa ser diferente da atual' },
        { status: 400 }
      )
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await bcrypt.hash(newPassword, 10) },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Change password error:', error)
    return NextResponse.json(
      { error: 'Erro ao alterar a senha' },
      { status: 500 }
    )
  }
}
