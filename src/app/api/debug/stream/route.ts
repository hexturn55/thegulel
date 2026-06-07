import { NextRequest, NextResponse } from 'next/server';
import { getSignedStreamUrl, getStreamUrl } from '@/lib/cloudflare';

export const dynamic = 'force-dynamic';

/**
 * TEMPORARY diagnostic: reports a Cloudflare Stream video's real settings and
 * the true manifest HTTP status, run from the Vercel server (which has network
 * access + the API token). Used to find why playback fails. Remove after use.
 */
export async function GET(request: NextRequest) {
  const videoId =
    request.nextUrl.searchParams.get('videoId') ||
    '01571b55582229d31ec1c7387bc58366';

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  // 1. Real video settings via the Stream API
  let settings: unknown = null;
  if (accountId && apiToken) {
    try {
      const r = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/${videoId}`,
        { headers: { Authorization: `Bearer ${apiToken}` }, cache: 'no-store' }
      );
      const j = await r.json();
      const v = j?.result;
      settings = v
        ? {
            status: v.status?.state,
            readyToStream: v.readyToStream,
            requireSignedURLs: v.requireSignedURLs,
            allowedOrigins: v.allowedOrigins,
            duration: v.duration,
            apiOk: j?.success,
            apiErrors: j?.errors,
          }
        : { apiOk: j?.success, apiErrors: j?.errors };
    } catch (e) {
      settings = { error: String(e) };
    }
  }

  // 2. True manifest status (signed + unsigned), fetched server-side
  async function probe(url: string | null) {
    if (!url) return { url: null };
    try {
      const r = await fetch(url, { cache: 'no-store' });
      return {
        status: r.status,
        denyReason: r.headers.get('x-deny-reason'),
        server: r.headers.get('server'),
      };
    } catch (e) {
      return { error: String(e) };
    }
  }

  const signedUrl = await getSignedStreamUrl(videoId);

  return NextResponse.json({
    videoId,
    creds: { account: !!accountId, apiToken: !!apiToken },
    subdomain: process.env.NEXT_PUBLIC_CLOUDFLARE_CUSTOMER_SUBDOMAIN ?? null,
    settings,
    signedMinted: !!signedUrl,
    signed: await probe(signedUrl),
    unsigned: await probe(getStreamUrl(videoId)),
  });
}
