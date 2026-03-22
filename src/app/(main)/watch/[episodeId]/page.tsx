import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { getStreamUrl } from '@/lib/cloudflare';
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
    const purchase = await prisma.episodePurchase.findUnique({
      where: {
        userId_episodeId: {
          userId,
          episodeId,
        },
      },
    });
    isUnlocked = !!purchase;

    // Also check for active subscription
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
        endDate: { gte: new Date() },
      },
    });
    if (subscription) {
      isUnlocked = true;
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
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;

  const data = await getEpisodeData(episodeId, userId);

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
