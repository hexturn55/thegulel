import prisma from './prisma';

/**
 * Returns the user's current active VIP subscription (status ACTIVE and not
 * yet expired), or `null`. A VIP subscription bypasses the coin system — any
 * episode is unlocked while one is active.
 */
export async function getActiveSubscription(userId: string) {
  try {
    return await prisma.subscription.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
        endDate: { gte: new Date() },
      },
      orderBy: { endDate: 'desc' },
    });
  } catch (err) {
    // Never let a VIP lookup take down a whole page (e.g. a pending DB
    // migration where Subscription columns don't exist yet). Degrade to
    // "not VIP" instead of throwing in the server render.
    console.error('getActiveSubscription failed — treating as non-VIP:', err);
    return null;
  }
}

/** Convenience boolean wrapper around {@link getActiveSubscription}. */
export async function hasActiveVip(userId: string): Promise<boolean> {
  return (await getActiveSubscription(userId)) !== null;
}
