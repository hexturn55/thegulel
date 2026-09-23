/* eslint-disable @typescript-eslint/no-explicit-any -- the Google IMA SDK is
   loaded at runtime from a CDN and ships no TypeScript types, so its globals
   (google.ima.*) and event objects are necessarily typed as `any`. */
/**
 * Google IMA SDK rewarded-video integration.
 *
 * `playRewardedAd()` loads the IMA HTML5 SDK on demand, plays a rewarded ad
 * from the configured VAST tag, and resolves once the ad finishes.
 *
 * Uses `NEXT_PUBLIC_IMA_REWARDED_AD_TAG_URL` when set (live, SSV-verified
 * rewards); otherwise Google's public sample ad (demo mode, see
 * rewardedAdMode). Resolves `{ played: false }` if the SDK fails to load or
 * errors.
 *
 * MUST be called from within a user gesture (e.g. a click handler) — the IMA
 * `AdDisplayContainer` requires that for autoplay with sound.
 */

const IMA_SDK_URL = 'https://imasdk.googleapis.com/js/sdkloader/ima3.js';

// Minimal shape of the parts of the IMA global we touch.
type ImaGlobal = typeof window & { google?: { ima?: any } };

export interface RewardedAdResult {
  /** Whether a rewarded ad was actually shown. */
  played: boolean;
  /** Whether the user earned the reward (watched without skipping). */
  rewarded: boolean;
}

export function isRewardedAdConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_IMA_REWARDED_AD_TAG_URL;
}

/**
 * Google's public IMA sample ad (a ~10s linear video). Used as the rewarded ad
 * until a real ad unit is configured, so the earn-coins flow is fully
 * demonstrable; rewards in this mode are granted by /api/ads/demo/* under
 * strict limits instead of by Google's SSV callback.
 */
const DEMO_AD_TAG_URL =
  'https://pubads.g.doubleclick.net/gampad/ads?iu=/21775744923/external/single_ad_samples&sz=640x480&cust_params=sample_ct%3Dlinear&ciu_szs=300x250%2C728x90&gdfp_req=1&output=vast&unviewed_position_start=1&env=vp&impl=s';

export type RewardedAdMode = 'live' | 'demo';

export function rewardedAdMode(): RewardedAdMode {
  return isRewardedAdConfigured() ? 'live' : 'demo';
}

function loadImaSdk(): Promise<boolean> {
  const w = window as ImaGlobal;
  if (w.google?.ima) return Promise.resolve(true);

  return new Promise((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${IMA_SDK_URL}"]`
    );
    if (existing) {
      existing.addEventListener('load', () => resolve(true));
      existing.addEventListener('error', () => resolve(false));
      return;
    }
    const script = document.createElement('script');
    script.src = IMA_SDK_URL;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}

export async function playRewardedAd(userId?: string): Promise<RewardedAdResult> {
  if (typeof window === 'undefined') return { played: false, rewarded: false };
  const liveTag = process.env.NEXT_PUBLIC_IMA_REWARDED_AD_TAG_URL;

  // Live: attribute the reward to our user via SSV `custom_data`; coins are
  // granted only when Google calls /api/ads/ssv after a verified completion.
  // Demo: Google's sample ad, with a cache-busting correlator.
  const requestUrl = liveTag
    ? userId
      ? `${liveTag}${liveTag.includes('?') ? '&' : '?'}custom_data=${encodeURIComponent(userId)}`
      : liveTag
    : `${DEMO_AD_TAG_URL}&correlator=${Date.now()}`;

  const sdkReady = await loadImaSdk();
  const ima = (window as ImaGlobal).google?.ima;
  if (!sdkReady || !ima) return { played: false, rewarded: false };

  return new Promise<RewardedAdResult>((resolve) => {
    let settled = false;
    let earnedReward = false;

    // Full-screen overlay hosting the ad video + IMA UI.
    const overlay = document.createElement('div');
    overlay.style.cssText =
      'position:fixed;inset:0;z-index:9999;background:#000;display:flex;align-items:center;justify-content:center;';

    const adVideo = document.createElement('video');
    adVideo.setAttribute('playsinline', '');
    adVideo.style.cssText = 'width:100%;height:100%;object-fit:contain;';

    const adContainer = document.createElement('div');
    adContainer.style.cssText = 'position:absolute;inset:0;';

    overlay.appendChild(adVideo);
    overlay.appendChild(adContainer);
    document.body.appendChild(overlay);

    let adsManager: any;

    const cleanup = () => {
      try {
        adsManager?.destroy();
      } catch {
        /* ignore */
      }
      overlay.remove();
    };

    const finish = (result: RewardedAdResult) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(result);
    };

    // Safety valve: never trap the user if the SDK stalls.
    const timeout = window.setTimeout(
      () => finish({ played: false, rewarded: false }),
      45000
    );
    const settledThenClear = (result: RewardedAdResult) => {
      window.clearTimeout(timeout);
      finish(result);
    };

    try {
      const adDisplayContainer = new ima.AdDisplayContainer(
        adContainer,
        adVideo
      );
      adDisplayContainer.initialize();

      const adsLoader = new ima.AdsLoader(adDisplayContainer);

      adsLoader.addEventListener(
        ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED,
        (e: any) => {
          adsManager = e.getAdsManager(adVideo);

          adsManager.addEventListener(
            ima.AdErrorEvent.Type.AD_ERROR,
            () => settledThenClear({ played: false, rewarded: false })
          );
          adsManager.addEventListener(
            ima.AdEvent.Type.COMPLETE,
            () => {
              earnedReward = true;
            }
          );
          adsManager.addEventListener(ima.AdEvent.Type.SKIPPED, () => {
            earnedReward = false;
          });
          adsManager.addEventListener(
            ima.AdEvent.Type.ALL_ADS_COMPLETED,
            () => settledThenClear({ played: true, rewarded: earnedReward })
          );

          try {
            adsManager.init(
              overlay.clientWidth,
              overlay.clientHeight,
              ima.ViewMode.FULLSCREEN
            );
            adsManager.start();
          } catch {
            settledThenClear({ played: false, rewarded: false });
          }
        },
        false
      );

      adsLoader.addEventListener(
        ima.AdErrorEvent.Type.AD_ERROR,
        () => settledThenClear({ played: false, rewarded: false }),
        false
      );

      const adsRequest = new ima.AdsRequest();
      adsRequest.adTagUrl = requestUrl;
      adsRequest.linearAdSlotWidth = overlay.clientWidth || window.innerWidth;
      adsRequest.linearAdSlotHeight =
        overlay.clientHeight || window.innerHeight;
      adsRequest.nonLinearAdSlotWidth = overlay.clientWidth || window.innerWidth;
      adsRequest.nonLinearAdSlotHeight = 150;
      adsLoader.requestAds(adsRequest);
    } catch {
      settledThenClear({ played: false, rewarded: false });
    }
  });
}
