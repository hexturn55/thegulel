import { MetadataRoute } from 'next';
import prisma from '@/lib/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Resilient to the DB being unreachable at build time — fall back to the
  // static routes so a production build never hard-fails on sitemap generation.
  let series: { id: string; updatedAt: Date }[] = [];
  try {
    series = await prisma.series.findMany({
      where: { status: 'PUBLISHED' },
      select: { id: true, updatedAt: true },
    });
  } catch (error) {
    console.error('Sitemap: failed to load series, using static routes only:', error);
  }

  const seriesUrls = series.map((s) => ({
    url: `https://thegulel.com/series/${s.id}`,
    lastModified: s.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  return [
    {
      url: 'https://thegulel.com',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: 'https://thegulel.com/search',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.5,
    },
    ...seriesUrls,
  ];
}
