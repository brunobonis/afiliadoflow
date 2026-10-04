import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { setSession, MIN_PASSWORD_LENGTH } from '@/lib/auth'

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
}

// Appends a counter until the slug is free, so two "Minha Loja" never collide.
async function uniqueSlug(base: string) {
  const root = base || 'workspace'
  let candidate = root

  for (let i = 2; await prisma.workspace.findUnique({ where: { slug: candidate } }); i++) {
    candidate = `${root}-${i}`
  }

  return candidate
}

export async function POST(request: NextRequest) {
  // Kill switch: set DISABLE_REGISTRATION=true to make the app invite-only.
  if (process.env.DISABLE_REGISTRATION === 'true') {
    return NextResponse.json(
      { error: 'Cadastro desabilitado' },
      { status: 403 }
    )
  }

  try {
    const body = await request.json()
    const name: string = (body.name || '').trim()
    const email: string = (body.email || '').trim().toLowerCase()
    const password: string = body.password || ''
    const workspaceName: string = (body.workspaceName || '').trim() || `Workspace de ${name}`

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Nome, email e senha são obrigatórios' },
        { status: 400 }
      )
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: `A senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres` },
        { status: 400 }
      )
    }

    if (await prisma.user.findUnique({ where: { email } })) {
      return NextResponse.json(
        { error: 'Já existe uma conta com este email' },
        { status: 409 }
      )
    }

    const slug = await uniqueSlug(slugify(workspaceName))
    const passwordHash = await bcrypt.hash(password, 10)

    const { user, workspace } = await prisma.$transaction(async (tx) => {
      const workspace = await tx.workspace.create({
        data: {
          name: workspaceName,
          slug,
          timezone: 'America/Sao_Paulo',
          currency: 'BRL',
        },
      })

      const user = await tx.user.create({
        data: { email, name, passwordHash },
      })

      await tx.workspaceUser.create({
        data: { workspaceId: workspace.id, userId: user.id, role: 'owner' },
      })

      return { user, workspace }
    })

    await setSession({
      userId: user.id,
      email: user.email,
      workspaceId: workspace.id,
      role: 'owner',
    })

    return NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, name: user.name },
    })
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json(
      { error: 'Erro ao criar a conta' },
      { status: 500 }
    )
  }
}
