/**
 * Runtime configuration, sourced from EXPO_PUBLIC_* env vars (inlined by Expo
 * at build time). Copy .env.example to .env and fill these in.
 */
export const config = {
  /** Base URL of the Gulel web/API deployment (the Next.js app). */
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000',
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
  /** RevenueCat public SDK keys (per platform). */
  revenueCatIosKey: process.env.EXPO_PUBLIC_RC_IOS_KEY ?? '',
  revenueCatAndroidKey: process.env.EXPO_PUBLIC_RC_ANDROID_KEY ?? '',
};
