import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()

    const campaigns = await prisma.campaign.findMany({
      where: { workspaceId: session.workspaceId },
      include: {
        metaAccount: true,
        _count: {
          select: { links: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(campaigns)
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    const body = await request.json()

    const campaign = await prisma.campaign.create({
      data: {
        workspaceId: session.workspaceId,
        metaAccountId: body.metaAccountId || null,
        externalId: body.externalId || null,
        name: body.name,
        platform: body.platform || 'other',
        budget: body.budget || null,
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,
        status: 'active',
      },
    })

    return NextResponse.json(campaign)
  } catch (error) {
    console.error('Error creating campaign:', error)
    return NextResponse.json(
      { error: 'Erro ao criar campanha' },
      { status: 500 }
    )
  }
}
