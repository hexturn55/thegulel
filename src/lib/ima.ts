/* eslint-disable @typescript-eslint/no-explicit-any -- the Google IMA SDK is
   loaded at runtime from a CDN and ships no TypeScript types, so its globals
   (google.ima.*) and event objects are necessarily typed as `any`. */
/**
 * Google IMA SDK rewarded-video integration.
 *
 * `playRewardedAd()` loads the IMA HTML5 SDK on demand, plays a rewarded ad
 * from the configured VAST tag, and resolves once the ad finishes.
 *
 * Env-gated: if `NEXT_PUBLIC_IMA_REWARDED_AD_TAG_URL` is not set (or the SDK
 * fails to load / errors), it resolves with `{ played: false }` so the caller
 * can fall back to the simulated reward flow. This keeps the coin economy
 * working in dev/preview where no Ad Manager account is wired up.
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

export async function playRewardedAd(): Promise<RewardedAdResult> {
  const tagUrl = process.env.NEXT_PUBLIC_IMA_REWARDED_AD_TAG_URL;
  if (!tagUrl) return { played: false, rewarded: false };
  if (typeof window === 'undefined') return { played: false, rewarded: false };

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
      adsRequest.adTagUrl = tagUrl;
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
