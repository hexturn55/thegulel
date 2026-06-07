import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * TEMPORARY diagnostic: probes whether each table queries cleanly, to detect a
 * pending schema migration (e.g. Subscription.providerCustomerId /
 * CoinTransaction.providerRef columns missing in production). Remove after use.
 */
export async function GET() {
  const out: Record<string, string> = {};

  const probe = async (name: string, fn: () => Promise<unknown>) => {
    try {
      await fn();
      out[name] = 'ok';
    } catch (e) {
      out[name] = (e as Error).message.replace(/\s+/g, ' ').slice(0, 400);
    }
  };

  await probe('series', () => prisma.series.findFirst());
  await probe('subscription', () => prisma.subscription.findFirst());
  await probe('coinTransaction', () => prisma.coinTransaction.findFirst());

  return NextResponse.json(out);
}
