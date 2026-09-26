import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import type { User } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { AUTH_EVENT_COOKIE } from '@/lib/analytics';
import { supabaseUserWhere, syncPrismaUser } from '@/lib/sync-user';

export async function GET(request: NextRequest) {
  const { searchParams, origin, protocol } = new URL(request.url);
  const code = searchParams.get('code');
  // Only same-origin paths: "@evil.com" or "//evil.com" would otherwise turn
  // `${origin}${redirectTo}` into an open redirect.
  const requested = searchParams.get('redirectTo') ?? '/';
  const redirectTo =
    requested.startsWith('/') && !requested.startsWith('//') && !requested.startsWith('/\\')
      ? requested
      : '/';

  const cookieStore = await cookies();
  let supabaseResponse = NextResponse.redirect(`${origin}${redirectTo}`);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
          supabaseResponse = NextResponse.redirect(`${origin}${redirectTo}`);
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  let supabaseUser: User;
  if (code) {
    // OAuth: exchange auth code for session
    const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error || !sessionData?.user) {
      console.error('OAuth callback error:', error);
      return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`);
    }
    supabaseUser = sessionData.user;
  } else {
    // Phone OTP is verified in the browser, which already holds the session;
    // it comes here without a code just for the DB sync.
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      return NextResponse.redirect(`${origin}/auth/login?error=no_code`);
    }
    supabaseUser = data.user;
  }
  const provider = supabaseUser.app_metadata?.provider ?? 'unknown';

  // Sync Supabase auth user → Prisma User. New users get the welcome bonus
  // (unless their phone/email belongs to a deleted account); existing users
  // get their profile refreshed from the provider.
  let authEvent: 'sign_up' | 'login' | null = null;
  let userId: string | null = null;
  try {
    // This is the first server hit after sign-in, so "no record yet" means a
    // brand-new account.
    const existed = await prisma.user.findFirst({
      where: supabaseUserWhere(supabaseUser),
      select: { id: true },
    });
    const user = await syncPrismaUser(supabaseUser, { provider, refreshProfile: true });
    authEvent = existed ? 'login' : 'sign_up';
    userId = user.id;
  } catch (dbError) {
    // Non-fatal — user is authenticated with Supabase, Prisma sync can retry
    // (GET /api/auth/me and getAuthUser() sync on demand).
    console.error('Prisma user sync error:', dbError);
  }

  // Hand "new vs returning" to the next page load, which reports GA4
  // sign_up / login (+ Meta CompleteRegistration) and clears the cookie.
  if (authEvent && userId) {
    supabaseResponse.cookies.set(AUTH_EVENT_COOKIE, `${authEvent}.${provider}.${userId}`, {
      path: '/',
      maxAge: 300,
      sameSite: 'lax',
      secure: protocol === 'https:',
    });
  }

  return supabaseResponse;
}
