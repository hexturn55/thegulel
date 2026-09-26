/**
 * Domain types shared between web and mobile.
 *
 * These mirror the Prisma models (see prisma/schema.prisma) but are expressed
 * as serialization-safe plain types: dates are ISO strings (what the JSON API
 * returns), and only the fields exposed by the public API are included.
 */

export type Locale = 'en' | 'hi' | 'zh';

export type SeriesStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export type TransactionType =
  | 'PURCHASE'
  | 'AD_REWARD'
  | 'EPISODE_UNLOCK'
  | 'SUBSCRIPTION'
  | 'BONUS';

export type SubscriptionPlan = 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export type SubscriptionStatus = 'ACTIVE' | 'CANCELLED' | 'EXPIRED';

/** Shape returned by GET /api/series (catalog cards). */
export interface SeriesCard {
  id: string;
  title: string;
  thumbnail: string;
  genre: string;
  totalEpisodes: number;
  featured: boolean;
}

/** Full series detail (localized fields optional). */
export interface Series extends SeriesCard {
  titleHi?: string | null;
  titleZh?: string | null;
  description: string;
  descriptionHi?: string | null;
  descriptionZh?: string | null;
  tags: string[];
  freeEpisodes: number;
  coinPrice: number;
  status: SeriesStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Episode {
  id: string;
  seriesId: string;
  episodeNumber: number;
  title: string;
  titleHi?: string | null;
  titleZh?: string | null;
  /** Duration in seconds. */
  duration: number;
  /**
   * Thumbnail URL (a server proxy path). Stream URLs are never part of the
   * listing — request one with `getPlaybackUrl`, which checks entitlement.
   */
  thumbnail: string;
  isFree: boolean;
  /**
   * Whether the current viewer may watch this episode (free, VIP, or unlocked
   * with coins). Only present when the API knows who is asking.
   */
  isUnlocked?: boolean;
  /** Coin cost to unlock this episode (absent for free episodes). */
  coinPrice?: number;
}

/**
 * Shape returned by GET /api/episodes/:id/play for an entitled viewer.
 * Older servers return only `url`; the other fields may then be missing.
 */
export interface PlaybackInfo {
  /** Short-lived signed HLS (.m3u8) URL. */
  url: string;
  /** ISO timestamp when `url` stops working, or null if unknown. */
  expiresAt: string | null;
  /** Saved resume position in seconds (0 when none). */
  progress: number;
  seriesId: string;
  /** Next episode in the series, or null when this is the last one. */
  nextEpisodeId: string | null;
}

/** Shape returned by GET /api/ads/status (rewarded-ad eligibility). */
export interface AdStatus {
  canWatch: boolean;
  /** Seconds until the next rewarded ad may be watched (0 when allowed now). */
  retryInSeconds: number;
  remainingToday: number;
}

/** Shape returned by POST /api/episodes/unlock. */
export type UnlockResult = {
  success: boolean;
  newBalance: number;
  alreadyUnlocked?: boolean;
};

/** Current user as returned by GET /api/auth/me. */
export interface CurrentUser {
  id: string;
  phone?: string | null;
  email?: string | null;
  name?: string | null;
  avatar?: string | null;
  locale: string;
  provider?: string | null;
  coinBalance: number;
  isVip: boolean;
}

export interface CoinPackage {
  id: string;
  name: string;
  coins: number;
  priceUSD: number;
  priceINR: number;
  popular: boolean;
}

export interface CoinTransaction {
  id: string;
  amount: number;
  type: TransactionType;
  description?: string | null;
  createdAt: string;
}

export interface WatchProgress {
  episodeId: string;
  /** Progress in seconds. */
  progress: number;
  completed: boolean;
}

/** Standard error body the API returns on failure. */
export interface ApiError {
  error: string;
  /** Machine-readable error code (e.g. 'LOCKED'), when the route provides one. */
  code?: string;
}
