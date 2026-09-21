/**
 * Web stub for the rewarded-ads layer. AdMob is native-only; the web bundle
 * (used for previews and E2E checks) never loads a rewarded ad. These no-ops
 * let the shared UI compile and run under Expo web.
 */

export type RewardedResult = 'earned' | 'dismissed' | 'unavailable';

export async function initAds(): Promise<void> {
  // no-op on web
}

export async function showRewardedAd(_userId: string): Promise<RewardedResult> {
  console.warn('[ads] Rewarded ads are unavailable on web.');
  return 'unavailable';
}
