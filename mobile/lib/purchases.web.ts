/**
 * Web stub for the IAP layer. Native in-app purchases don't exist on the web;
 * the web app uses Stripe/Razorpay instead. These no-ops mirror lib/purchases.ts
 * so the shared UI compiles and runs under Expo web (used for previews and E2E
 * checks) without importing the native module.
 */

export interface CoinOffering {
  id: string;
  title: string;
  description: string;
  priceString: string;
  pkg: unknown;
}

export interface VipOffering {
  id: string;
  title: string;
  priceString: string;
  periodLabel: string;
  introText: string | null;
  pkg: unknown;
}

export type StoreOfferings = {
  status: 'ok' | 'unconfigured' | 'error';
  coins: CoinOffering[];
  vip: VipOffering[];
};

/** Opaque on web; RevenueCat's CustomerInfo on native. */
export type CustomerInfo = unknown;

export interface PurchaseResult {
  completed: boolean;
  customerInfo?: CustomerInfo;
}

export function isPurchasesConfigurable(): boolean {
  return false;
}

export async function ensurePurchasesConfigured(_appUserId: string): Promise<boolean> {
  return false;
}

export async function initPurchases(_appUserId?: string): Promise<void> {
  // no-op on web
}

export async function logOutPurchases(): Promise<void> {
  // no-op on web
}

export async function getStoreOfferings(_appUserId: string): Promise<StoreOfferings> {
  return { status: 'unconfigured', coins: [], vip: [] };
}

export async function purchaseOffering(
  _offering: CoinOffering | VipOffering,
): Promise<PurchaseResult> {
  return { completed: false };
}

export function hasActiveVip(_customerInfo: CustomerInfo | null | undefined): boolean {
  return false;
}

export async function restorePurchases(): Promise<boolean> {
  throw new Error('In-app purchases are unavailable on web.');
}
