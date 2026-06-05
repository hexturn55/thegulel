import { createServerSupabaseClient } from './supabase-server';
import prisma from './prisma';

/**
 * Resolve the current request's authenticated user from the Supabase session
 * and return the matching Prisma `User` record (or `null` if unauthenticated).
 *
 * This is the single source of truth for "who is calling" in API routes.
 * Auth is carried by Supabase session cookies (`sb-*`), set by the OAuth
 * callback and client-side OTP verification — there is NO separate `userId`
 * cookie.
 */
export async function getAuthUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user: supabaseUser },
  } = await supabase.auth.getUser();

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
