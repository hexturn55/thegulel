import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { episodeId, progress, completed } = await request.json();
    const userId = request.cookies.get('userId')?.value;

    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const watchHistory = await prisma.watchHistory.upsert({
      where: {
        userId_episodeId: {
          userId,
          episodeId,
        },
      },
      update: {
        progress,
        completed,
        watchedAt: new Date(),
      },
      create: {
        userId,
        episodeId,
        progress,
        completed,
      },
    });

    return NextResponse.json({
      success: true,
      watchHistory,
    });
  } catch (error) {
    console.error('Save progress error:', error);
    return NextResponse.json(
      { error: 'Failed to save progress' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.cookies.get('userId')?.value;

    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const history = await prisma.watchHistory.findMany({
      where: { userId },
      orderBy: { watchedAt: 'desc' },
      take: 20,
      include: {
        episode: {
          include: {
            series: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ history });
  } catch (error) {
    console.error('Fetch history error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch history' },
      { status: 500 }
    );
  }
}
