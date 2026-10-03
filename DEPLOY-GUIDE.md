# Deploy AfiliadoFlow - Guia Completo

## Opções de Deploy

### 1. Railway (Recomendado) ⭐
- Deploy automático via Git
- Banco PostgreSQL incluído
- Domínio gratuito
- Fácil configuração

### 2. Vercel
- Especializado em Next.js
- Precisa banco externo (Supabase/Neon)
- Domínio gratuito

### 3. VPS (DigitalOcean/AWS)
- Controle total
- Mais complexo
- Custos variáveis

---

## OPÇÃO 1: Deploy na Railway (Passo a Passo)

### Pré-requisitos
- Conta GitHub
- Conta Railway (gratuita)

### Passo 1: Preparar o Projeto

#### 1.1 Criar arquivo `.env.production`
```env
DATABASE_URL="postgresql://user:password@host:5432/database"
JWT_SECRET="sua-chave-secreta-de-producao-com-32-caracteres"
NEXT_PUBLIC_APP_URL="https://seu-app.railway.app"
NODE_ENV="production"
```

#### 1.2 Atualizar `package.json` - Scripts de build
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "prisma generate && next build",
    "start": "next start",
    "postinstall": "prisma generate"
  }
}
```

#### 1.3 Criar `railway.json`
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "numReplicas": 1,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### Passo 2: Subir para GitHub

```bash
cd "C:\0 - CLAUDE ORGANIZADO PARA GITHUB\05-projetos-diversos\afiliadoflow"

# Inicializar git (se ainda não tiver)
git init
git add .
git commit -m "Prepare for Railway deployment"

# Criar repositório no GitHub e conectar
git remote add origin https://github.com/seu-usuario/afiliadoflow.git
git branch -M main
git push -u origin main
```

### Passo 3: Deploy na Railway

1. **Acesse:** https://railway.app
2. **Faça login** com GitHub
3. **Clique em:** "New Project"
4. **Selecione:** "Deploy from GitHub repo"
5. **Escolha:** seu repositório afiliadoflow
6. **Adicione PostgreSQL:**
   - Clique em "+ New"
   - Selecione "Database" → "PostgreSQL"
7. **Configure variáveis:**
   - Vá em Settings → Variables
   - Adicione:
     ```
     JWT_SECRET=sua-chave-secreta-aqui-com-32-caracteres
     NODE_ENV=production
     ```
8. **Gere domínio:**
   - Settings → Generate Domain
9. **Deploy automático** vai iniciar

### Passo 4: Migrar Banco de Dados

```bash
# No terminal local, configure a URL do Railway
export DATABASE_URL="postgresql://..." # copie da Railway

# Execute migrations
npx prisma db push
npx prisma db seed # se tiver seed
```

---

## OPÇÃO 2: Deploy na Vercel

### Passo 1: Criar Banco PostgreSQL

**Opção A: Neon (Recomendado)**
1. Acesse: https://neon.tech
2. Crie conta gratuita
3. Crie novo projeto
4. Copie a Connection String

**Opção B: Supabase**
1. Acesse: https://supabase.com
2. Crie projeto
3. Copie a Connection String

### Passo 2: Deploy Vercel

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
cd "C:\0 - CLAUDE ORGANIZADO PARA GITHUB\05-projetos-diversos\afiliadoflow"
vercel

# Configurar variáveis
vercel env add DATABASE_URL
vercel env add JWT_SECRET

# Deploy produção
vercel --prod
```

---

## Configurações Importantes

### 1. Variáveis de Ambiente Obrigatórias

```env
# Banco de dados
DATABASE_URL="postgresql://..."

# Autenticação
JWT_SECRET="chave-secreta-forte-32-caracteres"

# App
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="https://seu-dominio.com"

# Integrações (quando configurar)
SHOPEE_PARTNER_ID=""
SHOPEE_PARTNER_KEY=""
META_APP_ID=""
META_APP_SECRET=""
```

### 2. Atualizar Prisma para PostgreSQL

Editar `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"  // mudar de sqlite
  url      = env("DATABASE_URL")
}
```

### 3. Build Config (Railway/Vercel)

Adicionar em `package.json`:
```json
{
  "engines": {
    "node": ">=18.17.0"
  }
}
```

---

## Checklist Pré-Deploy

- [ ] Código no GitHub
- [ ] `.env.local` no `.gitignore` (não commitar)
- [ ] Schema Prisma usando PostgreSQL
- [ ] Variáveis de ambiente configuradas
- [ ] Scripts de build atualizados
- [ ] Domínio personalizado (opcional)

---

## Pós-Deploy

### 1. Criar Primeiro Usuário

Acessar o console e executar seed ou criar via API:
```bash
npx prisma db seed
```

### 2. Configurar Integrações

- Adicionar contas Shopee
- Conectar Meta Ads
- Testar webhooks

### 3. Monitoramento

- Railway: Logs em tempo real no dashboard
- Vercel: Logs na aba "Logs"

---

## Custos Estimados

### Railway (Free Tier)
- $5 crédito mensal gratuito
- PostgreSQL incluído
- ~500 horas/mês

### Vercel (Hobby)
- Deploy gratuito
- Banco externo necessário
- Neon: Free tier 0.5GB

### Produção Recomendada
- Railway Pro: $20/mês
- Ou VPS: $10-20/mês

---

## Troubleshooting

### Erro: "Prisma Client not generated"
```bash
npm run postinstall
```

### Erro: "Database connection failed"
- Verificar DATABASE_URL
- Testar conexão localmente
- Whitelist IP no provider

### Erro: Build timeout
- Aumentar timeout no Railway
- Otimizar dependências

---

## Próximos Passos

1. Configurar domínio personalizado
2. Configurar SSL (automático Railway/Vercel)
3. Setup de monitoramento
4. Backup automático do banco

---

**Qual opção prefere: Railway ou Vercel?**

Recomendo Railway pela simplicidade (banco incluído).
