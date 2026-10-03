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

    const account = await prisma.metaAccount.update({
      where: {
        id,
        workspaceId: session.workspaceId,
      },
      data: {
        accountName: body.accountName,
        adAccountId: body.adAccountId,
        accessToken: body.accessToken,
        status: body.status,
      },
    })

    return NextResponse.json(account)
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao atualizar conta' },
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

    await prisma.metaAccount.delete({
      where: {
        id,
        workspaceId: session.workspaceId,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao excluir conta' },
      { status: 500 }
    )
  }
}
