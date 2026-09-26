import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { syncPrismaUser } from '@/lib/sync-user';

/**
 * POST /api/auth/otp/verify
 *
 * Legacy server-side verify. The login page now uses supabase.auth.verifyOtp()
 * directly on the client, then redirects to /auth/callback for DB sync.
 *
 * This route handles cases where verification + DB sync need to happen server-side.
 */
export async function POST(request: NextRequest) {
  try {
    const { phone, token } = await request.json();

    if (!phone || !token) {
      return NextResponse.json(
        { error: 'Phone and token are required' },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    // Verify OTP with Supabase
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms',
    });

    if (error || !data.user) {
      return NextResponse.json(
        { error: error?.message ?? 'Invalid or expired code' },
        { status: 400 }
      );
    }

    // Find or create the Prisma user (welcome bonus for new users unless the
    // phone belongs to a deleted account; legacy phone-only records get their
    // supabaseId backfilled).
    const user = await syncPrismaUser(
      { ...data.user, phone: data.user.phone || phone },
      { provider: 'phone' }
    );

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json({ error: 'Failed to verify OTP' }, { status: 500 });
  }
}
