import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { syncShopeeAccount } from '@/lib/shopee-sync'

/**
 * Sincronização automática, disparada pelo Cron da Vercel.
 *
 * A Shopee atualiza o relatório uma vez por dia, de madrugada, então rodar com
 * mais frequência só gastaria chamada sem trazer dado novo.
 */
export async function GET(request: NextRequest) {
  // A Vercel envia este cabeçalho nos disparos de cron. Sem a checagem, a rota
  // ficaria aberta na internet para qualquer um disparar sincronização.
  const segredo = process.env.CRON_SECRET

  if (segredo && request.headers.get('authorization') !== `Bearer ${segredo}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const contas = await prisma.shopeeAccount.findMany({
    where: { appId: { not: null }, appSecret: { not: null } },
    select: { id: true, workspaceId: true, accountName: true },
  })

  const resultados: Array<Record<string, unknown>> = []

  for (const conta of contas) {
    try {
      // Sete dias: cobre o atraso da Shopee em confirmar comissão sem relerá
      // meses inteiros a cada madrugada.
      const resultado = await syncShopeeAccount(conta.id, conta.workspaceId, { days: 7 })

      resultados.push({
        conta: conta.accountName,
        ok: true,
        recebidas: resultado.fetched,
        novas: resultado.created,
        atualizadas: resultado.updated,
      })
    } catch (error) {
      // Uma conta com credencial vencida não pode impedir as outras de
      // sincronizar; o erro fica registrado em errorMessage pela própria sync.
      resultados.push({
        conta: conta.accountName,
        ok: false,
        erro: error instanceof Error ? error.message.slice(0, 200) : 'Erro desconhecido',
      })
    }
  }

  return NextResponse.json({ executadoEm: new Date().toISOString(), resultados })
}
