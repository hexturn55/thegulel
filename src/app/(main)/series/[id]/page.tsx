import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Play } from 'lucide-react';
import { Metadata } from 'next';
import prisma from '@/lib/prisma';
import EpisodeList from '@/components/EpisodeList';
import { ShareButton } from '@/components/ShareButton';
import { StructuredData } from '@/components/StructuredData';
import { getAuthUser } from '@/lib/auth';
import { hasActiveVip } from '@/lib/subscription';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const series = await prisma.series.findUnique({
    where: { id, status: 'PUBLISHED' },
    select: { title: true, description: true, thumbnail: true, genre: true },
  });

  if (!series) return { title: 'Series Not Found' };

  return {
    title: series.title,
    description: series.description.slice(0, 160),
    openGraph: {
      title: series.title,
      description: series.description.slice(0, 160),
      images: [{ url: series.thumbnail, width: 720, height: 1280, alt: series.title }],
      type: 'video.tv_show',
      siteName: 'Gulel OTT',
    },
    twitter: {
      card: 'summary_large_image',
      title: series.title,
      description: series.description.slice(0, 160),
      images: [series.thumbnail],
    },
  };
}

async function getSeriesWithEpisodes(id: string, userId?: string) {
  const series = await prisma.series.findUnique({
    where: { id, status: 'PUBLISHED' },
    include: {
      episodes: {
        orderBy: { episodeNumber: 'asc' },
      },
    },
  });

  if (!series) return null;

  // Get user's purchases and watch history if logged in
  let purchases: string[] = [];
  let watchHistory: Record<string, { progress: number }> = {};
  let isVip = false;

  if (userId) {
    // VIP subscribers have every episode unlocked.
    isVip = await hasActiveVip(userId);
    if (!isVip) {
      const userPurchases = await prisma.episodePurchase.findMany({
        where: { userId },
        select: { episodeId: true },
      });
      purchases = userPurchases.map((p) => p.episodeId);
    }

    const history = await prisma.watchHistory.findMany({
      where: { userId, episodeId: { in: series.episodes.map((e) => e.id) } },
      select: { episodeId: true, progress: true },
    });
    watchHistory = Object.fromEntries(
      history.map((h) => [h.episodeId, { progress: h.progress }])
    );
  }

  return {
    series,
    purchases,
    watchHistory,
    isVip,
  };
}

export default async function SeriesPage({ params }: PageProps) {
  const { id } = await params;
  const user = await getAuthUser();

  const data = await getSeriesWithEpisodes(id, user?.id);

  if (!data) {
    notFound();
  }

  const { series, purchases, watchHistory, isVip } = data;

  const episodes = series.episodes.map((ep) => ({
    id: ep.id,
    episodeNumber: ep.episodeNumber,
    title: ep.title,
    thumbnail: ep.thumbnail,
    duration: ep.duration,
    isFree: ep.isFree,
    isUnlocked: isVip || purchases.includes(ep.id),
    watchProgress: watchHistory[ep.id]?.progress,
  }));

  const seriesUrl = `/series/${series.id}`;

  return (
    <div className="min-h-screen bg-black pb-20">
      {/* Structured Data */}
      <StructuredData
        type="TVSeries"
        name={series.title}
        description={series.description}
        image={series.thumbnail}
        genre={series.genre}
        numberOfEpisodes={series.totalEpisodes}
      />

      {/* Hero section */}
      <div className="relative h-[60vh] md:h-[70vh]">
        <Image
          src={series.thumbnail}
          alt={series.title}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="max-w-2xl">
            <h1 className="text-white text-3xl md:text-4xl font-bold mb-3">
              {series.title}
            </h1>

            <div className="flex items-center gap-3 mb-4 text-sm text-gray-300">
              <span className="bg-red-500 text-white px-3 py-1 rounded font-semibold">
                {series.genre}
              </span>
              <span>{series.totalEpisodes} Episodes</span>
              <span>•</span>
              <span>First {series.freeEpisodes} Free</span>
            </div>

            <p className="text-gray-300 text-sm md:text-base mb-6 line-clamp-3">
              {series.description}
            </p>

            <div className="flex items-center gap-3 flex-wrap">
              <a
                href={`/watch/${episodes[0]?.id}`}
                className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white font-bold px-8 py-3 rounded-full transition transform hover:scale-105"
              >
                <Play className="w-5 h-5 fill-white" />
                Watch Now
              </a>

              <ShareButton
                url={seriesUrl}
                title={series.title}
                description={series.description.slice(0, 100)}
                seriesId={series.id}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Episodes */}
      <div className="px-4 py-6">
        <h2 className="text-white text-2xl font-bold mb-4">Episodes</h2>
        <EpisodeList episodes={episodes} seriesId={series.id} />
      </div>
    </div>
  );
}
