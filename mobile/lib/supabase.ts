import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { config } from './config';

/**
 * Supabase client for React Native. Uses AsyncStorage for session persistence
 * (works on iOS, Android, and web). Auth state is restored on launch; the
 * access token is forwarded to the Gulel API as a bearer token (see lib/api).
 *
 * Hardening note: for production, swap AsyncStorage for an expo-secure-store
 * adapter on native so the refresh token is stored in the Keychain/Keystore.
 */
// Fall back to harmless placeholders when env isn't configured so the app
// still renders (public catalog works); auth calls will simply fail until
// real Supabase credentials are provided.
if (!config.supabaseUrl || !config.supabaseAnonKey) {
  console.warn('[supabase] EXPO_PUBLIC_SUPABASE_URL/ANON_KEY not set; auth disabled.');
}

export const supabase = createClient(
  config.supabaseUrl || 'https://placeholder.supabase.co',
  config.supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);

/** Returns the current access token (or null), for authenticated API calls. */
export async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}
