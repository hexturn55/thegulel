import { createHash } from 'crypto';
import type { NextRequest } from 'next/server';
import prisma from './prisma';
import { readAttribution } from './attribution';

/**
 * Meta Conversions API — server-side events for the Pixel's dataset.
 *
 * Purchases and subscriptions are confirmed by payment webhooks, which is
 * where these events are sent from. Each carries the same `event_id` as the
 * browser Pixel event (the provider reference used for idempotency, e.g.
 * `stripe:cs_…`), so Meta counts the conversion once while still getting the
 * server's better match data.
 *
 * No-op unless META_CAPI_ACCESS_TOKEN and a pixel id are set. Never throws:
 * failures are logged and the caller carries on.
 */

const GRAPH_VERSION = 'v23.0';
const TIMEOUT_MS = 3000;

export type MetaActionSource = 'website' | 'app' | 'system_generated';

type Contact = string | null | undefined;

export interface MetaUser {
  /** Plain values; normalized and SHA-256 hashed here. */
  email?: Contact | Contact[];
  phone?: Contact | Contact[];
  externalId?: string | null;
  /** Sent as-is (Meta does not want these hashed). */
  fbp?: string | null;
  fbc?: string | null;
  clientIp?: string | null;
  userAgent?: string | null;
  /** App events: Meta SDK anonymous id and device advertising id. */
  anonId?: string | null;
  madid?: string | null;
}

export interface MetaEvent {
  eventName: string;
  eventId: string;
  /** Unix seconds; defaults to now. */
  eventTime?: number;
  value?: number;
  currency?: string;
  contentIds?: string[];
  predictedLtv?: number;
  /** Extra custom_data properties (e.g. last-touch UTMs). */
  custom?: Record<string, string | number | undefined>;
  user: MetaUser;
  eventSourceUrl?: string;
  actionSource: MetaActionSource;
  /** Required by Meta for action_source 'app'. */
  app?: { platform: 'ios' | 'android'; trackingEnabled: boolean };
  /** Test-mode payment: only sent while META_CAPI_TEST_EVENT_CODE is set. */
  test?: boolean;
}

function config() {
  const pixelId = process.env.META_PIXEL_ID || process.env.NEXT_PUBLIC_FB_PIXEL_ID;
  const token = process.env.META_CAPI_ACCESS_TOKEN;
  if (!pixelId || !token) return null;
  return { pixelId, token, testCode: process.env.META_CAPI_TEST_EVENT_CODE || undefined };
}

/**
 * Whether an event would actually be sent. Test-mode payments are kept out of
 * the production dataset unless a test event code routes them to Test Events.
 */
export function metaCapiEnabled(test = false): boolean {
  const c = config();
  return !!c && (!test || !!c.testCode);
}

const sha256 = (v: string) => createHash('sha256').update(v).digest('hex');

function hashAll(values: Contact | Contact[], normalize: (v: string) => string | undefined) {
  const list = Array.isArray(values) ? values : [values];
  const hashed = new Set<string>();
  for (const raw of list) {
    const v = raw ? normalize(raw) : undefined;
    if (v) hashed.add(sha256(v));
  }
  return hashed.size ? [...hashed] : undefined;
}

const normalizeEmail = (v: string) => {
  const e = v.trim().toLowerCase();
  return e.includes('@') ? e : undefined;
};

// Digits only, country code included, no leading zeros (Meta's normalization).
const normalizePhone = (v: string) => {
  const d = v.replace(/\D/g, '').replace(/^0+/, '');
  return d.length >= 7 ? d : undefined;
};

/** Drop empty fields — Meta rejects some keys when present but empty. */
function compact<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && v !== '')
  ) as Partial<T>;
}

export async function sendMetaEvent(event: MetaEvent): Promise<boolean> {
  const c = config();
  if (!c || (event.test && !c.testCode)) return false;

  try {
    const u = event.user;
    const externalId = u.externalId?.trim();
    const contentIds = event.contentIds?.filter((id) => typeof id === 'string' && id);
    const hasContent = !!contentIds?.length;

    const data = compact({
      event_name: event.eventName,
      event_time: event.eventTime ?? Math.floor(Date.now() / 1000),
      event_id: event.eventId,
      action_source: event.actionSource,
      event_source_url: event.eventSourceUrl,
      user_data: compact({
        em: hashAll(u.email, normalizeEmail),
        ph: hashAll(u.phone, normalizePhone),
        external_id: externalId ? [sha256(externalId)] : undefined,
        fbp: u.fbp,
        fbc: u.fbc,
        client_ip_address: u.clientIp,
        client_user_agent: u.userAgent,
        anon_id: u.anonId,
        madid: u.madid,
      }),
      custom_data: compact({
        ...event.custom,
        value: event.value,
        currency: event.currency?.toUpperCase(),
        content_ids: hasContent ? contentIds : undefined,
        content_type: hasContent ? 'product' : undefined,
        predicted_ltv: event.predictedLtv,
      }),
      app_data:
        event.actionSource === 'app' && event.app
          ? {
              advertiser_tracking_enabled: event.app.trackingEnabled ? 1 : 0,
              application_tracking_enabled: event.app.trackingEnabled ? 1 : 0,
              // 16-slot device info array; only the platform version tag is known server-side.
              extinfo: [event.app.platform === 'ios' ? 'i2' : 'a2', ...Array<string>(15).fill('')],
            }
          : undefined,
    });

    const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${c.pixelId}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: [data],
        access_token: c.token,
        ...(c.testCode ? { test_event_code: c.testCode } : {}),
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) {
      const detail = (await res.text().catch(() => '')).slice(0, 300);
      console.error(`[meta-capi] ${event.eventName} ${event.eventId} rejected (${res.status}): ${detail}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`[meta-capi] ${event.eventName} ${event.eventId} failed:`, err);
    return false;
  }
}

/* ── Browser signals carried through checkout ────────────────────────────── */

/**
 * The webhook request comes from the payment provider, not the viewer, so
 * the viewer's Meta cookies, IP, user agent and last-touch UTMs are captured
 * when checkout is created and ride along in the provider's metadata.
 */
const SIGNAL_KEYS = [
  'fbp',
  'fbc',
  'ip',
  'ua',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
] as const;

type SignalKey = (typeof SIGNAL_KEYS)[number];
export type CheckoutSignals = Partial<Record<SignalKey, string>>;

// A truncated cookie value is wrong data, so these are dropped rather than cut.
const EXACT_SIGNALS: SignalKey[] = ['fbp', 'fbc'];

function clientIp(headers: Headers): string | undefined {
  const ip =
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip')?.trim();
  return ip && ip.length <= 45 ? ip : undefined;
}

/**
 * Snapshot for provider metadata. `maxLen` is the provider's per-value limit
 * (Stripe metadata: 500 chars, Razorpay notes: 256).
 */
export function captureCheckoutSignals(request: NextRequest, maxLen: number): CheckoutSignals {
  const { lastTouch } = readAttribution(request.cookies);
  const fbclid = lastTouch?.fbclid;
  const raw: Record<SignalKey, string | undefined> = {
    fbp: request.cookies.get('_fbp')?.value,
    // The Pixel writes _fbc itself when it sees an fbclid; if it couldn't
    // (blocked, or the tap happened before it loaded), rebuild it from our
    // last-touch cookie in Meta's `fb.1.<ms>.<fbclid>` format.
    fbc:
      request.cookies.get('_fbc')?.value ||
      (fbclid ? `fb.1.${lastTouch?.ts || Date.now()}.${fbclid}` : undefined),
    ip: clientIp(request.headers),
    ua: request.headers.get('user-agent') ?? undefined,
    utm_source: lastTouch?.utm_source,
    utm_medium: lastTouch?.utm_medium,
    utm_campaign: lastTouch?.utm_campaign,
    utm_content: lastTouch?.utm_content,
  };

  const out: CheckoutSignals = {};
  for (const key of SIGNAL_KEYS) {
    const v = raw[key]?.trim();
    if (!v) continue;
    if (v.length > maxLen && EXACT_SIGNALS.includes(key)) continue;
    out[key] = v.slice(0, maxLen);
  }
  return out;
}

/** Read the signals back out of Stripe metadata / Razorpay notes. */
export function checkoutSignalsFrom(meta: Record<string, unknown> | null | undefined): CheckoutSignals {
  const out: CheckoutSignals = {};
  if (!meta) return out;
  for (const key of SIGNAL_KEYS) {
    const v = meta[key];
    if (typeof v === 'string' && v) out[key] = v;
  }
  return out;
}

/**
 * Purchase / Subscribe for a web checkout, sent from its payment webhook.
 * Adds the account's email/phone (hashed) to whatever the provider collected.
 */
export async function sendCheckoutEvent(args: {
  eventName: 'Purchase' | 'Subscribe';
  eventId: string;
  eventTime?: number;
  userId: string;
  metadata: Record<string, unknown> | null | undefined;
  contact?: { email?: string | null; phone?: string | null };
  value: number;
  currency: string;
  contentIds: string[];
  predictedLtv?: number;
  /** Page the checkout started from, e.g. '/wallet'. */
  path: string;
  test?: boolean;
}): Promise<boolean> {
  if (!metaCapiEnabled(args.test)) return false;

  const signals = checkoutSignalsFrom(args.metadata);
  let account: { email: string | null; phone: string | null } | null = null;
  try {
    account = await prisma.user.findUnique({
      where: { id: args.userId },
      select: { email: true, phone: true },
    });
  } catch (err) {
    console.error('[meta-capi] user lookup failed:', err);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  return sendMetaEvent({
    eventName: args.eventName,
    eventId: args.eventId,
    eventTime: args.eventTime,
    value: args.value,
    currency: args.currency,
    contentIds: args.contentIds,
    predictedLtv: args.predictedLtv,
    custom: {
      utm_source: signals.utm_source,
      utm_medium: signals.utm_medium,
      utm_campaign: signals.utm_campaign,
      utm_content: signals.utm_content,
    },
    user: {
      email: [args.contact?.email, account?.email],
      phone: [args.contact?.phone, account?.phone],
      externalId: args.userId,
      fbp: signals.fbp,
      fbc: signals.fbc,
      clientIp: signals.ip,
      userAgent: signals.ua,
    },
    eventSourceUrl: appUrl ? `${appUrl}${args.path}` : undefined,
    // Website events require the browser's user agent; without it (an older
    // checkout, or metadata that didn't make it) report it as server-generated.
    actionSource: signals.ua ? 'website' : 'system_generated',
    test: args.test,
  });
}
