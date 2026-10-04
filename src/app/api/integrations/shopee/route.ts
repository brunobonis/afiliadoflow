import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { encryptSecret, encryptionConfigured } from '@/lib/crypto'
import { fetchConversions } from '@/lib/shopee-sync'
import { ShopeeApiError } from '@/lib/shopee'

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()

    const accounts = await prisma.shopeeAccount.findMany({
      where: { workspaceId: session.workspaceId },
      orderBy: { createdAt: 'desc' },
      // appSecret nunca sai daqui, nem cifrado.
      select: {
        id: true,
        accountName: true,
        appId: true,
        status: true,
        errorMessage: true,
        lastSyncAt: true,
        createdAt: true,
      },
    })

    return NextResponse.json(accounts)
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function POST(request: NextRequest) {
  let session

  try {
    session = await requireAuth()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!encryptionConfigured()) {
    return NextResponse.json(
      { error: 'ENCRYPTION_KEY não configurada no servidor. A credencial não pode ser guardada com segurança.' },
      { status: 503 }
    )
  }

  try {
    const body = await request.json()
    const appId = String(body.appId || '').trim()
    const appSecret = String(body.appSecret || '').trim()
    const accountName = String(body.accountName || '').trim() || 'Shopee Afiliados'

    if (!appId || !appSecret) {
      return NextResponse.json(
        { error: 'AppId e Secret são obrigatórios' },
        { status: 400 }
      )
    }

    // Valida contra a API real antes de gravar. A versão anterior marcava a
    // conta como ativa sem nunca chamar a Shopee, então credencial errada só
    // aparecia muito depois, como relatório vazio.
    const fim = new Date()
    const inicio = new Date(fim.getTime() - 24 * 60 * 60 * 1000)

    try {
      await fetchConversions({ appId, appSecret }, inicio, fim)
    } catch (error) {
      if (error instanceof ShopeeApiError) {
        // "wrong type" e afins são erro de validação da consulta, não de
        // credencial: dizer "credenciais recusadas" mandaria você conferir
        // AppId e Secret que estão corretos.
        const credencial = error.code !== undefined

        return NextResponse.json(
          {
            error: credencial
              ? `A Shopee recusou estas credenciais: ${error.message}`
              : `A Shopee recusou a consulta (não é problema de credencial): ${error.message}`,
            code: error.code,
            detail: error.detail,
          },
          { status: 400 }
        )
      }

      throw error
    }

    const account = await prisma.shopeeAccount.create({
      data: {
        workspaceId: session.workspaceId,
        accountName,
        appId,
        appSecret: encryptSecret(appSecret),
        // Colunas legadas da Open Platform, ainda NOT NULL no banco.
        partnerId: '',
        partnerKey: '',
        status: 'active',
      },
      select: { id: true, accountName: true, appId: true, status: true, createdAt: true },
    })

    return NextResponse.json(account)
  } catch (error) {
    console.error('Error creating Shopee account:', error)

    return NextResponse.json(
      { error: 'Erro ao salvar a conta Shopee' },
      { status: 500 }
    )
  }
}
