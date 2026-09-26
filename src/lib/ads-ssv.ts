import crypto from 'crypto';

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

async function loadKeys(): Promise<KeyMap> {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.keys;
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
    const pem = (await loadKeys())[keyId];
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
