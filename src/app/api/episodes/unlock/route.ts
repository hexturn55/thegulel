import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { hasActiveVip } from '@/lib/subscription';

class Insufficient extends Error {}

export async function POST(request: NextRequest) {
  try {
    const { episodeId } = await request.json();

    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const userId = user.id;

    // VIP subscribers already have access — never charge coins.
    if (await hasActiveVip(userId)) {
      return NextResponse.json({ success: true, vip: true, newBalance: user.coinBalance });
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
      return NextResponse.json({ success: true, free: true, newBalance: user.coinBalance });
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
          data: { userId, episodeId, coinsSpent: coinPrice },
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
        return NextResponse.json(
          { error: 'Insufficient coins', required: coinPrice, balance: fresh?.coinBalance ?? 0 },
          { status: 400 }
        );
      }
      if ((err as { code?: string }).code === 'P2002') {
        return NextResponse.json({ success: true, alreadyUnlocked: true, newBalance: user.coinBalance });
      }
      throw err;
    }
  } catch (error) {
    console.error('Episode unlock error:', error);
    return NextResponse.json({ error: 'Failed to unlock episode' }, { status: 500 });
  }
}
