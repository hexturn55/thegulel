import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@/generated/prisma';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import {
  DEMO_COOLDOWN_MS,
  DEMO_DAILY_CAP,
  DEMO_REWARD_COINS,
  checkAdToken,
  demoAdsEnabled,
} from '@/lib/ad-demo';

export const dynamic = 'force-dynamic';

class Limited extends Error {
  constructor(public code: 'cooldown' | 'daily_cap', public retryAfter?: number) {
    super(code);
  }
}

/**
 * POST /api/ads/demo/reward { token } — grant the demo ad reward.
 * The token is single-use (its nonce becomes the transaction's unique
 * providerRef), and the cooldown and daily cap are checked inside a
 * serializable transaction so parallel claims can't overshoot them.
 */
export async function POST(request: NextRequest) {
  if (!demoAdsEnabled()) {
    return NextResponse.json({ error: 'Demo ads disabled' }, { status: 409 });
  }
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { token } = await request.json().catch(() => ({ token: '' }));
  const check = checkAdToken(String(token ?? ''), user.id);
  if (!check.ok) {
    return NextResponse.json({ error: check.reason }, { status: 400 });
  }

  try {
    const result = await prisma.$transaction(
      async (tx) => {
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const recent = await tx.coinTransaction.findMany({
          where: {
            userId: user.id,
            type: 'AD_REWARD',
            providerRef: { startsWith: 'demo:' },
            createdAt: { gte: since },
          },
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true },
        });
        if (recent.length >= DEMO_DAILY_CAP) throw new Limited('daily_cap');
        const last = recent[0]?.createdAt.getTime() ?? 0;
        const wait = DEMO_COOLDOWN_MS - (Date.now() - last);
        if (wait > 0) throw new Limited('cooldown', Math.ceil(wait / 1000));

        await tx.coinTransaction.create({
          data: {
            userId: user.id,
            amount: DEMO_REWARD_COINS,
            type: 'AD_REWARD',
            description: 'Watched advertisement',
            providerRef: `demo:${check.nonce}`,
          },
        });
        const updated = await tx.user.update({
          where: { id: user.id },
          data: { coinBalance: { increment: DEMO_REWARD_COINS } },
          select: { coinBalance: true },
        });
        return {
          newBalance: updated.coinBalance,
          remainingToday: DEMO_DAILY_CAP - recent.length - 1,
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );
    return NextResponse.json({ success: true, coins: DEMO_REWARD_COINS, ...result });
  } catch (err) {
    if (err instanceof Limited) {
      return NextResponse.json(
        { error: err.code, retryAfter: err.retryAfter },
        { status: 429 }
      );
    }
    const code = (err as { code?: string }).code;
    if (code === 'P2002') {
      return NextResponse.json({ error: 'already_claimed' }, { status: 409 });
    }
    if (code === 'P2034') {
      return NextResponse.json({ error: 'cooldown', retryAfter: 5 }, { status: 429 });
    }
    console.error('[ads/demo/reward] failed:', err);
    return NextResponse.json({ error: 'Failed to grant reward' }, { status: 500 });
  }
}
