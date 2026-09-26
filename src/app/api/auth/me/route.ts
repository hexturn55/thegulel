import { NextResponse } from 'next/server';
import { getSupabaseUser } from '@/lib/supabase-server';
import { hasActiveVip } from '@/lib/subscription';
import { syncPrismaUser } from '@/lib/sync-user';

/**
 * GET /api/auth/me
 * Returns the current user's Prisma record (coin balance, etc.)
 * Requires a valid Supabase session (cookie) or bearer token (mobile).
 *
 * A first sign-in that has no Prisma record yet (mobile never goes through the
 * web /auth/callback) creates it here, with the welcome bonus unless the
 * phone/email belongs to a previously deleted account.
 */
export async function GET() {
  const supabaseUser = await getSupabaseUser();

  if (!supabaseUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await syncPrismaUser(supabaseUser);
    const isVip = await hasActiveVip(user.id);

    return NextResponse.json({ ...user, isVip });
  } catch (error) {
    console.error('GET /api/auth/me error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
