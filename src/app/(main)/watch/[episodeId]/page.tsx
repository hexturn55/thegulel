import { notFound } from 'next/navigation';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import { episodeThumbnailPath, resolvePlayableUrl } from '@/lib/cloudflare';
import { getAuthUser } from '@/lib/auth';
import { hasActiveVip } from '@/lib/subscription';
import WatchClient from './WatchClient';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ episodeId: string }>;
}

async function getEpisodeData(episodeId: string, userId?: string) {
  // Draft series (e.g. pitch-only showcases) are not part of the catalog.
  const episode = await prisma.episode.findFirst({
    where: { id: episodeId, series: { status: 'PUBLISHED' } },
    include: {
      series: {
        select: {
          id: true,
          title: true,
          thumbnail: true,
          coinPrice: true,
          genre: true,
          episodes: {
            orderBy: { episodeNumber: 'asc' },
            select: { id: true, episodeNumber: true, title: true, isFree: true },
          },
        },
      },
    },
  });
  if (!episode) return null;

  const all = episode.series.episodes;
  let vip = false;
  let purchased = new Set<string>();
  if (userId) {
    vip = await hasActiveVip(userId);
    if (!vip) {
      const purchases = await prisma.episodePurchase.findMany({
        where: { userId, episodeId: { in: all.map((e) => e.id) } },
        select: { episodeId: true },
      });
      purchased = new Set(purchases.map((p) => p.episodeId));
    }
  }
  const unlocked = (e: { id: string; isFree: boolean }) => e.isFree || vip || purchased.has(e.id);

  const index = all.findIndex((e) => e.id === episodeId);
  return {
    episode,
    isUnlocked: unlocked(episode),
    episodes: all.map((e) => ({ ...e, unlocked: unlocked(e) })),
    nextEpisodeId: all[index + 1]?.id,
    prevEpisodeId: all[index - 1]?.id,
  };
}

export default async function WatchPage({ params }: PageProps) {
  const { episodeId } = await params;
  const user = await getAuthUser();
  const data = await getEpisodeData(episodeId, user?.id);
  if (!data) notFound();

  const { episode, isUnlocked, episodes, nextEpisodeId, prevEpisodeId } = data;

  // Never ship a stream URL for a locked episode — the client gets null and
  // renders the unlock flow instead.
  const videoUrl = isUnlocked ? await resolvePlayableUrl(episode) : null;

  if (isUnlocked && !videoUrl) {
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
    <div className="fixed inset-0 z-50 bg-black">
      <WatchClient
        key={episode.id}
        series={{
          id: episode.series.id,
          title: episode.series.title,
          thumbnail: episode.series.thumbnail,
          coinPrice: episode.series.coinPrice,
          genre: episode.series.genre,
        }}
        episode={{
          id: episode.id,
          episodeNumber: episode.episodeNumber,
          title: episode.title,
          thumbnail: episodeThumbnailPath(episode.id),
        }}
        videoUrl={videoUrl}
        episodes={episodes}
        nextEpisodeId={nextEpisodeId}
        prevEpisodeId={prevEpisodeId}
      />
    </div>
  );
}
