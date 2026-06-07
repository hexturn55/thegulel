import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getProductMapping, type ProductMapping } from '@/lib/revenuecat';

/**
 * POST /api/webhooks/revenuecat
 *
 * Server-to-server webhook from RevenueCat. This is how in-app purchases made
 * on iOS/Android (StoreKit / Play Billing) translate into coins and VIP access,
 * mirroring the Stripe/Razorpay webhooks for web.
 *
 * Auth: RevenueCat sends the exact value configured in the dashboard as the
 * `Authorization` header. Set REVENUECAT_WEBHOOK_SECRET to that value.
 *
 * Idempotency: each credit uses a unique `CoinTransaction.providerRef`
 * (`revenuecat:<event_id>`), so redelivered events credit coins exactly once.
 * `app_user_id` is the Gulel `User.id` (set as RevenueCat's appUserID on login).
 */

interface RevenueCatEvent {
  id: string;
  type: string;
  app_user_id: string;
  product_id?: string;
  original_transaction_id?: string;
  expiration_at_ms?: number | null;
  purchased_at_ms?: number | null;
}

export async function POST(request: NextRequest) {
  const secret = process.env.REVENUECAT_WEBHOOK_SECRET;
  const authHeader = request.headers.get('authorization');
  if (!secret || authHeader !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let payload: { event?: RevenueCatEvent };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const event = payload.event;
  if (!event?.id || !event.type || !event.app_user_id) {
    return NextResponse.json({ error: 'Malformed event' }, { status: 400 });
  }

  const userId = event.app_user_id;
  const mapping = getProductMapping(event.product_id);

  try {
    switch (event.type) {
      // A consumable coin pack or the first/repeat purchase of a VIP sub.
      case 'INITIAL_PURCHASE':
      case 'NON_RENEWING_PURCHASE':
      case 'RENEWAL':
      case 'PRODUCT_CHANGE':
      case 'UNCANCELLATION': {
        if (!mapping) {
          console.warn(`[revenuecat] Unknown product ${event.product_id}; skipping`);
          break;
        }

        if (mapping.kind === 'coins') {
          // Only purchase events grant coins (renewals don't apply to consumables).
          if (event.type === 'INITIAL_PURCHASE' || event.type === 'NON_RENEWING_PURCHASE') {
            await creditCoins(userId, mapping.coins, event.id, event.product_id);
          }
        } else {
          await grantVip(userId, mapping, event);
        }
        break;
      }

      case 'EXPIRATION':
      case 'BILLING_ISSUE': {
        // Revoke VIP once the entitlement actually lapses.
        await expireVip(userId, event);
        break;
      }

      case 'CANCELLATION':
        // User turned off auto-renew but keeps access until EXPIRATION — no-op.
        break;

      default:
        console.log(`[revenuecat] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[revenuecat] handler error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

async function creditCoins(
  userId: string,
  coins: number,
  eventId: string,
  productId?: string,
) {
  try {
    await prisma.$transaction([
      prisma.coinTransaction.create({
        data: {
          userId,
          amount: coins,
          type: 'PURCHASE',
          description: `Purchased ${coins} coins (${productId ?? 'IAP'})`,
          providerRef: `revenuecat:${eventId}`,
        },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { coinBalance: { increment: coins } },
      }),
    ]);
    console.log(`[revenuecat] Credited ${coins} coins to ${userId}`);
  } catch (err) {
    if ((err as { code?: string }).code === 'P2002') {
      console.log(`[revenuecat] Duplicate event ignored: ${eventId}`);
    } else {
      throw err;
    }
  }
}

function subscriptionProviderId(event: RevenueCatEvent): string {
  return event.original_transaction_id ?? `${event.app_user_id}:${event.product_id}`;
}

async function grantVip(
  userId: string,
  mapping: Extract<ProductMapping, { kind: 'vip' }>,
  event: RevenueCatEvent,
) {
  const providerId = subscriptionProviderId(event);
  const startDate = event.purchased_at_ms ? new Date(event.purchased_at_ms) : new Date();
  const endDate = event.expiration_at_ms
    ? new Date(event.expiration_at_ms)
    : new Date(Date.now() + mapping.durationDays * 24 * 60 * 60 * 1000);

  await prisma.subscription.upsert({
    where: { providerId },
    create: {
      userId,
      plan: mapping.plan,
      provider: 'revenuecat',
      providerId,
      status: 'ACTIVE',
      startDate,
      endDate,
    },
    update: { status: 'ACTIVE', startDate, endDate },
  });
  console.log(`[revenuecat] VIP ${mapping.plan} active for ${userId} until ${endDate.toISOString()}`);
}

async function expireVip(userId: string, event: RevenueCatEvent) {
  const providerId = subscriptionProviderId(event);
  await prisma.subscription.updateMany({
    where: { providerId, userId },
    data: { status: 'EXPIRED' },
  });
  console.log(`[revenuecat] VIP expired for ${userId}`);
}
