import type { Episode, SeriesCard } from '@gulel/shared';

/**
 * Demo catalog used as a fallback when the live API isn't reachable (e.g. no
 * EXPO_PUBLIC_API_URL configured, or the backend isn't running yet). This keeps
 * the app fully browsable for previews/demos. Real API data always takes
 * precedence — this only fills in when the fetch fails.
 */

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

export function sampleEpisodes(seriesId: string): Episode[] {
  const seed = SEED.find((s) => s.id === seriesId);
  const count = Math.min(seed?.episodes ?? 8, 8);
  return Array.from({ length: count }, (_, i) => {
    const n = i + 1;
    return {
      id: `${seriesId}-ep-${n}`,
      seriesId,
      episodeNumber: n,
      title: `Episode ${n}`,
      duration: 90 + i * 30,
      videoUrl: SAMPLE_VIDEOS[i % SAMPLE_VIDEOS.length]!,
      videoId: `${seriesId}-${n}`,
      thumbnail: thumb(`Ep ${n}`),
      isFree: n <= 2,
    };
  });
}
