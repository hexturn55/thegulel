import type { Episode, PlaybackInfo, SeriesCard } from '@gulel/shared';

/**
 * DEVELOPMENT-ONLY demo catalog, used as a fallback when the live API isn't
 * reachable in a __DEV__ build. Screens must load this module lazily inside an
 * `if (__DEV__)` block (`require('@/lib/sampleData')`) so release bundles never
 * show fake content. Demo ids always start with `demo-`.
 */

const DEMO_PREFIX = 'demo-';

/** True for ids that belong to the bundled demo catalog. */
export function isDemoId(id: string | null | undefined): boolean {
  return typeof id === 'string' && id.startsWith(DEMO_PREFIX);
}

function thumb(label: string): string {
  return `https://placehold.co/300x450/1a1a22/e11d48?text=${encodeURIComponent(label)}`;
}

// Public sample streams so the player actually plays in demo mode.
const SAMPLE_VIDEOS = [
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
];

interface SampleSeed {
  id: string;
  title: string;
  genre: string;
  episodes: number;
  featured?: boolean;
}

const SEED: SampleSeed[] = [
  { id: 'demo-1', title: 'Love After Midnight', genre: 'Romance', episodes: 12, featured: true },
  { id: 'demo-2', title: 'The CEO’s Secret Bride', genre: 'Romance', episodes: 20 },
  { id: 'demo-3', title: 'Vengeance Protocol', genre: 'Thriller', episodes: 16, featured: true },
  { id: 'demo-4', title: 'Heir to the Throne', genre: 'Drama', episodes: 24 },
  { id: 'demo-5', title: 'My Billionaire Roommate', genre: 'Comedy', episodes: 10 },
  { id: 'demo-6', title: 'Realm of Shadows', genre: 'Fantasy', episodes: 18 },
  { id: 'demo-7', title: 'Cold Case Files', genre: 'Mystery', episodes: 14 },
  { id: 'demo-8', title: 'Last Strike', genre: 'Action', episodes: 22 },
];

export const SAMPLE_SERIES: SeriesCard[] = SEED.map((s) => ({
  id: s.id,
  title: s.title,
  thumbnail: thumb(s.title),
  genre: s.genre,
  totalEpisodes: s.episodes,
  featured: Boolean(s.featured),
}));

/** Offline demo episode: carries its own public sample stream. */
export type SampleEpisode = Episode & { sampleUrl?: string };

const DEMO_EPISODE_COUNT = 8;
const DEMO_COIN_PRICE = 10;

/** Demo episodes for a `demo-` series id; [] for any other (real) id. */
export function sampleEpisodes(seriesId: string): SampleEpisode[] {
  if (!isDemoId(seriesId)) return [];
  const seed = SEED.find((s) => s.id === seriesId);
  const count = Math.min(seed?.episodes ?? DEMO_EPISODE_COUNT, DEMO_EPISODE_COUNT);
  return Array.from({ length: count }, (_, i) => {
    const n = i + 1;
    const isFree = n <= 2;
    return {
      id: `${seriesId}-ep-${n}`,
      seriesId,
      episodeNumber: n,
      title: `Episode ${n}`,
      duration: 90 + i * 30,
      sampleUrl: SAMPLE_VIDEOS[i % SAMPLE_VIDEOS.length]!,
      thumbnail: thumb(`Ep ${n}`),
      isFree,
      // Demo episodes are all playable so the offline player can be exercised.
      isUnlocked: true,
      ...(isFree ? {} : { coinPrice: DEMO_COIN_PRICE }),
    };
  });
}

/**
 * Offline playback info for a demo episode id (`demo-<n>-ep-<k>`), or null
 * for anything that is not a known demo episode.
 */
export function samplePlayback(episodeId: string): PlaybackInfo | null {
  const match = /^(demo-.+?)-ep-(\d+)$/.exec(episodeId);
  if (!match) return null;
  const seriesId = match[1]!;
  const n = Number(match[2]);
  const episodes = sampleEpisodes(seriesId);
  const ep = episodes.find((e) => e.episodeNumber === n);
  if (!ep?.sampleUrl) return null;
  const next = episodes.find((e) => e.episodeNumber === n + 1);
  return {
    url: ep.sampleUrl,
    expiresAt: null,
    progress: 0,
    seriesId,
    nextEpisodeId: next?.id ?? null,
  };
}
