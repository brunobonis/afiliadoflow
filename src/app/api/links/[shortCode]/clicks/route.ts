import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { isLikelyBot } from '@/lib/bot-detection'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shortCode: string }> }
) {
  try {
    const session = await requireAuth()
    const { shortCode } = await params
    const { searchParams } = new URL(request.url)

    const link = await prisma.trackingLink.findFirst({
      where: { shortCode, workspaceId: session.workspaceId },
    })

    if (!link) {
      return NextResponse.json({ error: 'Link não encontrado' }, { status: 404 })
    }

    const eventos = await prisma.clickEvent.findMany({
      where: { linkId: link.id },
      orderBy: { clickedAt: 'desc' },
      take: 200,
    })

    /**
     * Reclassifica na leitura, não confia só no isBot gravado: a lista de
     * assinaturas melhorou depois que esses eventos entraram, e eventos
     * antigos continuariam contados como pessoas.
     */
    const comClassificacao = eventos.map((evento) => ({
      ...evento,
      isBot: evento.isBot || isLikelyBot(evento.userAgent),
    }))

    const humanos = comClassificacao.filter((evento) => !evento.isBot)
    const automatizados = comClassificacao.length - humanos.length

    // O padrão é esconder automação, porque ela distorce taxa de conversão.
    const incluirBots = searchParams.get('bots') === '1'

    return NextResponse.json({
      // Devolve tudo que foi buscado: a tela rola, então cortar aqui só
      // esconderia registro sem o usuário saber que existe.
      clicks: incluirBots ? comClassificacao : humanos,
      totalHumanos: humanos.length,
      totalAutomatizados: automatizados,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
