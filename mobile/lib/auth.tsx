import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import type { CurrentUser } from '@gulel/shared';
import { supabase } from './supabase';
import { api } from './api';
import { initPurchases, logOutPurchases } from './purchases';

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

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    await logOutPurchases();
    setUser(null);
    setSession(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ session, user, loading, refresh, signInWithOtp, verifyOtp, signOut }}
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
