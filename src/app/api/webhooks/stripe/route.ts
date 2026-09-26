import { NextRequest, NextResponse, after } from 'next/server';
import { stripe } from '@/lib/stripe';
import prisma from '@/lib/prisma';
import Stripe from 'stripe';
import { metaCapiEnabled, sendCheckoutEvent } from '@/lib/meta-capi';
import { getVipPlan, vipPredictedLtv } from '@/lib/vip-plans';

// Marks a subscription whose Meta Subscribe event has been sent, so a
// redelivered checkout.session.completed doesn't report it twice.
const CAPI_MARKER = 'meta_capi_subscribe';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        // VIP subscriptions use mode 'subscription'; coin purchases use 'payment'.
        if (session.mode === 'subscription') {
          const sub = await stripe.subscriptions.retrieve(
            session.subscription as string
          );
          await upsertSubscription(sub);
          console.log(`VIP activated for session ${session.id}`);

          // Server-side Subscribe, after the response so the webhook stays
          // fast. event_id = the checkout session, as on the VIP success page.
          if (metaCapiEnabled(!event.livemode) && !sub.metadata?.[CAPI_MARKER]) {
            after(async () => {
              try {
                await stripe.subscriptions.update(sub.id, { metadata: { [CAPI_MARKER]: '1' } });
              } catch (err) {
                console.error(`[meta-capi] could not mark ${sub.id}; skipping Subscribe:`, err);
                return;
              }
              const plan = getVipPlan(sub.metadata?.plan ?? '');
              const value = (session.amount_total ?? 0) / 100;
              await sendCheckoutEvent({
                eventName: 'Subscribe',
                eventId: `stripe:${session.id}`,
                eventTime: event.created,
                userId: sub.metadata?.userId ?? session.metadata?.userId ?? '',
                metadata: session.metadata,
                contact: session.customer_details ?? undefined,
                value,
                currency: (session.currency ?? 'usd').toUpperCase(),
                contentIds: [`VIP_${plan?.id ?? 'MONTHLY'}`],
                predictedLtv: plan ? vipPredictedLtv(plan, value) : undefined,
                path: '/vip',
                test: !event.livemode,
              });
            });
          }
          break;
        }

        const { userId, coins, packageId } = session.metadata!;
        const amount = parseInt(coins);

        // Idempotent credit: the transaction's `providerRef` is unique, so a
        // replayed/duplicate webhook delivery fails the create with P2002 and
        // the balance increment is rolled back — coins are credited exactly once.
        let credited = false;
        try {
          await prisma.$transaction([
            prisma.coinTransaction.create({
              data: {
                userId,
                amount,
                type: 'PURCHASE',
                description: `Purchased ${coins} coins via Stripe`,
                providerRef: `stripe:${session.id}`,
              },
            }),
            prisma.user.update({
              where: { id: userId },
              data: { coinBalance: { increment: amount } },
            }),
          ]);
          credited = true;
          console.log(`Coins added to user ${userId}: ${coins}`);
        } catch (err) {
          if ((err as { code?: string }).code === 'P2002') {
            console.log(`Duplicate Stripe event ignored: ${session.id}`);
          } else {
            throw err;
          }
        }

        // First (non-duplicate) credit only: server-side Purchase, sent after
        // the response and deduped against the wallet's browser event by the
        // shared providerRef.
        if (credited) {
          after(() =>
            sendCheckoutEvent({
              eventName: 'Purchase',
              eventId: `stripe:${session.id}`,
              eventTime: event.created,
              userId,
              metadata: session.metadata,
              contact: session.customer_details ?? undefined,
              value: (session.amount_total ?? 0) / 100,
              currency: (session.currency ?? 'usd').toUpperCase(),
              contentIds: [packageId],
              path: '/wallet',
              test: !event.livemode,
            })
          );
        }
        break;
      }

      // Renewals, cancellations (cancel_at_period_end), plan changes.
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await upsertSubscription(sub);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.error('Payment failed:', paymentIntent.id);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

type DbStatus = 'ACTIVE' | 'CANCELLED' | 'EXPIRED';

function mapStatus(stripeStatus: Stripe.Subscription.Status): DbStatus {
  switch (stripeStatus) {
    case 'active':
    case 'trialing':
    case 'past_due':
      return 'ACTIVE';
    case 'canceled':
      return 'CANCELLED';
    default:
      return 'EXPIRED';
  }
}

/**
 * Idempotently mirrors a Stripe subscription into our `Subscription` table,
 * keyed on the unique `providerId`. Access is gated on status ACTIVE +
 * endDate, so a `deleted` event (status EXPIRED) revokes VIP cleanly.
 */
async function upsertSubscription(sub: Stripe.Subscription) {
  const userId = sub.metadata?.userId;
  const plan = (sub.metadata?.plan ?? 'MONTHLY') as
    | 'WEEKLY'
    | 'MONTHLY'
    | 'YEARLY';

  if (!userId) {
    console.error(`Subscription ${sub.id} has no userId metadata — skipping`);
    return;
  }

  const status = mapStatus(sub.status);
  // In Stripe API v20 the billing period lives on the subscription item.
  const item = sub.items.data[0];
  const startDate = new Date(item.current_period_start * 1000);
  const endDate = new Date(item.current_period_end * 1000);
  const customerId =
    typeof sub.customer === 'string' ? sub.customer : sub.customer.id;

  await prisma.subscription.upsert({
    where: { providerId: sub.id },
    create: {
      userId,
      plan,
      provider: 'stripe',
      providerId: sub.id,
      providerCustomerId: customerId,
      status,
      startDate,
      endDate,
    },
    update: {
      status,
      endDate,
      startDate,
      providerCustomerId: customerId,
    },
  });
}
