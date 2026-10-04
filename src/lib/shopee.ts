import { createHash } from 'crypto'

const ENDPOINT =
  process.env.SHOPEE_AFFILIATE_ENDPOINT ||
  'https://open-api.affiliate.shopee.com.br/graphql'

export interface ShopeeCredentials {
  appId: string
  appSecret: string
}

export class ShopeeApiError extends Error {
  readonly code?: number
  readonly detail?: unknown

  constructor(message: string, options: { code?: number; detail?: unknown } = {}) {
    super(message)
    this.name = 'ShopeeApiError'
    this.code = options.code
    this.detail = options.detail
  }
}

/**
 * A assinatura cobre exatamente o corpo enviado, byte a byte. Por isso o
 * payload é serializado uma única vez e a mesma string vai para o hash e para
 * o fetch — reserializar aqui produziria "Invalid Signature".
 */
function sign(appId: string, timestamp: number, payload: string, secret: string) {
  return createHash('sha256').update(`${appId}${timestamp}${payload}${secret}`).digest('hex')
}

export async function shopeeGraphQL<T>(
  credentials: ShopeeCredentials,
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const payload = JSON.stringify(variables ? { query, variables } : { query })
  const timestamp = Math.floor(Date.now() / 1000)
  const signature = sign(credentials.appId, timestamp, payload, credentials.appSecret)

  let response: Response

  try {
    response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `SHA256 Credential=${credentials.appId}, Timestamp=${timestamp}, Signature=${signature}`,
      },
      body: payload,
      cache: 'no-store',
    })
  } catch (error) {
    throw new ShopeeApiError('Não foi possível alcançar a API da Shopee', { detail: error })
  }

  const text = await response.text()
  let body: any

  try {
    body = JSON.parse(text)
  } catch {
    throw new ShopeeApiError(`Resposta inesperada da Shopee (HTTP ${response.status})`, {
      detail: text.slice(0, 500),
    })
  }

  // A Shopee devolve erro de credencial com HTTP 200 e o detalhe no corpo,
  // então checar só o status deixaria a falha passar como sucesso.
  if (Array.isArray(body.errors) && body.errors.length) {
    const first = body.errors[0]
    throw new ShopeeApiError(first?.message || 'Erro retornado pela Shopee', {
      code: first?.extensions?.code,
      detail: body.errors,
    })
  }

  if (!response.ok) {
    throw new ShopeeApiError(`A Shopee respondeu HTTP ${response.status}`, { detail: body })
  }

  if (!body.data) {
    throw new ShopeeApiError('A Shopee respondeu sem dados', { detail: body })
  }

  return body.data as T
}

/**
 * As comissões chegam como String para preservar casas decimais. Converter
 * direto com Number pode trazer NaN silencioso, que viraria 0 no relatório.
 */
export function parseMoney(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === '') return 0

  const parsed = typeof value === 'number' ? value : Number(String(value).replace(',', '.'))

  return Number.isFinite(parsed) ? parsed : 0
}

/** Os horários vêm em epoch de segundos; o Prisma espera Date. */
export function parseEpochSeconds(value: number | string | null | undefined): Date | null {
  if (value === null || value === undefined || value === '') return null

  const seconds = Number(value)

  return Number.isFinite(seconds) && seconds > 0 ? new Date(seconds * 1000) : null
}
