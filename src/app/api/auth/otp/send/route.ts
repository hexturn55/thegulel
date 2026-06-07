import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/auth/otp/send
 *
 * Compatibility shim. Phone OTP is sent by the Supabase client directly from
 * the browser/app via `supabase.auth.signInWithOtp({ phone })` (Supabase sends
 * the SMS through the provider configured under Authentication → Phone).
 * This route only validates the number and points callers at the client SDK.
 */
export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json();

    if (!phone || !phone.match(/^\+?[1-9]\d{1,14}$/)) {
      return NextResponse.json(
        { error: 'Invalid phone number. Include country code, e.g. +91XXXXXXXXXX' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Use the Supabase client signInWithOtp({ phone }) from the browser/app.',
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 });
  }
}
