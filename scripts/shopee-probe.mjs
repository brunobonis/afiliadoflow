/**
 * Sonda a Shopee Affiliate Open API para descobrir o contrato real antes de
 * escrevermos a integracao.
 *
 * Roda local, nao grava nada em lugar nenhum e nao depende do banco.
 * A credencial e lida do teclado, entao nao fica no historico do shell.
 *
 *   node scripts/shopee-probe.mjs
 */
import { createHash } from 'node:crypto'
import { createInterface } from 'node:readline'

const ENDPOINT =
  process.env.SHOPEE_AFFILIATE_ENDPOINT ||
  'https://open-api.affiliate.shopee.com.br/graphql'

/**
 * Le uma linha da entrada. Usa o iterador assincrono em vez de rl.question
 * porque question() perde linhas quando a entrada vem por pipe.
 */
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

/**
 * A assinatura cobre exatamente o corpo enviado, entao o payload e montado uma
 * unica vez e reaproveitado na assinatura e no fetch.
 */
async function call(appId, secret, query, variables) {
  const payload = JSON.stringify(variables ? { query, variables } : { query })
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
    return { status: res.status, body: JSON.parse(text) }
  } catch {
    return { status: res.status, body: text.slice(0, 800) }
  }
}

function show(titulo, resultado) {
  console.log(`\n${'='.repeat(70)}\n${titulo}  (HTTP ${resultado.status})\n${'='.repeat(70)}`)
  console.log(JSON.stringify(resultado.body, null, 2).slice(0, 6000))
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

  console.log('\nConsultando a Shopee...')

  // 1. Autenticacao + lista de queries disponiveis, com os argumentos de cada uma.
  show(
    '1. QUERIES DISPONIVEIS',
    await call(
      appId,
      secret,
      `{ __type(name: "Query") { fields { name args { name type { kind name ofType { kind name } } } } } }`
    )
  )

  // 2. Mutations: e aqui que mora a geracao de link com sub_id, que e o que
  // torna possivel cruzar venda da Shopee com anuncio do Meta.
  show(
    '2. MUTATIONS DISPONIVEIS',
    await call(
      appId,
      secret,
      `{ __type(name: "Mutation") { fields { name args { name type { kind name ofType { kind name } } } } } }`
    )
  )

  // 3. Campos do ConversionReport, que e o que vira venda no nosso banco.
  show(
    '3. CAMPOS DE ConversionReport',
    await call(
      appId,
      secret,
      `{ __type(name: "ConversionReport") { fields { name type { kind name ofType { kind name ofType { kind name } } } } } }`
    )
  )

  // 3. O envelope paginado.
  show(
    '4. CAMPOS DE ConversionReportConnection',
    await call(
      appId,
      secret,
      `{ __type(name: "ConversionReportConnection") { fields { name type { kind name ofType { kind name } } } } }`
    )
  )

  // 4. Os itens de cada pedido.
  show(
    '5. CAMPOS DE ConversionReportOrder',
    await call(
      appId,
      secret,
      `{ __type(name: "ConversionReportOrder") { fields { name type { kind name ofType { kind name } } } } }`
    )
  )

  console.log(`\n${'='.repeat(70)}`)
  console.log('Pronto. Copie a saida acima e mande no chat.')
  console.log('Nada foi gravado e a credencial nao saiu desta maquina.')
}

main().catch((err) => {
  console.error('\nFalhou:', err.message)
  process.exit(1)
})
