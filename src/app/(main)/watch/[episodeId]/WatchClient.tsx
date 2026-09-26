'use client';

import { useRouter } from 'next/navigation';
import Player, { type PlayerProps } from '@/components/player/Player';

type WatchClientProps = Omit<PlayerProps, 'onNavigate' | 'onClose' | 'onUnlocked'>;

export default function WatchClient(props: WatchClientProps) {
  const router = useRouter();
  return (
    <Player
      {...props}
      onNavigate={(id) => router.push(`/watch/${id}`)}
      onClose={() => router.push(`/series/${props.series.id}`)}
      // Re-render on the server so the now-unlocked episode gets its stream URL.
      onUnlocked={() => router.refresh()}
    />
  );
}
