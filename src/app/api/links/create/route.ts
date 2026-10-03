import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { generateShortCode } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    const body = await request.json()

    // Validate destination URL
    const destination = body.destination?.trim()
    if (!destination) {
      return NextResponse.json(
        { error: 'Link da Shopee é obrigatório' },
        { status: 400 }
      )
    }

    // Validate it's a Shopee link
    if (!destination.includes('shopee.com') && !destination.includes('shope.ee')) {
      return NextResponse.json(
        { error: 'Por favor, insira um link válido da Shopee' },
        { status: 400 }
      )
    }

    // Generate unique short code
    let shortCode = generateShortCode(6)
    let attempts = 0
    while (attempts < 10) {
      const existing = await prisma.trackingLink.findUnique({
        where: { shortCode },
      })
      if (!existing) break
      shortCode = generateShortCode(6)
      attempts++
    }

    // Create link
    const link = await prisma.trackingLink.create({
      data: {
        workspaceId: session.workspaceId,
        shortCode,
        destination,
        nickname: body.nickname || null,
        status: 'active',
      },
    })

    // TODO: Optional - Try to enrich with Shopee API if integration is connected
    // This would extract product info from the link if available

    return NextResponse.json({
      id: link.id,
      shortCode: link.shortCode,
      destination: link.destination,
      nickname: link.nickname,
    })
  } catch (error) {
    console.error('Error creating link:', error)
    return NextResponse.json(
      { error: 'Erro ao criar link' },
      { status: 500 }
    )
  }
}
