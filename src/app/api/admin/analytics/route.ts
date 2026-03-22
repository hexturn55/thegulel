import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';

function getPeriodStart(period: string): Date {
  const now = new Date();
  const days = period === '90d' ? 90 : period === '30d' ? 30 : 7;
  const start = new Date(now);
  start.setDate(start.getDate() - days);
  start.setHours(0, 0, 0, 0);
  return start;
}

export async function GET(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') ?? '7d';
  const since = getPeriodStart(period);

  const [
    rawSignups,
    rawViews,
    rawRevenue,
    topSeriesRaw,
    topEpisodesRaw,
  ] = await Promise.all([
    // Daily signups
    prisma.$queryRaw<Array<{ day: string; count: bigint }>>`
      SELECT DATE("createdAt") AS day, COUNT(*) AS count
      FROM "User"
      WHERE "createdAt" >= ${since}
      GROUP BY day
      ORDER BY day ASC
    `,
    // Daily watch events
    prisma.$queryRaw<Array<{ day: string; count: bigint }>>`
      SELECT DATE("watchedAt") AS day, COUNT(*) AS count
      FROM "WatchHistory"
      WHERE "watchedAt" >= ${since}
      GROUP BY day
      ORDER BY day ASC
    `,
    // Revenue by day (PURCHASE transactions)
    prisma.$queryRaw<Array<{ day: string; total: bigint }>>`
      SELECT DATE("createdAt") AS day, SUM(amount) AS total
      FROM "CoinTransaction"
      WHERE "createdAt" >= ${since} AND type = 'PURCHASE'
      GROUP BY day
      ORDER BY day ASC
    `,
    // Top series by watch count
    prisma.watchHistory.groupBy({
      by: ['episodeId'],
      where: { watchedAt: { gte: since } },
      _count: { episodeId: true },
      orderBy: { _count: { episodeId: 'desc' } },
      take: 10,
    }),
    // Top episodes by watch count
    prisma.watchHistory.groupBy({
      by: ['episodeId'],
      where: { watchedAt: { gte: since } },
      _count: { episodeId: true },
      orderBy: { _count: { episodeId: 'desc' } },
      take: 10,
    }),
  ]);

  // Hydrate top episodes with episode + series info
  const episodeIds = topEpisodesRaw.map((r) => r.episodeId);
  const episodes = await prisma.episode.findMany({
    where: { id: { in: episodeIds } },
    include: { series: { select: { id: true, title: true } } },
  });

  const topEpisodes = topEpisodesRaw.map((r) => ({
    episodeId: r.episodeId,
    views: r._count.episodeId,
    episode: episodes.find((e) => e.id === r.episodeId) ?? null,
  }));

  // Aggregate series views
  const seriesViewMap = new Map<string, number>();
  for (const ep of topEpisodesRaw) {
    const episode = episodes.find((e) => e.id === ep.episodeId);
    if (episode) {
      const prev = seriesViewMap.get(episode.seriesId) ?? 0;
      seriesViewMap.set(episode.seriesId, prev + ep._count.episodeId);
    }
  }
  const topSeriesIds = [...seriesViewMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id]) => id);

  const seriesList = await prisma.series.findMany({
    where: { id: { in: topSeriesIds } },
    select: { id: true, title: true, thumbnail: true },
  });

  const topSeries = topSeriesIds.map((id) => ({
    seriesId: id,
    views: seriesViewMap.get(id) ?? 0,
    series: seriesList.find((s) => s.id === id) ?? null,
  }));

  return NextResponse.json({
    period,
    since: since.toISOString(),
    dailySignups: rawSignups.map((r) => ({ day: r.day, count: Number(r.count) })),
    dailyViews: rawViews.map((r) => ({ day: r.day, count: Number(r.count) })),
    revenueByDay: rawRevenue.map((r) => ({ day: r.day, total: Number(r.total) })),
    topSeries,
    topEpisodes,
  });
}
