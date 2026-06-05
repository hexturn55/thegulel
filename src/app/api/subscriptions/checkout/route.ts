import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getAuthUser } from '@/lib/auth';
import { getVipPlan } from '@/lib/vip-plans';

/**
 * POST /api/subscriptions/checkout
 * Starts a recurring Stripe Checkout session for a VIP plan. The webhook
 * (`/api/webhooks/stripe`) activates the Subscription record on completion.
 */
export async function POST(request: NextRequest) {
  try {
    const { plan: planId, currency = 'USD' } = await request.json();

    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const plan = getVipPlan(planId);
    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    const isUSD = currency === 'USD';
    const price = isUSD ? plan.priceUSD : plan.priceINR;

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: plan.name,
              description: 'Gulel VIP — unlimited access, no coins needed',
            },
            unit_amount: Math.round(price * 100),
            recurring: { interval: plan.interval },
          },
          quantity: 1,
        },
      ],
      // Carry identity on both the session and the subscription so later
      // subscription lifecycle webhooks can resolve the user and plan.
      metadata: { userId: user.id, plan: plan.id, kind: 'vip' },
      subscription_data: {
        metadata: { userId: user.id, plan: plan.id, kind: 'vip' },
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/vip?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/vip?canceled=true`,
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error('VIP checkout error:', error);
    return NextResponse.json({ error: 'Checkout failed' }, { status: 500 });
  }
}
