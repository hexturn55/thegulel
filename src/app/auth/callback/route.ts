import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import type { User } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { AUTH_EVENT_COOKIE } from '@/lib/analytics';

export async function GET(request: NextRequest) {
  const { searchParams, origin, protocol } = new URL(request.url);
  const code = searchParams.get('code');
  // Same-origin paths only — never bounce to another host after sign-in.
  const requested = searchParams.get('redirectTo') ?? '/';
  const redirectTo = requested.startsWith('/') ? requested : '/';

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
  // Supabase reports a missing email/phone as "" — store null, or the second
  // such user collides on the unique column.
  const email = supabaseUser.email || null;
  const name =
    supabaseUser.user_metadata?.full_name ??
    supabaseUser.user_metadata?.name ??
    supabaseUser.user_metadata?.user_name ??
    null;
  const avatar =
    supabaseUser.user_metadata?.avatar_url ??
    supabaseUser.user_metadata?.picture ??
    null;

  // Sync Supabase auth user → Prisma User
  let authEvent: 'sign_up' | 'login' | null = null;
  let userId: string | null = null;
  try {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { supabaseId: supabaseUser.id },
          ...(email ? [{ email }] : []),
          ...(supabaseUser.phone ? [{ phone: supabaseUser.phone }] : []),
        ],
      },
    });

    if (existingUser) {
      // Update existing user with latest data from provider
      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          supabaseId: supabaseUser.id,
          email: email ?? existingUser.email,
          name: name ?? existingUser.name,
          avatar: avatar ?? existingUser.avatar,
          provider: provider,
        },
      });
      authEvent = 'login';
      userId = existingUser.id;
    } else {
      // New user — create with welcome bonus
      const newUser = await prisma.user.create({
        data: {
          supabaseId: supabaseUser.id,
          // phone is optional for OAuth users — use a placeholder scoped to provider
          phone: supabaseUser.phone || null,
          email,
          name,
          avatar,
          locale: supabaseUser.user_metadata?.locale ?? 'en',
          provider: provider,
          coinBalance: 50, // Welcome bonus
        },
      });

      // Log welcome bonus
      await prisma.coinTransaction.create({
        data: {
          userId: newUser.id,
          amount: 50,
          type: 'BONUS',
          description: 'Welcome bonus',
        },
      });
      authEvent = 'sign_up';
      userId = newUser.id;
    }
  } catch (dbError) {
    // Non-fatal — user is authenticated with Supabase, Prisma sync can retry
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
