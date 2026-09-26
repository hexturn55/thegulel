import crypto from 'crypto';
import prisma from '@/lib/prisma';

/**
 * Verification for Google rewarded-ads **Server-Side Verification (SSV)**.
 *
 * When a user finishes a rewarded ad, Google's servers call our callback with
 * the reward details plus a `signature`/`key_id`. We verify that signature
 * against Google's public reward-verifier keys, so the reward can ONLY be
 * granted by Google — never by a client claiming "I watched an ad".
 *
 * Keys + scheme: https://developers.google.com/admob/android/rewarded-video-ssv
 * (the same verifier keys cover AdMob and Ad Manager / IMA rewarded SSV).
 */
const VERIFIER_KEYS_URL =
  'https://www.gstatic.com/admob/reward/verifier-keys.json';

type KeyMap = Record<string, string>; // keyId -> PEM public key
let cache: { at: number; keys: KeyMap } | null = null;
const CACHE_TTL_MS = 12 * 60 * 60 * 1000;
// Google rotates verifier keys; an unknown key_id triggers one early refetch,
// but at most once per minute process-wide so forged key_ids can't turn this
// endpoint into a gstatic request amplifier.
const FORCED_REFRESH_MIN_INTERVAL_MS = 60 * 1000;
let lastForcedRefreshAt = 0;

async function fetchKeys(): Promise<KeyMap> {
  const res = await fetch(VERIFIER_KEYS_URL, { cache: 'no-store' });
  if (!res.ok) throw new Error(`verifier keys fetch failed: ${res.status}`);
  const data = (await res.json()) as {
    keys: Array<{ keyId: number; pem: string }>;
  };
  const keys: KeyMap = {};
  for (const k of data.keys) keys[String(k.keyId)] = k.pem;
  cache = { at: Date.now(), keys };
  return keys;
}

async function loadKeys(): Promise<KeyMap> {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.keys;
  return fetchKeys();
}

/** PEM for a key id, refetching the key set once (rate-limited) if unknown. */
async function getKeyPem(keyId: string): Promise<string | undefined> {
  const pem = (await loadKeys())[keyId];
  if (pem) return pem;
  const now = Date.now();
  if (now - lastForcedRefreshAt < FORCED_REFRESH_MIN_INTERVAL_MS) return undefined;
  lastForcedRefreshAt = now;
  return (await fetchKeys())[keyId];
}

/**
 * Verify an SSV callback. `rawQuery` is the request query string WITHOUT the
 * leading `?`. The signed content is everything up to (not including)
 * `&signature=` — `signature` and `key_id` are always the final two params.
 * Returns true only if the ECDSA signature checks out. Fails closed.
 */
export async function verifyAdSsv(rawQuery: string): Promise<boolean> {
  const sigIdx = rawQuery.indexOf('&signature=');
  if (sigIdx === -1) return false;

  const content = rawQuery.slice(0, sigIdx);
  const tail = new URLSearchParams(rawQuery.slice(sigIdx + 1));
  const signature = tail.get('signature');
  const keyId = tail.get('key_id');
  if (!signature || !keyId) return false;

  try {
    const pem = await getKeyPem(keyId);
    if (!pem) return false;
    const verifier = crypto.createVerify('SHA256');
    verifier.update(content);
    verifier.end();
    // Google signs with ECDSA (DER) and base64url-encodes the signature.
    return verifier.verify(pem, Buffer.from(signature, 'base64url'));
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Rewarded-ad limits, shared by the SSV callback (/api/ads/ssv) and the
// eligibility endpoint (/api/ads/status) so both agree on the rules.
// ---------------------------------------------------------------------------

/** Coins granted per verified rewarded ad. */
export const AD_REWARD_COINS = 5;
/** Minimum time between rewarded grants for one user. */
export const AD_COOLDOWN_MS = 60 * 1000;
const DEFAULT_DAILY_CAP = 10;

/** Max rewarded grants per user per UTC day (env ADS_DAILY_CAP, default 10). */
export function adsDailyCap(): number {
  const n = Number(process.env.ADS_DAILY_CAP ?? DEFAULT_DAILY_CAP);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : DEFAULT_DAILY_CAP;
}

/** Start of the current UTC day. */
export function startOfUtcDay(now = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export interface AdLimitState {
  /** ms until the cooldown ends (0 when not cooling down). */
  cooldownRemainingMs: number;
  /** AD_REWARD grants since UTC midnight. */
  todayCount: number;
  dailyCap: number;
}

/** Current cooldown and daily-cap usage for a user. */
export async function getAdLimitState(userId: string): Promise<AdLimitState> {
  const [cooldown, todayCount] = await Promise.all([
    prisma.adCooldown.findUnique({ where: { userId }, select: { lastAdAt: true } }),
    prisma.coinTransaction.count({
      where: { userId, type: 'AD_REWARD', createdAt: { gte: startOfUtcDay() } },
    }),
  ]);
  const elapsed = cooldown ? Date.now() - cooldown.lastAdAt.getTime() : Infinity;
  return {
    cooldownRemainingMs: Math.max(0, AD_COOLDOWN_MS - elapsed),
    todayCount,
    dailyCap: adsDailyCap(),
  };
}
