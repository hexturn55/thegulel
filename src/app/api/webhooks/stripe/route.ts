import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import prisma from '@/lib/prisma';
import Stripe from 'stripe';

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
        const { userId, coins } = session.metadata!;
        const amount = parseInt(coins);

        // Idempotent credit: the transaction's `providerRef` is unique, so a
        // replayed/duplicate webhook delivery fails the create with P2002 and
        // the balance increment is rolled back — coins are credited exactly once.
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
          console.log(`Coins added to user ${userId}: ${coins}`);
        } catch (err) {
          if ((err as { code?: string }).code === 'P2002') {
            console.log(`Duplicate Stripe event ignored: ${session.id}`);
          } else {
            throw err;
          }
        }
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
