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

/** Só o indispensável para identificar o produto. */
const ITEM_FIELDS_BARE = `
  itemId
  modelId
  itemName
  qty
`

/**
 * Da seleção mais completa à ausência total de itens.
 *
 * A última entrada é vazia de propósito: sem o bloco items a consulta volta a
 * ser a que já funcionou em produção. Perder o nome do produto é ruim, mas
 * pior é não sincronizar venda nenhuma — e sem este degrau nem cadastrar a
 * conta era possível, já que o cadastro valida chamando a API.
 */
const ITEM_SELECTIONS: Array<{ nome: string; campos: string | null; comLimit: boolean }> = [
  { nome: 'completa', campos: ITEM_FIELDS_RICH, comLimit: true },
  { nome: 'completa sem limite', campos: ITEM_FIELDS_RICH, comLimit: false },
  { nome: 'reduzida', campos: ITEM_FIELDS_MINIMAL, comLimit: true },
  { nome: 'minima', campos: ITEM_FIELDS_BARE, comLimit: true },
  { nome: 'sem itens', campos: null, comLimit: false },
]

/**
 * pageInfo fica de fora.
 *
 * A introspecção declara pageInfo: PageInfo!, mas a Shopee devolve null nele,
 * e um não nulo nulo derruba a resposta inteira — foi o que quebrou até a
 * seleção "sem itens", que reproduz a consulta já comprovada em produção.
 * Sem pageInfo não há cursor, então a coleta é de página única e sinaliza
 * truncamento quando vem cheia.
 */
const buildQuery = (itemFields: string | null, comLimit: boolean) => `
  query ConversionReport($start: Int64, $end: Int64${comLimit ? ', $limit: Int' : ''}) {
    conversionReport(
      purchaseTimeStart: $start
      purchaseTimeEnd: $end
      ${comLimit ? 'limit: $limit' : ''}
    ) {
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
          ${itemFields ? `items { ${itemFields} }` : ''}
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
  /** Qual seleção de campos a API aceitou: completa, reduzida, minima, sem itens. */
  selecao: string
  /** Quantas janelas de tempo foram necessárias para cobrir o período. */
  janelas: number
  /** Primeiro registro cru, para conferir o formato real que a Shopee devolve. */
  sample: ConversionNode | null
}

const PAGE_SIZE = 100


interface ConversionPage {
  conversionReport: {
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
  end: number
): Promise<ConversionPage['conversionReport'] & { selecao: string }> {
  /**
   * purchaseTimeStart/End são o escalar Int64 e a forma aceita não está
   * documentada. Em produção a string funcionou, mas o fallback fica porque a
   * alternativa é falhar inteiro por uma suposição.
   */
  // Cada tentativa que falha entra aqui com o que foi tentado. Reportar só uma
  // mensagem escondia qual combinação a gerou, e o diagnostico virava chute.
  const falhas: Array<{ selecao: string; erro: string }> = []

  for (const selecao of ITEM_SELECTIONS) {
    /**
     * Int64 vai como texto. As oito tentativas instrumentadas mostraram
     * "wrong type" em todas as variações numéricas e nenhuma na textual, nas
     * quatro seleções — evidência suficiente para parar de tentar número.
     */
    const variables: Record<string, unknown> = { start: String(start), end: String(end) }
    if (selecao.comLimit) variables.limit = PAGE_SIZE

    try {
      const data = await shopeeGraphQL<ConversionPage>(
        credentials,
        buildQuery(selecao.campos, selecao.comLimit),
        variables
      )

      return { ...data.conversionReport, selecao: selecao.nome }
    } catch (error) {
      // Credencial, permissão ou limite não melhoram com outro formato.
      if (!isQueryShapeError(error)) throw error

      falhas.push({
        selecao: selecao.nome,
        erro: error instanceof Error ? error.message : String(error),
      })
    }
  }

  throw new ShopeeApiError(
    `A Shopee recusou todas as ${falhas.length} variações da consulta`,
    { detail: falhas }
  )
}

/** Até 64 janelas; além disso o intervalo é curto demais para valer dividir. */
const MAX_DEPTH = 6

/**
 * Coleta dividindo o período, não por cursor.
 *
 * A paginação por cursor dependia de pageInfo.scrollId, e selecionar pageInfo
 * derruba a consulta inteira porque a Shopee devolve null num campo que ela
 * própria declara não nulo. Sobrou o filtro de data, que funciona: quando uma
 * janela volta cheia — sinal de que foi cortada — ela é dividida ao meio e
 * cada metade é coletada em separado, até caber no limite.
 *
 * As chamadas são sequenciais de propósito, para não disparar rajada contra a
 * API por causa de um intervalo grande.
 */
async function coletar(
  credentials: ShopeeCredentials,
  inicio: number,
  fim: number,
  profundidade: number,
  estado: { selecao: string; truncated: boolean; janelas: number }
): Promise<ConversionNode[]> {
  const resultado = await fetchPage(credentials, inicio, fim)
  const nodes = resultado.nodes || []

  estado.selecao = resultado.selecao
  estado.janelas++

  if (nodes.length < PAGE_SIZE) return nodes

  // Janela cheia: pode haver mais do que o limite devolveu.
  if (profundidade >= MAX_DEPTH || fim - inicio < 2) {
    estado.truncated = true
    return nodes
  }

  const meio = Math.floor((inicio + fim) / 2)

  return [
    ...(await coletar(credentials, inicio, meio, profundidade + 1, estado)),
    ...(await coletar(credentials, meio + 1, fim, profundidade + 1, estado)),
  ]
}

export async function fetchConversions(
  credentials: ShopeeCredentials,
  start: Date,
  end: Date
): Promise<{
  nodes: ConversionNode[]
  truncated: boolean
  selecao: string
  janelas: number
}> {
  const estado = { selecao: 'completa', truncated: false, janelas: 0 }

  const nodes = await coletar(
    credentials,
    Math.floor(start.getTime() / 1000),
    Math.floor(end.getTime() / 1000),
    0,
    estado
  )

  // Dividir o período pode trazer a mesma conversão em duas janelas vizinhas.
  const unicos = new Map(nodes.map((node) => [String(node.conversionId), node]))

  return { nodes: [...unicos.values()], ...estado }
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
interface LinhaVenda {
  externalId: string
  payload: Record<string, unknown>
}

function linhasDe(
  node: ConversionNode,
  workspaceId: string,
  shopeeAccountId: string
): LinhaVenda[] {
  const conversionId = String(node.conversionId)
  const purchasedAt = parseEpochSeconds(node.purchaseTime) ?? new Date()
  const subId = node.utmContent || null

  const origem = subId ? 'shopee_subid' : node.referrer ? 'shopee_referrer' : 'unattributed'
  const status = mapStatus(node.conversionStatus)

  const base = {
    workspaceId,
    shopeeAccountId,
    subId,
    attributionSource: origem,
    referrer: node.referrer || null,
    device: node.device || null,
    buyerType: node.buyerType || null,
    status,
    purchasedAt,
    confirmedAt: status === 'confirmed' ? purchasedAt : null,
  }

  const linhas = (node.orders || []).flatMap((order) =>
    (order.items || []).map((item) => ({
      // Chave estável por item: a mesma conversão reaparece quando a comissão
      // confirma, e sem o item na chave cada sincronização duplicaria tudo.
      externalId: `${conversionId}:${order.orderId}:${item.itemId}:${item.modelId}`,
      payload: {
        ...base,
        orderNumber: order.orderId ?? null,
        amount: parseMoney(item.actualAmount),
        commission: parseMoney(item.itemTotalCommission),
        quantity: Number(item.qty) || 1,
        productName: item.itemName || null,
        productImage: item.imageUrl || null,
        shopName: item.shopName || null,
        // channelType e attributionType sao do item, nao da conversao.
        channelType: item.channelType || null,
        attributionType: item.attributionType || null,
        categoryName: item.categoryLv1Name || null,
        shopeeData: { conversion: node, order, item } as unknown as object,
      },
    }))
  )

  if (linhas.length) return linhas

  /**
   * Sem itens — ou porque a API recusou o bloco, ou porque a conversão veio
   * sem produtos. Grava uma linha por conversão para a venda e a comissão não
   * sumirem do relatório; perde-se o nome do produto, não o dinheiro.
   */
  return [
    {
      externalId: conversionId,
      payload: {
        ...base,
        orderNumber: node.orders?.[0]?.orderId ?? null,
        amount: parseMoney(node.totalCommission),
        commission: parseMoney(node.netCommission ?? node.totalCommission),
        quantity: 1,
        productName: null,
        productImage: null,
        shopName: null,
        channelType: null,
        attributionType: null,
        categoryName: null,
        shopeeData: node as unknown as object,
      },
    },
  ]
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
  let selecao: string
  let janelas: number

  try {
    ;({ nodes, truncated, selecao, janelas } = await fetchConversions(
      credentialsOf(account),
      start,
      end
    ))
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
      await prisma.sale.update({ where: { id: existingId }, data: linha.payload as never })
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
    selecao,
    janelas,
    sample: nodes[0] ?? null,
  }
}
