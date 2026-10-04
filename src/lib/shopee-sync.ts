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
 * Só campos que a introspecção confirmou existir. GraphQL exige nomear cada
 * campo, e um nome inventado derruba a consulta inteira.
 *
 * pageInfo traz apenas scrollId: limit e hasNextPage são declarados não nulos
 * mas voltam null, e selecioná-los faz a resposta inteira falhar com
 * "got null for non-null".
 */
/**
 * A Shopee declara vários campos como não nulos e devolve null neles, o que
 * derruba a resposta inteira com "got null for non-null". completeTime é o
 * caso mais provável: fica nulo enquanto a comissão não confirma.
 *
 * Por isso duas seleções: a rica, e uma mínima para quando a rica falhar.
 * Melhor perder colunas do que não sincronizar venda nenhuma.
 */
const ITEM_FIELDS_RICH = `
  itemId
  modelId
  itemName
  imageUrl
  shopName
  qty
  actualAmount
  itemTotalCommission
  categoryLv1Name
  channelType
  attributionType
`

const ITEM_FIELDS_MINIMAL = `
  itemId
  modelId
  itemName
  qty
  actualAmount
  itemTotalCommission
`

const buildQuery = (itemFields: string) => `
  query ConversionReport($start: Int64, $end: Int64, $limit: Int, $scrollId: String) {
    conversionReport(
      purchaseTimeStart: $start
      purchaseTimeEnd: $end
      limit: $limit
      scrollId: $scrollId
    ) {
      pageInfo {
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
        buyerType
        device
        productType
        referrer
        utmContent
        orders {
          orderId
          orderStatus
          shopType
          items {
            ${itemFields}
          }
        }
      }
    }
  }
`

/** Opcionais são os que só existem na seleção rica; na mínima não vêm. */
interface ConversionItem {
  itemId: string | number
  modelId: string | number
  itemName: string
  qty: number
  actualAmount: string
  itemTotalCommission: string
  imageUrl?: string
  shopName?: string
  categoryLv1Name?: string | null
  channelType?: string
  attributionType?: string
}

interface ConversionOrder {
  orderId: string
  orderStatus?: string
  shopType?: string
  items?: ConversionItem[]
}

interface ConversionNode {
  conversionId: string | number
  checkoutId: string | number
  purchaseTime: number
  clickTime: number
  conversionStatus: string
  totalCommission: string
  netCommission: string
  buyerType: string
  device: string
  productType: string
  referrer: string
  utmContent: string
  orders?: ConversionOrder[]
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

const PAGE_SIZE = 100

/** Trava contra laço infinito caso o cursor nunca termine. */
const MAX_PAGES = 50

interface ConversionPage {
  conversionReport: {
    pageInfo: { scrollId: string | null } | null
    nodes: ConversionNode[]
  }
}

/**
 * Erro de formato da consulta, não de credencial. A presença de um código
 * numérico não distingue os dois: "got null for non-null" chega com o código
 * 10010 e nada tem a ver com AppId ou Secret.
 */
export function isQueryShapeError(error: unknown): boolean {
  return (
    error instanceof ShopeeApiError &&
    /wrong type|invalid type|cannot represent|expected type|got null for non-null/i.test(
      error.message
    )
  )
}

async function fetchPage(
  credentials: ShopeeCredentials,
  start: number,
  end: number,
  scrollId: string | null
): Promise<ConversionPage['conversionReport']> {
  /**
   * purchaseTimeStart/End são o escalar Int64 e a forma aceita não está
   * documentada. Em produção a string funcionou, mas o fallback fica porque a
   * alternativa é falhar inteiro por uma suposição.
   */
  const tentativas: Array<{ query: string; variables: Record<string, unknown> }> = []

  for (const itemFields of [ITEM_FIELDS_RICH, ITEM_FIELDS_MINIMAL]) {
    tentativas.push(
      { query: buildQuery(itemFields), variables: { start: String(start), end: String(end), limit: PAGE_SIZE, scrollId } },
      { query: buildQuery(itemFields), variables: { start, end, limit: PAGE_SIZE, scrollId } }
    )
  }

  let ultimoErro: unknown

  for (const tentativa of tentativas) {
    try {
      const data = await shopeeGraphQL<ConversionPage>(
        credentials,
        tentativa.query,
        tentativa.variables
      )

      return data.conversionReport
    } catch (error) {
      ultimoErro = error

      // Credencial, permissão ou limite não melhoram com outro formato.
      if (!isQueryShapeError(error)) throw error
    }
  }

  throw ultimoErro
}

/**
 * Percorre todas as páginas antes de devolver.
 *
 * O scrollId da Shopee vale cerca de 30 segundos, então nada de gravar no
 * banco entre uma página e outra: a escrita atrasaria a próxima chamada e o
 * cursor expiraria no meio da coleta, truncando sem erro visível.
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
    const recebidos = resultado.nodes || []

    nodes.push(...recebidos)
    scrollId = resultado.pageInfo?.scrollId ?? null

    if (recebidos.length < PAGE_SIZE) return { nodes, truncated: false }
    if (!scrollId) return { nodes, truncated: true }
  }

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

function mapStatus(status: string): string {
  const normalized = (status || '').toLowerCase()

  if (normalized.includes('cancel') || normalized.includes('invalid')) return 'cancelled'
  if (normalized.includes('complet') || normalized.includes('confirm')) return 'confirmed'

  return 'pending'
}

/**
 * Uma linha por item comprado, não por conversão.
 *
 * Uma conversão pode conter vários pedidos e cada pedido vários produtos, e é
 * no item que vivem itemName, qty, preço, categoria e channelType. Gravar por
 * conversão deixava "qual produto vendeu" sem resposta, que é justamente a
 * pergunta do relatório.
 */
function linhasDe(node: ConversionNode, workspaceId: string, shopeeAccountId: string) {
  const conversionId = String(node.conversionId)
  const purchasedAt = parseEpochSeconds(node.purchaseTime) ?? new Date()
  const subId = node.utmContent || null

  const origem = subId ? 'shopee_subid' : node.referrer ? 'shopee_referrer' : 'unattributed'
  const status = mapStatus(node.conversionStatus)

  return (node.orders || []).flatMap((order) =>
    (order.items || []).map((item) => ({
      // Chave estável por item: a mesma conversão reaparece quando a comissão
      // confirma, e sem o item na chave cada sincronização duplicaria tudo.
      externalId: `${conversionId}:${order.orderId}:${item.itemId}:${item.modelId}`,
      payload: {
        workspaceId,
        shopeeAccountId,
        orderNumber: order.orderId,
        subId,
        amount: parseMoney(item.actualAmount),
        commission: parseMoney(item.itemTotalCommission),
        quantity: Number(item.qty) || 1,
        status,
        attributionSource: origem,
        productName: item.itemName || null,
        productImage: item.imageUrl || null,
        shopName: item.shopName || null,
        referrer: node.referrer || null,
        device: node.device || null,
        buyerType: node.buyerType || null,
        // channelType e attributionType sao do item, nao da conversao.
        channelType: item.channelType || null,
        attributionType: item.attributionType || null,
        categoryName: item.categoryLv1Name || null,
        purchasedAt,
        // item.completeTime seria a data exata da confirmação, mas vem null
        // enquanto a comissão não confirma — e, sendo declarado Int64!, isso
        // derruba a consulta inteira. Aproximamos pela data da compra.
        confirmedAt: status === 'confirmed' ? purchasedAt : null,
        shopeeData: { conversion: node, order, item } as unknown as object,
      },
    }))
  )
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

  const linhas = nodes.flatMap((node) => linhasDe(node, workspaceId, account.id))

  // Uma consulta para saber o que já existe, em vez de uma por item: no plano
  // Hobby a função é cortada em poucos segundos, e uma ida ao banco por
  // registro estoura esse limite conforme o volume cresce.
  const existentes = new Map(
    (
      await prisma.sale.findMany({
        where: { workspaceId, externalId: { in: linhas.map((l) => l.externalId) } },
        select: { id: true, externalId: true },
      })
    ).map((venda) => [venda.externalId, venda.id])
  )

  const novas: Array<Record<string, unknown>> = []
  let updated = 0

  for (const linha of linhas) {
    const existingId = existentes.get(linha.externalId)

    if (existingId) {
      await prisma.sale.update({ where: { id: existingId }, data: linha.payload })
      updated++
    } else {
      novas.push({ ...linha.payload, externalId: linha.externalId })
    }
  }

  if (novas.length) {
    await prisma.sale.createMany({ data: novas as never })
  }

  await prisma.shopeeAccount.update({
    where: { id: account.id },
    data: { status: 'active', errorMessage: null, lastSyncAt: new Date() },
  })

  return {
    fetched: linhas.length,
    created: novas.length,
    updated,
    rangeStart: start,
    rangeEnd: end,
    truncated,
    sample: nodes[0] ?? null,
  }
}
