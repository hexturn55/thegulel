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

/**
 * Mint a Cloudflare Stream **signed** HLS URL for a video (server-only).
 *
 * A 403 on a Stream manifest means the video has "Require signed URLs" on, so
 * the plain `…/{videoId}/manifest/video.m3u8` is rejected. This requests a
 * short-lived token from the Stream API and returns the tokenized HLS URL
 * (`…/{token}/manifest/video.m3u8`), which plays whether or not signed URLs
 * are required. Returns null if Cloudflare isn't configured or the call fails,
 * so callers fall back to the plain URL.
 *
 * NEVER call from the client — it uses CLOUDFLARE_API_TOKEN.
 */
export async function getSignedStreamUrl(videoId: string): Promise<string | null> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  const subdomain = process.env.NEXT_PUBLIC_CLOUDFLARE_CUSTOMER_SUBDOMAIN;
  if (!accountId || !apiToken || !subdomain || !videoId) return null;

  try {
    const res = await fetch(
      `${CLOUDFLARE_API_BASE}/accounts/${accountId}/stream/${videoId}/token`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        // 6-hour window — long enough for any single episode, re-minted each load.
        body: JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 6 * 3600 }),
        cache: 'no-store',
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const token = data?.result?.token;
    return token ? `https://${subdomain}/${token}/manifest/video.m3u8` : null;
  } catch {
    return null;
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
