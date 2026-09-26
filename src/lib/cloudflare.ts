const CLOUDFLARE_API_BASE = 'https://api.cloudflare.com/client/v4';

export interface CloudflareStreamVideo {
  uid: string;
  thumbnail: string;
  playback: {
    hls: string;
    dash: string;
  };
  duration: number;
  status: {
    state: string;
  };
}

export async function getStreamVideo(videoId: string): Promise<CloudflareStreamVideo> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !token) {
    throw new Error('Cloudflare credentials not configured');
  }

  const response = await fetch(
    `${CLOUDFLARE_API_BASE}/accounts/${accountId}/stream/${videoId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch video: ${response.statusText}`);
  }

  const data = await response.json();
  return data.result;
}

export async function uploadStreamVideo(file: File): Promise<CloudflareStreamVideo> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !token) {
    throw new Error('Cloudflare credentials not configured');
  }

  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(
    `${CLOUDFLARE_API_BASE}/accounts/${accountId}/stream`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to upload video: ${response.statusText}`);
  }

  const data = await response.json();
  return data.result;
}

export function getStreamUrl(videoId: string): string | null {
  const subdomain = process.env.NEXT_PUBLIC_CLOUDFLARE_CUSTOMER_SUBDOMAIN;
  if (!subdomain || !videoId) return null;
  return `https://${subdomain}/${videoId}/manifest/video.m3u8`;
}

/**
 * Resolve a **playable HLS** URL for an episode.
 *
 * The player is hls.js, which only plays HLS (`.m3u8`) — it cannot play
 * Cloudflare Stream's DASH (`.mpd`) manifests. So:
 *  - if the Cloudflare customer subdomain is configured and we have a videoId,
 *    build the canonical HLS URL on that host;
 *  - otherwise take the stored absolute `videoUrl` but rewrite a Cloudflare
 *    DASH manifest (`/manifest/video.mpd`) to its HLS sibling (`video.m3u8`);
 *  - otherwise fall back to the videoId.
 * Returns null if nothing usable, so callers render a friendly fallback.
 */
export function resolveVideoUrl(episode: {
  videoUrl?: string | null;
  videoId?: string | null;
}): string | null {
  const subdomain = process.env.NEXT_PUBLIC_CLOUDFLARE_CUSTOMER_SUBDOMAIN;

  if (episode.videoId && subdomain) {
    return `https://${subdomain}/${episode.videoId}/manifest/video.m3u8`;
  }

  if (episode.videoUrl && /^https?:\/\//.test(episode.videoUrl)) {
    // Cloudflare Stream serves both DASH and HLS at the same path; the player
    // needs HLS, so normalize a `.mpd` manifest to `.m3u8`.
    return episode.videoUrl.replace(
      /\/manifest\/video\.mpd(\?|$)/,
      '/manifest/video.m3u8$1'
    );
  }

  return episode.videoId ? getStreamUrl(episode.videoId) : null;
}

// Signed-token cache: minting a token is a Cloudflare API call, so reuse each
// video's token while it still has at least TOKEN_MIN_REMAINING_S left. A
// token (and so any leaked stream URL) lives at most TOKEN_TTL_S, and every
// URL handed out stays valid for at least TOKEN_MIN_REMAINING_S. The mobile
// app refreshes via `expiresAt`, but the web watch page embeds the URL once in
// server-rendered HTML with no refresh path, so keep that floor generous
// enough for paused / backgrounded tabs.
const TOKEN_TTL_S = 4 * 3600;
const TOKEN_MIN_REMAINING_S = 2 * 3600;
const tokenCache = new Map<string, { token: string; exp: number }>();

/**
 * Mint (or reuse) a Cloudflare Stream signed token for a video (server-only),
 * with its expiry (unix seconds). Returns null if Cloudflare isn't configured
 * or the call fails.
 *
 * NEVER call from the client — it uses CLOUDFLARE_API_TOKEN.
 */
export async function getStreamTokenWithExpiry(
  videoId: string
): Promise<{ token: string; exp: number } | null> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  if (!accountId || !apiToken || !videoId) return null;

  const now = Math.floor(Date.now() / 1000);
  const cached = tokenCache.get(videoId);
  if (cached && cached.exp - now > TOKEN_MIN_REMAINING_S) return cached;

  try {
    const exp = now + TOKEN_TTL_S;
    const res = await fetch(
      `${CLOUDFLARE_API_BASE}/accounts/${accountId}/stream/${videoId}/token`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ exp }),
        cache: 'no-store',
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const token: string | undefined = data?.result?.token;
    if (!token) return null;
    const entry = { token, exp };
    tokenCache.set(videoId, entry);
    return entry;
  } catch {
    return null;
  }
}

/**
 * Mint (or reuse) a Cloudflare Stream signed token for a video (server-only).
 * Videos require signed URLs, so every manifest and thumbnail request goes
 * through a token: `https://{subdomain}/{token}/...`. Returns null if
 * Cloudflare isn't configured or the call fails.
 *
 * NEVER call from the client — it uses CLOUDFLARE_API_TOKEN.
 */
export async function getStreamToken(videoId: string): Promise<string | null> {
  return (await getStreamTokenWithExpiry(videoId))?.token ?? null;
}

/**
 * Signed HLS (`.m3u8`, never DASH — iOS/AVPlayer and hls.js need HLS)
 * manifest URL for a video plus when it stops working, or null if signing is
 * unavailable.
 */
export async function getSignedStreamUrlWithExpiry(
  videoId: string
): Promise<{ url: string; expiresAt: Date } | null> {
  const subdomain = process.env.NEXT_PUBLIC_CLOUDFLARE_CUSTOMER_SUBDOMAIN;
  if (!subdomain) return null;
  const t = await getStreamTokenWithExpiry(videoId);
  if (!t) return null;
  return {
    url: `https://${subdomain}/${t.token}/manifest/video.m3u8`,
    expiresAt: new Date(t.exp * 1000),
  };
}

/** Signed HLS manifest URL for a video, or null if signing is unavailable. */
export async function getSignedStreamUrl(videoId: string): Promise<string | null> {
  return (await getSignedStreamUrlWithExpiry(videoId))?.url ?? null;
}

/** Signed thumbnail URL for a video (server-side use only — see the proxy). */
export async function getSignedThumbnailUrl(videoId: string): Promise<string | null> {
  const subdomain = process.env.NEXT_PUBLIC_CLOUDFLARE_CUSTOMER_SUBDOMAIN;
  if (!subdomain) return null;
  const token = await getStreamToken(videoId);
  return token ? `https://${subdomain}/${token}/thumbnails/thumbnail.jpg?height=640` : null;
}

/**
 * Public URL for an episode's thumbnail. Served through our own proxy so the
 * Cloudflare video ID never reaches the client (with signed URLs required,
 * the raw Cloudflare thumbnail URL wouldn't load anyway).
 */
export function episodeThumbnailPath(episodeId: string): string {
  return `/api/episodes/${episodeId}/thumbnail`;
}

/** Set (or clear) "require signed URLs" on a Cloudflare Stream video. */
export async function setRequireSignedUrls(videoId: string, required: boolean): Promise<boolean> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  if (!accountId || !apiToken) return false;
  try {
    const res = await fetch(`${CLOUDFLARE_API_BASE}/accounts/${accountId}/stream/${videoId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid: videoId, requireSignedURLs: required }),
      cache: 'no-store',
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Resolve the best playable HLS URL for an episode, preferring a Cloudflare
 * signed URL (handles "Require signed URLs"); falls back to the plain
 * HLS-normalized URL. Async because signing hits the Stream API.
 */
export async function resolvePlayableUrl(episode: {
  videoUrl?: string | null;
  videoId?: string | null;
}): Promise<string | null> {
  if (episode.videoId) {
    const signed = await getSignedStreamUrl(episode.videoId);
    if (signed) return signed;
  }
  return resolveVideoUrl(episode);
}

export function getStreamThumbnail(videoId: string): string | null {
  const subdomain = process.env.NEXT_PUBLIC_CLOUDFLARE_CUSTOMER_SUBDOMAIN;
  if (!subdomain || !videoId) return null;
  return `https://${subdomain}/${videoId}/thumbnails/thumbnail.jpg`;
}
