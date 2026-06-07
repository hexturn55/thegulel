/**
 * Web stub for the IAP layer. Native in-app purchases don't exist on the web;
 * the web app uses Stripe/Razorpay instead. These no-ops let the shared UI
 * compile and run under Expo web (used for previews and E2E checks).
 */
export async function initPurchases(_appUserId?: string): Promise<void> {
  // no-op on web
}

export async function getOfferings(): Promise<null> {
  return null;
}

export async function purchasePackage(_pkg: unknown): Promise<boolean> {
  console.warn('[purchases] In-app purchases are unavailable on web.');
  return false;
}
