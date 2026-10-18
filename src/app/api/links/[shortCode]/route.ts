import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shortCode: string }> }
) {
  try {
    const session = await requireAuth()
    const { shortCode } = await params

    const link = await prisma.trackingLink.findFirst({
      where: {
        shortCode,
        workspaceId: session.workspaceId,
      },
      include: {
        _count: {
          select: {
            // Conta só acesso de pessoa: este número também alimenta a taxa
            // de conversão da tela, e robô no divisor a afunda sem motivo.
            events: { where: { isBot: false } },
            sales: true,
          },
        },
      },
    })

    if (!link) {
      return NextResponse.json({ error: 'Link não encontrado' }, { status: 404 })
    }

    return NextResponse.json(link)
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
