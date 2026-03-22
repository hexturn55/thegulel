import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const limit = parseInt(searchParams.get('limit') ?? '20', 10);
  const search = searchParams.get('search') ?? '';
  const status = searchParams.get('status') ?? '';

  const where: Record<string, unknown> = {};
  if (search) {
    where.title = { contains: search, mode: 'insensitive' };
  }
  if (status) {
    where.status = status;
  }

  const [series, total] = await Promise.all([
    prisma.series.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { episodes: true } } },
    }),
    prisma.series.count({ where }),
  ]);

  return NextResponse.json({
    series,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      title, titleHi, titleZh,
      description, descriptionHi, descriptionZh,
      thumbnail, genre, tags,
      freeEpisodes, coinPrice, status, featured,
    } = body;

    if (!title || !description || !thumbnail || !genre) {
      return NextResponse.json(
        { error: 'title, description, thumbnail, and genre are required' },
        { status: 400 }
      );
    }

    const series = await prisma.series.create({
      data: {
        title, titleHi, titleZh,
        description, descriptionHi, descriptionZh,
        thumbnail, genre,
        tags: tags ?? [],
        freeEpisodes: freeEpisodes ?? 5,
        coinPrice: coinPrice ?? 10,
        status: status ?? 'DRAFT',
        featured: featured ?? false,
      },
    });

    return NextResponse.json({ series }, { status: 201 });
  } catch (error) {
    console.error('Create series error:', error);
    return NextResponse.json({ error: 'Failed to create series' }, { status: 500 });
  }
}
