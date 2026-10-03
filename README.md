# AfiliadoFlow - Plataforma SaaS para Afiliados

Plataforma completa de analytics para afiliados Shopee com integração Meta Ads.

## 🚀 Status: MVP Funcional

Desenvolvido automaticamente com:
- ✅ Autenticação e multi-tenancy
- ✅ Dashboard com KPIs e métricas
- ✅ Gestão de produtos e links rastreáveis
- ✅ Sistema de vendas e comissões
- ✅ Páginas de integrações Shopee/Meta
- ✅ Links curtos com tracking (`/go/:shortCode`)
- ✅ Banco SQLite local (pronto para PostgreSQL)

## 📦 Stack

- **Framework:** Next.js 15 (App Router)
- **Linguagem:** TypeScript
- **Database:** SQLite (dev) / PostgreSQL (prod)
- **ORM:** Prisma
- **UI:** TailwindCSS + Radix UI
- **Auth:** JWT via jose

## 🏃 Quick Start

```bash
# Instalar dependências
npm install --legacy-peer-deps

# Criar banco de dados
npx prisma db push

# Popular com dados demo
npm run db:seed

# Rodar servidor de desenvolvimento
npm run dev
```

Acesse: **http://localhost:3000**

### 🔑 Credenciais Demo

```
Email: fabiana@demo.com
Senha: demo123
```

## 📁 Estrutura

```
afiliadoflow/
├── prisma/
│   ├── schema.prisma       # Schema multi-tenant completo
│   └── seed.ts             # Dados de exemplo
├── src/
│   ├── app/
│   │   ├── api/            # API Routes
│   │   │   ├── auth/login  # Autenticação
│   │   │   ├── products    # CRUD produtos
│   │   │   └── links       # CRUD links
│   │   ├── dashboard/      # Dashboard protegido
│   │   │   ├── page.tsx    # Visão geral (KPIs, funil)
│   │   │   ├── products/   # Produtos & Links
│   │   │   ├── sales/      # Vendas & Comissões
│   │   │   └── integrations/ # Shopee/Meta
│   │   ├── go/[shortCode]  # Redirect + tracking
│   │   └── login/          # Tela de login
│   └── lib/
│       ├── auth.ts         # JWT sessions
│       ├── prisma.ts       # Prisma client
│       └── utils.ts        # Helpers
└── .env.local              # Variáveis de ambiente
```

## 🗄️ Database Schema

Multi-tenant desde o início:

- **Workspaces** (clientes isolados)
- **Users** + **WorkspaceUser** (permissões por workspace)
- **ShopeeAccount** / **MetaAccount** (integrações por cliente)
- **Product** / **TrackingLink** / **Campaign**
- **Sale** / **ClickEvent** (vendas e analytics)
- **AuditLog** (rastreabilidade)

## 🎨 Design System

Baseado no template fornecido:
- **Dark theme:** Navy (#0B0E14, #0F172A)
- **Primary:** Cyan (#38BDF8, #22D3EE)
- **Secondary:** Orange (#F97316)
- **Typography:** Inter

## 🚢 Deploy (Futuro)

### Opção 1: Railway (Recomendado)
```bash
# 1. Criar conta em railway.app
# 2. Criar novo projeto
# 3. Adicionar PostgreSQL
# 4. Conectar repo GitHub
# 5. Definir variáveis de ambiente:
DATABASE_URL="postgresql://..."
JWT_SECRET="seu-secret-aqui"
NEXT_PUBLIC_APP_URL="https://seu-app.railway.app"
```

### Opção 2: Vercel + Supabase
- Frontend: Vercel (git push automático)
- Database: Supabase (PostgreSQL grátis)

### Opção 3: VPS (Manual)
Quando contratar VPS com acesso root, rodar:
```bash
# Instalar Node.js 20+, PostgreSQL, Nginx
# Clonar repo
# npm install
# Configurar .env
# npx prisma migrate deploy
# pm2 start npm --name "afiliadoflow" -- start
```

## 🔧 Configuração Produção

Trocar em `.env`:
```env
DATABASE_URL="postgresql://user:pass@host:5432/dbname"
JWT_SECRET="gere-um-secret-forte-aqui"
NEXT_PUBLIC_APP_URL="https://seudominio.com.br"
NEXT_PUBLIC_SHORT_LINK_DOMAIN="https://go.seudominio.com.br"

# Meta Ads (quando configurar)
META_APP_ID="seu-app-id"
META_APP_SECRET="seu-app-secret"
META_REDIRECT_URI="https://seudominio.com.br/api/integrations/meta/callback"
```

## 🔐 Segurança

- ✅ Autenticação JWT com httpOnly cookies
- ✅ Isolamento total entre workspaces no banco
- ✅ Permissões verificadas no servidor
- ✅ Credenciais não expostas no frontend
- ⚠️ TODO: Rate limiting em produção
- ⚠️ TODO: Criptografia de credenciais de API (Shopee/Meta)

## 📊 Features Implementadas

### ✅ Autenticação
- Login/logout
- Session management
- Protected routes

### ✅ Dashboard
- KPIs principais (receita, conversão, ticket médio)
- Funil de conversão com dropoffs
- Device split (mobile/desktop/tablet)
- Vendas recentes
- Top produtos

### ✅ Produtos & Links
- Listagem de produtos
- Listagem de links rastreáveis
- Visualização de métricas (cliques, vendas)
- UTM tracking

### ✅ Vendas
- Histórico completo
- Status (pendente/confirmada/cancelada)
- Comissões por venda
- Totalizadores

### ✅ Integrações
- UI para Shopee (mock)
- UI para Meta Ads (mock)
- Estados de conexão

### ⏳ TODO (Próximas Fases)

- [ ] Formulários completos (criar produto, link, campanha)
- [ ] API real Shopee (sincronização)
- [ ] OAuth Meta Ads
- [ ] Workers de sincronização (cron jobs)
- [ ] Relatórios avançados com filtros
- [ ] Gráficos de performance temporal
- [ ] Sistema de planos e billing
- [ ] Painel administrativo da plataforma
- [ ] Exportação de relatórios (PDF/Excel)
- [ ] Webhooks para eventos
- [ ] Notificações por email
- [ ] Logs de auditoria na UI

## 🧪 Testing

```bash
# Abrir Prisma Studio (database GUI)
npm run db:studio

# Testar link curto
curl http://localhost:3000/go/sp001
```

## 📝 Notas de Desenvolvimento

1. **SQLite → PostgreSQL:** Trocar apenas a `DATABASE_URL` e rodar `npx prisma migrate dev`
2. **Multi-tenancy:** Todos os queries filtram por `workspaceId`
3. **Permissões:** Role-based (owner/admin/analyst/reader)
4. **Tracking:** Click events registrados de forma assíncrona

## 🤝 Colaboração

Desenvolvido automaticamente por Claude Code para Bruno.
Primeira cliente: Fabiana (dados demo já cadastrados).

---

**Próximo passo:** Escolher provedor de deploy e configurar produção.
