import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';

const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID ?? '';

function buildThumbnailUrl(videoId: string): string {
  return `https://videodelivery.net/${videoId}/thumbnails/thumbnail.jpg`;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: seriesId } = await params;
  const episodes = await prisma.episode.findMany({
    where: { seriesId },
    orderBy: { episodeNumber: 'asc' },
  });

  return NextResponse.json({ episodes });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: seriesId } = await params;
  try {
    const body = await request.json();
    const {
      episodeNumber, title, titleHi, titleZh,
      videoId, duration,
      subtitlesEn, subtitlesHi, subtitlesZh,
      isFree,
    } = body;

    if (!episodeNumber || !title || !videoId || duration === undefined) {
      return NextResponse.json(
        { error: 'episodeNumber, title, videoId, and duration are required' },
        { status: 400 }
      );
    }

    const thumbnail = buildThumbnailUrl(videoId);
    const videoUrl = `https://videodelivery.net/${videoId}/manifest/video.mpd`;

    const episode = await prisma.episode.create({
      data: {
        seriesId,
        episodeNumber,
        title, titleHi, titleZh,
        videoId,
        videoUrl,
        thumbnail,
        duration,
        subtitlesEn, subtitlesHi, subtitlesZh,
        isFree: isFree ?? false,
      },
    });

    // Update totalEpisodes on series
    await prisma.series.update({
      where: { id: seriesId },
      data: { totalEpisodes: { increment: 1 } },
    });

    return NextResponse.json({ episode }, { status: 201 });
  } catch (error) {
    console.error('Create episode error:', error);
    return NextResponse.json({ error: 'Failed to create episode' }, { status: 500 });
  }
}
