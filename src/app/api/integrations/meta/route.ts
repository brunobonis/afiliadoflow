import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()

    const accounts = await prisma.metaAccount.findMany({
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

    const account = await prisma.metaAccount.create({
      data: {
        workspaceId: session.workspaceId,
        accountName: body.accountName,
        adAccountId: body.adAccountId,
        accessToken: body.accessToken, // In production, encrypt this
        status: 'pending',
      },
    })

    return NextResponse.json(account)
  } catch (error) {
    console.error('Error creating Meta account:', error)
    return NextResponse.json(
      { error: 'Erro ao adicionar conta Meta' },
      { status: 500 }
    )
  }
}
