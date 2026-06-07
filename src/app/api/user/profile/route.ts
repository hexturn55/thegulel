import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseUser } from '@/lib/supabase-server';
import prisma from '@/lib/prisma';

/**
 * GET /api/user/profile
 * Returns the current authenticated user's full profile.
 */
export async function GET(request: NextRequest) {
  const supabaseUser = await getSupabaseUser();

  if (!supabaseUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { supabaseId: supabaseUser.id },
          ...(supabaseUser.email ? [{ email: supabaseUser.email }] : []),
          ...(supabaseUser.phone ? [{ phone: supabaseUser.phone }] : []),
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        locale: true,
        provider: true,
        coinBalance: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('GET /api/user/profile error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

/**
 * PATCH /api/user/profile
 * Update name, locale, or avatar for the current user.
 */
export async function PATCH(request: NextRequest) {
  const supabaseUser = await getSupabaseUser();

  if (!supabaseUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { name?: string; locale?: string; avatar?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { name, locale, avatar } = body;

  // Build update payload — only include fields that were provided
  const updateData: Record<string, string> = {};
  if (name !== undefined) updateData.name = name;
  if (locale !== undefined) updateData.locale = locale;
  if (avatar !== undefined) updateData.avatar = avatar;

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  try {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { supabaseId: supabaseUser.id },
          ...(supabaseUser.email ? [{ email: supabaseUser.email }] : []),
          ...(supabaseUser.phone ? [{ phone: supabaseUser.phone }] : []),
        ],
      },
      select: { id: true },
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const updated = await prisma.user.update({
      where: { id: existingUser.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        locale: true,
        provider: true,
        coinBalance: true,
        createdAt: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('PATCH /api/user/profile error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
