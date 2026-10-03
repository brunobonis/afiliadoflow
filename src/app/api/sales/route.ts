import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()
    const { searchParams } = new URL(request.url)
    const accountId = searchParams.get('accountId')

    const whereClause: any = {
      workspaceId: session.workspaceId,
    }

    if (accountId) {
      whereClause.shopeeAccountId = accountId
    }

    const sales = await prisma.sale.findMany({
      where: whereClause,
      include: {
        product: true,
        link: true,
        shopeeAccount: true,
      },
      orderBy: { purchasedAt: 'desc' },
    })

    return NextResponse.json(sales)
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
