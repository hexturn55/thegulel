/**
 * Web stub for the IAP layer. Native in-app purchases don't exist on the web;
 * the web app uses Stripe/Razorpay instead. These no-ops let the shared UI
 * compile and run under Expo web (used for previews and E2E checks).
 */

export interface CoinOffering {
  id: string;
  title: string;
  description: string;
  priceString: string;
  pkg: unknown;
}

export async function initPurchases(_appUserId?: string): Promise<void> {
  // no-op on web
}

export async function getCoinOfferings(): Promise<CoinOffering[]> {
  return [];
}

export async function purchaseOffering(_offering: CoinOffering): Promise<boolean> {
  console.warn('[purchases] In-app purchases are unavailable on web.');
  return false;
}

export async function logOutPurchases(): Promise<void> {
  // no-op on web
}
