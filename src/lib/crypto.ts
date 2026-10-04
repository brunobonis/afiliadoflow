import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12 // tamanho recomendado para GCM
const KEY_LENGTH = 32 // AES-256

/**
 * Credenciais de API de terceiros (secret da Shopee, token do Meta) não podem
 * ficar legíveis no banco: quem obtiver uma cópia do dump teria acesso direto
 * às contas. Elas são cifradas aqui antes de qualquer gravação.
 */
function getKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY

  if (!raw) {
    throw new Error(
      'ENCRYPTION_KEY não configurada. Gere uma com: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'base64\'))"'
    )
  }

  const key = Buffer.from(raw, 'base64')

  if (key.length !== KEY_LENGTH) {
    throw new Error(
      `ENCRYPTION_KEY precisa ter ${KEY_LENGTH} bytes em base64, mas tem ${key.length}`
    )
  }

  return key
}

/**
 * Retorna "iv.authTag.ciphertext" em base64. O authTag do GCM faz a leitura
 * falhar se o valor for adulterado no banco, em vez de devolver lixo.
 */
export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, getKey(), iv)

  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])

  return [iv.toString('base64'), cipher.getAuthTag().toString('base64'), encrypted.toString('base64')].join('.')
}

export function decryptSecret(payload: string): string {
  const [ivPart, tagPart, dataPart] = payload.split('.')

  if (!ivPart || !tagPart || !dataPart) {
    throw new Error('Valor cifrado em formato inválido')
  }

  const decipher = createDecipheriv(ALGORITHM, getKey(), Buffer.from(ivPart, 'base64'))
  decipher.setAuthTag(Buffer.from(tagPart, 'base64'))

  return Buffer.concat([
    decipher.update(Buffer.from(dataPart, 'base64')),
    decipher.final(),
  ]).toString('utf8')
}

/**
 * Para exibir na interface sem revelar o valor: "wSx...9fKb".
 */
export function maskSecret(plaintext: string): string {
  if (plaintext.length <= 8) return '•'.repeat(plaintext.length)

  return `${plaintext.slice(0, 3)}${'•'.repeat(6)}${plaintext.slice(-4)}`
}

/** Permite a interface avisar que falta configurar a chave, sem quebrar. */
export function encryptionConfigured(): boolean {
  try {
    getKey()
    return true
  } catch {
    return false
  }
}
