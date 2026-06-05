import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import { getStreamUrl } from '@/lib/cloudflare';
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
  const videoUrl = getStreamUrl(episode.videoId);

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
