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
  query ConversionReport($start: Int64, $end: Int64) {
    conversionReport(purchaseTimeStart: $start, purchaseTimeEnd: $end) {
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

export async function fetchConversions(
  credentials: ShopeeCredentials,
  start: Date,
  end: Date
): Promise<ConversionNode[]> {
  const inicio = Math.floor(start.getTime() / 1000)
  const fim = Math.floor(end.getTime() / 1000)

  /**
   * A Shopee declara purchaseTimeStart/End como o escalar Int64, e a forma
   * aceita não está documentada: algumas APIs exigem string, para não perder
   * precisão em 64 bits, e outras exigem número. Em vez de fixar um palpite,
   * tenta string e, se o erro for de tipo, repete com número.
   */
  const tentativas: Array<Record<string, unknown>> = [
    { start: String(inicio), end: String(fim) },
    { start: inicio, end: fim },
  ]

  let ultimoErro: unknown

  for (const variables of tentativas) {
    try {
      const data = await shopeeGraphQL<{ conversionReport: { nodes: ConversionNode[] } }>(
        credentials,
        CONVERSION_REPORT_QUERY,
        variables
      )

      return data.conversionReport?.nodes || []
    } catch (error) {
      ultimoErro = error

      // Credencial, permissão ou limite não melhoram com outra codificação.
      if (!isTypeError(error)) throw error
    }
  }

  throw ultimoErro
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

  try {
    nodes = await fetchConversions(credentialsOf(account), start, end)
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

    const existing = await prisma.sale.findFirst({
      where: { workspaceId, externalId },
      select: { id: true },
    })

    if (existing) {
      await prisma.sale.update({ where: { id: existing.id }, data: payload })
      updated++
    } else {
      await prisma.sale.create({ data: payload })
      created++
    }
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
    sample: nodes[0] ?? null,
  }
}
