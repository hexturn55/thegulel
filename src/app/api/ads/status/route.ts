import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { getAdLimitState } from '@/lib/ads-ssv';

export const dynamic = 'force-dynamic';

/**
 * GET /api/ads/status — whether the signed-in viewer may watch a rewarded ad
 * now. Uses the same cooldown and daily cap as the SSV callback
 * (/api/ads/ssv), so a client can hide the button instead of showing an ad
 * that won't pay out.
 *
 * 200 → { canWatch, retryInSeconds, remainingToday }
 *   retryInSeconds  seconds until the cooldown ends; when the daily cap is
 *                   reached, seconds until UTC midnight. 0 when allowed now.
 */
export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { cooldownRemainingMs, todayCount, dailyCap } = await getAdLimitState(user.id);
  const remainingToday = Math.max(0, dailyCap - todayCount);

  let retryInSeconds = 0;
  if (remainingToday === 0) {
    const now = new Date();
    const nextMidnight = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
    retryInSeconds = Math.ceil((nextMidnight - now.getTime()) / 1000);
  } else if (cooldownRemainingMs > 0) {
    retryInSeconds = Math.ceil(cooldownRemainingMs / 1000);
  }

  return NextResponse.json(
    { canWatch: retryInSeconds === 0, retryInSeconds, remainingToday },
    { headers: { 'Cache-Control': 'private, no-store' } }
  );
}
