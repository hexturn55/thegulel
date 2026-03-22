import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const packages = await prisma.coinPackage.findMany({
      where: { active: true },
      orderBy: { coins: 'asc' },
    });
    return NextResponse.json({ packages });
  } catch (error) {
    console.error('Fetch packages error:', error);
    return NextResponse.json({ error: 'Failed to fetch packages' }, { status: 500 });
  }
}
