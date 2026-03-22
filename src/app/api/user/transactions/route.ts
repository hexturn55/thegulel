import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import prisma from '@/lib/prisma';

/**
 * GET /api/user/transactions
 * Returns paginated coin transaction history for the current user.
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

    const [transactions, total] = await Promise.all([
      prisma.coinTransaction.findMany({
        where: { userId: dbUser.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          amount: true,
          type: true,
          description: true,
          createdAt: true,
        },
      }),
      prisma.coinTransaction.count({ where: { userId: dbUser.id } }),
    ]);

    return NextResponse.json({
      transactions,
      total,
      page,
      limit,
      hasMore: skip + transactions.length < total,
    });
  } catch (error) {
    console.error('GET /api/user/transactions error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
