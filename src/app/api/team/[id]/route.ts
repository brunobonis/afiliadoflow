import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    const { id } = await params
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
        { error: 'Apenas administradores podem alterar permissões' },
        { status: 403 }
      )
    }

    const member = await prisma.workspaceMember.update({
      where: { id },
      data: { role: body.role },
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
    return NextResponse.json(
      { error: 'Erro ao atualizar membro' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    const { id } = await params

    // Check if requester is admin
    const requester = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId: session.workspaceId,
        userId: session.userId,
      },
    })

    if (requester?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Apenas administradores podem remover membros' },
        { status: 403 }
      )
    }

    await prisma.workspaceMember.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao remover membro' },
      { status: 500 }
    )
  }
}
