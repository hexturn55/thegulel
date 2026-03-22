import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';

const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID ?? '';
const CF_STREAM_TOKEN = process.env.CLOUDFLARE_STREAM_TOKEN ?? '';

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!CF_ACCOUNT_ID || !CF_STREAM_TOKEN) {
    return NextResponse.json(
      { error: 'Cloudflare credentials not configured' },
      { status: 500 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const maxDurationSeconds = body.maxDurationSeconds ?? 600;

    // Request a direct upload URL from Cloudflare Stream
    // The browser uploads the video file directly to Cloudflare (avoids proxying large files through Next.js)
    const cfResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/stream/direct_upload`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${CF_STREAM_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          maxDurationSeconds,
          requireSignedURLs: false,
        }),
      }
    );

    if (!cfResponse.ok) {
      const err = await cfResponse.text();
      console.error('Cloudflare direct_upload error:', err);
      return NextResponse.json(
        { error: 'Failed to create Cloudflare upload URL' },
        { status: 502 }
      );
    }

    const cfData = await cfResponse.json();
    const { uploadURL, uid: videoId } = cfData.result;

    // Thumbnail URL — available once Cloudflare processes the video
    const thumbnailUrl = `https://videodelivery.net/${videoId}/thumbnails/thumbnail.jpg`;

    return NextResponse.json({
      uploadURL,
      videoId,
      thumbnailUrl,
    });
  } catch (error) {
    console.error('Upload route error:', error);
    return NextResponse.json({ error: 'Failed to get upload URL' }, { status: 500 });
  }
}
