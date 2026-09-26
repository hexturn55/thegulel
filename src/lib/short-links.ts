import { NextResponse, type NextRequest } from 'next/server';
import prisma from './prisma';

/**
 * Short links for social bios, Shorts pinned comments and WhatsApp captions:
 * `thegulel.com/go/{slug}` opens the series' first free episode, where
 * `{slug}` is the slugified title or one of the short aliases below.
 */

/** Short alias → full title slug. Printed on graphics and typed from Shorts. */
export const SERIES_ALIASES: Record<string, string> = {
  pishachini: 'pishachini-the-healer',
  bride: 'the-substitute-bride',
  ceo: 'ceos-hidden-identity',
  mafia: 'the-mafia-lords-bride',
  stepmom: 'my-stepmothers-lies',
  alliance: 'the-secret-alliance',
  doctor: 'medical-genius',
  revenge: 'the-billionaires-revenge',
  wife: 'the-ceos-hidden-wife',
  weddings: 'three-weddings',
  whispers: 'whispers-in-the-dark',
  vows: 'broken-vows',
  forbidden: 'forbidden-love',
  obsession: 'midnight-obsession',
  heart: 'million-dollar-heart',
  fate: 'bound-by-fate',
  empress: 'the-last-empress',
  dragon: 'dragons-blood',
  beijing: 'love-in-beijing',
  heir: 'revenge-of-the-heir',
  shanghai: 'love-in-shanghai',
  mafiaking: 'mafia-kings-heart',
  palace: 'imperial-palace-secrets',
};

/** The flagship series featured at the top of /go. */
export const FLAGSHIP_SLUG = 'pishachini-the-healer';

// Same guard as /api/series: the leftover seed/demo duplicate of "The Secret
// Alliance" stays out of the catalog (and must not win the `alliance` slug).
export const HIDDEN_SERIES_ID = 'demo-series';

/**
 * "Pishachini: The Healer" → "pishachini-the-healer",
 * "The CEO's Hidden Wife" → "the-ceos-hidden-wife".
 */
export function seriesSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Published series, in catalog order (so a duplicate title resolves predictably). */
export function publishedSeries() {
  return prisma.series.findMany({
    where: { status: 'PUBLISHED', id: { not: HIDDEN_SERIES_ID } },
    orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
    select: { id: true, title: true, thumbnail: true, genre: true },
  });
}

/** Same-origin path the slug (and optional episode number) should open, or null. */
async function resolveTarget(rawSlug: string, episode?: string): Promise<string | null> {
  let decoded = rawSlug;
  try {
    decoded = decodeURIComponent(rawSlug);
  } catch {
    /* already decoded */
  }
  const slug = seriesSlug(decoded);
  if (!slug) return null;
  const wanted = Object.hasOwn(SERIES_ALIASES, slug) ? SERIES_ALIASES[slug] : slug;

  const series = (await publishedSeries()).find((s) => seriesSlug(s.title) === wanted);
  if (!series) return null;

  const episodes = await prisma.episode.findMany({
    where: { seriesId: series.id },
    orderBy: { episodeNumber: 'asc' },
    select: { id: true, episodeNumber: true, isFree: true },
  });
  const number = episode && /^\d{1,4}$/.test(episode) ? Number(episode) : null;
  const target =
    (number !== null && episodes.find((e) => e.episodeNumber === number)) ||
    episodes.find((e) => e.isFree) ||
    episodes[0];

  // No episodes yet → the series page shows "coming soon".
  return target ? `/watch/${target.id}` : `/series/${series.id}`;
}

/**
 * 307 to the resolved episode, or to /go for an unknown slug. The redirect is
 * built from the request's own URL, so it is always same-origin and keeps
 * every incoming query param (UTMs, click IDs) intact.
 */
export async function shortLinkRedirect(
  request: NextRequest,
  slug: string,
  episode?: string
): Promise<NextResponse> {
  let path: string | null = null;
  try {
    path = await resolveTarget(slug, episode);
  } catch (err) {
    console.error('[go] short link lookup failed:', err);
  }
  const url = request.nextUrl.clone();
  url.pathname = path ?? '/go';
  return NextResponse.redirect(url, 307);
}
