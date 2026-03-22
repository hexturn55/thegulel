import { MetadataRoute } from 'next';
import prisma from '@/lib/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const series = await prisma.series.findMany({
    where: { status: 'PUBLISHED' },
    select: { id: true, updatedAt: true },
  });

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
