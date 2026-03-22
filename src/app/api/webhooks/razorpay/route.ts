import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'No signature' },
        { status: 400 }
      );
    }

    // Verify Razorpay signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    const event = JSON.parse(body);

    switch (event.event) {
      case 'payment.captured': {
        const payment = event.payload.payment.entity;
        const { userId, coins } = payment.notes;

        // Add coins to user balance
        await prisma.user.update({
          where: { id: userId },
          data: {
            coinBalance: {
              increment: parseInt(coins),
            },
          },
        });

        // Log transaction
        await prisma.coinTransaction.create({
          data: {
            userId,
            amount: parseInt(coins),
            type: 'PURCHASE',
            description: `Purchased ${coins} coins via Razorpay`,
          },
        });

        console.log(`Coins added to user ${userId}: ${coins}`);
        break;
      }

      case 'payment.failed': {
        const payment = event.payload.payment.entity;
        console.error('Razorpay payment failed:', payment.id);
        break;
      }

      default:
        console.log(`Unhandled Razorpay event: ${event.event}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Razorpay webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
