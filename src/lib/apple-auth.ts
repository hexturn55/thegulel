import { sign } from 'node:crypto';

/**
 * Sign in with Apple server-side token handling.
 *
 * App Store Guideline 5.1.1(v): an app offering Sign in with Apple must revoke
 * the user's Apple tokens when they delete their account. To do that we keep
 * the refresh token obtained by exchanging the authorization code the app
 * receives at sign-in, and call Apple's /auth/revoke on deletion.
 *
 * Env:
 *   APPLE_TEAM_ID      Apple Developer team ID (JWT `iss`)
 *   APPLE_KEY_ID       Sign in with Apple key ID (JWT header `kid`)
 *   APPLE_PRIVATE_KEY  the .p8 key contents (PEM; literal "\n" allowed)
 *   APPLE_CLIENT_ID    optional, defaults to the iOS bundle ID com.gulel.app
 *
 * When the required env vars are unset everything logs a warning and no-ops.
 */

const APPLE_TOKEN_URL = 'https://appleid.apple.com/auth/token';
const APPLE_REVOKE_URL = 'https://appleid.apple.com/auth/revoke';
const DEFAULT_CLIENT_ID = 'com.gulel.app';

interface AppleConfig {
  teamId: string;
  keyId: string;
  privateKey: string;
  clientId: string;
}

function getAppleConfig(): AppleConfig | null {
  const teamId = process.env.APPLE_TEAM_ID;
  const keyId = process.env.APPLE_KEY_ID;
  const privateKey = process.env.APPLE_PRIVATE_KEY;
  if (!teamId || !keyId || !privateKey) return null;
  return {
    teamId,
    keyId,
    privateKey: privateKey.replace(/\\n/g, '\n'),
    clientId: process.env.APPLE_CLIENT_ID || DEFAULT_CLIENT_ID,
  };
}

export function isAppleAuthConfigured(): boolean {
  return getAppleConfig() !== null;
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64url');
}

/** ES256 client-secret JWT for Apple's token/revoke endpoints (valid 5 min). */
function createClientSecret(config: AppleConfig): string {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'ES256', kid: config.keyId };
  const claims = {
    iss: config.teamId,
    iat: now,
    exp: now + 5 * 60,
    aud: 'https://appleid.apple.com',
    sub: config.clientId,
  };
  const signingInput = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(claims))}`;
  const signature = sign('sha256', Buffer.from(signingInput), {
    key: config.privateKey,
    dsaEncoding: 'ieee-p1363',
  });
  return `${signingInput}.${base64url(signature)}`;
}

/**
 * Exchange a Sign in with Apple authorization code for a refresh token.
 * Returns null when Apple auth is not configured; throws when Apple rejects
 * the code or returns no refresh token.
 */
export async function exchangeAuthorizationCode(code: string): Promise<string | null> {
  const config = getAppleConfig();
  if (!config) {
    console.warn('[apple-auth] APPLE_TEAM_ID/APPLE_KEY_ID/APPLE_PRIVATE_KEY not set; skipping code exchange');
    return null;
  }

  const res = await fetch(APPLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: createClientSecret(config),
      code,
      grant_type: 'authorization_code',
    }),
    cache: 'no-store',
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Apple token exchange failed (${res.status}): ${detail.slice(0, 200)}`);
  }

  const data = (await res.json()) as { refresh_token?: string };
  if (!data.refresh_token) {
    throw new Error('Apple token exchange returned no refresh_token');
  }
  return data.refresh_token;
}

/**
 * Revoke a Sign in with Apple refresh token. Returns true on success, false
 * when not configured or Apple refused. Never throws.
 */
export async function revokeAppleToken(refreshToken: string): Promise<boolean> {
  const config = getAppleConfig();
  if (!config) {
    console.warn('[apple-auth] APPLE_TEAM_ID/APPLE_KEY_ID/APPLE_PRIVATE_KEY not set; skipping token revocation');
    return false;
  }

  try {
    const res = await fetch(APPLE_REVOKE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: createClientSecret(config),
        token: refreshToken,
        token_type_hint: 'refresh_token',
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      console.error(`[apple-auth] revoke failed (${res.status}): ${detail.slice(0, 200)}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[apple-auth] revoke error:', err);
    return false;
  }
}
