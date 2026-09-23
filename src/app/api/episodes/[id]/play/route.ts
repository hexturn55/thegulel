import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { canWatchEpisode } from '@/lib/access';
import { getSignedStreamUrl } from '@/lib/cloudflare';

export const dynamic = 'force-dynamic';

/**
 * GET /api/episodes/:id/play — a short-lived signed HLS URL, only for viewers
 * entitled to the episode (free pilot, VIP, or unlocked with coins).
 * Cloudflare requires signed URLs, so this is the only way to obtain a
 * playable stream. Used by the mobile app; the web watch page signs the same
 * way server-side.
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const episode = await prisma.episode.findUnique({
    where: { id },
    select: { id: true, isFree: true, videoId: true },
  });
  if (!episode) {
    return NextResponse.json({ error: 'Episode not found' }, { status: 404 });
  }

  const user = await getAuthUser();
  if (!(await canWatchEpisode(episode, user?.id))) {
    return NextResponse.json(
      { error: 'Episode locked', locked: true },
      { status: user ? 402 : 401 }
    );
  }

  const url = await getSignedStreamUrl(episode.videoId);
  if (!url) {
    return NextResponse.json({ error: 'Playback unavailable' }, { status: 503 });
  }
  return NextResponse.json(
    { url },
    { headers: { 'Cache-Control': 'private, no-store' } }
  );
}
