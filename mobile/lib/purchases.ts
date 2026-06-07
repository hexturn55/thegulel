import { Platform } from 'react-native';
import Purchases, { type PurchasesPackage } from 'react-native-purchases';
import { config } from './config';

/**
 * In-app purchases via RevenueCat (native iOS/Android).
 *
 * Apple App Store and Google Play REQUIRE their native IAP for digital goods
 * (coins, VIP). Stripe/Razorpay (web) are not permitted in-app on iOS.
 * After a successful purchase, the RevenueCat server-to-server webhook
 * (/api/webhooks/revenuecat) credits coins / grants VIP; the app then refetches
 * /api/auth/me to reflect the new balance.
 *
 * A `.web.ts` sibling provides no-op stubs so the web bundle never imports the
 * native module.
 */

export interface CoinOffering {
  id: string;
  title: string;
  description: string;
  priceString: string;
  pkg: PurchasesPackage;
}

let configured = false;

export async function initPurchases(appUserId?: string): Promise<void> {
  const apiKey =
    Platform.OS === 'ios' ? config.revenueCatIosKey : config.revenueCatAndroidKey;
  if (!apiKey) {
    console.warn('[purchases] RevenueCat key not configured; skipping init.');
    return;
  }
  if (!configured) {
    Purchases.configure({ apiKey, appUserID: appUserId ?? null });
    configured = true;
  } else if (appUserId) {
    await Purchases.logIn(appUserId);
  }
}

/** Available coin/VIP packages from the current RevenueCat offering. */
export async function getCoinOfferings(): Promise<CoinOffering[]> {
  try {
    const offerings = await Purchases.getOfferings();
    const pkgs = offerings.current?.availablePackages ?? [];
    return pkgs.map((p) => ({
      id: p.identifier,
      title: p.product.title,
      description: p.product.description,
      priceString: p.product.priceString,
      pkg: p,
    }));
  } catch (e) {
    console.warn('[purchases] getOfferings failed', e);
    return [];
  }
}

/**
 * Run the native purchase flow. Returns true if the purchase completed, false
 * if the user cancelled. (Coins are consumables and grant no entitlement, so we
 * key success on completion, not on active entitlements.)
 */
export async function purchaseOffering(offering: CoinOffering): Promise<boolean> {
  try {
    await Purchases.purchasePackage(offering.pkg);
    return true;
  } catch (e) {
    if ((e as { userCancelled?: boolean }).userCancelled) return false;
    throw e;
  }
}

export async function logOutPurchases(): Promise<void> {
  if (configured) {
    try {
      await Purchases.logOut();
    } catch {
      // ignore
    }
  }
}
