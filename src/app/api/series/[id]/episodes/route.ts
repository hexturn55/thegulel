import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';
import { episodeThumbnailPath } from '@/lib/cloudflare';
import { getAuthUser } from '@/lib/auth';
import { hasActiveVip } from '@/lib/subscription';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    // Public listing: never expose Cloudflare video IDs or stream URLs —
    // playable URLs come only from /api/episodes/:id/play after an
    // entitlement check, and thumbnails go through our signed proxy.
    const [series, rows] = await Promise.all([
      prisma.series.findFirst({
        where: { id, status: 'PUBLISHED' },
        select: { coinPrice: true },
      }),
      prisma.episode.findMany({
        where: { seriesId: id, series: { status: 'PUBLISHED' } },
        orderBy: { episodeNumber: 'asc' },
        select: {
          id: true,
          seriesId: true,
          episodeNumber: true,
          title: true,
          titleHi: true,
          titleZh: true,
          duration: true,
          isFree: true,
        },
      }),
    ]);

    // Per-viewer entitlement (optional auth): free, VIP, or unlocked with
    // coins. One VIP lookup and one purchase query for the whole list.
    let vip = false;
    let purchased = new Set<string>();
    let user: Awaited<ReturnType<typeof getAuthUser>> = null;
    try {
      user = await getAuthUser();
    } catch (err) {
      // The listing is public — a flaky auth lookup must not take it down.
      console.warn('episodes list: auth lookup failed, serving anonymous view', err);
    }
    if (user && rows.some((e) => !e.isFree)) {
      vip = await hasActiveVip(user.id);
      if (!vip) {
        const purchases = await prisma.episodePurchase.findMany({
          where: { userId: user.id, episodeId: { in: rows.map((e) => e.id) } },
          select: { episodeId: true },
        });
        purchased = new Set(purchases.map((p) => p.episodeId));
      }
    }

    const coinPrice = series?.coinPrice;
    const episodes = rows.map((e) => ({
      ...e,
      thumbnail: episodeThumbnailPath(e.id),
      isUnlocked: e.isFree || vip || purchased.has(e.id),
      // Price only matters for paid episodes (absent for free ones).
      ...(e.isFree || coinPrice === undefined ? {} : { coinPrice }),
    }));

    return NextResponse.json(
      { episodes },
      // isUnlocked is per-viewer, so never let a shared cache store it.
      { headers: { 'Cache-Control': 'private, no-store' } }
    );
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

    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
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
