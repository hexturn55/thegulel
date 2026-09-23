import crypto from 'crypto';

/**
 * Demo-mode rewarded ads (no real ad unit configured yet).
 *
 * Google's SSV can't vouch for a sample ad, so the server bounds what a
 * client can claim instead: a signed, single-use ad-session token is issued
 * when the ad starts, and a reward is only accepted for that token after the
 * ad could plausibly have finished, subject to a cooldown and a daily cap.
 * Worst-case abuse is DEMO_DAILY_CAP x DEMO_REWARD_COINS coins per account
 * per day. Once NEXT_PUBLIC_IMA_REWARDED_AD_TAG_URL is set, these endpoints
 * shut off and only Google-verified rewards (/api/ads/ssv) grant coins.
 */
export const DEMO_REWARD_COINS = 5;
export const DEMO_DAILY_CAP = 3;
export const DEMO_COOLDOWN_MS = 60_000;
export const DEMO_MIN_WATCH_MS = 8_000;
const TOKEN_TTL_MS = 15 * 60_000;

export function demoAdsEnabled(): boolean {
  return !process.env.NEXT_PUBLIC_IMA_REWARDED_AD_TAG_URL && !!process.env.JWT_SECRET;
}

function sign(payload: string): string {
  return crypto
    .createHmac('sha256', process.env.JWT_SECRET as string)
    .update(payload)
    .digest('base64url');
}

export function issueAdToken(userId: string): string {
  const payload = Buffer.from(
    JSON.stringify({ u: userId, n: crypto.randomUUID(), t: Date.now() })
  ).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

export type AdTokenCheck =
  | { ok: true; nonce: string }
  | { ok: false; reason: 'invalid' | 'too_early' | 'expired' };

export function checkAdToken(token: string, userId: string): AdTokenCheck {
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return { ok: false, reason: 'invalid' };
  const expected = Buffer.from(sign(payload));
  const got = Buffer.from(sig);
  if (expected.length !== got.length || !crypto.timingSafeEqual(expected, got)) {
    return { ok: false, reason: 'invalid' };
  }
  let data: { u: string; n: string; t: number };
  try {
    data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch {
    return { ok: false, reason: 'invalid' };
  }
  if (data.u !== userId) return { ok: false, reason: 'invalid' };
  const age = Date.now() - data.t;
  if (age < DEMO_MIN_WATCH_MS) return { ok: false, reason: 'too_early' };
  if (age > TOKEN_TTL_MS) return { ok: false, reason: 'expired' };
  return { ok: true, nonce: data.n };
}
