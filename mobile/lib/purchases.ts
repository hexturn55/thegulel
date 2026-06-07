import { Platform } from 'react-native';
import Purchases, { type PurchasesOffering } from 'react-native-purchases';
import { config } from './config';

/**
 * In-app purchases via RevenueCat (native iOS/Android).
 *
 * Apple App Store and Google Play REQUIRE their native IAP for digital goods
 * (coins, VIP). Stripe/Razorpay (used on web) are not permitted for in-app
 * digital purchases on iOS. RevenueCat wraps StoreKit/Billing and reconciles
 * entitlements; back it with server-to-server webhooks that credit coins via
 * the same idempotent CoinTransaction.providerRef path the web webhooks use.
 *
 * NOTE: A `.web.ts` sibling provides no-op stubs so the web bundle never
 * imports the native module.
 */
export async function initPurchases(appUserId?: string): Promise<void> {
  const apiKey =
    Platform.OS === 'ios' ? config.revenueCatIosKey : config.revenueCatAndroidKey;
  if (!apiKey) {
    console.warn('[purchases] RevenueCat key not configured; skipping init.');
    return;
  }
  Purchases.configure({ apiKey, appUserID: appUserId ?? null });
}

/** Fetch the current coin/VIP offerings to render a paywall. */
export async function getOfferings(): Promise<PurchasesOffering | null> {
  const offerings = await Purchases.getOfferings();
  return offerings.current ?? null;
}

/** Purchase a package; returns true if an entitlement is now active. */
export async function purchasePackage(
  pkg: Parameters<typeof Purchases.purchasePackage>[0],
): Promise<boolean> {
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  return Object.keys(customerInfo.entitlements.active).length > 0;
}
