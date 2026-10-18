import nodemailer from 'nodemailer'

/**
 * Envio por SMTP. Funciona com o e-mail da Hostinger, Gmail ou qualquer
 * provedor que forneça SMTP, então não depende de criar conta em serviço novo.
 */
function config() {
  const host = process.env.SMTP_HOST
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASSWORD

  if (!host || !user || !pass) return null

  const port = Number(process.env.SMTP_PORT) || 465

  return {
    host,
    port,
    // 465 é TLS implícito; 587 começa em claro e sobe para TLS.
    secure: port === 465,
    auth: { user, pass },
    from: process.env.SMTP_FROM || user,
  }
}

export function emailConfigurado(): boolean {
  return config() !== null
}

export async function enviarEmail(para: string, assunto: string, html: string, texto: string) {
  const cfg = config()

  if (!cfg) {
    throw new Error(
      'SMTP não configurado. Defina SMTP_HOST, SMTP_USER e SMTP_PASSWORD nas variáveis de ambiente.'
    )
  }

  const transporte = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: cfg.auth,
  })

  await transporte.sendMail({
    from: cfg.from,
    to: para,
    subject: assunto,
    text: texto,
    html,
  })
}

export function montarEmailDeRecuperacao(link: string, validadeMinutos: number) {
  const texto = [
    'Você pediu para redefinir sua senha no AfiliadoFlow.',
    '',
    `Abra este endereço para escolher uma nova senha: ${link}`,
    '',
    `O link vale por ${validadeMinutos} minutos e só pode ser usado uma vez.`,
    'Se não foi você quem pediu, ignore esta mensagem: sua senha continua a mesma.',
  ].join('\n')

  const html = `
    <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #0f172a;">
      <h1 style="font-size: 20px; margin: 0 0 16px;">Redefinir senha</h1>
      <p style="font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
        Você pediu para redefinir sua senha no AfiliadoFlow. Clique no botão abaixo para escolher uma nova.
      </p>
      <p style="margin: 0 0 24px;">
        <a href="${link}" style="display: inline-block; background: #38BDF8; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 15px;">
          Escolher nova senha
        </a>
      </p>
      <p style="font-size: 13px; color: #64748b; line-height: 1.6; margin: 0 0 8px;">
        O link vale por ${validadeMinutos} minutos e só pode ser usado uma vez.
      </p>
      <p style="font-size: 13px; color: #64748b; line-height: 1.6; margin: 0;">
        Se não foi você quem pediu, ignore esta mensagem: sua senha continua a mesma.
      </p>
    </div>
  `

  return { texto, html }
}
