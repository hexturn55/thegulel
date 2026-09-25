import { NextRequest, NextResponse } from 'next/server';
import {
  INVESTOR_COOKIE,
  checkInvestorCode,
  investorCookieValue,
  investorDashboardEnabled,
} from '@/lib/investor-metrics';

/**
 * POST /api/investors/access — exchange the investor access code for a
 * signed, httpOnly cookie. Works as a plain HTML form post (no client JS).
 * DELETE (or POST with action=logout) clears it.
 */
export async function POST(request: NextRequest) {
  const form = await request.formData().catch(() => null);
  const dashboard = new URL('/investors/dashboard', request.url);

  if (form?.get('action') === 'logout') return logout(dashboard);

  const code = String(form?.get('code') ?? '');
  if (!investorDashboardEnabled() || !checkInvestorCode(code)) {
    // Flat delay blunts online guessing; the code itself should be long.
    await new Promise((r) => setTimeout(r, 750));
    dashboard.searchParams.set('e', '1');
    return NextResponse.redirect(dashboard, 303);
  }

  const res = NextResponse.redirect(dashboard, 303);
  res.cookies.set(INVESTOR_COOKIE, investorCookieValue()!, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 14,
  });
  return res;
}

export async function DELETE(request: NextRequest) {
  return logout(new URL('/investors/dashboard', request.url));
}

function logout(to: URL) {
  const res = NextResponse.redirect(to, 303);
  res.cookies.delete(INVESTOR_COOKIE);
  return res;
}
