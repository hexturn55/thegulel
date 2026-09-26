import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { canWatchEpisode } from '@/lib/access';
import { getSignedStreamUrlWithExpiry } from '@/lib/cloudflare';

export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'private, no-store' };

/**
 * GET /api/episodes/:id/play — a short-lived signed HLS URL, only for viewers
 * entitled to the episode (free pilot, VIP, or unlocked with coins).
 * Cloudflare requires signed URLs, so this is the only way to obtain a
 * playable stream. Used by the mobile app; the web watch page signs the same
 * way server-side.
 *
 * 200 → { url, expiresAt, progress, seriesId, nextEpisodeId }
 *   url           signed HLS (.m3u8) manifest — never DASH (iOS can't play it)
 *   expiresAt     ISO time the URL stops working (null if unknown)
 *   progress      the viewer's saved resume position in seconds (0 if none)
 *   nextEpisodeId next episode in the same series, or null
 * 401 signed out / 402 signed in but not entitled →
 *   { error: 'Episode locked', locked: true, code: 'LOCKED', seriesId }
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  // Draft series (e.g. pitch-only showcases) are never playable here.
  const episode = await prisma.episode.findFirst({
    where: { id, series: { status: 'PUBLISHED' } },
    select: { id: true, isFree: true, videoId: true, seriesId: true, episodeNumber: true },
  });
  if (!episode) {
    return NextResponse.json({ error: 'Episode not found' }, { status: 404, headers: NO_STORE });
  }

  const user = await getAuthUser();
  if (!(await canWatchEpisode(episode, user?.id))) {
    return NextResponse.json(
      { error: 'Episode locked', locked: true, code: 'LOCKED', seriesId: episode.seriesId },
      { status: user ? 402 : 401, headers: NO_STORE }
    );
  }

  const [signed, history, next] = await Promise.all([
    getSignedStreamUrlWithExpiry(episode.videoId),
    user
      ? prisma.watchHistory.findUnique({
          where: { userId_episodeId: { userId: user.id, episodeId: episode.id } },
          select: { progress: true, completed: true },
        })
      : null,
    prisma.episode.findFirst({
      where: {
        seriesId: episode.seriesId,
        episodeNumber: { gt: episode.episodeNumber },
        series: { status: 'PUBLISHED' },
      },
      orderBy: { episodeNumber: 'asc' },
      select: { id: true },
    }),
  ]);

  if (!signed) {
    return NextResponse.json({ error: 'Playback unavailable' }, { status: 503, headers: NO_STORE });
  }

  return NextResponse.json(
    {
      url: signed.url,
      expiresAt: signed.expiresAt.toISOString(),
      // A finished episode restarts from the beginning.
      progress: history && !history.completed ? Math.max(0, history.progress) : 0,
      seriesId: episode.seriesId,
      nextEpisodeId: next?.id ?? null,
    },
    { headers: NO_STORE }
  );
}
