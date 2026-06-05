import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { PrismaClient } from '../src/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';

// Use DIRECT_URL for seeding (bypasses pgbouncer)
const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  // Clear existing coin packages
  await prisma.coinPackage.deleteMany();

  // Seed coin packages
  const packages = [
    { name: 'Starter Pack', coins: 100, priceUSD: 1.99, priceINR: 149, popular: false },
    { name: 'Popular Pack', coins: 500, priceUSD: 7.99, priceINR: 599, popular: true },
    { name: 'Super Pack', coins: 1200, priceUSD: 14.99, priceINR: 1099, popular: false },
    { name: 'Mega Pack', coins: 3000, priceUSD: 29.99, priceINR: 2499, popular: false },
  ];

  for (const pkg of packages) {
    await prisma.coinPackage.create({ data: { ...pkg, active: true } });
  }

  console.log('✅ Coin packages seeded');

  // Create a demo series
  await prisma.series.upsert({
    where: { id: 'demo-series' },
    update: {},
    create: {
      id: 'demo-series',
      title: 'The Secret Alliance',
      titleHi: 'गुप्त गठबंधन',
      titleZh: '秘密联盟',
      description: 'A thrilling vertical drama about corporate espionage and hidden identities.',
      thumbnail: 'https://placehold.co/720x1280/1e293b/ffffff/png?text=The+Secret+Alliance',
      genre: 'Thriller',
      tags: ['Suspense', 'Corporate', 'Mystery'],
      freeEpisodes: 5,
      coinPrice: 10,
      status: 'PUBLISHED',
      featured: true,
    },
  });

  console.log('✅ Demo series created');
  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => { console.error('❌ Seeding failed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
