import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { exchangeAuthorizationCode, isAppleAuthConfigured } from '@/lib/apple-auth';
import { isMissingTableError } from '@/lib/sync-user';

/**
 * POST /api/auth/apple/link
 * Body: { authorizationCode: string }
 *
 * Called by the iOS app right after Sign in with Apple. Exchanges the one-time
 * authorization code for an Apple refresh token and stores it, so deleting the
 * account can revoke the Apple grant (App Store Guideline 5.1.1(v)).
 *
 * Returns { ok: true } when stored, { ok: false } (200) when storage is not
 * available yet, and 503 { ok: false } when Apple auth is not configured on
 * this server (APPLE_* env vars missing).
 */
export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { authorizationCode?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const code = typeof body.authorizationCode === 'string' ? body.authorizationCode.trim() : '';
  if (!code) {
    return NextResponse.json({ error: 'authorizationCode is required' }, { status: 400 });
  }

  if (!isAppleAuthConfigured()) {
    // A deployment gap, not a client error: surface it in production logs and
    // monitoring (account deletion cannot revoke Apple access without this).
    console.error(
      '[apple-link] Apple auth not configured (APPLE_TEAM_ID / APPLE_KEY_ID / APPLE_PRIVATE_KEY); not storing a refresh token'
    );
    return NextResponse.json(
      { ok: false, error: 'Apple auth not configured' },
      { status: 503 }
    );
  }

  let refreshToken: string | null;
  try {
    refreshToken = await exchangeAuthorizationCode(code);
  } catch (err) {
    console.error('[apple-link] code exchange failed:', err);
    return NextResponse.json(
      { ok: false, error: 'Could not verify Apple authorization code' },
      { status: 400 }
    );
  }
  if (!refreshToken) return NextResponse.json({ ok: false });

  try {
    await prisma.appleCredential.upsert({
      where: { userId: user.id },
      create: { userId: user.id, refreshToken },
      update: { refreshToken },
    });
  } catch (err) {
    if (isMissingTableError(err)) {
      console.warn('[apple-link] AppleCredential table does not exist yet (run mobile_hardening migration)');
      return NextResponse.json({ ok: false });
    }
    console.error('[apple-link] storing refresh token failed:', err);
    return NextResponse.json({ ok: false, error: 'Internal error' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
