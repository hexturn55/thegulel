import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { syncPrismaUser } from '@/lib/sync-user';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // Only same-origin paths: "@evil.com" or "//evil.com" would otherwise turn
  // `${origin}${redirectTo}` into an open redirect.
  const requested = searchParams.get('redirectTo') ?? '/';
  const redirectTo =
    requested.startsWith('/') && !requested.startsWith('//') && !requested.startsWith('/\\')
      ? requested
      : '/';

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

  // Sync Supabase auth user → Prisma User. New users get the welcome bonus
  // (unless their phone/email belongs to a deleted account); existing users
  // get their profile refreshed from the provider.
  try {
    await syncPrismaUser(sessionData.user, {
      provider: sessionData.user.app_metadata?.provider ?? 'unknown',
      refreshProfile: true,
    });
  } catch (dbError) {
    // Non-fatal — user is authenticated with Supabase, Prisma sync can retry
    // (GET /api/auth/me and getAuthUser() sync on demand).
    console.error('Prisma user sync error:', dbError);
  }

  return supabaseResponse;
}
