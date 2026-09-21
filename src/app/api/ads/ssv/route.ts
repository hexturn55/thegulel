import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAdSsv } from '@/lib/ads-ssv';

export const dynamic = 'force-dynamic';

const AD_REWARD_COINS = 5;
const AD_COOLDOWN_MS = 60 * 1000; // min seconds between rewarded grants per user

/**
 * GET /api/ads/ssv
 *
 * Google's rewarded-ads Server-Side Verification callback. Google calls this
 * (server-to-server) after a user *actually completes* a rewarded ad. We:
 *  1. verify Google's signature (so only Google can grant a reward),
 *  2. resolve our user from `custom_data` (the userId we sent with the ad),
 *  3. grant coins exactly once per `transaction_id` (idempotent),
 *  4. rate-limit per user via AdCooldown.
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
  const userId = p.get('custom_data') || p.get('user_id');
  const transactionId = p.get('transaction_id');
  if (!userId || !transactionId) {
    return new NextResponse('missing data', { status: 200 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return new NextResponse('unknown user', { status: 200 });

  // Rate limit per user.
  const cooldown = await prisma.adCooldown.findUnique({ where: { userId } });
  if (cooldown && Date.now() - cooldown.lastAdAt.getTime() < AD_COOLDOWN_MS) {
    return new NextResponse('cooldown', { status: 200 });
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
