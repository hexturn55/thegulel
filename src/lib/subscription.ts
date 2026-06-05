import prisma from './prisma';

/**
 * Returns the user's current active VIP subscription (status ACTIVE and not
 * yet expired), or `null`. A VIP subscription bypasses the coin system — any
 * episode is unlocked while one is active.
 */
export async function getActiveSubscription(userId: string) {
  return prisma.subscription.findFirst({
    where: {
      userId,
      status: 'ACTIVE',
      endDate: { gte: new Date() },
    },
    orderBy: { endDate: 'desc' },
  });
}

/** Convenience boolean wrapper around {@link getActiveSubscription}. */
export async function hasActiveVip(userId: string): Promise<boolean> {
  return (await getActiveSubscription(userId)) !== null;
}
