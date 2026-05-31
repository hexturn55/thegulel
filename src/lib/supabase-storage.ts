import 'server-only';

import { createAdminSupabaseClient } from './supabase-server';

/**
 * Server-only helper for persisting generated media into Supabase Storage.
 * Pika/fal returns media on a temporary CDN URL, so we download the bytes and
 * re-upload them into our own bucket to get a durable, public URL.
 */

const BUCKET = process.env.PIKA_SUPABASE_BUCKET ?? 'pika-media';

export interface StoredMedia {
  /** Durable public URL within our Supabase Storage bucket. */
  publicUrl: string;
  /** Object path inside the bucket. */
  path: string;
}

/**
 * Download a remote media file and upload it to Supabase Storage, returning the
 * durable public URL. Uses the service-role client so it works from Server
 * Actions regardless of RLS.
 */
export async function uploadRemoteMediaToStorage(
  sourceUrl: string,
  destPath: string
): Promise<StoredMedia> {
  const res = await fetch(sourceUrl);
  if (!res.ok) {
    throw new Error(`Failed to download generated media (HTTP ${res.status}) from ${sourceUrl}`);
  }

  const contentType = res.headers.get('content-type') ?? guessContentType(destPath);
  const bytes = new Uint8Array(await res.arrayBuffer());

  const supabase = createAdminSupabaseClient();
  const { error } = await supabase.storage.from(BUCKET).upload(destPath, bytes, {
    contentType,
    upsert: true,
  });
  if (error) {
    throw new Error(`Supabase Storage upload failed: ${error.message}`);
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(destPath);
  return { publicUrl: data.publicUrl, path: destPath };
}

function guessContentType(path: string): string {
  if (path.endsWith('.mp4')) return 'video/mp4';
  if (path.endsWith('.webm')) return 'video/webm';
  if (path.endsWith('.png')) return 'image/png';
  if (path.endsWith('.jpg') || path.endsWith('.jpeg')) return 'image/jpeg';
  return 'application/octet-stream';
}

/** Build a deterministic object path for a job's media. */
export function mediaPathFor(seriesId: string, jobId: string, sourceUrl: string): string {
  const ext = extensionFromUrl(sourceUrl);
  return `series/${seriesId}/${jobId}${ext}`;
}

function extensionFromUrl(url: string): string {
  const clean = url.split('?')[0];
  const match = clean.match(/\.(mp4|webm|png|jpg|jpeg)$/i);
  return match ? `.${match[1].toLowerCase()}` : '.bin';
}
