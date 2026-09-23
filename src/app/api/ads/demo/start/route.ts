import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { demoAdsEnabled, issueAdToken } from '@/lib/ad-demo';

export const dynamic = 'force-dynamic';

/** POST /api/ads/demo/start — issue a single-use ad-session token. */
export async function POST() {
  if (!demoAdsEnabled()) {
    return NextResponse.json({ error: 'Demo ads disabled' }, { status: 409 });
  }
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  return NextResponse.json({ token: issueAdToken(user.id) });
}
