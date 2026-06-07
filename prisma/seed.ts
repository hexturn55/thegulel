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

  // Real series/episodes are managed via the admin panel and the production
  // content pipeline. To populate a dev/staging catalog with browsable demo
  // content, run with SEED_DEMO_CONTENT=true (off by default so production
  // catalogs are never polluted with placeholders).
  if (process.env.SEED_DEMO_CONTENT === 'true') {
    await seedDemoContent();
    console.log('✅ Demo series + episodes seeded');
  }

  console.log('🎉 Seeding complete!');
}

const SAMPLE_VIDEO =
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';

function poster(label: string): string {
  return `https://placehold.co/600x900/1a1a22/e11d48?text=${encodeURIComponent(label)}`;
}

async function seedDemoContent() {
  const demo = [
    { title: 'Love After Midnight', genre: 'Romance', episodes: 12, featured: true },
    { title: 'The CEO’s Secret Bride', genre: 'Romance', episodes: 16 },
    { title: 'Vengeance Protocol', genre: 'Thriller', episodes: 14, featured: true },
    { title: 'Heir to the Throne', genre: 'Drama', episodes: 18 },
    { title: 'My Billionaire Roommate', genre: 'Comedy', episodes: 10 },
    { title: 'Realm of Shadows', genre: 'Fantasy', episodes: 15 },
  ];

  for (const d of demo) {
    const series = await prisma.series.create({
      data: {
        title: d.title,
        description: `${d.title} — a gripping ${d.genre.toLowerCase()} micro-drama. (Demo content.)`,
        thumbnail: poster(d.title),
        genre: d.genre,
        tags: [d.genre],
        totalEpisodes: d.episodes,
        freeEpisodes: 3,
        coinPrice: 10,
        status: 'PUBLISHED',
        featured: Boolean(d.featured),
      },
    });

    await prisma.episode.createMany({
      data: Array.from({ length: d.episodes }, (_, i) => {
        const n = i + 1;
        return {
          seriesId: series.id,
          episodeNumber: n,
          title: `Episode ${n}`,
          duration: 90 + i * 20,
          videoUrl: SAMPLE_VIDEO,
          videoId: `${series.id}-${n}`,
          thumbnail: poster(`${d.title} E${n}`),
          isFree: n <= 3,
        };
      }),
    });
  }
}

main()
  .catch((e) => { console.error('❌ Seeding failed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
