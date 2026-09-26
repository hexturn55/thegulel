import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { readAttribution } from '@/lib/attribution';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/** Prisma's "table does not exist": the SeriesAlert migration isn't applied yet. */
const tableMissing = (err: unknown) => (err as { code?: string }).code === 'P2021';

/**
 * "Notify me when the next episode drops" for one series.
 *
 *   GET    → { available, signedIn, subscribed }
 *   POST   { afterEpisode } → subscribe (idempotent; keeps the first opt-in)
 *   DELETE → unsubscribe
 *
 * `available: false` means the SeriesAlert table hasn't been migrated yet, so
 * the player hides the button instead of showing an error.
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  try {
    const user = await getAuthUser();
    if (!user) {
      // Probe the table so a signed-out viewer isn't sent to log in for a
      // button that can't save yet.
      await prisma.seriesAlert.findFirst({ where: { seriesId: id }, select: { id: true } });
      return NextResponse.json({ available: true, signedIn: false, subscribed: false });
    }
    const row = await prisma.seriesAlert.findUnique({
      where: { userId_seriesId: { userId: user.id, seriesId: id } },
      select: { id: true },
    });
    return NextResponse.json({ available: true, signedIn: true, subscribed: !!row });
  } catch (err) {
    if (tableMissing(err)) return NextResponse.json({ available: false, signedIn: false, subscribed: false });
    console.error('[notify] lookup failed:', err);
    return NextResponse.json({ error: 'Lookup failed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { afterEpisode?: unknown } | null;
  const after = Number(body?.afterEpisode);
  const afterEpisode = Number.isInteger(after) && after > 0 && after < 10_000 ? after : 0;

  try {
    const series = await prisma.series.findFirst({
      where: { id, status: 'PUBLISHED' },
      select: { id: true },
    });
    if (!series) {
      return NextResponse.json({ error: 'Series not found' }, { status: 404 });
    }

    // Which campaign brought this viewer, so season demand can be read per campaign.
    const campaign = readAttribution(request.cookies).lastTouch?.utm_campaign;
    await prisma.seriesAlert.upsert({
      where: { userId_seriesId: { userId: user.id, seriesId: id } },
      update: {},
      create: {
        userId: user.id,
        seriesId: id,
        afterEpisode,
        source: campaign ? campaign.slice(0, 120) : null,
      },
    });
    return NextResponse.json({ available: true, signedIn: true, subscribed: true });
  } catch (err) {
    if (tableMissing(err)) {
      return NextResponse.json({ error: 'Not available yet' }, { status: 503 });
    }
    console.error('[notify] subscribe failed:', err);
    return NextResponse.json({ error: 'Could not save' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  try {
    await prisma.seriesAlert.deleteMany({ where: { userId: user.id, seriesId: id } });
    return NextResponse.json({ available: true, signedIn: true, subscribed: false });
  } catch (err) {
    if (tableMissing(err)) {
      return NextResponse.json({ error: 'Not available yet' }, { status: 503 });
    }
    console.error('[notify] unsubscribe failed:', err);
    return NextResponse.json({ error: 'Could not save' }, { status: 500 });
  }
}
