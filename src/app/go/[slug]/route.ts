import type { NextRequest } from 'next/server';
import { shortLinkRedirect } from '@/lib/short-links';

/**
 * GET /go/{slug} — short link to a series' first free episode.
 * `{slug}` is the slugified title or an alias (see SERIES_ALIASES); unknown
 * slugs land on the /go link-in-bio page. Query params are preserved.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  return shortLinkRedirect(request, slug);
}
