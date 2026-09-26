import { getSupabaseUser } from './supabase-server';
import prisma from './prisma';
import { supabaseUserWhere, syncPrismaUser } from './sync-user';

/**
 * Resolve the current request's authenticated user and return the matching
 * Prisma `User` record (or `null` if unauthenticated).
 *
 * This is the single source of truth for "who is calling" in API routes.
 * Auth is resolved from EITHER the Supabase session cookie (web) or an
 * `Authorization: Bearer <token>` header (mobile) — see `getSupabaseUser`.
 *
 * A signed-in Supabase user with no Prisma record yet (e.g. a mobile sign-in
 * that has not called /api/auth/me) is synced on the spot, so every route
 * sees the same user the welcome-bonus/tombstone logic created.
 */
export async function getAuthUser() {
  const supabaseUser = await getSupabaseUser();
  if (!supabaseUser) return null;

  const user = await prisma.user.findFirst({ where: supabaseUserWhere(supabaseUser) });
  if (user) return user;

  try {
    const synced = await syncPrismaUser(supabaseUser);
    return prisma.user.findUnique({ where: { id: synced.id } });
  } catch (err) {
    console.error('getAuthUser: Prisma user sync failed:', err);
    return null;
  }
}
