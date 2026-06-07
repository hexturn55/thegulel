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

  // NOTE: real series/episodes are managed via the admin panel and the
  // production content pipeline — the seed intentionally does NOT create a
  // demo series, to avoid polluting a populated catalog with placeholders.

  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => { console.error('❌ Seeding failed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
