import { NextResponse } from 'next/server';

/**
 * DEPRECATED & DISABLED.
 *
 * This endpoint used to grant coins on the client's say-so, which let anyone
 * mint coins without watching an ad. Rewarded-ad coins are now granted ONLY by
 * Google's verified Server-Side Verification callback — see /api/ads/ssv.
 *
 * Kept as an explicit 410 so any stale client gets a clear signal instead of
 * silently appearing to work.
 */
export async function POST() {
  return NextResponse.json(
    {
      error:
        'Ad rewards are granted automatically after a verified ad. This endpoint is disabled.',
    },
    { status: 410 }
  );
}
