import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { episodeId } = await request.json();

    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    const userId = user.id;

    // Get episode and series
    const episode = await prisma.episode.findUnique({
      where: { id: episodeId },
      include: {
        series: true,
      },
    });

    if (!episode) {
      return NextResponse.json(
        { error: 'Episode not found' },
        { status: 404 }
      );
    }

    // Check if already unlocked
    const existingPurchase = await prisma.episodePurchase.findUnique({
      where: {
        userId_episodeId: {
          userId,
          episodeId,
        },
      },
    });

    if (existingPurchase) {
      return NextResponse.json(
        { error: 'Episode already unlocked' },
        { status: 400 }
      );
    }

    // Check user balance
    const coinPrice = episode.series.coinPrice;

    if (user.coinBalance < coinPrice) {
      return NextResponse.json(
        {
          error: 'Insufficient coins',
          required: coinPrice,
          balance: user.coinBalance,
        },
        { status: 400 }
      );
    }

    // Perform transaction
    const [updatedUser, purchase, transaction] = await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          coinBalance: {
            decrement: coinPrice,
          },
        },
      }),
      prisma.episodePurchase.create({
        data: {
          userId,
          episodeId,
          coinsSpent: coinPrice,
        },
      }),
      prisma.coinTransaction.create({
        data: {
          userId,
          amount: -coinPrice,
          type: 'EPISODE_UNLOCK',
          description: `Unlocked: ${episode.title}`,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      newBalance: updatedUser.coinBalance,
      purchase,
    });
  } catch (error) {
    console.error('Episode unlock error:', error);
    return NextResponse.json(
      { error: 'Failed to unlock episode' },
      { status: 500 }
    );
  }
}
