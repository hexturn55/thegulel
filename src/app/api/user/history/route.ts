import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import prisma from '@/lib/prisma';

/**
 * GET /api/user/history
 * Returns paginated watch history for the current user,
 * including episode and series info.
 *
 * Query params:
 *   page  — page number (default: 1)
 *   limit — items per page (default: 20)
 */
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user: supabaseUser },
  } = await supabase.auth.getUser();

  if (!supabaseUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));
  const skip = (page - 1) * limit;

  try {
    const dbUser = await prisma.user.findFirst({
      where: {
        OR: [
          { supabaseId: supabaseUser.id },
          ...(supabaseUser.email ? [{ email: supabaseUser.email }] : []),
          ...(supabaseUser.phone ? [{ phone: supabaseUser.phone }] : []),
        ],
      },
      select: { id: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const [history, total] = await Promise.all([
      prisma.watchHistory.findMany({
        where: { userId: dbUser.id },
        orderBy: { watchedAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          progress: true,
          completed: true,
          watchedAt: true,
          episode: {
            select: {
              id: true,
              title: true,
              thumbnail: true,
              duration: true,
              episodeNumber: true,
              series: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
          },
        },
      }),
      prisma.watchHistory.count({ where: { userId: dbUser.id } }),
    ]);

    // Flatten to a clean response shape
    const items = history.map((h) => ({
      id: h.id,
      progress: h.progress,
      completed: h.completed,
      watchedAt: h.watchedAt,
      episodeId: h.episode.id,
      episodeTitle: h.episode.title,
      episodeNumber: h.episode.episodeNumber,
      thumbnail: h.episode.thumbnail,
      duration: h.episode.duration,
      seriesId: h.episode.series.id,
      seriesTitle: h.episode.series.title,
    }));

    return NextResponse.json({
      history: items,
      total,
      page,
      limit,
      hasMore: skip + history.length < total,
    });
  } catch (error) {
    console.error('GET /api/user/history error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
