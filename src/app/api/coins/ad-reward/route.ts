import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

const AD_REWARD_COINS = 5;
const AD_COOLDOWN_MS = 60 * 1000; // 1 minute cooldown between ads

export async function POST() {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    const userId = authUser.id;

    // Check cooldown via DB (persistent across restarts)
    const cooldown = await prisma.adCooldown.findUnique({
      where: { userId },
    });

    if (cooldown) {
      const elapsed = Date.now() - cooldown.lastAdAt.getTime();
      if (elapsed < AD_COOLDOWN_MS) {
        const remainingSeconds = Math.ceil((AD_COOLDOWN_MS - elapsed) / 1000);
        return NextResponse.json(
          {
            error: 'Please wait before watching another ad',
            remainingSeconds,
          },
          { status: 429 }
        );
      }
    }

    // Update user balance
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        coinBalance: {
          increment: AD_REWARD_COINS,
        },
      },
    });

    // Log transaction
    await prisma.coinTransaction.create({
      data: {
        userId,
        amount: AD_REWARD_COINS,
        type: 'AD_REWARD',
        description: 'Watched advertisement',
      },
    });

    // Upsert cooldown record
    await prisma.adCooldown.upsert({
      where: { userId },
      update: { lastAdAt: new Date() },
      create: { userId, lastAdAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      coinsEarned: AD_REWARD_COINS,
      newBalance: user.coinBalance,
    });
  } catch (error) {
    console.error('Ad reward error:', error);
    return NextResponse.json(
      { error: 'Failed to grant reward' },
      { status: 500 }
    );
  }
}
