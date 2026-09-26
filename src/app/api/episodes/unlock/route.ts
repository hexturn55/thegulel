import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { hasActiveVip } from '@/lib/subscription';

class Insufficient extends Error {}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const episodeId: unknown = body?.episodeId;
    if (typeof episodeId !== 'string' || !episodeId) {
      return NextResponse.json({ error: 'episodeId required' }, { status: 400 });
    }

    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const userId = user.id;

    // VIP subscribers already have access — never charge coins.
    if (await hasActiveVip(userId)) {
      return NextResponse.json({
        success: true,
        vip: true,
        alreadyUnlocked: true,
        newBalance: user.coinBalance,
      });
    }

    // Only catalog (published) episodes can be bought.
    const episode = await prisma.episode.findFirst({
      where: { id: episodeId, series: { status: 'PUBLISHED' } },
      include: { series: { select: { coinPrice: true } } },
    });
    if (!episode) {
      return NextResponse.json({ error: 'Episode not found' }, { status: 404 });
    }
    if (episode.isFree) {
      return NextResponse.json({
        success: true,
        free: true,
        alreadyUnlocked: true,
        newBalance: user.coinBalance,
      });
    }

    // Already bought: succeed without charging again.
    const existing = await prisma.episodePurchase.findUnique({
      where: { userId_episodeId: { userId, episodeId: episode.id } },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json({
        success: true,
        alreadyUnlocked: true,
        newBalance: user.coinBalance,
      });
    }

    const coinPrice = episode.series.coinPrice;

    try {
      // Debit only if the balance covers the price, in the same transaction as
      // the purchase row: a double tap either hits the unique purchase
      // constraint or finds the balance already spent — never goes negative.
      const newBalance = await prisma.$transaction(async (tx) => {
        const debited = await tx.user.updateMany({
          where: { id: userId, coinBalance: { gte: coinPrice } },
          data: { coinBalance: { decrement: coinPrice } },
        });
        if (debited.count === 0) throw new Insufficient();
        await tx.episodePurchase.create({
          data: { userId, episodeId: episode.id, coinsSpent: coinPrice },
        });
        await tx.coinTransaction.create({
          data: {
            userId,
            amount: -coinPrice,
            type: 'EPISODE_UNLOCK',
            description: `Unlocked: ${episode.title}`,
          },
        });
        const u = await tx.user.findUnique({ where: { id: userId }, select: { coinBalance: true } });
        return u?.coinBalance ?? 0;
      });
      return NextResponse.json({ success: true, newBalance });
    } catch (err) {
      if (err instanceof Insufficient) {
        const fresh = await prisma.user.findUnique({
          where: { id: userId },
          select: { coinBalance: true },
        });
        // 400 (not 402) because already-shipped clients key off it.
        return NextResponse.json(
          {
            error: 'Insufficient coins',
            code: 'INSUFFICIENT_COINS',
            required: coinPrice,
            balance: fresh?.coinBalance ?? 0,
          },
          { status: 400 }
        );
      }
      if ((err as { code?: string }).code === 'P2002') {
        // A concurrent request bought it first (the transaction rolled back,
        // so this one wasn't charged). Report the current balance.
        const fresh = await prisma.user.findUnique({
          where: { id: userId },
          select: { coinBalance: true },
        });
        return NextResponse.json({
          success: true,
          alreadyUnlocked: true,
          newBalance: fresh?.coinBalance ?? user.coinBalance,
        });
      }
      throw err;
    }
  } catch (error) {
    console.error('Episode unlock error:', error);
    return NextResponse.json({ error: 'Failed to unlock episode' }, { status: 500 });
  }
}
