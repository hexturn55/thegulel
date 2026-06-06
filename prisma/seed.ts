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
  const FREE_EPISODES = 5;
  const TOTAL_EPISODES = 8;

  await prisma.series.upsert({
    where: { id: 'demo-series' },
    update: {
      status: 'PUBLISHED',
      featured: true,
      freeEpisodes: FREE_EPISODES,
      totalEpisodes: TOTAL_EPISODES,
      thumbnail: `/api/placeholder/${encodeURIComponent('The Secret Alliance')}`,
    },
    create: {
      id: 'demo-series',
      title: 'The Secret Alliance',
      titleHi: 'गुप्त गठबंधन',
      titleZh: '秘密联盟',
      description: 'A thrilling vertical drama about corporate espionage and hidden identities.',
      thumbnail: `/api/placeholder/${encodeURIComponent('The Secret Alliance')}`,
      genre: 'Thriller',
      tags: ['Suspense', 'Corporate', 'Mystery'],
      freeEpisodes: FREE_EPISODES,
      totalEpisodes: TOTAL_EPISODES,
      coinPrice: 10,
      status: 'PUBLISHED',
      featured: true,
    },
  });

  // Playable sample HLS stream (CORS-enabled) so the demo works without a
  // Cloudflare Stream account. Replace videoUrl/videoId with real Cloudflare
  // uploads in production.
  const SAMPLE_HLS = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';

  for (let n = 1; n <= TOTAL_EPISODES; n++) {
    await prisma.episode.upsert({
      where: { seriesId_episodeNumber: { seriesId: 'demo-series', episodeNumber: n } },
      update: {
        videoUrl: SAMPLE_HLS,
        isFree: n <= FREE_EPISODES,
        thumbnail: `/api/placeholder/${encodeURIComponent(`Episode ${n}`)}`,
      },
      create: {
        seriesId: 'demo-series',
        episodeNumber: n,
        title: `Episode ${n}`,
        duration: 596,
        videoUrl: SAMPLE_HLS,
        videoId: '',
        thumbnail: `/api/placeholder/${encodeURIComponent(`Episode ${n}`)}`,
        isFree: n <= FREE_EPISODES,
      },
    });
  }

  console.log(`✅ Demo series + ${TOTAL_EPISODES} episodes created`);
  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => { console.error('❌ Seeding failed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
