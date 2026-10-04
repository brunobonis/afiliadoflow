import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()
    const { searchParams } = new URL(request.url)

    const accountId = searchParams.get('accountId')
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const status = searchParams.get('status')

    const where: any = { workspaceId: session.workspaceId }

    if (accountId) where.shopeeAccountId = accountId
    if (status && status !== 'all') where.status = status

    /**
     * O filtro roda no banco, não na tela: filtrar depois de carregar tudo
     * faria o total divergir do que a lista mostra assim que o volume passasse
     * do que cabe numa resposta.
     */
    // A tela envia instantes ISO completos, já convertidos para o fuso de quem
    // está olhando. Montar o limite aqui a partir de uma data solta recortaria
    // o dia em UTC, e a venda das 21h apareceria no dia seguinte.
    if (from || to) {
      where.purchasedAt = {}

      const inicio = from ? new Date(from) : null
      const fim = to ? new Date(to) : null

      if (inicio && !Number.isNaN(inicio.getTime())) where.purchasedAt.gte = inicio
      if (fim && !Number.isNaN(fim.getTime())) where.purchasedAt.lte = fim
    }

    const sales = await prisma.sale.findMany({
      where,
      include: {
        product: true,
        link: true,
        shopeeAccount: { select: { id: true, accountName: true } },
      },
      orderBy: { purchasedAt: 'desc' },
    })

    // Os totais vêm do mesmo recorte da lista, para não haver divergência.
    const resumo = sales.reduce(
      (acc, sale) => {
        acc.total++
        acc.porStatus[sale.status] = (acc.porStatus[sale.status] || 0) + 1

        if (sale.status === 'confirmed') {
          acc.receitaConfirmada += sale.amount
          acc.comissaoConfirmada += sale.commission
        } else if (sale.status !== 'cancelled') {
          acc.comissaoPendente += sale.commission
        }

        return acc
      },
      {
        total: 0,
        receitaConfirmada: 0,
        comissaoConfirmada: 0,
        comissaoPendente: 0,
        porStatus: {} as Record<string, number>,
      }
    )

    return NextResponse.json({ sales, resumo })
  } catch (error) {
    console.error('Sales error:', error)

    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
