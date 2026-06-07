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
 * Only public, client-safe values live here (the API URL, the Supabase
 * publishable key, RevenueCat public SDK keys).
 */
const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string | undefined>;

export const config = {
  /** Base URL of the Gulel web/API deployment (the Next.js app). */
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? extra.apiUrl ?? 'http://localhost:3000',
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? extra.supabaseUrl ?? '',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? extra.supabaseAnonKey ?? '',
  /** RevenueCat public SDK keys (per platform). */
  revenueCatIosKey: process.env.EXPO_PUBLIC_RC_IOS_KEY ?? extra.revenueCatIosKey ?? '',
  revenueCatAndroidKey:
    process.env.EXPO_PUBLIC_RC_ANDROID_KEY ?? extra.revenueCatAndroidKey ?? '',
};
