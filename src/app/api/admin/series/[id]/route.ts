import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const series = await prisma.series.findUnique({
    where: { id },
    include: {
      episodes: { orderBy: { episodeNumber: 'asc' } },
      _count: { select: { episodes: true } },
    },
  });

  if (!series) {
    return NextResponse.json({ error: 'Series not found' }, { status: 404 });
  }

  return NextResponse.json({ series });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  try {
    const body = await request.json();
    const series = await prisma.series.update({
      where: { id },
      data: body,
    });
    return NextResponse.json({ series });
  } catch (error) {
    console.error('Update series error:', error);
    return NextResponse.json({ error: 'Failed to update series' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  try {
    // Episodes cascade via schema onDelete: Cascade
    await prisma.series.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete series error:', error);
    return NextResponse.json({ error: 'Failed to delete series' }, { status: 500 });
  }
}
