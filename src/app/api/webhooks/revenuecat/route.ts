import { NextRequest, NextResponse, after } from 'next/server';
import prisma from '@/lib/prisma';
import { getProductMapping, type ProductMapping } from '@/lib/revenuecat';
import { metaCapiEnabled, sendMetaEvent } from '@/lib/meta-capi';

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
 * Events for an app_user_id that isn't a Gulel user (e.g. an anonymous
 * `$RCAnonymousID`) are acknowledged and skipped so RevenueCat stops retrying.
 *
 * Sandbox: NOT skipped — App Review buys with sandbox accounts against the
 * production backend and must see the purchase work. Sandbox credits are
 * tagged "[SANDBOX] " in their descriptions and logged.
 *
 * Refunds: RevenueCat reports a store refund as CANCELLATION with
 * cancel_reason CUSTOMER_SUPPORT. Coins are clawed back (never below zero —
 * any shortfall is recorded in the description) as a negative PURCHASE
 * transaction; a refunded VIP subscription is expired immediately.
 */

interface RevenueCatEvent {
  id: string;
  type: string;
  app_user_id: string;
  product_id?: string;
  original_transaction_id?: string;
  expiration_at_ms?: number | null;
  purchased_at_ms?: number | null;
  /** CANCELLATION only: why (CUSTOMER_SUPPORT = refund). */
  cancel_reason?: string;
  /** "SANDBOX" | "PRODUCTION". */
  environment?: string;
  /** TRANSFER only: app user ids the purchases moved from / to. */
  transferred_from?: string[];
  transferred_to?: string[];
  // Used for the Meta Conversions API event.
  store?: string;
  price?: number | null;
  price_in_purchased_currency?: number | null;
  currency?: string | null;
  subscriber_attributes?: Record<string, { value?: string } | undefined>;
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
  const isTransfer = event?.type === 'TRANSFER';
  if (!event?.id || !event.type || (!event.app_user_id && !isTransfer)) {
    return NextResponse.json({ error: 'Malformed event' }, { status: 400 });
  }

  const userId = event.app_user_id;
  const mapping = getProductMapping(event.product_id);
  const tag = event.environment === 'SANDBOX' ? '[SANDBOX] ' : '';
  if (tag) {
    console.info(`[revenuecat] ${tag}${event.type} ${event.id} for ${userId} (${event.product_id ?? '-'})`);
  }

  try {
    // Never write for a user we don't know (FK failures would make
    // RevenueCat retry forever). TRANSFER resolves its own users below.
    if (!isTransfer) {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
      if (!user) {
        console.warn(`[revenuecat] Unknown app_user_id ${userId} for ${event.type} ${event.id}; skipping`);
        return NextResponse.json({ received: true, skipped: 'unknown user' });
      }
    }

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
            const credited = await creditCoins(userId, mapping.coins, event.id, event.product_id, tag);
            if (credited) after(() => sendAppEvent('Purchase', event));
          }
        } else {
          const activated = await grantVip(userId, mapping, event, tag);
          if (activated && event.type === 'INITIAL_PURCHASE') {
            after(() => sendAppEvent('Subscribe', event));
          }
        }
        break;
      }

      case 'EXPIRATION':
      case 'BILLING_ISSUE': {
        // Revoke VIP once the entitlement actually lapses.
        await expireVip(userId, event);
        break;
      }

      case 'CANCELLATION': {
        // Anything but a refund (e.g. UNSUBSCRIBE) keeps access until
        // EXPIRATION — no-op.
        if (event.cancel_reason !== 'CUSTOMER_SUPPORT') break;
        if (!mapping) {
          console.warn(`[revenuecat] Refund for unknown product ${event.product_id}; skipping`);
          break;
        }
        if (mapping.kind === 'coins') {
          await refundCoins(userId, mapping.coins, event.id, tag);
        } else {
          await prisma.subscription.updateMany({
            where: { providerId: subscriptionProviderId(event) },
            data: { status: 'EXPIRED', endDate: new Date() },
          });
          console.log(`[revenuecat] ${tag}VIP refunded — expired for ${userId}`);
        }
        break;
      }

      case 'TRANSFER':
        await transferVip(event);
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

/** Returns true only for the first (non-duplicate) credit of this event. */
async function creditCoins(
  userId: string,
  coins: number,
  eventId: string,
  productId: string | undefined,
  tag: string,
): Promise<boolean> {
  try {
    await prisma.$transaction([
      prisma.coinTransaction.create({
        data: {
          userId,
          amount: coins,
          type: 'PURCHASE',
          description: `${tag}Purchased ${coins} coins (${productId ?? 'IAP'})`,
          providerRef: `revenuecat:${eventId}`,
        },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { coinBalance: { increment: coins } },
      }),
    ]);
    console.log(`[revenuecat] ${tag}Credited ${coins} coins to ${userId}`);
    return true;
  } catch (err) {
    if ((err as { code?: string }).code === 'P2002') {
      console.log(`[revenuecat] Duplicate event ignored: ${eventId}`);
      return false;
    }
    throw err;
  }
}

function subscriptionProviderId(event: RevenueCatEvent): string {
  return event.original_transaction_id ?? `${event.app_user_id}:${event.product_id}`;
}

/** Returns true when this event moved the subscription into ACTIVE. */
async function grantVip(
  userId: string,
  mapping: Extract<ProductMapping, { kind: 'vip' }>,
  event: RevenueCatEvent,
  tag: string,
): Promise<boolean> {
  const providerId = subscriptionProviderId(event);
  const before = await prisma.subscription.findUnique({
    where: { providerId },
    select: { status: true },
  });
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
  console.log(`[revenuecat] ${tag}VIP ${mapping.plan} active for ${userId} until ${endDate.toISOString()}`);
  return before?.status !== 'ACTIVE';
}

/**
 * Server-side Purchase / Subscribe for an in-app purchase (action_source
 * 'app'), keyed on the same `revenuecat:<event id>` reference the credit uses.
 * Don't also enable RevenueCat's own Meta integration for these events, or
 * they'd be counted twice.
 */
async function sendAppEvent(eventName: 'Purchase' | 'Subscribe', event: RevenueCatEvent) {
  const test = event.environment === 'SANDBOX';
  if (!metaCapiEnabled(test)) return;
  const platform =
    event.store === 'APP_STORE' || event.store === 'MAC_APP_STORE'
      ? 'ios'
      : event.store === 'PLAY_STORE' || event.store === 'AMAZON'
        ? 'android'
        : null;
  if (!platform) return; // promotional grants, web billing, etc. aren't app purchases

  const attr = (key: string) => event.subscriber_attributes?.[key]?.value || undefined;
  let account: { email: string | null; phone: string | null } | null = null;
  try {
    account = await prisma.user.findUnique({
      where: { id: event.app_user_id },
      select: { email: true, phone: true },
    });
  } catch (err) {
    console.error('[revenuecat] user lookup for Meta failed:', err);
  }

  const localPrice = event.price_in_purchased_currency;
  const hasLocalPrice = typeof localPrice === 'number' && !!event.currency;
  await sendMetaEvent({
    eventName,
    eventId: `revenuecat:${event.id}`,
    eventTime: event.purchased_at_ms ? Math.floor(event.purchased_at_ms / 1000) : undefined,
    value: hasLocalPrice ? localPrice : (event.price ?? undefined),
    currency: hasLocalPrice ? event.currency! : 'USD',
    contentIds: event.product_id ? [event.product_id] : undefined,
    user: {
      email: [attr('$email'), account?.email],
      phone: [attr('$phoneNumber'), account?.phone],
      externalId: event.app_user_id,
      clientIp: attr('$ip'),
      anonId: attr('$fbAnonymousId'),
      madid: platform === 'ios' ? attr('$idfa') : attr('$gpsAdId'),
    },
    actionSource: 'app',
    app: {
      platform,
      // iOS: only with App Tracking Transparency consent. Android: when an
      // advertising id was collected (i.e. the user hasn't opted out).
      trackingEnabled:
        platform === 'ios' ? attr('$attConsentStatus') === 'authorized' : !!attr('$gpsAdId'),
    },
    test,
  });
}

async function expireVip(userId: string, event: RevenueCatEvent) {
  const providerId = subscriptionProviderId(event);
  await prisma.subscription.updateMany({
    where: { providerId, userId },
    data: { status: 'EXPIRED' },
  });
  console.log(`[revenuecat] VIP expired for ${userId}`);
}

class BalanceChanged extends Error {}

/**
 * Claw back refunded coins. Debits min(balance, coins) — the balance never
 * goes negative (DB CHECK coinBalance >= 0); coins already spent are recorded
 * as a shortfall. Recorded as a negative PURCHASE transaction (the schema has
 * no refund type), idempotent on `revenuecat:refund:<event_id>`.
 */
async function refundCoins(userId: string, coins: number, eventId: string, tag: string) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const { debit, shortfall } = await prisma.$transaction(async (tx) => {
        const u = await tx.user.findUnique({ where: { id: userId }, select: { coinBalance: true } });
        const balance = Math.max(0, u?.coinBalance ?? 0);
        const debit = Math.min(balance, coins);
        const shortfall = coins - debit;
        // Insert first: a redelivered event fails here (P2002) before any debit.
        await tx.coinTransaction.create({
          data: {
            userId,
            amount: -debit,
            type: 'PURCHASE',
            description: `${tag}Refund of ${coins} coins${shortfall ? ` (shortfall ${shortfall})` : ''}`,
            providerRef: `revenuecat:refund:${eventId}`,
          },
        });
        if (debit > 0) {
          const res = await tx.user.updateMany({
            where: { id: userId, coinBalance: { gte: debit } },
            data: { coinBalance: { decrement: debit } },
          });
          // Balance was spent concurrently — roll back and recompute.
          if (res.count === 0) throw new BalanceChanged();
        }
        return { debit, shortfall };
      });
      console.log(
        `[revenuecat] ${tag}Refunded ${debit}/${coins} coins from ${userId}` +
          (shortfall ? ` (shortfall ${shortfall})` : '')
      );
      return;
    } catch (err) {
      if (err instanceof BalanceChanged) continue;
      if ((err as { code?: string }).code === 'P2002') {
        console.log(`[revenuecat] Duplicate refund event ignored: ${eventId}`);
        return;
      }
      throw err;
    }
  }
  throw new Error(`[revenuecat] refund ${eventId}: balance kept changing; will retry`);
}

/**
 * TRANSFER: the store account's purchases moved between app users (e.g. a
 * restore on a different Gulel login). Move ACTIVE RevenueCat VIP
 * subscriptions from the Gulel users in `transferred_from` to the first Gulel
 * user in `transferred_to`. Anonymous RevenueCat ids are ignored.
 */
async function transferVip(event: RevenueCatEvent) {
  const fromIds = (event.transferred_from ?? []).filter(Boolean);
  const toIds = (event.transferred_to ?? []).filter(Boolean);
  if (fromIds.length === 0 || toIds.length === 0) {
    console.warn(`[revenuecat] TRANSFER ${event.id} without from/to ids; skipping`);
    return;
  }

  const known = await prisma.user.findMany({
    where: { id: { in: [...fromIds, ...toIds] } },
    select: { id: true },
  });
  const knownIds = new Set(known.map((u) => u.id));
  const target = toIds.find((id) => knownIds.has(id));
  const sources = fromIds.filter((id) => knownIds.has(id) && id !== target);
  if (!target || sources.length === 0) {
    console.warn(`[revenuecat] TRANSFER ${event.id}: no Gulel users to move between; skipping`);
    return;
  }

  const moved = await prisma.subscription.updateMany({
    where: { userId: { in: sources }, status: 'ACTIVE', provider: 'revenuecat' },
    data: { userId: target },
  });
  console.log(
    `[revenuecat] TRANSFER ${event.id}: moved ${moved.count} VIP subscription(s) from ${sources.join(',')} to ${target}`
  );
}
