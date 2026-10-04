import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

interface Agrupamento {
  chave: string
  vendas: number
  itens: number
  receita: number
  comissao: number
  comissaoConfirmada: number
}

/**
 * Agrega em memória em vez de usar groupBy do banco porque a chave de origem é
 * channelType com referrer de reserva, e a de produto precisa ignorar nulo —
 * regras que não cabem num groupBy. O recorte de data limita o volume.
 */
function agrupar(
  vendas: Array<{
    status: string
    amount: number
    commission: number
    quantity: number
  }>,
  chaveDe: (venda: any) => string | null
): Agrupamento[] {
  const mapa = new Map<string, Agrupamento>()

  for (const venda of vendas) {
    const chave = chaveDe(venda)
    if (!chave) continue

    const atual = mapa.get(chave) || {
      chave,
      vendas: 0,
      itens: 0,
      receita: 0,
      comissao: 0,
      comissaoConfirmada: 0,
    }

    atual.vendas++
    atual.itens += venda.quantity || 1

    // Cancelada não entra em receita nem comissão: contar inflaria o resultado
    // de um produto que na prática não pagou nada.
    if (venda.status !== 'cancelled') {
      atual.receita += venda.amount
      atual.comissao += venda.commission

      if (venda.status === 'confirmed') atual.comissaoConfirmada += venda.commission
    }

    mapa.set(chave, atual)
  }

  return [...mapa.values()].sort((a, b) => b.comissao - a.comissao)
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()
    const { searchParams } = new URL(request.url)

    const from = searchParams.get('from')
    const to = searchParams.get('to')

    const where: any = { workspaceId: session.workspaceId }

    if (from || to) {
      where.purchasedAt = {}

      const inicio = from ? new Date(from) : null
      const fim = to ? new Date(to) : null

      if (inicio && !Number.isNaN(inicio.getTime())) where.purchasedAt.gte = inicio
      if (fim && !Number.isNaN(fim.getTime())) where.purchasedAt.lte = fim
    }

    const vendas = await prisma.sale.findMany({
      where,
      select: {
        status: true,
        amount: true,
        commission: true,
        quantity: true,
        productName: true,
        categoryName: true,
        channelType: true,
        referrer: true,
        shopName: true,
        device: true,
        buyerType: true,
        purchasedAt: true,
      },
    })

    const totais = vendas.reduce(
      (acc, venda) => {
        acc.vendas++

        if (venda.status !== 'cancelled') {
          acc.receita += venda.amount
          acc.comissao += venda.commission
          if (venda.status === 'confirmed') acc.comissaoConfirmada += venda.commission
          else acc.comissaoPendente += venda.commission
        } else {
          acc.canceladas++
        }

        return acc
      },
      {
        vendas: 0,
        canceladas: 0,
        receita: 0,
        comissao: 0,
        comissaoConfirmada: 0,
        comissaoPendente: 0,
      }
    )

    return NextResponse.json({
      totais,
      porProduto: agrupar(vendas, (v) => v.productName).slice(0, 50),
      porOrigem: agrupar(vendas, (v) => v.channelType || v.referrer),
      porCategoria: agrupar(vendas, (v) => v.categoryName),
      porLoja: agrupar(vendas, (v) => v.shopName).slice(0, 20),
      porDispositivo: agrupar(vendas, (v) => v.device),
      porComprador: agrupar(vendas, (v) => v.buyerType),
      porDia: agrupar(vendas, (v) =>
        v.purchasedAt ? new Date(v.purchasedAt).toISOString().slice(0, 10) : null
      ).sort((a, b) => a.chave.localeCompare(b.chave)),
    })
  } catch (error) {
    console.error('Reports error:', error)

    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
