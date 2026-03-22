import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const redirectTo = searchParams.get('redirectTo') ?? '/';

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/login?error=no_code`);
  }

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

  // Exchange auth code for session
  const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !sessionData?.user) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`);
  }

  const supabaseUser = sessionData.user;
  const provider = supabaseUser.app_metadata?.provider ?? 'unknown';
  const email = supabaseUser.email ?? null;
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
  try {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { supabaseId: supabaseUser.id },
          ...(email ? [{ email }] : []),
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
    } else {
      // New user — create with welcome bonus
      const newUser = await prisma.user.create({
        data: {
          supabaseId: supabaseUser.id,
          // phone is optional for OAuth users — use a placeholder scoped to provider
          phone: supabaseUser.phone ?? null,
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
    }
  } catch (dbError) {
    // Non-fatal — user is authenticated with Supabase, Prisma sync can retry
    console.error('Prisma user sync error:', dbError);
  }

  return supabaseResponse;
}
