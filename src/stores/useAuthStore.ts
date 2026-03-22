import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createClient } from '@/lib/supabase';

export type AuthProvider = 'google' | 'facebook' | 'line' | 'phone' | null;

interface User {
  id: string;
  supabaseId?: string;
  phone?: string;
  email?: string;
  name?: string;
  avatar?: string;
  locale: string;
  provider?: AuthProvider;
  coinBalance: number;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  logout: () => Promise<void>;
  updateCoinBalance: (balance: number) => void;

  /** Sync auth state from Supabase session (call on app mount) */
  checkSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
        }),

      setToken: (token) => set({ token }),

      logout: async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        set({ user: null, token: null, isAuthenticated: false });
      },

      updateCoinBalance: (balance) =>
        set((state) =>
          state.user
            ? { user: { ...state.user, coinBalance: balance } }
            : {}
        ),

      checkSession: async () => {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          set({ user: null, token: null, isAuthenticated: false });
          return;
        }

        const supabaseUser = session.user;
        const provider =
          (supabaseUser.app_metadata?.provider as AuthProvider) ?? null;

        // Fetch Prisma user data (coin balance etc.) from the DB via API
        try {
          const res = await fetch('/api/auth/me');
          if (res.ok) {
            const data = await res.json();
            set({
              user: {
                id: data.id,
                supabaseId: supabaseUser.id,
                phone: data.phone ?? supabaseUser.phone ?? undefined,
                email: data.email ?? supabaseUser.email ?? undefined,
                name:
                  data.name ??
                  supabaseUser.user_metadata?.full_name ??
                  supabaseUser.user_metadata?.name ??
                  undefined,
                avatar:
                  data.avatar ??
                  supabaseUser.user_metadata?.avatar_url ??
                  supabaseUser.user_metadata?.picture ??
                  undefined,
                locale: data.locale ?? 'en',
                provider,
                coinBalance: data.coinBalance ?? 0,
              },
              token: session.access_token,
              isAuthenticated: true,
            });
          } else {
            // Fallback: populate from Supabase session only
            set({
              user: {
                id: supabaseUser.id,
                supabaseId: supabaseUser.id,
                phone: supabaseUser.phone ?? undefined,
                email: supabaseUser.email ?? undefined,
                name:
                  supabaseUser.user_metadata?.full_name ??
                  supabaseUser.user_metadata?.name ??
                  undefined,
                avatar:
                  supabaseUser.user_metadata?.avatar_url ??
                  supabaseUser.user_metadata?.picture ??
                  undefined,
                locale: 'en',
                provider,
                coinBalance: 0,
              },
              token: session.access_token,
              isAuthenticated: true,
            });
          }
        } catch {
          // Network error — still mark as authenticated with session data
          set({
            user: {
              id: supabaseUser.id,
              supabaseId: supabaseUser.id,
              phone: supabaseUser.phone ?? undefined,
              email: supabaseUser.email ?? undefined,
              name:
                supabaseUser.user_metadata?.full_name ??
                supabaseUser.user_metadata?.name ??
                undefined,
              avatar:
                supabaseUser.user_metadata?.avatar_url ??
                supabaseUser.user_metadata?.picture ??
                undefined,
              locale: 'en',
              provider,
              coinBalance: 0,
            },
            token: session.access_token,
            isAuthenticated: true,
          });
        }
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
