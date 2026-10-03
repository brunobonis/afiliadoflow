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
    })

    if (!link) {
      return NextResponse.json({ error: 'Link não encontrado' }, { status: 404 })
    }

    const clicks = await prisma.clickEvent.findMany({
      where: { linkId: link.id },
      orderBy: { clickedAt: 'desc' },
      take: 50,
    })

    return NextResponse.json(clicks)
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
