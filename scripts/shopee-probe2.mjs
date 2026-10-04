/**
 * Segunda sonda: fecha as lacunas que a primeira deixou.
 *
 * Imprime um resumo compacto (campo: Tipo) em vez do JSON bruto da
 * introspeccao, para nada ser cortado. O alvo principal e o ShortLinkInput,
 * que diz como passar o sub_id na geracao de link.
 *
 *   node scripts/shopee-probe2.mjs
 */
import { createHash } from 'node:crypto'
import { createInterface } from 'node:readline'

const ENDPOINT =
  process.env.SHOPEE_AFFILIATE_ENDPOINT ||
  'https://open-api.affiliate.shopee.com.br/graphql'

// Quatro niveis cobrem [Tipo!]! e aninhamentos equivalentes.
const TYPE_REF = 'kind name ofType { kind name ofType { kind name ofType { kind name } } }'

function reader() {
  const rl = createInterface({ input: process.stdin })
  const lines = rl[Symbol.asyncIterator]()

  return {
    async ask(question) {
      process.stdout.write(question)
      const { value } = await lines.next()
      return (value ?? '').trim()
    },
    close: () => rl.close(),
  }
}

async function call(appId, secret, query) {
  const payload = JSON.stringify({ query })
  const timestamp = Math.floor(Date.now() / 1000)
  const signature = createHash('sha256')
    .update(`${appId}${timestamp}${payload}${secret}`)
    .digest('hex')

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `SHA256 Credential=${appId}, Timestamp=${timestamp}, Signature=${signature}`,
    },
    body: payload,
  })

  const text = await res.text()

  try {
    return JSON.parse(text)
  } catch {
    return { parseError: text.slice(0, 500) }
  }
}

/** Reduz a arvore de ofType a notacao GraphQL: Tipo, Tipo!, [Tipo!]!. */
function typeName(t) {
  if (!t) return '?'
  if (t.kind === 'NON_NULL') return `${typeName(t.ofType)}!`
  if (t.kind === 'LIST') return `[${typeName(t.ofType)}]`
  return t.name || t.kind
}

function printType(label, type) {
  console.log(`\n--- ${label} ---`)

  if (!type) {
    console.log('  (tipo nao existe nesta API)')
    return
  }

  if (type.enumValues?.length) {
    console.log(`  enum: ${type.enumValues.map((v) => v.name).join(' | ')}`)
  }

  for (const f of type.inputFields || []) {
    console.log(`  ${f.name}: ${typeName(f.type)}`)
  }

  for (const f of type.fields || []) {
    const args = (f.args || []).map((a) => `${a.name}: ${typeName(a.type)}`).join(', ')
    console.log(`  ${f.name}${args ? `(${args})` : ''}: ${typeName(f.type)}`)
  }
}

async function main() {
  const input = reader()
  const appId = await input.ask('AppId: ')
  const secret = await input.ask('\nSecret: ')
  input.close()

  if (!appId || !secret) {
    console.error('\nAppId e Secret sao obrigatorios.')
    process.exit(1)
  }

  console.log('\nConsultando a Shopee...\n')

  const alvos = {
    shortLinkInput: 'ShortLinkInput',
    batchShortLinkInput: 'BatchShortLinkInput',
    conversionReport: 'ConversionReport',
    conversionReportItem: 'ConversionReportItem',
    pageInfo: 'PageInfo',
    buyerType: 'BuyerType',
    deviceType: 'DeviceType',
    productType: 'ProductType',
    displayOrderStatus: 'DisplayOrderStatus',
  }

  /**
   * Uma requisicao por tipo. A consulta unica e grande falhou silenciosamente;
   * requisicoes pequenas sao o formato que a API aceita.
   */
  async function introspect(nome) {
    const resposta = await call(
      appId,
      secret,
      `{ __type(name: "${nome}") { name kind enumValues { name } inputFields { name type { ${TYPE_REF} } } fields { name args { name type { ${TYPE_REF} } } type { ${TYPE_REF} } } } }`
    )

    if (resposta.errors) {
      console.log(`\n--- ${nome} ---`)
      console.log(`  ERRO: ${resposta.errors[0]?.message || JSON.stringify(resposta.errors)}`)
      return null
    }

    // Sem data e sem errors significa resposta fora do padrao; mostrar crua em
    // vez de fingir que o tipo nao existe.
    if (!resposta.data) {
      console.log(`\n--- ${nome} ---`)
      console.log(`  RESPOSTA INESPERADA: ${JSON.stringify(resposta).slice(0, 400)}`)
      return null
    }

    return resposta.data.__type
  }

  // As assinaturas de conversionReport e generateShortLink saem da raiz.
  for (const [raiz, nomes] of [
    ['Query', ['conversionReport']],
    ['Mutation', ['generateShortLink', 'generateBatchShortLink']],
  ]) {
    const tipo = await introspect(raiz)

    for (const nome of nomes) {
      const campo = tipo?.fields?.find((f) => f.name === nome)
      if (!campo) continue

      const args = (campo.args || []).map((a) => `${a.name}: ${typeName(a.type)}`).join('\n    ')
      console.log(`\n--- ASSINATURA ${nome} ---`)
      console.log(`  retorna: ${typeName(campo.type)}`)
      console.log(`  args:\n    ${args || '(nenhum)'}`)
    }
  }

  for (const nome of Object.values(alvos)) {
    printType(nome, await introspect(nome))
  }

  /**
   * Segue a cadeia em vez de adivinhar: o tipo dos itens do pedido nao se
   * chama ConversionReportItem, e e nele que esta o nome do produto.
   */
  const pedido = await introspect('ConversionReportOrder')
  printType('ConversionReportOrder', pedido)

  const itens = pedido?.fields?.find((f) => f.name === 'items')
  const tipoItem = typeName(itens?.type).replace(/[[\]!]/g, '')

  if (tipoItem && tipoItem !== '?') {
    console.log(`\n(itens do pedido sao do tipo ${tipoItem}, consultando...)`)
    printType(tipoItem, await introspect(tipoItem))
  }

  console.log('\nPronto. Cole a saida no chat.')
}

main().catch((err) => {
  console.error('\nFalhou:', err.message)
  process.exit(1)
})
