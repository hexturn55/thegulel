import 'react-native-url-polyfill/auto';
import { AppState, Platform, type AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import * as aesjs from 'aes-js';
import { createClient } from '@supabase/supabase-js';
import { config } from './config';

/**
 * Supabase client for React Native. The access token is forwarded to the Gulel
 * API as a bearer token (see lib/api).
 *
 * Session persistence:
 * - Native: `LargeSecureStore`. The Supabase session (which includes the
 *   long-lived refresh token) is too large for the Keychain/Keystore (~2 KB
 *   limit on some Android devices), so it is AES-256-CTR encrypted and the
 *   ciphertext goes to AsyncStorage, while the per-key encryption key lives in
 *   expo-secure-store (Keychain / Keystore).
 * - Web: AsyncStorage (localStorage), as before.
 */

/** SecureStore keys may only contain [A-Za-z0-9._-]. */
function secureKeyName(key: string): string {
  return `sbk.${key.replace(/[^A-Za-z0-9._-]/g, '_')}`;
}

const SECURE_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
};

class LargeSecureStore {
  async getItem(key: string): Promise<string | null> {
    try {
      const [cipherHex, keyHex] = await Promise.all([
        AsyncStorage.getItem(key),
        SecureStore.getItemAsync(secureKeyName(key), SECURE_OPTIONS),
      ]);
      if (!cipherHex) return null;
      if (!keyHex) {
        // Pre-encryption builds stored the session as plain JSON in
        // AsyncStorage. Migrate it once instead of signing the user out.
        const legacy = cipherHex.trimStart();
        if (legacy.startsWith('{') || legacy.startsWith('"')) {
          JSON.parse(cipherHex);
          await this.setItem(key, cipherHex).catch(() => {});
          return cipherHex;
        }
        return null;
      }
      const aesKey = aesjs.utils.hex.toBytes(keyHex);
      if (aesKey.length !== 32) return null;
      const cipher = new aesjs.ModeOfOperation.ctr(aesKey, new aesjs.Counter(1));
      const plain = aesjs.utils.utf8.fromBytes(cipher.decrypt(aesjs.utils.hex.toBytes(cipherHex)));
      // Supabase always stores JSON. A key/ciphertext mismatch (e.g. the app was
      // killed between the two writes, or the Keychain was restored on another
      // device) decrypts to garbage: treat that as "no session".
      JSON.parse(plain);
      return plain;
    } catch {
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    // A fresh 256-bit key for every write: CTR mode must never reuse a
    // key/counter pair for different plaintexts.
    const aesKey = Crypto.getRandomBytes(32);
    const cipher = new aesjs.ModeOfOperation.ctr(aesKey, new aesjs.Counter(1));
    const encrypted = cipher.encrypt(aesjs.utils.utf8.toBytes(value));
    await SecureStore.setItemAsync(
      secureKeyName(key),
      aesjs.utils.hex.fromBytes(aesKey),
      SECURE_OPTIONS,
    );
    await AsyncStorage.setItem(key, aesjs.utils.hex.fromBytes(encrypted));
  }

  async removeItem(key: string): Promise<void> {
    await Promise.all([
      AsyncStorage.removeItem(key).catch(() => {}),
      SecureStore.deleteItemAsync(secureKeyName(key), SECURE_OPTIONS).catch(() => {}),
    ]);
  }
}

const isNative = Platform.OS !== 'web';

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
      storage: isNative ? new LargeSecureStore() : AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);

// On native there is no page-visibility signal, so tell Supabase when the app
// is foregrounded: refresh the session while active and stop the refresh timer
// in the background (it would otherwise fire late and race on resume).
if (isNative) {
  const onAppState = (state: AppStateStatus) => {
    if (state === 'active') {
      void supabase.auth.startAutoRefresh();
    } else {
      void supabase.auth.stopAutoRefresh();
    }
  };
  AppState.addEventListener('change', onAppState);
  if (AppState.currentState === 'active') onAppState('active');
}

/** Returns the current access token (or null), for authenticated API calls. */
export async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}
