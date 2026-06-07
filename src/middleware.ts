import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Routes that require authentication
const PROTECTED_ROUTES = ['/profile', '/wallet', '/admin'];

// Cross-origin allowlist for the JSON API (comma-separated origins, or "*").
// Native mobile sends no Origin header (no CORS needed); this is for the Expo
// web preview and any first-party web client on another origin. Empty = same
// origin only (secure default).
const ALLOWED_ORIGINS = (process.env.CORS_ALLOWED_ORIGINS ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

function applyCors(origin: string | null, res: NextResponse): NextResponse {
  if (origin && (ALLOWED_ORIGINS.includes('*') || ALLOWED_ORIGINS.includes(origin))) {
    res.headers.set('Access-Control-Allow-Origin', origin);
    res.headers.set('Vary', 'Origin');
    res.headers.set('Access-Control-Allow-Credentials', 'true');
    res.headers.set('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
    res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.headers.set('Access-Control-Max-Age', '86400');
  }
  return res;
}

export async function middleware(request: NextRequest) {
  const { pathname: earlyPath } = request.nextUrl;

  // API requests: handle CORS and return early — keep the auth-server round
  // trip off the API hot path (routes authenticate themselves).
  if (earlyPath.startsWith('/api')) {
    const origin = request.headers.get('origin');
    if (request.method === 'OPTIONS') {
      return applyCors(origin, new NextResponse(null, { status: 204 }));
    }
    return applyCors(origin, NextResponse.next());
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const pathname = request.nextUrl.pathname;
  const isProtected = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtected) {
    // Only here do we pay for a full auth-server validation, and gate access.
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(loginUrl);
    }
  } else {
    // Public pages: refresh the session cookie from the token without a
    // round-trip to the auth server on every request (getSession only calls
    // the network when the token actually needs refreshing).
    await supabase.auth.getSession();
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    // API: only for the early CORS branch above (no auth-server work).
    '/api/:path*',
    /*
     * Match all other request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
