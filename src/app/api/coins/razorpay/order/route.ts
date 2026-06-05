import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

/**
 * POST /api/coins/razorpay/order
 * Creates a Razorpay order for an INR coin-package purchase.
 *
 * Uses the Razorpay REST API directly (no SDK dependency). The order's
 * `notes` carry the userId/coins that the webhook
 * (`/api/webhooks/razorpay`) reads to credit coins after `payment.captured`.
 *
 * Env-gated: returns 503 if Razorpay keys are not configured, so the client
 * can fall back to Stripe.
 */
export async function POST(request: NextRequest) {
  try {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return NextResponse.json(
        { error: 'Razorpay is not configured' },
        { status: 503 }
      );
    }

    const { packageId } = await request.json();

    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const pkg = await prisma.coinPackage.findUnique({
      where: { id: packageId, active: true },
    });

    if (!pkg) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 });
    }

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');

    const res = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(pkg.priceINR * 100), // paise
        currency: 'INR',
        receipt: `coins_${pkg.id}_${user.id}`.slice(0, 40),
        notes: {
          userId: user.id,
          packageId: pkg.id,
          coins: pkg.coins.toString(),
        },
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      console.error('Razorpay order creation failed:', detail);
      return NextResponse.json(
        { error: 'Failed to create order' },
        { status: 502 }
      );
    }

    const order = await res.json();

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId,
      name: pkg.name,
      coins: pkg.coins,
    });
  } catch (error) {
    console.error('Razorpay order error:', error);
    return NextResponse.json({ error: 'Order failed' }, { status: 500 });
  }
}
