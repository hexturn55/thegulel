import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies, headers } from 'next/headers';

/**
 * Server-side Supabase client for use in API routes and Server Components.
 * Uses service role key when elevated privileges are needed (e.g. DB sync).
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll called from Server Component — safe to ignore
          }
        },
      },
    }
  );
}

/**
 * Resolve the Supabase auth user from EITHER the session cookie (web) or an
 * `Authorization: Bearer <access_token>` header (mobile/native). Returns the
 * Supabase user, or `null` if neither credential is present and valid.
 *
 * This is what lets the same API routes serve the web app (cookie auth) and the
 * Expo app (bearer token from the Supabase session).
 */
export async function getSupabaseUser() {
  // 1. Cookie session (web).
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) return user;

  // 2. Bearer token (mobile).
  const authHeader = (await headers()).get('authorization');
  const token = authHeader?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return null;

  const tokenClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
  const {
    data: { user: tokenUser },
  } = await tokenClient.auth.getUser(token);
  return tokenUser ?? null;
}

/**
 * Admin client with service role key — bypasses RLS.
 * NEVER expose this to the client.
 */
export function createAdminSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
