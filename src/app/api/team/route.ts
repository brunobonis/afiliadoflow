import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()

    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId: session.workspaceId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json(members)
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    const body = await request.json()

    // Check if requester is admin
    const requester = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId: session.workspaceId,
        userId: session.userId,
      },
    })

    if (requester?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Apenas administradores podem adicionar membros' },
        { status: 403 }
      )
    }

    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { email: body.email },
    })

    // If user doesn't exist, create invitation
    if (!user) {
      // TODO: Send invitation email
      return NextResponse.json(
        { message: 'Convite enviado por email' },
        { status: 200 }
      )
    }

    // Check if already member
    const existing = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId: session.workspaceId,
        userId: user.id,
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Usuário já é membro deste workspace' },
        { status: 400 }
      )
    }

    // Add member
    const member = await prisma.workspaceMember.create({
      data: {
        workspaceId: session.workspaceId,
        userId: user.id,
        role: body.role || 'member',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(member)
  } catch (error) {
    console.error('Error adding member:', error)
    return NextResponse.json(
      { error: 'Erro ao adicionar membro' },
      { status: 500 }
    )
  }
}
