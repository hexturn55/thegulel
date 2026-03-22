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

export function getStreamUrl(videoId: string): string {
  const subdomain = process.env.NEXT_PUBLIC_CLOUDFLARE_CUSTOMER_SUBDOMAIN;
  if (!subdomain) {
    throw new Error('NEXT_PUBLIC_CLOUDFLARE_CUSTOMER_SUBDOMAIN not configured');
  }
  return `https://${subdomain}/${videoId}/manifest/video.m3u8`;
}

export function getStreamThumbnail(videoId: string): string {
  const subdomain = process.env.NEXT_PUBLIC_CLOUDFLARE_CUSTOMER_SUBDOMAIN;
  if (!subdomain) {
    throw new Error('NEXT_PUBLIC_CLOUDFLARE_CUSTOMER_SUBDOMAIN not configured');
  }
  return `https://${subdomain}/${videoId}/thumbnails/thumbnail.jpg`;
}
