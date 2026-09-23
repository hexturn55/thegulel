import prisma from '@/lib/prisma';
import { hasActiveVip } from '@/lib/subscription';

/**
 * Whether a viewer may watch an episode: it's free (the pilot), they're VIP,
 * or they've unlocked it with coins. The single source of truth for playback
 * entitlement — the watch page and the play API both use it.
 */
export async function canWatchEpisode(
  episode: { id: string; isFree: boolean },
  userId?: string | null
): Promise<boolean> {
  if (episode.isFree) return true;
  if (!userId) return false;
  if (await hasActiveVip(userId)) return true;
  const purchase = await prisma.episodePurchase.findUnique({
    where: { userId_episodeId: { userId, episodeId: episode.id } },
    select: { id: true },
  });
  return !!purchase;
}
