/**
 * Classificação de acesso automatizado.
 *
 * Fica em arquivo próprio porque é usada em dois momentos: ao gravar o clique
 * e ao ler o relatório. Ler também é necessário porque a lista de assinaturas
 * muda com o tempo, e eventos gravados antes de uma melhoria continuariam
 * contados como gente se a classificação só valesse na gravação.
 */
const ASSINATURAS = [
  'bot',
  'crawler',
  'spider',
  'crawling',
  'meta-externalagent',
  'facebookexternalhit',
  'whatsapp',
  'telegram',
  'slackbot',
  'discordbot',
  'preview',
  'scraper',
  'curl',
  'wget',
  'python-requests',
  'go-http-client',
  'java/',
  'okhttp',
  'axios',
  'node-fetch',
  'headless',
  'phantomjs',
  'puppeteer',
  'playwright',
  'lighthouse',
  'pingdom',
  'uptime',
  'monitor',
  'statuscake',
  'postman',
  'insomnia',
]

/**
 * Todo navegador real traz Chrome, Firefox, Safari ou Edge no user agent —
 * inclusive os derivados, que carregam a marca do motor. Um acesso sem
 * nenhuma dessas marcas quase nunca é uma pessoa.
 */
const MARCAS_DE_NAVEGADOR = ['chrome', 'firefox', 'safari', 'edg', 'opera', 'opr/', 'trident']

export function isLikelyBot(userAgent: string | null | undefined): boolean {
  const ua = (userAgent || '').toLowerCase()

  // Sem user agent nenhum: cliente que não se identifica não é navegador.
  if (!ua.trim()) return true

  if (ASSINATURAS.some((assinatura) => ua.includes(assinatura))) return true

  return !MARCAS_DE_NAVEGADOR.some((marca) => ua.includes(marca))
}
