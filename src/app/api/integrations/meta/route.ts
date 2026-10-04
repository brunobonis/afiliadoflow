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

    const adAccountId: string = body.adAccountId

    const account = await prisma.metaAccount.create({
      data: {
        workspaceId: session.workspaceId,
        accountId: adAccountId,
        accountName: body.accountName,
        accessToken: body.accessToken, // In production, encrypt this
        // Manual tokens from the Graph API Explorer last ~60 days
        tokenExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        adAccountIds: [adAccountId],
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
