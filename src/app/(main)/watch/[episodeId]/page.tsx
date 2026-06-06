import { notFound } from 'next/navigation';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import { resolveVideoUrl } from '@/lib/cloudflare';
import { getAuthUser } from '@/lib/auth';
import { hasActiveVip } from '@/lib/subscription';
import WatchClient from './WatchClient';

interface PageProps {
  params: Promise<{ episodeId: string }>;
}

async function getEpisodeData(episodeId: string, userId?: string) {
  const episode = await prisma.episode.findUnique({
    where: { id: episodeId },
    include: {
      series: {
        include: {
          episodes: {
            orderBy: { episodeNumber: 'asc' },
            select: { id: true, episodeNumber: true },
          },
        },
      },
    },
  });

  if (!episode) return null;

  let isUnlocked = episode.isFree;

  if (!isUnlocked && userId) {
    // VIP subscribers bypass the coin system entirely.
    if (await hasActiveVip(userId)) {
      isUnlocked = true;
    } else {
      const purchase = await prisma.episodePurchase.findUnique({
        where: {
          userId_episodeId: {
            userId,
            episodeId,
          },
        },
      });
      isUnlocked = !!purchase;
    }
  }

  const currentIndex = episode.series.episodes.findIndex((e) => e.id === episodeId);
  const nextEpisode = episode.series.episodes[currentIndex + 1];
  const prevEpisode = episode.series.episodes[currentIndex - 1];

  return {
    episode,
    isUnlocked,
    nextEpisode,
    prevEpisode,
  };
}

export default async function WatchPage({ params }: PageProps) {
  const { episodeId } = await params;
  const user = await getAuthUser();

  const data = await getEpisodeData(episodeId, user?.id);

  if (!data) {
    notFound();
  }

  const { episode, isUnlocked, nextEpisode, prevEpisode } = data;
  const videoUrl = resolveVideoUrl(episode);

  // No playable source configured — show a graceful message instead of a crash.
  if (!videoUrl) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center px-6 text-center">
        <h1 className="text-white text-xl font-bold mb-2">Video coming soon</h1>
        <p className="text-gray-400 text-sm mb-6 max-w-xs">
          This episode doesn&apos;t have a playable video yet.
        </p>
        <Link
          href={`/series/${episode.seriesId}`}
          className="bg-red-500 hover:bg-red-600 text-white font-semibold px-6 py-3 rounded-full transition"
        >
          Back to series
        </Link>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black">
      <WatchClient
        episodeId={episode.id}
        videoUrl={videoUrl}
        videoId={episode.videoId}
        isFree={episode.isFree}
        isUnlocked={isUnlocked}
        nextEpisodeId={nextEpisode?.id}
        prevEpisodeId={prevEpisode?.id}
      />
    </div>
  );
}
