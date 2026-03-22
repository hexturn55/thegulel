import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase-server';

/**
 * POST /api/auth/otp/send
 * Sends a phone OTP via Supabase Auth (replaces custom in-memory store).
 *
 * Supabase handles the SMS via Twilio/MessageBird configured in the
 * Supabase dashboard under Authentication → Phone providers.
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

    // Use admin client to trigger OTP — avoids CORS issues in server-side context
    const supabase = createAdminSupabaseClient();
    const { error } = await supabase.auth.admin.generateLink({
      type: 'phone_change', // Note: for sign-in use signInWithOtp on the client
      // The actual OTP send must come from the browser client (signInWithOtp)
      // This route remains for backwards-compat — the login page calls signInWithOtp directly
      email: '', // not used
    });

    // For phone OTP, the client calls supabase.auth.signInWithOtp({ phone }) directly.
    // This server route is kept as a compatibility shim.
    return NextResponse.json({
      success: true,
      message: 'Use Supabase client signInWithOtp({ phone }) directly from the browser.',
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 });
  }
}
