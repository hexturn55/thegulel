import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const episodes = await prisma.episode.findMany({
      where: { seriesId: id },
      orderBy: { episodeNumber: 'asc' },
    });

    return NextResponse.json({ episodes });
  } catch (error) {
    console.error('Fetch episodes error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch episodes' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const data = await request.json();
    const userId = request.cookies.get('userId')?.value;

    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Verify series exists
    const series = await prisma.series.findUnique({
      where: { id },
    });

    if (!series) {
      return NextResponse.json(
        { error: 'Series not found' },
        { status: 404 }
      );
    }

    // Check if episode number is free
    const isFree = data.episodeNumber <= series.freeEpisodes;

    const episode = await prisma.episode.create({
      data: {
        seriesId: id,
        episodeNumber: data.episodeNumber,
        title: data.title,
        titleHi: data.titleHi,
        titleZh: data.titleZh,
        duration: data.duration,
        videoUrl: data.videoUrl,
        videoId: data.videoId,
        thumbnail: data.thumbnail,
        subtitlesEn: data.subtitlesEn,
        subtitlesHi: data.subtitlesHi,
        subtitlesZh: data.subtitlesZh,
        isFree,
      },
    });

    // Update series total episodes
    await prisma.series.update({
      where: { id },
      data: {
        totalEpisodes: {
          increment: 1,
        },
      },
    });

    return NextResponse.json({ episode }, { status: 201 });
  } catch (error) {
    console.error('Create episode error:', error);
    return NextResponse.json(
      { error: 'Failed to create episode' },
      { status: 500 }
    );
  }
}
