import { API_ROUTES } from './constants';
import type {
  CoinPackage,
  CurrentUser,
  Episode,
  SeriesCard,
  WatchProgress,
} from './types';

export interface ApiClientOptions {
  /**
   * Base URL of the Gulel API.
   * - Web: omit (same-origin, cookie auth).
   * - Mobile: e.g. "https://app.gulel.com".
   */
  baseUrl?: string;
  /**
   * Returns a bearer token for the current session. Mobile passes the Supabase
   * access token here; web can omit it and rely on same-origin cookies.
   */
  getToken?: () => string | null | undefined | Promise<string | null | undefined>;
  /** Custom fetch (e.g. for tests). Defaults to global fetch. */
  fetch?: typeof fetch;
}

export class ApiRequestError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

/**
 * A small, typed client over the Gulel JSON API. Framework-agnostic: works in
 * the browser (cookie auth) and React Native (bearer-token auth).
 */
export function createApiClient(options: ApiClientOptions = {}) {
  const baseUrl = (options.baseUrl ?? '').replace(/\/$/, '');
  const doFetch = options.fetch ?? globalThis.fetch;

  async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const token = options.getToken ? await options.getToken() : undefined;
    const headers = new Headers(init.headers);
    if (token) headers.set('Authorization', `Bearer ${token}`);
    if (init.body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const res = await doFetch(`${baseUrl}${path}`, {
      ...init,
      headers,
      // Send cookies on web; harmless on native.
      credentials: 'include',
    });

    const text = await res.text();
    const data = text ? JSON.parse(text) : undefined;

    if (!res.ok) {
      const message =
        (data && typeof data.error === 'string' && data.error) ||
        `Request failed (${res.status})`;
      throw new ApiRequestError(res.status, message);
    }
    return data as T;
  }

  return {
    request,

    /** Current authenticated user (coin balance, VIP status). */
    getMe(): Promise<CurrentUser> {
      return request<CurrentUser>(API_ROUTES.me);
    },

    /** Published catalog, optionally filtered by genre / featured. */
    async getSeries(params?: { genre?: string; featured?: boolean }): Promise<SeriesCard[]> {
      const qs = new URLSearchParams();
      if (params?.genre) qs.set('genre', params.genre);
      if (params?.featured) qs.set('featured', 'true');
      const suffix = qs.toString() ? `?${qs}` : '';
      const data = await request<{ series: SeriesCard[] }>(`${API_ROUTES.series}${suffix}`);
      return data.series;
    },

    /** Episodes for a series (ordered). */
    getEpisodes(seriesId: string): Promise<Episode[]> {
      return request<Episode[]>(API_ROUTES.seriesEpisodes(seriesId));
    },

    /** Spend coins to unlock a locked episode. */
    unlockEpisode(episodeId: string): Promise<{ coinBalance: number }> {
      return request<{ coinBalance: number }>(API_ROUTES.episodesUnlock, {
        method: 'POST',
        body: JSON.stringify({ episodeId }),
      });
    },

    /** Coin top-up packages. */
    getCoinPackages(): Promise<CoinPackage[]> {
      return request<CoinPackage[]>(API_ROUTES.coinPackages);
    },

    /** Persist playback position for resume. */
    saveProgress(input: WatchProgress): Promise<void> {
      return request<void>(API_ROUTES.watchProgress, {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },

    /** Full-text-ish series search. */
    async search(query: string): Promise<SeriesCard[]> {
      const data = await request<{ series: SeriesCard[] }>(
        `${API_ROUTES.search}?q=${encodeURIComponent(query)}`,
      );
      return data.series;
    },
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
