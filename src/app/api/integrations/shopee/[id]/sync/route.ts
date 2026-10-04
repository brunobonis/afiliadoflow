import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { syncShopeeAccount } from '@/lib/shopee-sync'
import { ShopeeApiError } from '@/lib/shopee'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let session

  try {
    session = await requireAuth()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const days = Math.min(Number(searchParams.get('days')) || 30, 180)

    const result = await syncShopeeAccount(id, session.workspaceId, { days })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Shopee sync error:', error)

    // O erro da Shopee é informativo (credencial, permissão, limite), então
    // vale repassar em vez de esconder atrás de "erro interno".
    if (error instanceof ShopeeApiError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao sincronizar' },
      { status: 500 }
    )
  }
}
