'use client';

import { useRouter } from 'next/navigation';
import VideoPlayer from '@/components/VideoPlayer';

interface WatchClientProps {
  episodeId: string;
  videoUrl: string;
  videoId: string;
  isFree: boolean;
  isUnlocked: boolean;
  nextEpisodeId?: string;
  prevEpisodeId?: string;
}

export default function WatchClient({
  episodeId,
  videoUrl,
  videoId,
  isFree,
  isUnlocked,
  nextEpisodeId,
  prevEpisodeId,
}: WatchClientProps) {
  const router = useRouter();

  return (
    <VideoPlayer
      episodeId={episodeId}
      videoUrl={videoUrl}
      videoId={videoId}
      isFree={isFree}
      isUnlocked={isUnlocked}
      onNextEpisode={nextEpisodeId ? () => router.push(`/watch/${nextEpisodeId}`) : undefined}
      onPrevEpisode={prevEpisodeId ? () => router.push(`/watch/${prevEpisodeId}`) : undefined}
      hasNext={!!nextEpisodeId}
      hasPrev={!!prevEpisodeId}
    />
  );
}
