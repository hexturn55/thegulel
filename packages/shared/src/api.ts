import { API_ROUTES } from './constants';
import type {
  AdStatus,
  CoinPackage,
  CurrentUser,
  Episode,
  PlaybackInfo,
  SeriesCard,
  UnlockResult,
  WatchProgress,
} from './types';

/** Requests without a caller-supplied AbortSignal time out after this long. */
const REQUEST_TIMEOUT_MS = 15_000;
/**
 * Account deletion runs several upstream calls in sequence on the server
 * (Apple revoke, RevenueCat, DB, Supabase admin); give it longer so the client
 * does not report failure for a deletion the server completes.
 */
const DELETE_ACCOUNT_TIMEOUT_MS = 60_000;

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
  /**
   * @param status HTTP status, or 0 when the request never got a response
   *   (offline / timed out).
   * @param code Machine-readable code from the error body (e.g. 'LOCKED'), or
   *   'NETWORK' / 'TIMEOUT' for status 0.
   * @param data The parsed error body, if any.
   */
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string,
    public readonly data?: unknown,
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

  async function request<T>(
    path: string,
    init: RequestInit = {},
    timeoutMs: number = REQUEST_TIMEOUT_MS,
  ): Promise<T> {
    const token = options.getToken ? await options.getToken() : undefined;
    const headers = new Headers(init.headers);
    if (token) headers.set('Authorization', `Bearer ${token}`);
    if (init.body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    // Time out requests the caller has no way to cancel, so a dead network
    // never leaves a spinner hanging forever.
    let timer: ReturnType<typeof setTimeout> | undefined;
    let timedOut = false;
    let signal = init.signal ?? undefined;
    if (!signal && typeof AbortController !== 'undefined') {
      const controller = new AbortController();
      signal = controller.signal;
      timer = setTimeout(() => {
        timedOut = true;
        controller.abort();
      }, timeoutMs);
    }

    let res: Response;
    let text: string;
    try {
      res = await doFetch(`${baseUrl}${path}`, {
        ...init,
        headers,
        signal,
        // Cookies only for same-origin cookie auth (no token provider). Bearer
        // clients (mobile, Expo web) omit them: a credentialed request is
        // rejected by browsers when the API answers with the public
        // `Access-Control-Allow-Origin: *` (CORS_ALLOWED_ORIGINS="*").
        credentials: options.getToken ? 'omit' : 'include',
      });
      text = await res.text();
    } catch (err) {
      if (timedOut) {
        throw new ApiRequestError(0, 'Request timed out', 'TIMEOUT');
      }
      // The caller cancelled with its own signal: surface that unchanged so it
      // can be told apart from a network failure.
      if (init.signal?.aborted) throw err;
      // fetch rejects with TypeError (or AbortError) when there is no network.
      throw new ApiRequestError(0, 'No connection', 'NETWORK');
    } finally {
      if (timer) clearTimeout(timer);
    }

    // A proxy/CDN error page or truncated body must not surface as a raw
    // SyntaxError.
    let data: unknown;
    try {
      data = text ? JSON.parse(text) : undefined;
    } catch {
      data = undefined;
      if (res.ok) {
        throw new ApiRequestError(res.status, 'Unexpected server response');
      }
    }

    if (!res.ok) {
      const body = (data && typeof data === 'object' ? data : {}) as {
        error?: unknown;
        code?: unknown;
      };
      const message =
        (typeof body.error === 'string' && body.error) || `Request failed (${res.status})`;
      const code = typeof body.code === 'string' ? body.code : undefined;
      throw new ApiRequestError(res.status, message, code, data);
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

    /** Episodes for a series (ordered by episode number). */
    async getEpisodes(seriesId: string): Promise<Episode[]> {
      const data = await request<{ episodes: Episode[] }>(
        API_ROUTES.seriesEpisodes(seriesId),
      );
      return data.episodes;
    },

    /**
     * Short-lived signed HLS URL for an episode the viewer may watch (free
     * pilot, VIP, or unlocked). Rejects with 401/402 when the episode is locked.
     */
    async getPlaybackUrl(episodeId: string): Promise<string> {
      const data = await request<{ url: string }>(API_ROUTES.episodePlay(episodeId));
      return data.url;
    },

    /**
     * Signed stream URL plus resume position and next-episode id. Rejects with
     * 401 (signed out) or 402/403 (not entitled; `code === 'LOCKED'`) when the
     * episode is locked. Fields an older server omits are defaulted.
     */
    async getPlayback(episodeId: string): Promise<PlaybackInfo> {
      const data = await request<Partial<PlaybackInfo> & { url: string }>(
        API_ROUTES.episodePlay(episodeId),
      );
      return {
        url: data.url,
        expiresAt: data.expiresAt ?? null,
        progress: typeof data.progress === 'number' ? data.progress : 0,
        seriesId: data.seriesId ?? '',
        nextEpisodeId: data.nextEpisodeId ?? null,
      };
    },

    /** Spend coins to unlock a locked episode; returns the new coin balance. */
    unlockEpisode(episodeId: string): Promise<UnlockResult> {
      return request<UnlockResult>(API_ROUTES.episodesUnlock, {
        method: 'POST',
        body: JSON.stringify({ episodeId }),
      });
    },

    /** Permanently delete the signed-in account and its data. */
    deleteAccount(): Promise<{ success: boolean }> {
      return request<{ success: boolean }>(
        API_ROUTES.userDelete,
        {
          method: 'POST',
          body: JSON.stringify({ confirmation: 'DELETE' }),
        },
        DELETE_ACCOUNT_TIMEOUT_MS,
      );
    },

    /** Whether the viewer may watch a rewarded ad right now (cooldown / daily cap). */
    getAdStatus(): Promise<AdStatus> {
      return request<AdStatus>(API_ROUTES.adsStatus);
    },

    /**
     * Send the Sign in with Apple authorization code so the server can store
     * a refresh token (needed to revoke the Apple grant on account deletion).
     */
    linkAppleAuthorizationCode(authorizationCode: string): Promise<{ ok: boolean }> {
      return request<{ ok: boolean }>(API_ROUTES.appleLink, {
        method: 'POST',
        body: JSON.stringify({ authorizationCode }),
      });
    },

    /** Coin top-up packages. */
    async getCoinPackages(): Promise<CoinPackage[]> {
      const data = await request<{ packages: CoinPackage[] }>(API_ROUTES.coinPackages);
      return data.packages;
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
