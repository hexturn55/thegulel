import { getAttribution } from './attribution';

type Params = Record<string, unknown>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

/** Drop empty values so neither tag receives literal `undefined`s. */
function compact(params?: Params): Params | undefined {
  if (!params) return undefined;
  return Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null));
}

// The tag snippets load after hydration, so an event fired from a mount effect
// on a fresh page load can run before gtag/fbq exist. Such events wait here
// (in order) and are retried for a few seconds — only for tags that are
// actually configured, so an unconfigured tag never queues anything.
const GA_CONFIGURED = !!process.env.NEXT_PUBLIC_GA_ID;
const PIXEL_CONFIGURED = !!process.env.NEXT_PUBLIC_FB_PIXEL_ID;
const RETRY_MS = 250;
const MAX_RETRIES = 40;

const pending: Array<() => boolean> = [];
let retryTimer: ReturnType<typeof setTimeout> | null = null;
let retries = 0;

function retryPending() {
  const still = pending.filter((send) => !send());
  pending.length = 0;
  if (still.length && ++retries < MAX_RETRIES) {
    pending.push(...still);
    retryTimer = setTimeout(retryPending, RETRY_MS);
  } else {
    retryTimer = null;
    retries = 0;
  }
}

/** Run `send` now, or queue it while its tag is still loading. */
function deliver(send: () => boolean) {
  if (pending.length === 0 && send()) return;
  pending.push(send);
  if (!retryTimer) retryTimer = setTimeout(retryPending, RETRY_MS);
}

// Analytics must never break the app: every call into a third-party global
// is guarded and swallowed.
function gtagEvent(name: string, params?: Params) {
  const payload = compact(params);
  deliver(() => {
    if (!window.gtag) return !GA_CONFIGURED;
    try {
      window.gtag('event', name, payload);
    } catch {
      /* ignore */
    }
    return true;
  });
}

function fbqEvent(
  kind: 'track' | 'trackCustom',
  name: string,
  params?: Params,
  eventId?: string
) {
  const payload = compact(params);
  deliver(() => {
    if (!window.fbq) return !PIXEL_CONFIGURED;
    try {
      // The eventID lets Meta deduplicate this browser event against the
      // server-side Conversions API event carrying the same event_id.
      if (eventId) window.fbq(kind, name, payload ?? {}, { eventID: eventId });
      else window.fbq(kind, name, payload);
    } catch {
      /* ignore */
    }
    return true;
  });
}

// Custom event tracking for GA4 + FB Pixel
export function trackEvent(eventName: string, params?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  gtagEvent(eventName, params);
  fbqEvent('trackCustom', eventName, params);
}

/* ── Funnel plumbing ─────────────────────────────────────────────────────── */

function newEventId(): string {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  } catch {
    /* insecure context */
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

const CAMPAIGN_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'] as const;

/** Last-touch UTMs as GA4 event params, so explorations can slice by campaign. */
function campaignParams(): Params {
  const lastTouch = getAttribution().lastTouch;
  const out: Params = {};
  for (const key of CAMPAIGN_KEYS) {
    if (lastTouch?.[key]) out[key] = lastTouch[key];
  }
  return out;
}

/** GA4 event with the campaign params attached. */
function ga4(name: string, params: Params) {
  gtagEvent(name, { ...campaignParams(), ...params });
}

// Transactions already reported from this browser, so a reload or a second
// visit to the success URL can't double count a purchase.
const SEEN_KEY = 'gulel:reported-tx';
const seenThisPage = new Set<string>();

function firstReport(transactionId: string): boolean {
  if (seenThisPage.has(transactionId)) return false;
  seenThisPage.add(transactionId);
  try {
    const seen: string[] = JSON.parse(localStorage.getItem(SEEN_KEY) ?? '[]');
    if (seen.includes(transactionId)) return false;
    localStorage.setItem(SEEN_KEY, JSON.stringify([...seen, transactionId].slice(-20)));
  } catch {
    /* storage unavailable — the in-page guard still applies */
  }
  return true;
}

export interface EpisodeContext {
  seriesId: string;
  seriesTitle: string;
  genre?: string;
  episodeId: string;
  episodeNumber: number;
  isFree: boolean;
}

function episodeParams(ep: EpisodeContext): Params {
  return {
    series_id: ep.seriesId,
    series_title: ep.seriesTitle,
    episode_id: ep.episodeId,
    episode_number: ep.episodeNumber,
    is_free: ep.isFree,
  };
}

export interface CheckoutItem {
  /** Coin package id, or `VIP_<plan>` for a VIP pass. */
  itemId: string;
  itemName: string;
  value: number;
  currency: string;
}

function ga4Items(item: CheckoutItem) {
  return [{ item_id: item.itemId, item_name: item.itemName, price: item.value, quantity: 1 }];
}

/* ── Auth events handed over by /auth/callback ───────────────────────────── */

/**
 * The auth callback knows whether it just created the user; it leaves that in
 * this short-lived cookie (`sign_up.<method>.<userId>` or `login.<method>.<userId>`)
 * and the next page load reports it.
 */
export const AUTH_EVENT_COOKIE = 'gulel_auth_evt';

export function flushAuthEvent() {
  if (typeof document === 'undefined') return;
  try {
    const raw = document.cookie
      .split('; ')
      .find((c) => c.startsWith(`${AUTH_EVENT_COOKIE}=`))
      ?.slice(AUTH_EVENT_COOKIE.length + 1);
    if (!raw) return;
    // Consume before reporting, so a re-run can't report it twice.
    document.cookie = `${AUTH_EVENT_COOKIE}=; Max-Age=0; Path=/`;
    const [kind, method = 'unknown', userId] = decodeURIComponent(raw).split('.');
    if (kind === 'sign_up') analytics.signUp(method.slice(0, 32), userId?.slice(0, 64));
    else if (kind === 'login') analytics.login(method.slice(0, 32));
  } catch {
    /* ignore */
  }
}

// Pre-defined events
export const analytics = {
  episodeView: (seriesId: string, episodeId: string, episodeNumber: number) =>
    trackEvent('episode_view', { series_id: seriesId, episode_id: episodeId, episode_number: episodeNumber }),

  episodeUnlock: (episodeId: string, coinsSpent: number) =>
    trackEvent('episode_unlock', { episode_id: episodeId, coins_spent: coinsSpent }),

  coinPurchase: (packageName: string, amount: number, currency: string) =>
    trackEvent('coin_purchase', { package_name: packageName, value: amount, currency }),

  adWatch: () =>
    trackEvent('ad_watch'),

  seriesView: (seriesId: string, title: string) =>
    trackEvent('series_view', { series_id: seriesId, series_title: title }),

  search: (query: string, resultsCount: number) =>
    trackEvent('search', { search_term: query, results_count: resultsCount }),

  share: (platform: string, seriesId: string) =>
    trackEvent('share', { method: platform, content_id: seriesId }),

  /* Funnel: GA4 recommended events + Meta standard events. */

  /** Episode playback actually started. */
  videoStart: (ep: EpisodeContext) => {
    if (typeof window === 'undefined') return;
    const params = episodeParams(ep);
    ga4('video_start', params);
    ga4('episode_view', params); // legacy custom event
    fbqEvent(
      'track',
      'ViewContent',
      {
        content_ids: [ep.seriesId],
        content_type: 'product',
        content_name: ep.seriesTitle,
        content_category: ep.genre,
      },
      newEventId()
    );
  },

  /** Episode watched to ≥90%. */
  videoComplete: (ep: EpisodeContext) => {
    if (typeof window === 'undefined') return;
    ga4('video_complete', episodeParams(ep));
    fbqEvent(
      'trackCustom',
      'EpisodeComplete',
      {
        content_ids: [ep.seriesId],
        content_name: ep.seriesTitle,
        episode_number: ep.episodeNumber,
        is_free: ep.isFree,
      },
      newEventId()
    );
  },

  /** Unlock sheet (paywall) shown on a locked episode. */
  paywallView: (ep: Omit<EpisodeContext, 'isFree'> & { coinPrice: number; signedIn: boolean }) => {
    if (typeof window === 'undefined') return;
    ga4('paywall_view', {
      ...episodeParams({ ...ep, isFree: false }),
      coin_price: ep.coinPrice,
      signed_in: ep.signedIn,
    });
    fbqEvent(
      'trackCustom',
      'PaywallView',
      {
        content_ids: [ep.seriesId],
        content_name: ep.seriesTitle,
        episode_number: ep.episodeNumber,
      },
      newEventId()
    );
  },

  /** A new account was created (reported via the auth callback cookie). */
  signUp: (method: string, userId?: string) => {
    if (typeof window === 'undefined') return;
    ga4('sign_up', { method });
    fbqEvent(
      'track',
      'CompleteRegistration',
      { status: true, method },
      userId ? `reg:${userId}` : newEventId()
    );
  },

  /** A returning user signed in. */
  login: (method: string) => {
    if (typeof window === 'undefined') return;
    ga4('login', { method });
  },

  /** User tapped a coin pack or VIP plan and is heading to checkout. */
  beginCheckout: (item: CheckoutItem) => {
    if (typeof window === 'undefined') return;
    ga4('begin_checkout', {
      value: item.value,
      currency: item.currency,
      items: ga4Items(item),
    });
    fbqEvent(
      'track',
      'InitiateCheckout',
      {
        value: item.value,
        currency: item.currency,
        content_ids: [item.itemId],
        content_type: 'product',
        num_items: 1,
      },
      newEventId()
    );
  },

  /**
   * Coin purchase confirmed. `transactionId` must be the provider reference
   * the webhook uses (`stripe:<session>` / `razorpay:<payment>`) so Meta
   * dedups this against the server-side Purchase.
   */
  purchase: (item: CheckoutItem & { transactionId: string }) => {
    if (typeof window === 'undefined' || !firstReport(item.transactionId)) return;
    ga4('purchase', {
      transaction_id: item.transactionId,
      value: item.value,
      currency: item.currency,
      items: ga4Items(item),
    });
    fbqEvent(
      'track',
      'Purchase',
      {
        value: item.value,
        currency: item.currency,
        content_ids: [item.itemId],
        content_type: 'product',
        content_name: item.itemName,
        num_items: 1,
      },
      item.transactionId
    );
  },

  /** VIP subscription confirmed (same dedup contract as `purchase`). */
  vipSubscribe: (
    item: CheckoutItem & { transactionId: string; plan: string; predictedLtv: number }
  ) => {
    if (typeof window === 'undefined' || !firstReport(item.transactionId)) return;
    ga4('purchase', {
      transaction_id: item.transactionId,
      value: item.value,
      currency: item.currency,
      items: ga4Items(item),
    });
    ga4('vip_subscribe', {
      transaction_id: item.transactionId,
      plan: item.plan,
      value: item.value,
      currency: item.currency,
    });
    fbqEvent(
      'track',
      'Subscribe',
      {
        value: item.value,
        currency: item.currency,
        predicted_ltv: item.predictedLtv,
        content_ids: [item.itemId],
      },
      item.transactionId
    );
  },

  /** Episode unlocked by spending coins. */
  unlockEpisode: (ep: Omit<EpisodeContext, 'isFree' | 'genre'> & { coins: number }) => {
    if (typeof window === 'undefined') return;
    ga4('spend_virtual_currency', {
      virtual_currency_name: 'coins',
      value: ep.coins,
      item_name: `${ep.seriesTitle} · EP ${ep.episodeNumber}`,
      series_id: ep.seriesId,
      episode_id: ep.episodeId,
      episode_number: ep.episodeNumber,
    });
    fbqEvent(
      'trackCustom',
      'UnlockEpisode',
      {
        content_ids: [ep.seriesId],
        content_name: ep.seriesTitle,
        episode_number: ep.episodeNumber,
        coins: ep.coins,
      },
      newEventId()
    );
  },

  /** Rewarded-ad coins landed in the balance. */
  adReward: (coins: number, seriesId?: string) => {
    if (typeof window === 'undefined') return;
    ga4('earn_virtual_currency', {
      virtual_currency_name: 'coins',
      value: coins,
      source: 'rewarded_ad',
      series_id: seriesId,
    });
    fbqEvent(
      'trackCustom',
      'AdReward',
      { coins, content_ids: seriesId ? [seriesId] : undefined },
      newEventId()
    );
  },
};
