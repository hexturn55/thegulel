/**
 * VIP subscription plans. These are "all-access" passes that bypass the coin
 * system entirely — an active VIP unlocks every episode without spending coins.
 *
 * Pricing is static config (not in the DB) so it can be versioned with the
 * code. Each plan maps to a recurring Stripe price created inline at checkout.
 */

export type VipPlanId = 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export interface VipPlan {
  id: VipPlanId;
  name: string;
  /** Stripe recurring interval. */
  interval: 'week' | 'month' | 'year';
  priceUSD: number;
  priceINR: number;
  popular?: boolean;
  /** Short marketing line. */
  blurb?: string;
}

export const VIP_PLANS: VipPlan[] = [
  {
    id: 'WEEKLY',
    name: 'VIP Weekly',
    interval: 'week',
    priceUSD: 4.99,
    priceINR: 399,
    blurb: 'Try it out, billed weekly',
  },
  {
    id: 'MONTHLY',
    name: 'VIP Monthly',
    interval: 'month',
    priceUSD: 14.99,
    priceINR: 1199,
    popular: true,
    blurb: 'Unlimited access, billed monthly',
  },
  {
    id: 'YEARLY',
    name: 'VIP Yearly',
    interval: 'year',
    priceUSD: 119.99,
    priceINR: 9599,
    blurb: 'Best value — 2 months free',
  },
];

export function getVipPlan(id: string): VipPlan | undefined {
  return VIP_PLANS.find((p) => p.id === id);
}
