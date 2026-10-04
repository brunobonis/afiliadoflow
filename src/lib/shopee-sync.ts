import { prisma } from '@/lib/prisma'
import { decryptSecret } from '@/lib/crypto'
import {
  shopeeGraphQL,
  ShopeeApiError,
  parseMoney,
  parseEpochSeconds,
  type ShopeeCredentials,
} from '@/lib/shopee'

/**
 * Só campos que a introspecção da API confirmou existir. GraphQL exige nomear
 * cada campo, e um nome inventado derruba a query inteira — então nada entra
 * aqui sem ter aparecido na sonda.
 *
 * Ainda de fora, por falta de confirmação: pageInfo (paginação) e os campos
 * de ConversionReportOrder.items.
 */
const CONVERSION_REPORT_QUERY = `
  query ConversionReport($start: Int64, $end: Int64, $limit: Int, $scrollId: String) {
    conversionReport(
      purchaseTimeStart: $start
      purchaseTimeEnd: $end
      limit: $limit
      scrollId: $scrollId
    ) {
      pageInfo {
        limit
        hasNextPage
        scrollId
      }
      nodes {
        conversionId
        checkoutId
        purchaseTime
        clickTime
        conversionStatus
        totalCommission
        netCommission
        sellerCommission
        shopeeCommissionCapped
        buyerType
        device
        productType
        referrer
        utmContent
        orders {
          orderId
          orderStatus
          shopType
        }
      }
    }
  }
`

interface ConversionNode {
  conversionId: string | number
  checkoutId: string | number
  purchaseTime: number
  clickTime: number
  conversionStatus: string
  totalCommission: string
  netCommission: string
  sellerCommission: string
  shopeeCommissionCapped: string
  buyerType: string
  device: string
  productType: string
  referrer: string
  utmContent: string
  orders?: Array<{ orderId: string; orderStatus?: string; shopType?: string }>
}

export interface SyncResult {
  fetched: number
  created: number
  updated: number
  rangeStart: Date
  rangeEnd: Date
  /** true quando a coleta bateu no teto de páginas e pode faltar venda. */
  truncated: boolean
  /** Primeiro registro cru, para conferir o formato real que a Shopee devolve. */
  sample: ConversionNode | null
}

/**
 * A Shopee confirma a comissão depois da compra, então o mesmo conversionId
 * reaparece com outro status e outro valor. Gravar por insert duplicaria a
 * venda a cada sincronização; a chave é o conversionId.
 */
function mapStatus(conversionStatus: string): string {
  const normalized = (conversionStatus || '').toLowerCase()

  if (normalized.includes('cancel') || normalized.includes('invalid')) return 'cancelled'
  if (normalized.includes('complet') || normalized.includes('confirm')) return 'confirmed'

  return 'pending'
}

/** Erro de validação da consulta, não de credencial — vale tentar outra forma. */
function isTypeError(error: unknown): boolean {
  return (
    error instanceof ShopeeApiError &&
    /wrong type|invalid type|cannot represent|expected type/i.test(error.message)
  )
}

const PAGE_SIZE = 100

/** Trava contra laço infinito caso hasNextPage nunca vire false. */
const MAX_PAGES = 50

interface ConversionPage {
  conversionReport: {
    pageInfo: { limit: number; hasNextPage: boolean; scrollId: string | null }
    nodes: ConversionNode[]
  }
}

async function fetchPage(
  credentials: ShopeeCredentials,
  start: number,
  end: number,
  scrollId: string | null
): Promise<ConversionPage['conversionReport']> {
  /**
   * purchaseTimeStart/End são o escalar Int64, e a forma aceita não está
   * documentada: há APIs que exigem string, para não perder precisão em 64
   * bits, e outras que exigem número. Em produção a string funcionou, mas o
   * fallback fica porque a alternativa é falhar inteiro por uma suposição.
   */
  const tentativas: Array<Record<string, unknown>> = [
    { start: String(start), end: String(end), limit: PAGE_SIZE, scrollId },
    { start, end, limit: PAGE_SIZE, scrollId },
  ]

  let ultimoErro: unknown

  for (const variables of tentativas) {
    try {
      const data = await shopeeGraphQL<ConversionPage>(
        credentials,
        CONVERSION_REPORT_QUERY,
        variables
      )

      return data.conversionReport
    } catch (error) {
      ultimoErro = error

      // Credencial, permissão ou limite não melhoram com outra codificação.
      if (!isTypeError(error)) throw error
    }
  }

  throw ultimoErro
}

/**
 * Percorre todas as páginas antes de devolver.
 *
 * O scrollId da Shopee vale ~30 segundos, então nada de gravar no banco entre
 * uma página e outra: a escrita atrasaria a próxima chamada e o cursor
 * expiraria no meio da coleta, truncando o resultado sem erro visível.
 */
export async function fetchConversions(
  credentials: ShopeeCredentials,
  start: Date,
  end: Date
): Promise<{ nodes: ConversionNode[]; truncated: boolean }> {
  const inicio = Math.floor(start.getTime() / 1000)
  const fim = Math.floor(end.getTime() / 1000)

  const nodes: ConversionNode[] = []
  let scrollId: string | null = null

  for (let pagina = 0; pagina < MAX_PAGES; pagina++) {
    const resultado = await fetchPage(credentials, inicio, fim, scrollId)

    nodes.push(...(resultado.nodes || []))

    if (!resultado.pageInfo?.hasNextPage) {
      return { nodes, truncated: false }
    }

    scrollId = resultado.pageInfo.scrollId
  }

  // Bateu no teto: melhor avisar do que devolver um total errado em silêncio.
  return { nodes, truncated: true }
}

export function credentialsOf(account: {
  appId: string | null
  appSecret: string | null
}): ShopeeCredentials {
  if (!account.appId || !account.appSecret) {
    throw new Error('Conta sem AppId ou Secret cadastrados')
  }

  return { appId: account.appId, appSecret: decryptSecret(account.appSecret) }
}

export async function syncShopeeAccount(
  accountId: string,
  workspaceId: string,
  options: { days?: number } = {}
): Promise<SyncResult> {
  const account = await prisma.shopeeAccount.findFirst({
    where: { id: accountId, workspaceId },
  })

  if (!account) throw new Error('Conta Shopee não encontrada')

  const end = new Date()
  const start = new Date(end.getTime() - (options.days ?? 30) * 24 * 60 * 60 * 1000)

  let nodes: ConversionNode[]
  let truncated: boolean

  try {
    ;({ nodes, truncated } = await fetchConversions(credentialsOf(account), start, end))
  } catch (error) {
    await prisma.shopeeAccount.update({
      where: { id: account.id },
      data: {
        status: 'error',
        errorMessage: error instanceof Error ? error.message.slice(0, 500) : 'Erro desconhecido',
      },
    })

    throw error
  }

  // Uma consulta para saber o que já existe, em vez de um findFirst por venda:
  // o plano Hobby da Vercel corta a função em poucos segundos, e uma ida ao
  // banco por registro estoura esse limite rápido conforme o volume cresce.
  const externalIds = nodes.map((node) => String(node.conversionId))

  const existentes = new Map(
    (
      await prisma.sale.findMany({
        where: { workspaceId, externalId: { in: externalIds } },
        select: { id: true, externalId: true },
      })
    ).map((venda) => [venda.externalId, venda.id])
  )

  const novas: Array<Record<string, unknown>> = []
  let created = 0
  let updated = 0

  for (const node of nodes) {
    const externalId = String(node.conversionId)
    const firstOrder = node.orders?.[0]

    // A comissão do afiliado é a líquida; as outras ficam no bruto para
    // auditoria, sem virar número no relatório.
    const commission = parseMoney(node.netCommission ?? node.totalCommission)
    const purchasedAt = parseEpochSeconds(node.purchaseTime) ?? new Date()
    const status = mapStatus(node.conversionStatus)

    const payload = {
      workspaceId,
      shopeeAccountId: account.id,
      externalId,
      orderNumber: firstOrder?.orderId ?? null,
      // utmContent carrega o sub_id quando o link tiver um; hoje vem vazio.
      subId: node.utmContent || null,
      amount: parseMoney(node.totalCommission),
      commission,
      status,
      attributionSource: node.utmContent ? 'shopee_subid' : 'unattributed',
      purchasedAt,
      confirmedAt: status === 'confirmed' ? parseEpochSeconds(node.purchaseTime) : null,
      shopeeData: node as unknown as object,
    }

    const existingId = existentes.get(externalId)

    if (existingId) {
      await prisma.sale.update({ where: { id: existingId }, data: payload })
      updated++
    } else {
      novas.push(payload)
    }
  }

  if (novas.length) {
    await prisma.sale.createMany({ data: novas as never })
    created = novas.length
  }

  await prisma.shopeeAccount.update({
    where: { id: account.id },
    data: { status: 'active', errorMessage: null, lastSyncAt: new Date() },
  })

  return {
    fetched: nodes.length,
    created,
    updated,
    rangeStart: start,
    rangeEnd: end,
    truncated,
    sample: nodes[0] ?? null,
  }
}
