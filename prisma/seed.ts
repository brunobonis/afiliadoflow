import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create demo workspace
  const workspace = await prisma.workspace.create({
    data: {
      name: 'Fabiana - Demo',
      slug: 'fabiana-demo',
      timezone: 'America/Sao_Paulo',
      currency: 'BRL',
      planLimit: {
        users: 5,
        links: 100,
        shopeeAccounts: 2,
        metaAccounts: 1,
        events: 50000,
      },
    },
  })

  console.log('✅ Workspace created:', workspace.name)

  // Create demo user
  const passwordHash = await bcrypt.hash('demo123', 10)
  const user = await prisma.user.create({
    data: {
      email: 'fabiana@demo.com',
      name: 'Fabiana',
      passwordHash,
    },
  })

  console.log('✅ User created:', user.email)

  // Link user to workspace as owner
  await prisma.workspaceUser.create({
    data: {
      workspaceId: workspace.id,
      userId: user.id,
      role: 'owner',
    },
  })

  console.log('✅ User linked to workspace as owner')

  // Create demo Shopee account
  const shopeeAccount = await prisma.shopeeAccount.create({
    data: {
      workspaceId: workspace.id,
      accountName: 'Shopee Principal',
      partnerId: 'demo-partner-id',
      partnerKey: 'demo-partner-key-encrypted',
      shopId: '123456',
      status: 'active',
    },
  })

  console.log('✅ Shopee account created')

  // Create demo products
  const products = await prisma.product.createMany({
    data: [
      {
        workspaceId: workspace.id,
        shopeeAccountId: shopeeAccount.id,
        externalId: 'SP001',
        name: 'Fone Bluetooth Premium',
        imageUrl: 'https://placehold.co/400x400/38bdf8/fff?text=Fone',
        price: 89.90,
        commission: 8.99,
        commissionRate: 10,
        status: 'active',
      },
      {
        workspaceId: workspace.id,
        shopeeAccountId: shopeeAccount.id,
        externalId: 'SP002',
        name: 'Smart Watch Fitness',
        imageUrl: 'https://placehold.co/400x400/22d3ee/fff?text=Watch',
        price: 199.90,
        commission: 29.99,
        commissionRate: 15,
        status: 'active',
      },
      {
        workspaceId: workspace.id,
        shopeeAccountId: shopeeAccount.id,
        externalId: 'SP003',
        name: 'Câmera de Segurança Wi-Fi',
        imageUrl: 'https://placehold.co/400x400/4fd1c5/fff?text=Cam',
        price: 149.90,
        commission: 18.74,
        commissionRate: 12.5,
        status: 'active',
      },
    ],
  })

  console.log(`✅ ${products.count} products created`)

  // Create demo tracking links
  const productList = await prisma.product.findMany({
    where: { workspaceId: workspace.id },
  })

  for (const product of productList) {
    await prisma.trackingLink.create({
      data: {
        workspaceId: workspace.id,
        productId: product.id,
        shortCode: `${product.externalId?.toLowerCase()}`,
        destination: `https://shopee.com.br/product/${product.externalId}`,
        nickname: `Link: ${product.name}`,
        utmSource: 'instagram',
        utmMedium: 'social',
        utmCampaign: 'lancamento',
        status: 'active',
      },
    })
  }

  console.log('✅ Tracking links created')

  // Create demo sales
  const link = await prisma.trackingLink.findFirst({
    where: { workspaceId: workspace.id },
  })

  if (link) {
    await prisma.sale.createMany({
      data: [
        {
          workspaceId: workspace.id,
          shopeeAccountId: shopeeAccount.id,
          productId: productList[0].id,
          linkId: link.id,
          externalId: 'ORD001',
          orderNumber: '#12345',
          amount: 89.90,
          commission: 8.99,
          status: 'confirmed',
          purchasedAt: new Date('2026-09-28'),
          confirmedAt: new Date('2026-09-29'),
        },
        {
          workspaceId: workspace.id,
          shopeeAccountId: shopeeAccount.id,
          productId: productList[1].id,
          linkId: link.id,
          externalId: 'ORD002',
          orderNumber: '#12346',
          amount: 199.90,
          commission: 29.99,
          status: 'confirmed',
          purchasedAt: new Date('2026-09-29'),
          confirmedAt: new Date('2026-09-30'),
        },
        {
          workspaceId: workspace.id,
          shopeeAccountId: shopeeAccount.id,
          productId: productList[0].id,
          externalId: 'ORD003',
          orderNumber: '#12347',
          amount: 89.90,
          commission: 8.99,
          status: 'pending',
          purchasedAt: new Date('2026-10-01'),
        },
      ],
    })

    console.log('✅ Demo sales created')
  }

  // Create demo click events
  if (link) {
    const clicksData = []
    for (let i = 0; i < 50; i++) {
      clicksData.push({
        workspaceId: workspace.id,
        linkId: link.id,
        ip: `192.168.1.${Math.floor(Math.random() * 255)}`,
        userAgent: 'Mozilla/5.0',
        device: ['mobile', 'desktop', 'tablet'][Math.floor(Math.random() * 3)],
        clickedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      })
    }

    await prisma.clickEvent.createMany({ data: clicksData })
    console.log(`✅ ${clicksData.length} click events created`)
  }

  console.log('\n🎉 Database seeded successfully!')
  console.log('\n📧 Login credentials:')
  console.log('   Email: fabiana@demo.com')
  console.log('   Password: demo123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
