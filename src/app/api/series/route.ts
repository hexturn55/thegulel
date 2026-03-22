import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const genre = searchParams.get('genre');
    const featured = searchParams.get('featured');

    const where: any = {
      status: 'PUBLISHED',
    };

    if (genre && genre !== 'All') {
      where.genre = genre;
    }

    if (featured === 'true') {
      where.featured = true;
    }

    const series = await prisma.series.findMany({
      where,
      orderBy: [
        { featured: 'desc' },
        { createdAt: 'desc' },
      ],
      select: {
        id: true,
        title: true,
        thumbnail: true,
        genre: true,
        totalEpisodes: true,
        featured: true,
      },
    });

    return NextResponse.json({ series });
  } catch (error) {
    console.error('Fetch series error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch series' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const userId = request.cookies.get('userId')?.value;

    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // In production, check if user is admin
    // For now, allow any authenticated user

    const series = await prisma.series.create({
      data: {
        title: data.title,
        titleHi: data.titleHi,
        titleZh: data.titleZh,
        description: data.description,
        descriptionHi: data.descriptionHi,
        descriptionZh: data.descriptionZh,
        thumbnail: data.thumbnail,
        genre: data.genre,
        tags: data.tags || [],
        freeEpisodes: data.freeEpisodes || 5,
        coinPrice: data.coinPrice || 10,
        status: data.status || 'DRAFT',
        featured: data.featured || false,
      },
    });

    return NextResponse.json({ series }, { status: 201 });
  } catch (error) {
    console.error('Create series error:', error);
    return NextResponse.json(
      { error: 'Failed to create series' },
      { status: 500 }
    );
  }
}
