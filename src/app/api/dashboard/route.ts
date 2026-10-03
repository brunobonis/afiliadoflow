import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()
    const { searchParams } = new URL(request.url)
    const accountId = searchParams.get('accountId')

    // Build where clause
    const whereClause: any = {
      workspaceId: session.workspaceId,
    }

    if (accountId) {
      whereClause.shopeeAccountId = accountId
    }

    // Fetch workspace data
    const workspace = await prisma.workspace.findUnique({
      where: { id: session.workspaceId },
    })

    // Fetch sales stats
    const sales = await prisma.sale.findMany({
      where: {
        ...whereClause,
        status: 'confirmed',
      },
    })

    const totalRevenue = sales.reduce((acc, sale) => acc + sale.amount, 0)
    const totalCommission = sales.reduce((acc, sale) => acc + sale.commission, 0)
    const avgOrderValue = sales.length > 0 ? totalRevenue / sales.length : 0

    // Fetch clicks (only from links of filtered products)
    let clicks = 0
    if (accountId) {
      clicks = await prisma.clickEvent.count({
        where: {
          workspaceId: session.workspaceId,
          link: {
            product: {
              shopeeAccountId: accountId,
            },
          },
        },
      })
    } else {
      clicks = await prisma.clickEvent.count({
        where: { workspaceId: session.workspaceId },
      })
    }

    const conversionRate = clicks > 0 ? (sales.length / clicks) * 100 : 0

    // Recent sales
    const recentSales = await prisma.sale.findMany({
      where: whereClause,
      include: {
        product: true,
        link: true,
      },
      orderBy: { purchasedAt: 'desc' },
      take: 5,
    })

    // Top products
    const topProducts = await prisma.product.findMany({
      where: accountId
        ? {
            workspaceId: session.workspaceId,
            shopeeAccountId: accountId,
          }
        : { workspaceId: session.workspaceId },
      include: {
        _count: {
          select: { sales: true },
        },
      },
      orderBy: {
        sales: {
          _count: 'desc',
        },
      },
      take: 5,
    })

    return NextResponse.json({
      workspace,
      totalRevenue,
      totalCommission,
      avgOrderValue,
      clicks,
      conversionRate,
      recentSales,
      topProducts,
      salesCount: sales.length,
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
