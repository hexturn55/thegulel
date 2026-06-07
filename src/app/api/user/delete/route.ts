import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseUser } from '@/lib/supabase-server';
import prisma from '@/lib/prisma';

/**
 * POST /api/user/delete
 * Permanently deletes the current user's account and all associated data.
 *
 * Body: { confirmation: "DELETE" }
 *
 * Deletes (in order): watch history, coin transactions, episode purchases,
 * subscriptions, and the user record itself. Then signs out of Supabase.
 * Does NOT delete the Supabase Auth user (requires admin API).
 */
export async function POST(request: NextRequest) {
  const supabaseUser = await getSupabaseUser();

  if (!supabaseUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { confirmation?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (body.confirmation !== 'DELETE') {
    return NextResponse.json(
      { error: 'Confirmation required. Send { confirmation: "DELETE" }' },
      { status: 400 }
    );
  }

  try {
    const dbUser = await prisma.user.findFirst({
      where: {
        OR: [
          { supabaseId: supabaseUser.id },
          ...(supabaseUser.email ? [{ email: supabaseUser.email }] : []),
          ...(supabaseUser.phone ? [{ phone: supabaseUser.phone }] : []),
        ],
      },
      select: { id: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userId = dbUser.id;

    // Delete all related data first (Cascade handles most, but be explicit)
    await prisma.$transaction([
      prisma.watchHistory.deleteMany({ where: { userId } }),
      prisma.coinTransaction.deleteMany({ where: { userId } }),
      prisma.episodePurchase.deleteMany({ where: { userId } }),
      prisma.subscription.deleteMany({ where: { userId } }),
      prisma.user.delete({ where: { id: userId } }),
    ]);

    // Sign out from Supabase (best effort — clears the web cookie session if
    // present; mobile clients clear their own session locally).
    try {
      const supabase = await createServerSupabaseClient();
      await supabase.auth.signOut();
    } catch {
      // no cookie session (e.g. bearer-token caller) — nothing to sign out
    }

    return NextResponse.json({ success: true, message: 'Account deleted.' });
  } catch (error) {
    console.error('POST /api/user/delete error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
