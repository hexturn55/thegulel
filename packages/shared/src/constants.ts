/** Shared, framework-agnostic constants. */

export const GENRES = [
  'All',
  'Romance',
  'Drama',
  'Thriller',
  'Comedy',
  'Fantasy',
  'Action',
  'Mystery',
] as const;

export type Genre = (typeof GENRES)[number];

export const SUPPORTED_LOCALES = ['en', 'hi', 'zh'] as const;

export const DEFAULT_LOCALE = 'en';

/** API route paths, centralized so web and mobile stay in sync. */
export const API_ROUTES = {
  me: '/api/auth/me',
  series: '/api/series',
  seriesEpisodes: (id: string) => `/api/series/${id}/episodes`,
  episodesUnlock: '/api/episodes/unlock',
  coinPackages: '/api/coins/packages',
  coinsPurchase: '/api/coins/purchase',
  adReward: '/api/coins/ad-reward',
  search: '/api/search',
  watchProgress: '/api/watch/progress',
  userTransactions: '/api/user/transactions',
  userHistory: '/api/user/history',
  subscriptions: '/api/subscriptions',
} as const;
