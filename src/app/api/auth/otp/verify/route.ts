import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import prisma from '@/lib/prisma';

/**
 * POST /api/auth/otp/verify
 *
 * Legacy server-side verify. The login page now uses supabase.auth.verifyOtp()
 * directly on the client, then redirects to /auth/callback for DB sync.
 *
 * This route handles cases where verification + DB sync need to happen server-side.
 */
export async function POST(request: NextRequest) {
  try {
    const { phone, token } = await request.json();

    if (!phone || !token) {
      return NextResponse.json(
        { error: 'Phone and token are required' },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    // Verify OTP with Supabase
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms',
    });

    if (error || !data.user) {
      return NextResponse.json(
        { error: error?.message ?? 'Invalid or expired code' },
        { status: 400 }
      );
    }

    const supabaseUser = data.user;

    // Find or create Prisma user
    let user = await prisma.user.findFirst({
      where: {
        OR: [{ supabaseId: supabaseUser.id }, { phone }],
      },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          supabaseId: supabaseUser.id,
          phone,
          provider: 'phone',
          coinBalance: 50,
        },
      });

      await prisma.coinTransaction.create({
        data: {
          userId: user.id,
          amount: 50,
          type: 'BONUS',
          description: 'Welcome bonus',
        },
      });
    } else if (!user.supabaseId) {
      // Backfill supabaseId for legacy users
      user = await prisma.user.update({
        where: { id: user.id },
        data: { supabaseId: supabaseUser.id, provider: 'phone' },
      });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        locale: user.locale,
        provider: user.provider,
        coinBalance: user.coinBalance,
      },
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json({ error: 'Failed to verify OTP' }, { status: 500 });
  }
}
