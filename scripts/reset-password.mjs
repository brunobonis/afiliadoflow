// Reseta a senha de um usuario direto no banco.
// Uso: DATABASE_URL="file:./prisma/dev.db" node scripts/reset-password.mjs <email> <senha>
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const [email, pw] = process.argv.slice(2)
if (!email || !pw) {
  console.error('Uso: node scripts/reset-password.mjs <email> <senha>')
  process.exit(1)
}

const prisma = new PrismaClient()
const passwordHash = await bcrypt.hash(pw, 10)
const user = await prisma.user.update({ where: { email }, data: { passwordHash } })
const check = await prisma.user.findUnique({ where: { email } })
console.log('Usuario atualizado:', user.email, '|', user.name)
console.log('Senha confere:', await bcrypt.compare(pw, check.passwordHash))
await prisma.$disconnect()
