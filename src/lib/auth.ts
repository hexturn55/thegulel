import { getSupabaseUser } from './supabase-server';
import prisma from './prisma';

/**
 * Resolve the current request's authenticated user and return the matching
 * Prisma `User` record (or `null` if unauthenticated).
 *
 * This is the single source of truth for "who is calling" in API routes.
 * Auth is resolved from EITHER the Supabase session cookie (web) or an
 * `Authorization: Bearer <token>` header (mobile) — see `getSupabaseUser`.
 */
export async function getAuthUser() {
  const supabaseUser = await getSupabaseUser();
  if (!supabaseUser) return null;

  return prisma.user.findFirst({
    where: {
      OR: [
        { supabaseId: supabaseUser.id },
        ...(supabaseUser.email ? [{ email: supabaseUser.email }] : []),
        ...(supabaseUser.phone ? [{ phone: supabaseUser.phone }] : []),
      ],
    },
  });
}
