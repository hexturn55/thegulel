import Constants from 'expo-constants';

/**
 * Runtime configuration.
 *
 * Resolution order for each value:
 *   1. EXPO_PUBLIC_* env (from .env during local dev / EAS build profile env)
 *   2. app.json `extra` (committed, always bundled — the reliable fallback so
 *      standalone builds are correctly configured even without build-time env)
 *   3. a safe default
 *
 * `||` (not `??`) is deliberate: an empty env string (e.g. `FOO=""` in .env)
 * must fall through to `extra` instead of overriding it with nothing.
 *
 * Only public, client-safe values live here (the API URL, the Supabase
 * publishable key, RevenueCat public SDK keys, AdMob unit ids).
 */
const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string | undefined>;

const PROD_ANDROID_REWARDED_ID = 'ca-app-pub-7686596859294513/6574059853';

/** Google's public sample AdMob publisher (used by its test app ids). */
const GOOGLE_SAMPLE_PUBLISHER = 'ca-app-pub-3940256099942544';

/**
 * True when the iOS binary's GADApplicationIdentifier (app.json
 * react-native-google-mobile-ads plugin `iosAppId`, baked in at prebuild) is
 * Google's sample app id. A real iOS ad unit must never be requested under it
 * (app id / unit mismatch: no fill, and against AdMob policy for a store
 * binary). Unknown = treated as sample, so the guard fails closed.
 */
function iosAdMobAppIdIsSample(): boolean {
  try {
    const plugins = (Constants.expoConfig?.plugins ?? []) as unknown[];
    for (const p of plugins) {
      if (Array.isArray(p) && p[0] === 'react-native-google-mobile-ads') {
        const iosAppId = (p[1] as { iosAppId?: unknown } | undefined)?.iosAppId;
        return typeof iosAppId !== 'string' || iosAppId.startsWith(GOOGLE_SAMPLE_PUBLISHER);
      }
    }
  } catch {
    // fall through
  }
  return true;
}

const admobRewardedAndroidId =
  process.env.EXPO_PUBLIC_ADMOB_REWARDED_ID_ANDROID ||
  extra.admobRewardedAdUnitIdAndroid ||
  PROD_ANDROID_REWARDED_ID;

export const config = {
  /** Base URL of the Gulel web/API deployment (the Next.js app). */
  apiUrl: process.env.EXPO_PUBLIC_API_URL || extra.apiUrl || 'http://localhost:3000',
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || extra.supabaseUrl || '',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || extra.supabaseAnonKey || '',

  /** RevenueCat public SDK keys (per platform). Empty = IAP unavailable. */
  revenueCatIosKey: process.env.EXPO_PUBLIC_RC_IOS_KEY || extra.revenueCatIosKey || '',
  revenueCatAndroidKey:
    process.env.EXPO_PUBLIC_RC_ANDROID_KEY || extra.revenueCatAndroidKey || '',

  /**
   * AdMob rewarded ad unit id for iOS. Deliberately has NO Android fallback:
   * an empty value means rewarded ads are not offered on iOS (no iOS AdMob app
   * exists yet). Also forced empty while the binary still carries Google's
   * sample iOS app id: set the real `iosAppId` in app.json (and rebuild) in
   * the same change that sets the iOS unit.
   */
  admobRewardedIosId: iosAdMobAppIdIsSample()
    ? ''
    : process.env.EXPO_PUBLIC_ADMOB_REWARDED_ID_IOS || extra.admobRewardedAdUnitIdIos || '',
  /** AdMob rewarded ad unit id for Android (real production unit by default). */
  admobRewardedAndroidId,
  /**
   * Serve Google's test ad units instead of real ones. Always true on the dev
   * server; release builds opt in via EXPO_PUBLIC_ADMOB_TEST_ADS=1 (the
   * development and preview EAS profiles set it, production does not).
   */
  adsUseTestUnits: __DEV__ || process.env.EXPO_PUBLIC_ADMOB_TEST_ADS === '1',

  /** Build environment label: 'development' | 'preview' | 'production'. */
  appEnv: process.env.EXPO_PUBLIC_APP_ENV || 'production',

  /** Legal / support links surfaced in the app (required by store review). */
  privacyUrl: extra.privacyUrl || 'https://thegulel.com/privacy',
  termsUrl: extra.termsUrl || 'https://thegulel.com/terms',
  deleteAccountUrl: extra.deleteAccountUrl || 'https://thegulel.com/delete-account',
  supportEmail: extra.supportEmail || 'support@thegulel.com',

  /**
   * @deprecated Use `admobRewardedAndroidId` / `admobRewardedIosId`. Kept only
   * so the current lib/ads.ts compiles until it is rewritten.
   */
  admobRewardedAdUnitId: admobRewardedAndroidId,
};
