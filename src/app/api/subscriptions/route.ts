import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { getActiveSubscription } from '@/lib/subscription';

/**
 * GET /api/subscriptions
 * Returns the caller's active VIP subscription (or `{ subscription: null }`).
 */
export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const subscription = await getActiveSubscription(user.id);

  return NextResponse.json({
    subscription: subscription
      ? {
          plan: subscription.plan,
          status: subscription.status,
          endDate: subscription.endDate,
        }
      : null,
    isVip: subscription !== null,
  });
}
