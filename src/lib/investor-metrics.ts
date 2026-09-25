import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { VIP_PLANS } from '@/lib/vip-plans';

/**
 * Live platform metrics for the investor dashboard.
 *
 * Every number here is read from the production database at request time —
 * nothing is projected or seeded. Where a figure is derived (e.g. rupee
 * revenue from coin purchases) the derivation is stated next to it so the
 * dashboard can label it honestly.
 */

/* ── Access gate ───────────────────────────────────────────────────────── */

export const INVESTOR_COOKIE = 'gulel_investor';

/** The dashboard is off entirely unless an access code is configured. */
export function investorDashboardEnabled(): boolean {
  return !!process.env.INVESTOR_DASHBOARD_CODE;
}

/** Cookie value proving the holder entered the current access code. */
export function investorCookieValue(): string | null {
  const code = process.env.INVESTOR_DASHBOARD_CODE;
  if (!code) return null;
  return crypto
    .createHmac('sha256', process.env.JWT_SECRET || code)
    .update(`investor-dashboard:${code}`)
    .digest('base64url');
}

function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

export function checkInvestorCode(input: string): boolean {
  const code = process.env.INVESTOR_DASHBOARD_CODE;
  return !!code && safeEqual(input.trim(), code);
}

export function checkInvestorCookie(value: string | undefined): boolean {
  const expected = investorCookieValue();
  return !!expected && !!value && safeEqual(value, expected);
}

/* ── Metrics ───────────────────────────────────────────────────────────── */

export interface SeriesMetrics {
  id: string;
  title: string;
  genre: string;
  thumbnail: string;
  coinPrice: number;
  episodes: number;
  viewers: number;
  starts: number;
  completions: number;
  completionRate: number | null;
  watchHours: number;
  pilotViewers: number;
  continuedViewers: number;
  /** Share of pilot viewers who went on to watch episode 2 or later. */
  continuation: number | null;
  unlocks: number;
  buyers: number;
  coinsSpent: number;
  /** coinsSpent valued at the blended rupee price of a coin. */
  revenueINR: number;
}

export interface DailyPoint {
  day: string;
  signups: number;
  activeViewers: number;
  starts: number;
  unlocks: number;
  coinsBought: number;
  adViews: number;
}

export interface InvestorMetrics {
  generatedAt: string;
  users: { total: number; new30d: number; new7d: number };
  viewers: { dau: number; wau: number; mau: number; allTime: number };
  engagement: {
    starts: number;
    completions: number;
    completionRate: number | null;
    watchHours: number;
    episodesPerViewer: number | null;
    pilotContinuation: number | null;
  };
  monetisation: {
    payingUsers: number;
    conversion: number | null;
    coinsPurchased: number;
    coinPurchases: number;
    revenueINR: number;
    revenueINR30d: number;
    arppuINR: number | null;
    unlocks: number;
    coinsSpent: number;
    inrPerCoin: number | null;
    vipActive: number;
    vipByPlan: Record<string, number>;
    vipMrrINR: number;
    adViews: number;
    adViews30d: number;
    adCoins: number;
  };
  catalog: { series: number; episodes: number; runtimeMinutes: number };
  series: SeriesMetrics[];
  daily: DailyPoint[];
}

const DAY = 86_400_000;

function ratio(n: number, d: number): number | null {
  return d > 0 ? n / d : null;
}

/**
 * Rupee value of coin purchases. A purchase whose coin amount matches an
 * active pack is valued at that pack's price; anything else (promos, retired
 * packs) at the blended rupee-per-coin rate across active packs.
 */
function valuePurchases(
  groups: { amount: number; count: number }[],
  packs: { coins: number; priceINR: number }[],
  inrPerCoin: number | null
): number {
  const byCoins = new Map(packs.map((p) => [p.coins, p.priceINR]));
  let total = 0;
  for (const g of groups) {
    const price = byCoins.get(g.amount);
    if (price != null) total += price * g.count;
    else if (inrPerCoin != null) total += g.amount * inrPerCoin * g.count;
  }
  return Math.round(total);
}

export async function getInvestorMetrics(): Promise<InvestorMetrics> {
  const now = Date.now();
  const d1 = new Date(now - DAY);
  const d7 = new Date(now - 7 * DAY);
  const d30 = new Date(now - 30 * DAY);

  const [
    usersTotal,
    users30,
    users7,
    dau,
    wau,
    mau,
    allViewers,
    engagementRows,
    purchaseGroups,
    purchaseGroups30,
    purchasers,
    packs,
    unlockAgg,
    vipRows,
    adAll,
    ad30,
    catalogRows,
    seriesRows,
    seriesPurchases,
    dailyRows,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: d30 } } }),
    prisma.user.count({ where: { createdAt: { gte: d7 } } }),
    prisma.watchHistory.findMany({ where: { updatedAt: { gte: d1 } }, distinct: ['userId'], select: { userId: true } }),
    prisma.watchHistory.findMany({ where: { updatedAt: { gte: d7 } }, distinct: ['userId'], select: { userId: true } }),
    prisma.watchHistory.findMany({ where: { updatedAt: { gte: d30 } }, distinct: ['userId'], select: { userId: true } }),
    prisma.watchHistory.findMany({ distinct: ['userId'], select: { userId: true } }),
    prisma.$queryRaw<{ starts: number; completions: number; seconds: number }[]>`
      SELECT COUNT(*)::int AS starts,
             COUNT(*) FILTER (WHERE completed)::int AS completions,
             COALESCE(SUM(progress), 0)::float AS seconds
      FROM "WatchHistory"`,
    prisma.coinTransaction.groupBy({ by: ['amount'], where: { type: 'PURCHASE' }, _count: { _all: true } }),
    prisma.coinTransaction.groupBy({
      by: ['amount'],
      where: { type: 'PURCHASE', createdAt: { gte: d30 } },
      _count: { _all: true },
    }),
    prisma.coinTransaction.findMany({ where: { type: 'PURCHASE' }, distinct: ['userId'], select: { userId: true } }),
    prisma.coinPackage.findMany({ where: { active: true }, select: { coins: true, priceINR: true } }),
    prisma.episodePurchase.aggregate({ _count: { _all: true }, _sum: { coinsSpent: true } }),
    prisma.subscription.findMany({
      where: { status: 'ACTIVE', endDate: { gt: new Date(now) } },
      select: { userId: true, plan: true },
    }),
    prisma.coinTransaction.aggregate({ where: { type: 'AD_REWARD' }, _count: { _all: true }, _sum: { amount: true } }),
    prisma.coinTransaction.count({ where: { type: 'AD_REWARD', createdAt: { gte: d30 } } }),
    prisma.$queryRaw<{ series: number; episodes: number; seconds: number }[]>`
      SELECT COUNT(DISTINCT s.id)::int AS series,
             COUNT(e.id)::int AS episodes,
             COALESCE(SUM(e.duration), 0)::float AS seconds
      FROM "Series" s LEFT JOIN "Episode" e ON e."seriesId" = s.id
      WHERE s.status = 'PUBLISHED'`,
    prisma.$queryRaw<
      {
        id: string;
        title: string;
        genre: string;
        thumbnail: string;
        coinPrice: number;
        episodes: number;
        viewers: number;
        starts: number;
        completions: number;
        seconds: number;
        pilot_viewers: number;
        continued_viewers: number;
      }[]
    >`
      SELECT s.id, s.title, s.genre, s.thumbnail, s."coinPrice",
             COUNT(DISTINCT e.id)::int AS episodes,
             COUNT(DISTINCT w."userId")::int AS viewers,
             COUNT(w.id)::int AS starts,
             COUNT(w.id) FILTER (WHERE w.completed)::int AS completions,
             COALESCE(SUM(w.progress), 0)::float AS seconds,
             COUNT(DISTINCT w."userId") FILTER (WHERE e."episodeNumber" = 1)::int AS pilot_viewers,
             COUNT(DISTINCT w."userId") FILTER (WHERE e."episodeNumber" >= 2)::int AS continued_viewers
      FROM "Series" s
      JOIN "Episode" e ON e."seriesId" = s.id
      LEFT JOIN "WatchHistory" w ON w."episodeId" = e.id
      WHERE s.status = 'PUBLISHED'
      GROUP BY s.id`,
    prisma.$queryRaw<{ seriesId: string; unlocks: number; buyers: number; coins: number }[]>`
      SELECT e."seriesId",
             COUNT(*)::int AS unlocks,
             COUNT(DISTINCT p."userId")::int AS buyers,
             COALESCE(SUM(p."coinsSpent"), 0)::int AS coins
      FROM "EpisodePurchase" p JOIN "Episode" e ON e.id = p."episodeId"
      GROUP BY e."seriesId"`,
    prisma.$queryRaw<
      {
        day: string;
        signups: number;
        active: number;
        starts: number;
        unlocks: number;
        coins: number;
        ads: number;
      }[]
    >`
      WITH days AS (
        SELECT generate_series(
          date_trunc('day', now()) - interval '29 days',
          date_trunc('day', now()),
          interval '1 day'
        ) AS d
      )
      SELECT to_char(d, 'YYYY-MM-DD') AS day,
        (SELECT COUNT(*) FROM "User" u
           WHERE u."createdAt" >= d AND u."createdAt" < d + interval '1 day')::int AS signups,
        (SELECT COUNT(DISTINCT w."userId") FROM "WatchHistory" w
           WHERE w."updatedAt" >= d AND w."updatedAt" < d + interval '1 day')::int AS active,
        (SELECT COUNT(*) FROM "WatchHistory" w
           WHERE w."watchedAt" >= d AND w."watchedAt" < d + interval '1 day')::int AS starts,
        (SELECT COUNT(*) FROM "EpisodePurchase" p
           WHERE p."createdAt" >= d AND p."createdAt" < d + interval '1 day')::int AS unlocks,
        (SELECT COALESCE(SUM(c.amount), 0) FROM "CoinTransaction" c
           WHERE c.type = 'PURCHASE' AND c."createdAt" >= d AND c."createdAt" < d + interval '1 day')::int AS coins,
        (SELECT COUNT(*) FROM "CoinTransaction" c
           WHERE c.type = 'AD_REWARD' AND c."createdAt" >= d AND c."createdAt" < d + interval '1 day')::int AS ads
      FROM days ORDER BY d`,
  ]);

  const totalPackCoins = packs.reduce((s, p) => s + p.coins, 0);
  const totalPackINR = packs.reduce((s, p) => s + p.priceINR, 0);
  const inrPerCoin = totalPackCoins > 0 ? totalPackINR / totalPackCoins : null;

  const toGroups = (g: { amount: number; _count: { _all: number } }[]) =>
    g.map((x) => ({ amount: x.amount, count: x._count._all }));
  const revenueINR = valuePurchases(toGroups(purchaseGroups), packs, inrPerCoin);
  const revenueINR30d = valuePurchases(toGroups(purchaseGroups30), packs, inrPerCoin);
  const coinsPurchased = purchaseGroups.reduce((s, g) => s + g.amount * g._count._all, 0);
  const coinPurchases = purchaseGroups.reduce((s, g) => s + g._count._all, 0);

  const vipByPlan: Record<string, number> = { WEEKLY: 0, MONTHLY: 0, YEARLY: 0 };
  for (const v of vipRows) vipByPlan[v.plan] = (vipByPlan[v.plan] ?? 0) + 1;
  const monthlyINR = (id: string) => {
    const p = VIP_PLANS.find((x) => x.id === id);
    if (!p) return 0;
    return p.interval === 'week' ? (p.priceINR * 52) / 12 : p.interval === 'year' ? p.priceINR / 12 : p.priceINR;
  };
  const vipMrrINR = Math.round(
    Object.entries(vipByPlan).reduce((s, [plan, n]) => s + n * monthlyINR(plan), 0)
  );

  const paying = new Set([...purchasers.map((p) => p.userId), ...vipRows.map((v) => v.userId)]);

  const eng = engagementRows[0] ?? { starts: 0, completions: 0, seconds: 0 };
  const seriesPilot = seriesRows.reduce((s, r) => s + r.pilot_viewers, 0);
  const seriesContinued = seriesRows.reduce((s, r) => s + r.continued_viewers, 0);

  const bySeriesPurchase = new Map(seriesPurchases.map((p) => [p.seriesId, p]));
  const series: SeriesMetrics[] = seriesRows
    .map((r) => {
      const p = bySeriesPurchase.get(r.id);
      const coinsSpent = p?.coins ?? 0;
      return {
        id: r.id,
        title: r.title,
        genre: r.genre,
        thumbnail: r.thumbnail,
        coinPrice: r.coinPrice,
        episodes: r.episodes,
        viewers: r.viewers,
        starts: r.starts,
        completions: r.completions,
        completionRate: ratio(r.completions, r.starts),
        watchHours: r.seconds / 3600,
        pilotViewers: r.pilot_viewers,
        continuedViewers: r.continued_viewers,
        continuation: ratio(r.continued_viewers, r.pilot_viewers),
        unlocks: p?.unlocks ?? 0,
        buyers: p?.buyers ?? 0,
        coinsSpent,
        revenueINR: inrPerCoin != null ? Math.round(coinsSpent * inrPerCoin) : 0,
      };
    })
    .sort((a, b) => b.viewers - a.viewers || b.unlocks - a.unlocks || b.episodes - a.episodes);

  const cat = catalogRows[0] ?? { series: 0, episodes: 0, seconds: 0 };

  return {
    generatedAt: new Date(now).toISOString(),
    users: { total: usersTotal, new30d: users30, new7d: users7 },
    viewers: { dau: dau.length, wau: wau.length, mau: mau.length, allTime: allViewers.length },
    engagement: {
      starts: eng.starts,
      completions: eng.completions,
      completionRate: ratio(eng.completions, eng.starts),
      watchHours: eng.seconds / 3600,
      episodesPerViewer: ratio(eng.starts, allViewers.length),
      pilotContinuation: ratio(seriesContinued, seriesPilot),
    },
    monetisation: {
      payingUsers: paying.size,
      conversion: ratio(paying.size, usersTotal),
      coinsPurchased,
      coinPurchases,
      revenueINR,
      revenueINR30d,
      arppuINR: purchasers.length > 0 ? Math.round(revenueINR / purchasers.length) : null,
      unlocks: unlockAgg._count._all,
      coinsSpent: unlockAgg._sum.coinsSpent ?? 0,
      inrPerCoin,
      vipActive: vipRows.length,
      vipByPlan,
      vipMrrINR,
      adViews: adAll._count._all,
      adViews30d: ad30,
      adCoins: adAll._sum.amount ?? 0,
    },
    catalog: { series: cat.series, episodes: cat.episodes, runtimeMinutes: cat.seconds / 60 },
    series,
    daily: dailyRows.map((d) => ({
      day: d.day,
      signups: d.signups,
      activeViewers: d.active,
      starts: d.starts,
      unlocks: d.unlocks,
      coinsBought: d.coins,
      adViews: d.ads,
    })),
  };
}

/** Pitch-only brand integration episodes (DRAFT series, never in the catalog). */
export const BRAND_SHOWCASE_SERIES_ID = 'brand-showcase';
