import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - 7);

  const [
    totalUsers,
    totalSeries,
    totalEpisodes,
    revenueResult,
    activeSubscriptions,
    newUsersToday,
    newUsersThisWeek,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.series.count(),
    prisma.episode.count(),
    prisma.coinTransaction.aggregate({
      where: { type: 'PURCHASE' },
      _sum: { amount: true },
    }),
    prisma.subscription.count({
      where: { status: 'ACTIVE' },
    }),
    prisma.user.count({
      where: { createdAt: { gte: startOfToday } },
    }),
    prisma.user.count({
      where: { createdAt: { gte: startOfWeek } },
    }),
  ]);

  return NextResponse.json({
    totalUsers,
    totalSeries,
    totalEpisodes,
    totalRevenue: revenueResult._sum.amount ?? 0,
    activeSubscriptions,
    newUsersToday,
    newUsersThisWeek,
  });
}
