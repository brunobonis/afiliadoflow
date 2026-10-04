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

  const selecoes = Object.entries(alvos)
    .map(
      ([alias, nome]) =>
        `${alias}: __type(name: "${nome}") { name kind enumValues { name } inputFields { name type { ${TYPE_REF} } } fields { name type { ${TYPE_REF} } } }`
    )
    .join('\n')

  // A assinatura de conversionReport e de generateShortLink saem da raiz.
  const raiz = `
    query: __type(name: "Query") { fields { name args { name type { ${TYPE_REF} } } type { ${TYPE_REF} } } }
    mutation: __type(name: "Mutation") { fields { name args { name type { ${TYPE_REF} } } type { ${TYPE_REF} } } }
  `

  const resposta = await call(appId, secret, `{ ${raiz}\n${selecoes} }`)

  if (resposta.errors) {
    console.error('Erro da Shopee:', JSON.stringify(resposta.errors, null, 2))
    process.exit(1)
  }

  const d = resposta.data || {}

  for (const nome of ['conversionReport', 'generateShortLink', 'generateBatchShortLink']) {
    const campo =
      d.query?.fields?.find((f) => f.name === nome) ||
      d.mutation?.fields?.find((f) => f.name === nome)

    if (campo) {
      const args = (campo.args || []).map((a) => `${a.name}: ${typeName(a.type)}`).join('\n    ')
      console.log(`\n--- ASSINATURA ${nome} ---`)
      console.log(`  retorna: ${typeName(campo.type)}`)
      console.log(`  args:\n    ${args || '(nenhum)'}`)
    }
  }

  for (const [alias, nome] of Object.entries(alvos)) {
    printType(nome, d[alias])
  }

  console.log('\nPronto. Cole a saida no chat.')
}

main().catch((err) => {
  console.error('\nFalhou:', err.message)
  process.exit(1)
})
