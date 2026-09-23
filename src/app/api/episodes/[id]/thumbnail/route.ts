import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSignedThumbnailUrl } from '@/lib/cloudflare';

/**
 * GET /api/episodes/:id/thumbnail — the episode's Cloudflare thumbnail,
 * fetched server-side with a signed token so the video ID never reaches the
 * client. Cached at the edge for a day; falls back to the series poster.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const episode = await prisma.episode.findUnique({
    where: { id },
    select: { videoId: true, series: { select: { thumbnail: true } } },
  });
  if (!episode) return new NextResponse('Not found', { status: 404 });

  const fallback = () =>
    NextResponse.redirect(new URL(episode.series.thumbnail || '/thumbnails/_fallback.png', request.url), 302);

  const signed = await getSignedThumbnailUrl(episode.videoId);
  if (!signed) return fallback();
  try {
    const res = await fetch(signed, { cache: 'no-store', signal: AbortSignal.timeout(8000) });
    if (!res.ok || !res.body) return fallback();
    return new NextResponse(res.body, {
      headers: {
        'Content-Type': res.headers.get('content-type') ?? 'image/jpeg',
        'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
      },
    });
  } catch {
    return fallback();
  }
}
