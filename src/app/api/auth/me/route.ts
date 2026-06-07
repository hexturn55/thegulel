import { NextResponse } from 'next/server';
import { getSupabaseUser } from '@/lib/supabase-server';
import prisma from '@/lib/prisma';
import { hasActiveVip } from '@/lib/subscription';

/**
 * GET /api/auth/me
 * Returns the current user's Prisma record (coin balance, etc.)
 * Requires a valid Supabase session (cookie) or bearer token (mobile).
 */
export async function GET() {
  const supabaseUser = await getSupabaseUser();

  if (!supabaseUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { supabaseId: supabaseUser.id },
          ...(supabaseUser.email ? [{ email: supabaseUser.email }] : []),
          ...(supabaseUser.phone ? [{ phone: supabaseUser.phone }] : []),
        ],
      },
      select: {
        id: true,
        phone: true,
        email: true,
        name: true,
        avatar: true,
        locale: true,
        provider: true,
        coinBalance: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const isVip = await hasActiveVip(user.id);

    return NextResponse.json({ ...user, isVip });
  } catch (error) {
    console.error('GET /api/auth/me error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
