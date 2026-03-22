import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; episodeId: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { episodeId } = await params;
  try {
    const body = await request.json();
    const episode = await prisma.episode.update({
      where: { id: episodeId },
      data: body,
    });
    return NextResponse.json({ episode });
  } catch (error) {
    console.error('Update episode error:', error);
    return NextResponse.json({ error: 'Failed to update episode' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; episodeId: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: seriesId, episodeId } = await params;
  try {
    await prisma.episode.delete({ where: { id: episodeId } });

    // Decrement totalEpisodes on series
    await prisma.series.update({
      where: { id: seriesId },
      data: { totalEpisodes: { decrement: 1 } },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete episode error:', error);
    return NextResponse.json({ error: 'Failed to delete episode' }, { status: 500 });
  }
}
