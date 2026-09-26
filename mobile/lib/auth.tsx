import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import * as Crypto from 'expo-crypto';
import * as AppleAuthentication from 'expo-apple-authentication';
import type { Session } from '@supabase/supabase-js';
import { ApiRequestError, type CurrentUser } from '@gulel/shared';
import { supabase } from './supabase';
import { api } from './api';
import { initPurchases, logOutPurchases } from './purchases';

// Lets the auth browser tab close cleanly and hand the redirect back to the app.
WebBrowser.maybeCompleteAuthSession();

interface AuthState {
  session: Session | null;
  user: CurrentUser | null;
  /** True until the persisted session (if any) has been restored and loaded. */
  loading: boolean;
  /**
   * True when the last attempt to load the signed-in user failed for a reason
   * other than an invalid session (offline, server error). `user` keeps its
   * previous value in that case.
   */
  userError: boolean;
  /** Re-fetch the current user (e.g. after a purchase or unlock). */
  refresh: () => Promise<void>;
  /** Send an SMS OTP to the given E.164 phone number. */
  signInWithOtp: (phone: string) => Promise<void>;
  /** Verify the SMS OTP code and establish a session. */
  verifyOtp: (phone: string, token: string) => Promise<void>;
  /**
   * OAuth sign-in with Google via an in-app browser + deep-link redirect.
   * Resolves false if the user cancelled, true once the session is set.
   */
  signInWithGoogle: () => Promise<boolean>;
  /**
   * Native Sign in with Apple (iOS only). Resolves false if the user
   * cancelled, true once the session is set.
   */
  signInWithApple: () => Promise<boolean>;
  signOut: () => Promise<void>;
  /** Permanently delete the account on the server, then sign out locally. */
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function toHex(bytes: Uint8Array): string {
  let out = '';
  for (const b of bytes) out += b.toString(16).padStart(2, '0');
  return out;
}

/**
 * Send Apple's one-time (5 minute) authorization code to the server so it can
 * later revoke Sign in with Apple on account deletion. Runs in the background
 * (sign-in does not wait for it); retries once on a network / 5xx failure and
 * logs instead of swallowing errors.
 */
async function linkAppleCode(code: string): Promise<void> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const res = await api.linkAppleAuthorizationCode(code);
      if (!res?.ok) console.warn('[auth] Apple credential not stored by the server');
      return;
    } catch (e) {
      const retryable =
        e instanceof ApiRequestError && (e.status === 0 || e.status >= 500) && attempt === 0;
      if (!retryable) {
        console.warn('[auth] could not link Apple credential', e);
        return;
      }
      await delay(2000);
    }
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [userError, setUserError] = useState(false);

  // Latest session, so `refresh` can keep a stable identity.
  const sessionRef = useRef<Session | null>(null);
  // Incremented on every load / sign-out; responses from older loads are
  // dropped so a slow request can never overwrite newer state.
  const requestIdRef = useRef(0);
  // Latest loaded user, readable from the auth listener without re-subscribing.
  const userRef = useRef<CurrentUser | null>(null);
  userRef.current = user;
  // Id of the loadUser call currently in flight (0 = none).
  const inFlightRef = useRef(0);

  const clearUser = useCallback(() => {
    requestIdRef.current += 1;
    setUser(null);
    setUserError(false);
  }, []);

  const loadUser = useCallback(
    async (s: Session | null): Promise<void> => {
      const id = ++requestIdRef.current;
      const stale = () => id !== requestIdRef.current;
      if (!s) {
        setUser(null);
        setUserError(false);
        return;
      }
      inFlightRef.current = id;
      try {
        for (let attempt = 0; ; attempt += 1) {
          try {
            const me = await api.getMe();
            if (stale()) return;
            setUser(me);
            setUserError(false);
            // Identify the user to RevenueCat so purchases attach to this account.
            void initPurchases(me.id).catch((e: unknown) => {
              console.warn('[auth] initPurchases failed', e);
            });
            return;
          } catch (e) {
            if (stale()) return;
            if (e instanceof ApiRequestError && e.status === 401) {
              // The server rejected a token Supabase considers valid (revoked,
              // deleted user, ...): drop the local session.
              await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
              void logOutPurchases();
              if (!stale()) setUser(null);
              return;
            }
            if (e instanceof ApiRequestError && e.status === 404 && attempt === 0) {
              // The server provisions the user row on first /me; give it a moment.
              await delay(1000);
              if (stale()) return;
              continue;
            }
            // Offline / server error: keep whatever user we had and flag it.
            console.warn('[auth] could not load the current user', e);
            setUserError(true);
            return;
          }
        }
      } finally {
        if (inFlightRef.current === id) inFlightRef.current = 0;
      }
    },
    [],
  );

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      sessionRef.current = s;
      setSession(s);
      // Supabase invokes this callback while holding its auth lock; calling
      // back into supabase.auth (getSession inside the API client) must happen
      // after the callback returns, hence setTimeout.
      switch (event) {
        case 'INITIAL_SESSION':
          setTimeout(() => {
            void (s ? loadUser(s) : Promise.resolve()).finally(() => setLoading(false));
          }, 0);
          break;
        case 'SIGNED_IN':
        case 'USER_UPDATED':
          // A fresh sign-in supersedes any earlier load failure; clear it now
          // (synchronously) so screens waiting on the new user do not act on
          // a stale error before the deferred load below completes.
          setUserError(false);
          setTimeout(() => void loadUser(s), 0);
          break;
        case 'SIGNED_OUT':
          clearUser();
          break;
        case 'TOKEN_REFRESHED':
          // Normally the user record is unchanged. But after an offline cold
          // start INITIAL_SESSION arrives with no session (the refresh failed),
          // and when the network returns the session is recovered with only
          // TOKEN_REFRESHED: load the user if we still have none.
          if (s && !userRef.current && !inFlightRef.current) {
            setTimeout(() => void loadUser(s), 0);
          }
          break;
        default:
          // PASSWORD_RECOVERY / MFA: only the session (updated above) changes.
          break;
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [loadUser, clearUser]);

  const refresh = useCallback(() => loadUser(sessionRef.current), [loadUser]);

  const signInWithOtp = useCallback(async (phone: string) => {
    const { error } = await supabase.auth.signInWithOtp({ phone });
    if (error) throw error;
  }, []);

  const verifyOtp = useCallback(async (phone: string, token: string) => {
    const { error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' });
    if (error) throw error;
  }, []);

  const signInWithGoogle = useCallback(async (): Promise<boolean> => {
    const redirectTo = Linking.createURL('auth-callback'); // e.g. gulel://auth-callback
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error) throw error;
    if (!data?.url) throw new Error('Could not start Google sign-in.');

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type !== 'success' || !result.url) return false; // cancelled/dismissed

    // Establish the session from the redirect: PKCE returns ?code=, the
    // implicit flow returns tokens in the URL fragment.
    const returned = result.url;
    const code = Linking.parse(returned).queryParams?.code;
    if (typeof code === 'string') {
      const { error: exErr } = await supabase.auth.exchangeCodeForSession(code);
      if (exErr) throw exErr;
      return true;
    }
    const fragment = returned.includes('#') ? returned.split('#')[1] : '';
    const params = new URLSearchParams(fragment);
    const errorDescription = params.get('error_description');
    if (errorDescription) throw new Error(errorDescription.replace(/\+/g, ' '));
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');
    if (!access_token || !refresh_token) {
      throw new Error('Sign-in did not return a session.');
    }
    const { error: setErr } = await supabase.auth.setSession({ access_token, refresh_token });
    if (setErr) throw setErr;
    return true;
  }, []);

  const signInWithApple = useCallback(async (): Promise<boolean> => {
    if (Platform.OS !== 'ios') {
      throw new Error('Sign in with Apple is only available on iOS.');
    }
    // Apple embeds the SHA-256 of the nonce in the identity token; Supabase
    // verifies it against the raw nonce.
    const rawNonce = toHex(Crypto.getRandomBytes(32));
    const hashedNonce = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      rawNonce,
    );

    let credential: AppleAuthentication.AppleAuthenticationCredential;
    try {
      credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });
    } catch (e) {
      if ((e as { code?: unknown } | null)?.code === 'ERR_REQUEST_CANCELED') return false;
      throw e;
    }
    if (!credential.identityToken) {
      throw new Error('Apple sign-in did not return an identity token.');
    }

    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
      nonce: rawNonce,
    });
    if (error) throw error;

    // Apple only shares the name on the very first authorization, and it is
    // not part of the identity token: persist it on the Supabase user.
    const name = credential.fullName;
    const fullName = name
      ? [name.givenName, name.middleName, name.familyName]
          .filter((p): p is string => !!p && p.trim().length > 0)
          .join(' ')
      : '';
    if (fullName) {
      const { error: updErr } = await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          given_name: name?.givenName ?? undefined,
          family_name: name?.familyName ?? undefined,
        },
      });
      if (updErr) console.warn('[auth] could not save Apple name', updErr);
    }

    // Lets the server obtain an Apple refresh token so it can revoke Sign in
    // with Apple on account deletion (App Store guideline 5.1.1(v)).
    if (credential.authorizationCode) {
      void linkAppleCode(credential.authorizationCode);
    }
    return true;
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    // Global sign-out needs the network; always clear the local session.
    if (error) await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
    await logOutPurchases();
    clearUser();
    sessionRef.current = null;
    setSession(null);
  }, [clearUser]);

  const deleteAccount = useCallback(async () => {
    try {
      await api.deleteAccount();
    } catch (e) {
      // 401: the server no longer recognises this login. Deleting the auth
      // user is the server's last step, so this is typically a retry after a
      // deletion that completed while the client timed out. Either way the
      // local session is dead: finish the local sign-out instead of failing.
      if (!(e instanceof ApiRequestError && e.status === 401)) throw e;
    }
    await logOutPurchases();
    await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
    clearUser();
    sessionRef.current = null;
    setSession(null);
  }, [clearUser]);

  const value = useMemo<AuthState>(
    () => ({
      session,
      user,
      loading,
      userError,
      refresh,
      signInWithOtp,
      verifyOtp,
      signInWithGoogle,
      signInWithApple,
      signOut,
      deleteAccount,
    }),
    [
      session,
      user,
      loading,
      userError,
      refresh,
      signInWithOtp,
      verifyOtp,
      signInWithGoogle,
      signInWithApple,
      signOut,
      deleteAccount,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
