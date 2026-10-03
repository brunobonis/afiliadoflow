import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()

    const accounts = await prisma.shopeeAccount.findMany({
      where: { workspaceId: session.workspaceId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(accounts)
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    const body = await request.json()

    // Validate required fields
    if (!body.accountName || !body.partnerId || !body.partnerKey) {
      return NextResponse.json(
        { error: 'Nome, Partner ID e Partner Key são obrigatórios' },
        { status: 400 }
      )
    }

    // TODO: In production, encrypt partnerKey before storing
    const account = await prisma.shopeeAccount.create({
      data: {
        workspaceId: session.workspaceId,
        accountName: body.accountName,
        partnerId: body.partnerId,
        partnerKey: body.partnerKey, // Should be encrypted
        shopId: body.shopId,
        status: 'pending',
      },
    })

    // TODO: Test connection to Shopee API here
    // For now, just set as active
    await prisma.shopeeAccount.update({
      where: { id: account.id },
      data: { status: 'active' },
    })

    return NextResponse.json(account)
  } catch (error) {
    console.error('Error creating Shopee account:', error)
    return NextResponse.json(
      { error: 'Erro ao criar conta Shopee' },
      { status: 500 }
    )
  }
}
