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

    // Get origin statistics
    const events = await prisma.clickEvent.findMany({
      where: { linkId: link.id },
      select: { originType: true },
    })

    const total = events.length
    const originCounts: Record<string, number> = {}

    events.forEach((event) => {
      const origin = event.originType || 'unknown'
      originCounts[origin] = (originCounts[origin] || 0) + 1
    })

    const stats = Object.entries(originCounts).map(([originType, count]) => ({
      originType,
      count,
      percentage: (count / total) * 100,
    }))

    // Sort by count descending
    stats.sort((a, b) => b.count - a.count)

    return NextResponse.json(stats)
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
