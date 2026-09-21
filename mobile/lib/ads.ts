import mobileAds, {
  AdEventType,
  RewardedAd,
  RewardedAdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';
import { config } from './config';

/**
 * Rewarded video ads via Google AdMob (native iOS/Android).
 *
 * Flow: the user taps "Watch a video" -> we load and show a rewarded ad and
 * pass their Gulel user id as AdMob `customData`. When they finish watching,
 * Google calls our Server-Side Verification endpoint (/api/ads/ssv) with that
 * id and the coins are granted there — the client never grants coins itself,
 * so watching is the only way to earn them.
 *
 * A `.web.ts` sibling provides no-op stubs so the web bundle never imports the
 * native module.
 */

export type RewardedResult =
  | 'earned' // user watched to completion; SSV will credit coins shortly
  | 'dismissed' // user closed the ad early; no reward
  | 'unavailable'; // no ad could be loaded/shown right now

let initPromise: Promise<unknown> | null = null;

/** Initialize the Mobile Ads SDK once (safe to call repeatedly). */
export function initAds(): Promise<unknown> {
  if (!initPromise) initPromise = mobileAds().initialize();
  return initPromise;
}

// In development/preview builds always use Google's test ad unit: showing real
// ads on a build you control (and tapping them) violates AdMob policy. Release
// builds (__DEV__ === false) serve the real, revenue-earning unit.
const adUnitId = __DEV__ ? TestIds.REWARDED : config.admobRewardedAdUnitId;

/**
 * Load and present a rewarded ad for the given Gulel user id. Resolves once the
 * ad is closed (or could not be shown). Never rejects — callers switch on the
 * returned result.
 */
export async function showRewardedAd(userId: string): Promise<RewardedResult> {
  await initAds();
  if (!adUnitId) return 'unavailable';

  return new Promise<RewardedResult>((resolve) => {
    const rewarded = RewardedAd.createForAdRequest(adUnitId, {
      // Tie this impression to the user so /api/ads/ssv knows who to credit.
      serverSideVerificationOptions: { customData: userId },
    });

    let earned = false;
    let settled = false;
    const listeners: Array<() => void> = [];
    const finish = (result: RewardedResult) => {
      if (settled) return;
      settled = true;
      listeners.forEach((remove) => remove());
      resolve(result);
    };

    listeners.push(
      rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
        rewarded.show().catch(() => finish('unavailable'));
      }),
    );
    listeners.push(
      rewarded.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
        earned = true;
      }),
    );
    listeners.push(
      rewarded.addAdEventListener(AdEventType.CLOSED, () => {
        finish(earned ? 'earned' : 'dismissed');
      }),
    );
    listeners.push(
      rewarded.addAdEventListener(AdEventType.ERROR, () => finish('unavailable')),
    );

    rewarded.load();
  });
}
