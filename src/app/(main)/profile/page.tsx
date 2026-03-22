'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import {
  User,
  Coins,
  Clock,
  LogOut,
  Trash2,
  Save,
  ChevronRight,
  AlertTriangle,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  avatar: string | null;
  locale: string;
  provider: string | null;
  coinBalance: number;
  createdAt: string;
}

interface Transaction {
  id: string;
  amount: number;
  type: 'PURCHASE' | 'AD_REWARD' | 'EPISODE_UNLOCK' | 'SUBSCRIPTION' | 'BONUS';
  description: string | null;
  createdAt: string;
}

interface HistoryItem {
  id: string;
  episodeId: string;
  episodeTitle: string;
  episodeNumber: number;
  seriesId: string;
  seriesTitle: string;
  thumbnail: string;
  duration: number;
  progress: number;
  completed: boolean;
  watchedAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const LOCALE_LABELS: Record<string, string> = { en: 'English', hi: 'हिंदी', zh: '中文' };

const TX_BADGE: Record<string, { label: string; className: string }> = {
  PURCHASE:      { label: 'Purchase',   className: 'bg-green-500/20 text-green-400' },
  AD_REWARD:     { label: 'Ad Reward',  className: 'bg-blue-500/20 text-blue-400'  },
  EPISODE_UNLOCK:{ label: 'Unlock',     className: 'bg-red-500/20 text-red-400'    },
  SUBSCRIPTION:  { label: 'Sub',        className: 'bg-purple-500/20 text-purple-400' },
  BONUS:         { label: 'Bonus',      className: 'bg-yellow-500/20 text-yellow-400' },
};

function Avatar({ src, name }: { src?: string | null; name?: string | null }) {
  if (src) {
    return (
      <img
        src={src}
        alt={name ?? 'avatar'}
        className="w-20 h-20 rounded-full object-cover ring-2 ring-white/20"
      />
    );
  }
  const initial = (name ?? '?')[0].toUpperCase();
  return (
    <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center ring-2 ring-white/20">
      <span className="text-white text-3xl font-bold">{initial}</span>
    </div>
  );
}

function ProviderBadge({ provider }: { provider: string | null }) {
  if (!provider) return null;
  const labels: Record<string, string> = {
    google: 'Google',
    facebook: 'Facebook',
    line: 'LINE',
    phone: 'Phone',
  };
  return (
    <span className="text-xs bg-white/10 text-white/70 rounded-full px-2 py-0.5">
      via {labels[provider] ?? provider}
    </span>
  );
}

// ─── Delete Confirmation Modal ─────────────────────────────────────────────────

function DeleteModal({
  onConfirm,
  onCancel,
  isDeleting,
}: {
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl p-6 max-w-sm w-full border border-red-500/30">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0" />
          <h2 className="text-white font-bold text-lg">Delete Account</h2>
        </div>
        <p className="text-gray-400 text-sm mb-6">
          This will permanently delete your account, coin balance, and all watch history.{' '}
          <strong className="text-white">This cannot be undone.</strong>
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="flex-1 py-3 rounded-xl bg-gray-800 text-white font-medium hover:bg-gray-700 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition disabled:opacity-50"
          >
            {isDeleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { user, logout } = useAuthStore();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Edit state
  const [editName, setEditName] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);
  const [selectedLocale, setSelectedLocale] = useState('en');
  const [isSavingLocale, setIsSavingLocale] = useState(false);

  // Delete
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setIsLoading(true);
    try {
      const [profileRes, txRes, histRes] = await Promise.all([
        fetch('/api/user/profile'),
        fetch('/api/user/transactions?limit=10'),
        fetch('/api/user/history?limit=5'),
      ]);

      if (profileRes.ok) {
        const p: UserProfile = await profileRes.json();
        setProfile(p);
        setEditName(p.name ?? '');
        setSelectedLocale(p.locale ?? 'en');
      }
      if (txRes.ok) {
        const t = await txRes.json();
        setTransactions(t.transactions ?? []);
      }
      if (histRes.ok) {
        const h = await histRes.json();
        setHistory(h.history ?? []);
      }
    } catch (err) {
      console.error('Profile fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Save name ──────────────────────────────────────────────────────────────

  const saveName = async () => {
    if (!editName.trim()) return;
    setIsSavingName(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim() }),
      });
      if (res.ok) {
        const updated: UserProfile = await res.json();
        setProfile(updated);
      }
    } finally {
      setIsSavingName(false);
    }
  };

  // ── Save locale ────────────────────────────────────────────────────────────

  const saveLocale = async (locale: string) => {
    setSelectedLocale(locale);
    setIsSavingLocale(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale }),
      });
      if (res.ok) {
        const updated: UserProfile = await res.json();
        setProfile(updated);
      }
    } finally {
      setIsSavingLocale(false);
    }
  };

  // ── Delete account ─────────────────────────────────────────────────────────

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch('/api/user/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation: 'DELETE' }),
      });
      if (res.ok) {
        await logout();
        window.location.href = '/';
      }
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  // ── Not logged in ──────────────────────────────────────────────────────────

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-white text-2xl font-bold mb-4">Not Logged In</h2>
          <Link
            href="/auth/login"
            className="inline-block bg-red-500 hover:bg-red-600 text-white font-semibold px-8 py-3 rounded-full transition"
          >
            Login
          </Link>
        </div>
      </div>
    );
  }

  const displayProfile = profile ?? {
    id: user.id,
    name: user.name ?? null,
    email: user.email ?? null,
    phone: user.phone ?? null,
    avatar: user.avatar ?? null,
    locale: user.locale,
    provider: user.provider ?? null,
    coinBalance: user.coinBalance,
    createdAt: '',
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {showDeleteModal && (
        <DeleteModal
          onConfirm={handleDeleteAccount}
          onCancel={() => setShowDeleteModal(false)}
          isDeleting={isDeleting}
        />
      )}

      <div className="min-h-screen bg-black pb-24">
        {/* ── Header ── */}
        <div className="bg-gradient-to-br from-purple-700 via-purple-600 to-pink-600 px-4 pt-8 pb-6">
          <div className="flex items-center gap-4 mb-6">
            <Avatar src={displayProfile.avatar} name={displayProfile.name} />
            <div>
              <h1 className="text-white text-2xl font-bold leading-tight">
                {displayProfile.name || 'User'}
              </h1>
              {displayProfile.email && (
                <p className="text-white/70 text-sm">{displayProfile.email}</p>
              )}
              {displayProfile.phone && (
                <p className="text-white/60 text-xs mt-0.5">{displayProfile.phone}</p>
              )}
              <div className="mt-1">
                <ProviderBadge provider={displayProfile.provider} />
              </div>
            </div>
          </div>

          {/* Coin balance card */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-400/20 rounded-full flex items-center justify-center">
              <Coins className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-white/70 text-xs">Coin Balance</p>
              <p className="text-white text-2xl font-bold">
                {displayProfile.coinBalance.toLocaleString()}
              </p>
            </div>
            <Link
              href="/wallet"
              className="ml-auto text-white/60 hover:text-white transition flex items-center gap-1 text-sm"
            >
              Top Up <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* ── Edit Name ── */}
        <section className="px-4 py-5 border-b border-gray-800">
          <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-widest mb-3">
            Display Name
          </h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Your name"
              className="flex-1 bg-gray-900 text-white rounded-xl px-4 py-3 text-sm border border-gray-700 focus:outline-none focus:border-purple-500"
            />
            <button
              onClick={saveName}
              disabled={isSavingName || editName.trim() === (profile?.name ?? '')}
              className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white font-medium px-4 py-3 rounded-xl transition text-sm"
            >
              <Save className="w-4 h-4" />
              {isSavingName ? 'Saving…' : 'Save'}
            </button>
          </div>
        </section>

        {/* ── Language ── */}
        <section className="px-4 py-5 border-b border-gray-800">
          <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-widest mb-3">
            Language {isSavingLocale && <span className="text-purple-400 normal-case font-normal">Saving…</span>}
          </h2>
          <div className="flex gap-2">
            {(['en', 'hi', 'zh'] as const).map((loc) => (
              <button
                key={loc}
                onClick={() => saveLocale(loc)}
                className={`flex-1 py-3 rounded-xl text-sm font-medium transition ${
                  selectedLocale === loc
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-900 text-gray-400 hover:bg-gray-800'
                }`}
              >
                {LOCALE_LABELS[loc]}
              </button>
            ))}
          </div>
        </section>

        {/* ── Transaction History ── */}
        <section className="px-4 py-5 border-b border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white text-lg font-bold">Transaction History</h2>
            <Link href="/wallet" className="text-purple-400 hover:text-purple-300 text-sm transition">
              View All
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-14 bg-gray-900 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-6">No transactions yet</p>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx) => {
                const badge = TX_BADGE[tx.type] ?? TX_BADGE.BONUS;
                const isCredit = tx.amount > 0;
                return (
                  <div
                    key={tx.id}
                    className="flex items-center gap-3 bg-gray-900 rounded-xl px-4 py-3"
                  >
                    <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${badge.className}`}>
                      {badge.label}
                    </span>
                    <p className="flex-1 text-gray-400 text-xs truncate">
                      {tx.description ?? badge.label}
                    </p>
                    <span className={`font-bold text-sm ${isCredit ? 'text-green-400' : 'text-red-400'}`}>
                      {isCredit ? '+' : ''}{tx.amount}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Continue Watching ── */}
        <section className="px-4 py-5 border-b border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white text-lg font-bold flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-400" />
              Continue Watching
            </h2>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-900 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : history.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-6">No watch history yet</p>
          ) : (
            <div className="space-y-3">
              {history.map((item) => {
                const progressPct = item.duration > 0
                  ? Math.min(100, Math.round((item.progress / item.duration) * 100))
                  : 0;
                return (
                  <Link
                    key={item.id}
                    href={`/watch/${item.episodeId}`}
                    className="flex gap-3 bg-gray-900 hover:bg-gray-800 rounded-xl p-3 transition"
                  >
                    <div className="relative w-24 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-800">
                      {item.thumbnail && (
                        <img
                          src={item.thumbnail}
                          alt={item.episodeTitle}
                          className="w-full h-full object-cover"
                        />
                      )}
                      {item.completed && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="text-white text-xs font-medium">Done</span>
                        </div>
                      )}
                      {/* Progress bar */}
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
                        <div
                          className="h-full bg-red-500"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{item.seriesTitle}</p>
                      <p className="text-gray-400 text-xs truncate">
                        Ep {item.episodeNumber}: {item.episodeTitle}
                      </p>
                      <p className="text-gray-600 text-xs mt-1">{formatDate(item.watchedAt)}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Actions ── */}
        <section className="px-4 py-5 space-y-2">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 bg-gray-900 hover:bg-red-900/20 p-4 rounded-xl transition"
          >
            <LogOut className="w-5 h-5 text-red-400" />
            <span className="text-red-400 font-medium">Sign Out</span>
          </button>

          <button
            onClick={() => setShowDeleteModal(true)}
            className="w-full flex items-center gap-3 bg-gray-900 hover:bg-red-900/20 p-4 rounded-xl transition"
          >
            <Trash2 className="w-5 h-5 text-red-600" />
            <span className="text-red-600 font-medium text-sm">Delete Account</span>
          </button>
        </section>
      </div>
    </>
  );
}
