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

    const products = await prisma.product.findMany({
      where: whereClause,
      include: {
        shopeeAccount: true,
        _count: {
          select: { links: true, sales: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(products)
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    const body = await request.json()

    const product = await prisma.product.create({
      data: {
        workspaceId: session.workspaceId,
        shopeeAccountId: body.shopeeAccountId || null,
        externalId: body.externalId || null,
        name: body.name,
        imageUrl: body.imageUrl || null,
        price: body.price || null,
        commission: body.commission || null,
        commissionRate: body.commissionRate || null,
        status: 'active',
      },
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json({ error: 'Error creating product' }, { status: 500 })
  }
}
