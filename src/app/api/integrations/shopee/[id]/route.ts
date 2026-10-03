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

    // Check if account belongs to workspace
    const account = await prisma.shopeeAccount.findFirst({
      where: {
        id,
        workspaceId: session.workspaceId,
      },
    })

    if (!account) {
      return NextResponse.json(
        { error: 'Conta não encontrada' },
        { status: 404 }
      )
    }

    // Update account
    const updated = await prisma.shopeeAccount.update({
      where: { id },
      data: {
        accountName: body.accountName,
        partnerId: body.partnerId,
        partnerKey: body.partnerKey, // Should be encrypted
        shopId: body.shopId,
      },
    })

    return NextResponse.json(updated)
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

    // Check if account belongs to workspace
    const account = await prisma.shopeeAccount.findFirst({
      where: {
        id,
        workspaceId: session.workspaceId,
      },
    })

    if (!account) {
      return NextResponse.json(
        { error: 'Conta não encontrada' },
        { status: 404 }
      )
    }

    await prisma.shopeeAccount.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao excluir conta' },
      { status: 500 }
    )
  }
}
