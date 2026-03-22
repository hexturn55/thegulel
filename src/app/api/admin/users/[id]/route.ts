import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      avatar: true,
      coinBalance: true,
      role: true,
      banned: true,
      banReason: true,
      provider: true,
      locale: true,
      createdAt: true,
      lastLoginAt: true,
      coinTransactions: {
        orderBy: { createdAt: 'desc' },
        take: 50,
      },
      _count: {
        select: {
          watchHistory: true,
          episodePurchases: true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({ user });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  try {
    const body = await request.json();
    const { coinAdjustment, banned, banReason, role } = body;

    const updateData: Record<string, unknown> = {};

    if (typeof banned === 'boolean') {
      updateData.banned = banned;
      if (banned && banReason) {
        updateData.banReason = banReason;
      } else if (!banned) {
        updateData.banReason = null;
      }
    }

    if (role && ['user', 'admin', 'superadmin'].includes(role)) {
      updateData.role = role;
    }

    if (typeof coinAdjustment === 'number' && coinAdjustment !== 0) {
      updateData.coinBalance = { increment: coinAdjustment };
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    // Log coin adjustment as transaction if applicable
    if (typeof coinAdjustment === 'number' && coinAdjustment !== 0) {
      await prisma.coinTransaction.create({
        data: {
          userId: id,
          amount: coinAdjustment,
          type: 'BONUS',
          description: `Admin adjustment by ${admin.id}`,
        },
      });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
