import type { NextRequest } from 'next/server';
import { shortLinkRedirect } from '@/lib/short-links';

/**
 * GET /go/{slug}/{episodeNumber} — short link to a specific episode. Falls
 * back to the series' first free episode when that number doesn't exist.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; episode: string }> }
) {
  const { slug, episode } = await params;
  return shortLinkRedirect(request, slug, episode);
}
