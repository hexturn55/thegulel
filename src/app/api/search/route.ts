import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim() ?? '';

  if (!q) {
    return NextResponse.json({ series: [] });
  }

  const series = await prisma.series.findMany({
    where: {
      status: 'PUBLISHED',
      OR: [
        { title: { contains: q, mode: 'insensitive' } },
        { titleHi: { contains: q, mode: 'insensitive' } },
        { titleZh: { contains: q, mode: 'insensitive' } },
        { genre: { contains: q, mode: 'insensitive' } },
        { tags: { has: q } },
      ],
    },
    select: {
      id: true,
      title: true,
      titleHi: true,
      titleZh: true,
      description: true,
      thumbnail: true,
      genre: true,
      tags: true,
      totalEpisodes: true,
      freeEpisodes: true,
      coinPrice: true,
      featured: true,
      createdAt: true,
    },
    orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
    take: 20,
  });

  // Optionally log search for analytics (fire-and-forget, don't await)
  let userId: string | undefined;
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();
    if (supabaseUser) {
      const dbUser = await prisma.user.findFirst({
        where: { supabaseId: supabaseUser.id },
        select: { id: true },
      });
      userId = dbUser?.id;
    }
  } catch {
    // Auth errors are non-fatal for search
  }

  prisma.searchLog.create({
    data: {
      query: q,
      userId: userId ?? null,
      results: series.length,
    },
  }).catch((err: unknown) => console.error('SearchLog error:', err));

  return NextResponse.json({ series, total: series.length });
}
