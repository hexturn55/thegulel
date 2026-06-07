import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import type { Session } from '@supabase/supabase-js';
import type { CurrentUser } from '@gulel/shared';
import { supabase } from './supabase';
import { api } from './api';
import { initPurchases, logOutPurchases } from './purchases';

// Lets the auth browser tab close cleanly and hand the redirect back to the app.
WebBrowser.maybeCompleteAuthSession();

interface AuthState {
  session: Session | null;
  user: CurrentUser | null;
  loading: boolean;
  /** Re-fetch the current user (e.g. after a purchase or unlock). */
  refresh: () => Promise<void>;
  /** Send an SMS OTP to the given E.164 phone number. */
  signInWithOtp: (phone: string) => Promise<void>;
  /** Verify the SMS OTP code and establish a session. */
  verifyOtp: (phone: string, token: string) => Promise<void>;
  /** OAuth sign-in with Google via an in-app browser + deep-link redirect. */
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async (s: Session | null) => {
    if (!s) {
      setUser(null);
      return;
    }
    try {
      const me = await api.getMe();
      setUser(me);
      // Identify the user to RevenueCat so purchases attach to this account.
      await initPurchases(me.id);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      void loadUser(data.session).finally(() => setLoading(false));
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      void loadUser(s);
    });
    return () => sub.subscription.unsubscribe();
  }, [loadUser]);

  const refresh = useCallback(() => loadUser(session), [session, loadUser]);

  const signInWithOtp = useCallback(async (phone: string) => {
    const { error } = await supabase.auth.signInWithOtp({ phone });
    if (error) throw error;
  }, []);

  const verifyOtp = useCallback(async (phone: string, token: string) => {
    const { error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' });
    if (error) throw error;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const redirectTo = Linking.createURL('auth-callback'); // e.g. gulel://auth-callback
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error) throw error;
    if (!data?.url) throw new Error('Could not start Google sign-in.');

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type !== 'success' || !result.url) return; // cancelled/dismissed

    // Establish the session from the redirect: PKCE returns ?code=, the
    // implicit flow returns tokens in the URL fragment.
    const returned = result.url;
    const code = Linking.parse(returned).queryParams?.code;
    if (typeof code === 'string') {
      const { error: exErr } = await supabase.auth.exchangeCodeForSession(code);
      if (exErr) throw exErr;
      return;
    }
    const fragment = returned.includes('#') ? returned.split('#')[1] : '';
    const params = new URLSearchParams(fragment);
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');
    if (access_token && refresh_token) {
      const { error: setErr } = await supabase.auth.setSession({ access_token, refresh_token });
      if (setErr) throw setErr;
    } else {
      throw new Error('Sign-in did not return a session.');
    }
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    await logOutPurchases();
    setUser(null);
    setSession(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        loading,
        refresh,
        signInWithOtp,
        verifyOtp,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
