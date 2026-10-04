import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { encryptSecret } from '@/lib/crypto'
import { fetchConversions } from '@/lib/shopee-sync'
import { ShopeeApiError } from '@/lib/shopee'

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

    const data: Record<string, unknown> = {}

    if (typeof body.accountName === 'string') {
      data.accountName = body.accountName.trim()
    }

    // Troca de credencial: valida contra a Shopee antes de substituir, senão
    // uma credencial errada apagaria a que estava funcionando.
    if (body.appSecret) {
      const appId = String(body.appId || account.appId || '').trim()
      const appSecret = String(body.appSecret).trim()

      if (!appId) {
        return NextResponse.json({ error: 'AppId é obrigatório' }, { status: 400 })
      }

      const fim = new Date()

      try {
        await fetchConversions({ appId, appSecret }, new Date(fim.getTime() - 86400000), fim)
      } catch (error) {
        if (error instanceof ShopeeApiError) {
          return NextResponse.json(
            { error: `A Shopee recusou estas credenciais: ${error.message}` },
            { status: 400 }
          )
        }

        throw error
      }

      data.appId = appId
      data.appSecret = encryptSecret(appSecret)
      data.status = 'active'
      data.errorMessage = null
    }

    const updated = await prisma.shopeeAccount.update({
      where: { id },
      data,
      select: {
        id: true,
        accountName: true,
        appId: true,
        status: true,
        lastSyncAt: true,
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
