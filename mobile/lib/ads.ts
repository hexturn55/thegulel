import { Platform } from 'react-native';
import mobileAds, {
  AdEventType,
  AdsConsent,
  AdsConsentPrivacyOptionsRequirementStatus,
  RewardedAd,
  RewardedAdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';
import { config } from './config';

/**
 * Rewarded video ads via Google AdMob (native iOS/Android).
 *
 * Flow: the user taps "Watch a video" -> we gather UMP consent (once), load and
 * show a rewarded ad and pass their Gulel user id as AdMob `customData`. When
 * they finish watching, Google calls our Server-Side Verification endpoint
 * (/api/ads/ssv) with that id and the coins are granted there — the client
 * never grants coins itself.
 *
 * Nothing in this module touches AdsConsent or the Mobile Ads SDK unless
 * `isRewardedAdSupported()` is true (e.g. iOS release builds have no ad unit
 * yet, so ads are hidden there entirely).
 *
 * A `.web.ts` sibling provides no-op stubs so the web bundle never imports the
 * native module.
 */

export type RewardedResult =
  | 'earned' // user watched to completion; SSV will credit coins shortly
  | 'dismissed' // user closed the ad early; no reward
  | 'unavailable'; // no ad could be loaded/shown right now

/** Give up on loading an ad after this long (never applies during playback). */
const LOAD_TIMEOUT_MS = 20_000;

// Test units whenever the build opts in (dev server, development/preview EAS
// profiles). Otherwise the real per-platform unit. There is deliberately no
// fallback from iOS to the Android unit: an empty iOS id disables ads on iOS.
const adUnitId: string = config.adsUseTestUnits
  ? TestIds.REWARDED
  : (Platform.select({
      ios: config.admobRewardedIosId,
      android: config.admobRewardedAndroidId,
    }) ?? '');

/** True when this build/platform has a rewarded ad unit to serve. */
export function isRewardedAdSupported(): boolean {
  return adUnitId !== '';
}

let sdkInitPromise: Promise<void> | null = null;

/** Initialize the Mobile Ads SDK once. Only call after consent allows ads. */
function initSdkOnce(): Promise<void> {
  if (!sdkInitPromise) {
    sdkInitPromise = mobileAds()
      .initialize()
      .then(() => undefined)
      .catch((e: unknown) => {
        sdkInitPromise = null; // allow a later retry
        throw e;
      });
  }
  return sdkInitPromise;
}

/**
 * Read the current consent state and, if ads may be requested, make sure the
 * SDK is initialized. Never rejects.
 */
async function canRequestAdsNow(): Promise<boolean> {
  try {
    const info = await AdsConsent.getConsentInfo();
    if (!info.canRequestAds) return false;
    await initSdkOnce();
    return true;
  } catch (e) {
    console.warn('[ads] consent/initialize failed', e);
    return false;
  }
}

let consentPromise: Promise<boolean> | null = null;

/**
 * Gather UMP (GDPR/US-state) consent — showing Google's consent form when
 * required — then initialize the SDK if ads may be requested. Memoized: the
 * form is shown at most once per app session. A `false` result is not kept, so
 * a later explicit action (e.g. tapping "Watch a video") can retry. Never
 * rejects; returns whether ads may be requested.
 */
export function gatherAdsConsent(): Promise<boolean> {
  if (!isRewardedAdSupported()) return Promise.resolve(false);
  if (!consentPromise) {
    consentPromise = (async () => {
      try {
        await AdsConsent.gatherConsent();
      } catch (e) {
        // Network/form errors: fall through and use whatever consent the UMP
        // SDK already has stored from a previous session.
        console.warn('[ads] gatherConsent failed', e);
      }
      const canRequest = await canRequestAdsNow();
      if (!canRequest) consentPromise = null;
      return canRequest;
    })();
  }
  return consentPromise;
}

/** Whether the user must be offered a way to change their ad privacy choices. */
export async function isPrivacyOptionsRequired(): Promise<boolean> {
  if (!isRewardedAdSupported()) return false;
  try {
    const info = await AdsConsent.getConsentInfo();
    return (
      info.privacyOptionsRequirementStatus ===
      AdsConsentPrivacyOptionsRequirementStatus.REQUIRED
    );
  } catch {
    return false;
  }
}

/** Present Google's privacy options form (lets the user change consent). */
export async function showPrivacyOptions(): Promise<void> {
  if (!isRewardedAdSupported()) return;
  try {
    await AdsConsent.showPrivacyOptionsForm();
  } catch (e) {
    console.warn('[ads] showPrivacyOptionsForm failed', e);
  }
}

/**
 * Load and present a rewarded ad for the given Gulel user id. Resolves once the
 * ad is closed (or could not be loaded/shown). Never rejects — callers switch
 * on the returned result.
 */
export async function showRewardedAd(userId: string): Promise<RewardedResult> {
  if (!isRewardedAdSupported()) return 'unavailable';
  await gatherAdsConsent();
  // Re-read consent every time: the user may have changed it via the privacy
  // options form since consent was first gathered.
  if (!(await canRequestAdsNow())) return 'unavailable';

  return new Promise<RewardedResult>((resolve) => {
    let rewarded: RewardedAd;
    try {
      rewarded = RewardedAd.createForAdRequest(adUnitId, {
        // Tie this impression to the user so /api/ads/ssv knows who to credit.
        serverSideVerificationOptions: { customData: userId },
      });
    } catch (e) {
      console.warn('[ads] createForAdRequest failed', e);
      resolve('unavailable');
      return;
    }

    let earned = false;
    let settled = false;
    let loadTimer: ReturnType<typeof setTimeout> | null = null;
    const listeners: Array<() => void> = [];

    const clearLoadTimer = () => {
      if (loadTimer !== null) {
        clearTimeout(loadTimer);
        loadTimer = null;
      }
    };
    const finish = (result: RewardedResult) => {
      clearLoadTimer();
      if (settled) return;
      settled = true;
      listeners.forEach((remove) => remove());
      resolve(result);
    };

    listeners.push(
      rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
        // Loaded in time: stop the load timeout before playback starts.
        clearLoadTimer();
        if (settled) return;
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
      rewarded.addAdEventListener(AdEventType.ERROR, () => {
        clearLoadTimer();
        finish('unavailable');
      }),
    );

    loadTimer = setTimeout(() => {
      loadTimer = null;
      finish('unavailable');
    }, LOAD_TIMEOUT_MS);

    try {
      rewarded.load();
    } catch (e) {
      console.warn('[ads] load failed', e);
      finish('unavailable');
    }
  });
}
