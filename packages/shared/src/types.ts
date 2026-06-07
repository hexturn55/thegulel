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
  /** Cloudflare Stream playback URL (HLS). */
  videoUrl: string;
  /** Cloudflare Stream video ID. */
  videoId: string;
  thumbnail: string;
  subtitlesEn?: string | null;
  subtitlesHi?: string | null;
  subtitlesZh?: string | null;
  isFree: boolean;
}

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
}
