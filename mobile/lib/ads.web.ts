/**
 * Web stub for the rewarded-ads layer. AdMob is native-only; the web bundle
 * (used for previews and E2E checks) never loads a rewarded ad. These no-ops
 * mirror lib/ads.ts so the shared UI compiles and runs under Expo web without
 * importing the native module.
 */

export type RewardedResult = 'earned' | 'dismissed' | 'unavailable';

export function isRewardedAdSupported(): boolean {
  return false;
}

export async function gatherAdsConsent(): Promise<boolean> {
  return false;
}

export async function isPrivacyOptionsRequired(): Promise<boolean> {
  return false;
}

export async function showPrivacyOptions(): Promise<void> {
  // no-op on web
}

export async function showRewardedAd(_userId: string): Promise<RewardedResult> {
  return 'unavailable';
}
