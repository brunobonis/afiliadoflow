# 🚨 PROBLEMA DE DEPLOY - AfiliadoFlow

## Contexto do Projeto

**AfiliadoFlow** é um sistema SaaS de gestão de links de afiliados com tracking, construído em Next.js 15, TypeScript, Prisma e Tailwind CSS.

**Repositório:** https://github.com/brunobonis/afiliadoflow

---

## ✅ O que está funcionando

- ✅ Código completo desenvolvido e funcionando localmente (http://localhost:3004)
- ✅ Sistema multi-tenant com autenticação JWT
- ✅ Fluxo simplificado de criação de links implementado
- ✅ Sistema de tracking com classificação de origem
- ✅ Banco de dados MySQL configurado no Hostinger
- ✅ Código no GitHub atualizado
- ✅ Variáveis de ambiente configuradas na Vercel

---

## ❌ PROBLEMA ATUAL

**Erro no deploy da Vercel:**
```
Error: Command "npm install" exited with 1
```

**Erro específico nos logs:**
```
npm error ERESOLVE could not resolve
npm error While resolving: @tanstack/react-query@5.104.1
npm error Found: react@19.0.0-rc-66855b96-20241106
npm error Conflicting peer dependency: react@19.3.0
```

**Causa:** Conflito de dependências do React. O projeto usa React 19 RC mas algumas bibliotecas esperam versões específicas.

---

## 🔧 Configuração Atual

### Banco de Dados MySQL (Hostinger)
```
Host: srv1147.hstgr.io
Porta: 3306
Database: u92342861_afiliadoflow
User: u92342861_afiliadoflow
```

### Variáveis de Ambiente (Vercel)
✅ `DATABASE_URL` configurada (MySQL connection string)
✅ `JWT_SECRET` configurada
✅ `NODE_ENV=production`

### Schema Prisma
```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
  relationMode = "prisma"
}
```

---

## 🎯 O QUE PRECISA SER RESOLVIDO

### 1. Corrigir conflitos de dependências do React

O projeto está usando:
- `react@19.0.0-rc-66855b96-20241106` (release candidate)
- Bibliotecas que esperam React 18 ou 19 stable

**Possíveis soluções:**

**Opção A - Downgrade para React 18 (Recomendado):**
```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "next": "15.0.3"
  }
}
```

**Opção B - Force resolution no package.json:**
```json
{
  "overrides": {
    "react": "19.0.0-rc-66855b96-20241106",
    "react-dom": "19.0.0-rc-66855b96-20241106"
  }
}
```

**Opção C - Usar --legacy-peer-deps:**
Adicionar em `package.json`:
```json
{
  "scripts": {
    "build": "npm install --legacy-peer-deps && prisma generate && next build"
  }
}
```

### 2. Após resolver dependências

```bash
# Commit das mudanças
git add .
git commit -m "fix: Resolve React peer dependencies for deployment"
git push origin main

# Deploy na Vercel
vercel --prod
```

### 3. Migrar banco de dados

Após deploy bem-sucedido:
```bash
# Conectar ao banco Hostinger
npx prisma db push

# Criar dados iniciais
npx prisma db seed
```

---

## 📁 Estrutura do Projeto

```
afiliadoflow/
├── prisma/
│   ├── schema.prisma (MySQL configurado)
│   └── seed.ts
├── src/
│   ├── app/
│   │   ├── api/ (APIs REST)
│   │   ├── dashboard/ (páginas do painel)
│   │   ├── go/[shortCode]/ (redirect tracker)
│   │   └── login/
│   ├── components/
│   ├── lib/
│   └── middleware.ts
├── package.json
├── next.config.js
└── railway.json
```

---

## 🔍 Logs de Erro Completos

**Link de inspeção da Vercel:**
https://vercel.com/flow-systems1/afiliadoflow/EXr325HeN8otptqFedF1NUWLtQdz

**Principais erros:**
1. `ERESOLVE could not resolve`
2. `Conflicting peer dependency: react@19.3.0`
3. `peer react@"^18 || ^19" from @tanstack/react-query@5.104.1`
4. 41+ pacotes com conflitos similares

---

## 📋 Checklist de Resolução

- [ ] Resolver conflitos de dependências React
- [ ] Commit e push das mudanças
- [ ] Deploy na Vercel bem-sucedido
- [ ] Verificar se a aplicação está acessível
- [ ] Executar `npx prisma db push` para criar tabelas
- [ ] Executar `npx prisma db seed` para dados iniciais
- [ ] Testar login: `fabiana@demo.com` / `demo123`
- [ ] Testar criação de link rastreável

---

## 🎓 Contexto Adicional

### Funcionalidades Implementadas:
- Criação simplificada de links (apenas URL + apelido opcional)
- Sistema de tracking com origem e confiança
- Redirect automático preservando afiliação
- Dashboard com métricas
- Integrações Shopee e Meta Ads (estrutura)
- Sistema multi-tenant completo

### Documentação Disponível:
- `DEPLOY-GUIDE.md` - Guia completo de deploy
- `MUDANCAS-SIMPLIFICACAO.md` - Mudanças implementadas
- `INSTRUCOES-PROXIMOS-PASSOS.md` - Próximas implementações
- `README.md` - Documentação do projeto

---

## 💡 Prompt Sugerido para Outro Claude

```
Preciso resolver um erro de deploy do projeto AfiliadoFlow na Vercel.

O projeto está no GitHub: https://github.com/brunobonis/afiliadoflow

PROBLEMA: Deploy falha com erro "npm error ERESOLVE could not resolve" 
devido a conflitos de peer dependencies do React 19 RC com bibliotecas 
que esperam React 18/19 stable.

Link dos logs: https://vercel.com/flow-systems1/afiliadoflow/EXr325HeN8otptqFedF1NUWLtQdz

CONTEXTO:
- Projeto Next.js 15 + TypeScript + Prisma + MySQL
- Código funcionando localmente
- Banco MySQL no Hostinger configurado
- Variáveis de ambiente na Vercel configuradas
- Git atualizado

PRECISO:
1. Resolver conflitos de dependências React (downgrade para 18 ou force resolution)
2. Fazer build passar na Vercel
3. Executar migrations no banco MySQL
4. Deixar aplicação online e funcionando

Leia o arquivo PROBLEMA-DEPLOY.md no repositório para detalhes completos.
```

---

## 🔗 Links Importantes

- **Repositório:** https://github.com/brunobonis/afiliadoflow
- **Vercel Dashboard:** https://vercel.com/flow-systems1/afiliadoflow
- **Último deploy (falhou):** https://vercel.com/flow-systems1/afiliadoflow/EXr325HeN8otptqFedF1NUWLtQdz

---

**Data do problema:** 03/10/2026
**Tentativas de deploy:** 5+ (todas falharam com mesmo erro)
**Último commit:** "fix: Resolve peer dependencies"
