/**
 * First-party campaign attribution.
 *
 * Every page load reads the UTM parameters and ad click IDs from the URL and
 * keeps two cookies, each holding compact URL-encoded JSON:
 *   - `gulel_ft` first touch: written once on the first visit, never replaced (90 days)
 *   - `gulel_lt` last touch: replaced whenever the URL carries a UTM or click ID (30 days)
 *
 * Cookies rather than GA's own attribution so the campaign survives in-app
 * browser sessions, reaches the server (checkout metadata → payment webhooks
 * → Conversions API), and can travel as params on our GA4 funnel events.
 *
 * This module is isomorphic: the client helpers touch `document` only when
 * called, and the server helper takes any cookie store with `get()` (a
 * `NextRequest.cookies` or the store returned by `await cookies()`).
 */

export const FIRST_TOUCH_COOKIE = 'gulel_ft';
export const LAST_TOUCH_COOKIE = 'gulel_lt';

const FIRST_TOUCH_MAX_AGE = 90 * 24 * 60 * 60; // seconds
const LAST_TOUCH_MAX_AGE = 30 * 24 * 60 * 60;

export const UTM_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
] as const;
export const CLICK_ID_KEYS = ['fbclid', 'gclid', 'gbraid', 'wbraid'] as const;
export const ATTRIBUTION_KEYS = [...UTM_KEYS, ...CLICK_ID_KEYS] as const;

export type AttributionKey = (typeof ATTRIBUTION_KEYS)[number];

export type Touch = Partial<Record<AttributionKey, string>> & {
  /** When this touch was recorded (ms since epoch). */
  ts: number;
  /** Path the visitor landed on. */
  landing: string;
  /** External referrer host, when there was one. */
  ref?: string;
};

export interface Attribution {
  firstTouch: Touch | null;
  lastTouch: Touch | null;
}

// Click IDs must stay intact (Meta rebuilds `fbc` from the exact fbclid);
// free-text UTMs are capped so the cookie stays well under 4 KB.
const MAX_CLICK_ID = 255;
const MAX_UTM = 100;
const MAX_PATH = 200;
const MAX_COOKIE = 3800;

function isClickId(key: AttributionKey): boolean {
  return (CLICK_ID_KEYS as readonly string[]).includes(key);
}

function clean(key: AttributionKey, value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const v = value.trim();
  if (!v) return undefined;
  return v.slice(0, isClickId(key) ? MAX_CLICK_ID : MAX_UTM);
}

/** Pick the attribution params out of a query string (or URLSearchParams). */
export function attributionFromSearch(
  search: string | URLSearchParams
): Partial<Record<AttributionKey, string>> {
  const params = typeof search === 'string' ? new URLSearchParams(search) : search;
  const out: Partial<Record<AttributionKey, string>> = {};
  for (const key of ATTRIBUTION_KEYS) {
    const v = clean(key, params.get(key));
    if (v) out[key] = v;
  }
  return out;
}

/**
 * Parse a touch cookie value. Tolerates both the raw (URL-encoded) form seen
 * in `document.cookie` and the already-decoded form Next's cookie store
 * returns; anything malformed reads as "no touch".
 */
export function parseTouch(raw: string | undefined | null): Touch | null {
  if (!raw) return null;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    try {
      data = JSON.parse(decodeURIComponent(raw));
    } catch {
      return null;
    }
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  const obj = data as Record<string, unknown>;

  const touch: Touch = {
    ts: typeof obj.ts === 'number' && Number.isFinite(obj.ts) ? obj.ts : 0,
    landing: typeof obj.landing === 'string' ? obj.landing.slice(0, MAX_PATH) : '',
  };
  if (typeof obj.ref === 'string' && obj.ref) touch.ref = obj.ref.slice(0, MAX_PATH);
  for (const key of ATTRIBUTION_KEYS) {
    const v = clean(key, obj[key]);
    if (v) touch[key] = v;
  }
  return touch;
}

function serializeTouch(touch: Touch): string {
  return encodeURIComponent(JSON.stringify(touch));
}

/* ── Server ──────────────────────────────────────────────────────────────── */

interface CookieReader {
  get(name: string): { value: string } | undefined;
}

/** Read both touches from a request's cookies (route handlers, server components). */
export function readAttribution(store: CookieReader): Attribution {
  return {
    firstTouch: parseTouch(store.get(FIRST_TOUCH_COOKIE)?.value),
    lastTouch: parseTouch(store.get(LAST_TOUCH_COOKIE)?.value),
  };
}

/* ── Client ──────────────────────────────────────────────────────────────── */

function readCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  for (const part of document.cookie.split('; ')) {
    const eq = part.indexOf('=');
    if (eq > 0 && part.slice(0, eq) === name) return part.slice(eq + 1);
  }
  return undefined;
}

function writeCookie(name: string, value: string, maxAge: number) {
  if (value.length > MAX_COOKIE) return; // browsers silently reject ~4 KB+ cookies; keep the old one
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${name}=${value}; Max-Age=${maxAge}; Path=/; SameSite=Lax${secure}`;
}

/** Both touches as stored in this browser (client only; empty during SSR). */
export function getAttribution(): Attribution {
  try {
    return {
      firstTouch: parseTouch(readCookie(FIRST_TOUCH_COOKIE)),
      lastTouch: parseTouch(readCookie(LAST_TOUCH_COOKIE)),
    };
  } catch {
    return { firstTouch: null, lastTouch: null };
  }
}

function externalReferrer(): string | undefined {
  try {
    if (!document.referrer) return undefined;
    const host = new URL(document.referrer).host;
    return host && host !== window.location.host ? host : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Record the current URL's attribution. Safe to call on every navigation:
 * first touch is only written when absent, last touch only when the URL
 * actually carries a UTM or click ID.
 */
export function captureAttribution() {
  if (typeof window === 'undefined') return;
  try {
    const params = attributionFromSearch(window.location.search);
    const touch: Touch = {
      ...params,
      ts: Date.now(),
      landing: window.location.pathname.slice(0, MAX_PATH),
    };
    const ref = externalReferrer();
    if (ref) touch.ref = ref;

    const value = serializeTouch(touch);
    if (!readCookie(FIRST_TOUCH_COOKIE)) {
      writeCookie(FIRST_TOUCH_COOKIE, value, FIRST_TOUCH_MAX_AGE);
    }
    if (Object.keys(params).length > 0) {
      writeCookie(LAST_TOUCH_COOKIE, value, LAST_TOUCH_MAX_AGE);
    }
  } catch {
    /* cookies blocked — attribution is best-effort */
  }
}
