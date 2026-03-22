import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import prisma from '@/lib/prisma';

/**
 * GET /api/user/preferences
 * Returns the current user's preferences (locale + hardcoded notification defaults).
 */
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user: supabaseUser },
  } = await supabase.auth.getUser();

  if (!supabaseUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const dbUser = await prisma.user.findFirst({
      where: {
        OR: [
          { supabaseId: supabaseUser.id },
          ...(supabaseUser.email ? [{ email: supabaseUser.email }] : []),
          ...(supabaseUser.phone ? [{ phone: supabaseUser.phone }] : []),
        ],
      },
      select: { locale: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      locale: dbUser.locale,
      notifications: true, // hardcoded for now
    });
  } catch (error) {
    console.error('GET /api/user/preferences error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

/**
 * PATCH /api/user/preferences
 * Updates user locale.
 *
 * Body: { locale: "en" | "hi" | "zh" }
 */
export async function PATCH(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user: supabaseUser },
  } = await supabase.auth.getUser();

  if (!supabaseUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { locale?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const validLocales = ['en', 'hi', 'zh'];
  if (!body.locale || !validLocales.includes(body.locale)) {
    return NextResponse.json(
      { error: `locale must be one of: ${validLocales.join(', ')}` },
      { status: 400 }
    );
  }

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

    const updated = await prisma.user.update({
      where: { id: dbUser.id },
      data: { locale: body.locale },
      select: { locale: true },
    });

    return NextResponse.json({
      locale: updated.locale,
      notifications: true,
    });
  } catch (error) {
    console.error('PATCH /api/user/preferences error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
