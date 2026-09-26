import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import {
  AD_REWARD_COINS,
  getAdLimitState,
  verifyAdSsv,
} from '@/lib/ads-ssv';

export const dynamic = 'force-dynamic';

let warnedNoAllowlist = false;

/**
 * Google's SSV callback sends only the numeric ad unit id (`ad_unit=6574059853`),
 * while AdMob shows the full `ca-app-pub-XXXX/6574059853`. Compare the part
 * after the last '/', so either form works in ADMOB_SSV_AD_UNITS.
 */
function normalizeAdUnit(s: string): string {
  const t = s.trim();
  return t.includes('/') ? t.slice(t.lastIndexOf('/') + 1) : t;
}

/**
 * Rewarded ad units allowed to grant coins (env ADMOB_SSV_AD_UNITS,
 * comma-separated; full `ca-app-pub-…/NNN` ids or the numeric `NNN` part).
 * Empty = allow any (the live web rewarded ads predate the allowlist and must
 * keep working on deploy); warns once per process.
 */
function adUnitAllowed(adUnit: string | null): boolean {
  const allowed = (process.env.ADMOB_SSV_AD_UNITS ?? '')
    .split(',')
    .map(normalizeAdUnit)
    .filter(Boolean);
  if (allowed.length === 0) {
    if (!warnedNoAllowlist) {
      warnedNoAllowlist = true;
      console.warn('ssv: ADMOB_SSV_AD_UNITS not set — accepting rewards from any ad unit');
    }
    return true;
  }
  if (!adUnit || !allowed.includes(normalizeAdUnit(adUnit))) {
    console.warn('ssv: unknown ad_unit', adUnit);
    return false;
  }
  return true;
}

/**
 * GET /api/ads/ssv
 *
 * Google's rewarded-ads Server-Side Verification callback. Google calls this
 * (server-to-server) after a user *actually completes* a rewarded ad. We:
 *  1. verify Google's signature (so only Google can grant a reward),
 *  2. check the ad unit against ADMOB_SSV_AD_UNITS (when configured),
 *  3. resolve our user from `custom_data` (the userId we sent with the ad),
 *  4. grant coins exactly once per `transaction_id` (idempotent),
 *  5. rate-limit per user via AdCooldown and a per-UTC-day cap (ADS_DAILY_CAP).
 *
 * Configure this URL as the SSV callback in your AdMob/Ad Manager rewarded
 * ad unit, and pass the Gulel userId as `custom_data`.
 *
 * Always returns 200 on "handled" outcomes so Google doesn't retry forever;
 * returns 403 only when the signature is invalid.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);

  const valid = await verifyAdSsv(url.search.slice(1));
  if (!valid) {
    return new NextResponse('invalid signature', { status: 403 });
  }

  const p = url.searchParams;
  if (!adUnitAllowed(p.get('ad_unit'))) {
    return new NextResponse('unknown ad unit', { status: 200 });
  }

  // Only custom_data carries our (server-issued) user id; `user_id` is
  // client-settable SDK metadata, so it is never trusted.
  const userId = p.get('custom_data');
  const transactionId = p.get('transaction_id');
  if (!userId || !transactionId) {
    return new NextResponse('missing data', { status: 200 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return new NextResponse('unknown user', { status: 200 });

  // Rate limit per user: cooldown between ads and a daily cap.
  const limits = await getAdLimitState(userId);
  if (limits.cooldownRemainingMs > 0) {
    return new NextResponse('cooldown', { status: 200 });
  }
  if (limits.todayCount >= limits.dailyCap) {
    return new NextResponse('daily cap', { status: 200 });
  }

  // Idempotent grant: the unique providerRef makes a replayed callback a no-op.
  try {
    await prisma.$transaction([
      prisma.coinTransaction.create({
        data: {
          userId,
          amount: AD_REWARD_COINS,
          type: 'AD_REWARD',
          description: 'Watched advertisement (verified)',
          providerRef: `ad:${transactionId}`,
        },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { coinBalance: { increment: AD_REWARD_COINS } },
      }),
      prisma.adCooldown.upsert({
        where: { userId },
        update: { lastAdAt: new Date() },
        create: { userId, lastAdAt: new Date() },
      }),
    ]);
  } catch (err) {
    if ((err as { code?: string }).code === 'P2002') {
      return new NextResponse('already granted', { status: 200 });
    }
    console.error('SSV grant failed:', err);
    return new NextResponse('error', { status: 500 });
  }

  return new NextResponse('ok', { status: 200 });
}
