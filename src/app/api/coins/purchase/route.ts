import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { packageId, currency = 'USD' } = await request.json();

    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get coin package
    const pkg = await prisma.coinPackage.findUnique({
      where: { id: packageId, active: true },
    });

    if (!pkg) {
      return NextResponse.json(
        { error: 'Package not found' },
        { status: 404 }
      );
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: pkg.name,
              description: `${pkg.coins} Gulel Coins`,
            },
            unit_amount:
              Math.round(
                (currency === 'USD' ? pkg.priceUSD : pkg.priceINR) * 100
              ),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/wallet?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/wallet?canceled=true`,
      metadata: {
        userId: user.id,
        packageId: pkg.id,
        coins: pkg.coins.toString(),
      },
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error('Coin purchase error:', error);
    return NextResponse.json(
      { error: 'Purchase failed' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const packages = await prisma.coinPackage.findMany({
      where: { active: true },
      orderBy: { coins: 'asc' },
    });

    return NextResponse.json({ packages });
  } catch (error) {
    console.error('Fetch packages error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch packages' },
      { status: 500 }
    );
  }
}
