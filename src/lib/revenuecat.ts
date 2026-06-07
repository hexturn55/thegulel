/**
 * RevenueCat product catalog — maps App Store / Play Store product identifiers
 * to what they grant in Gulel. These IDs MUST match the products you configure
 * in App Store Connect + Google Play Console and wire up in RevenueCat.
 *
 * Coins are consumables (StoreKit "consumable" / Play "in-app product").
 * VIP tiers are auto-renewing subscriptions.
 */

export type ProductMapping =
  | { kind: 'coins'; coins: number }
  | { kind: 'vip'; plan: 'WEEKLY' | 'MONTHLY' | 'YEARLY'; durationDays: number };

export const PRODUCT_CATALOG: Record<string, ProductMapping> = {
  // Coin packs (consumable)
  'com.gulel.coins.100': { kind: 'coins', coins: 100 },
  'com.gulel.coins.500': { kind: 'coins', coins: 550 },
  'com.gulel.coins.1200': { kind: 'coins', coins: 1400 },
  'com.gulel.coins.3000': { kind: 'coins', coins: 3600 },

  // VIP tiers (auto-renewing subscriptions)
  'com.gulel.vip.weekly': { kind: 'vip', plan: 'WEEKLY', durationDays: 7 },
  'com.gulel.vip.monthly': { kind: 'vip', plan: 'MONTHLY', durationDays: 30 },
  'com.gulel.vip.yearly': { kind: 'vip', plan: 'YEARLY', durationDays: 365 },
};

export function getProductMapping(productId: string | undefined): ProductMapping | null {
  if (!productId) return null;
  return PRODUCT_CATALOG[productId] ?? null;
}
