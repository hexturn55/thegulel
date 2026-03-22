'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User,
  Coins,
  Ban,
  ArrowLeft,
  Calendar,
  Phone,
  Mail,
  Shield,
  Clock,
  PlayCircle,
} from 'lucide-react';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import { useToast } from '@/components/admin/Toast';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description?: string;
  createdAt: string;
}

interface WatchHistoryItem {
  id: string;
  episodeId: string;
  episodeTitle?: string;
  seriesTitle?: string;
  watchedAt: string;
  progress?: number;
}

interface UserDetail {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  provider?: string;
  coinBalance: number;
  role: string;
  banned: boolean;
  createdAt: string;
  transactions?: Transaction[];
  watchHistory?: WatchHistoryItem[];
}

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [banLoading, setBanLoading] = useState(false);
  const [showCoinModal, setShowCoinModal] = useState(false);
  const [coinAmount, setCoinAmount] = useState('');
  const [coinReason, setCoinReason] = useState('');
  const [coinLoading, setCoinLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'transactions' | 'watch'>('transactions');

  const fetchUser = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${id}`);
      if (!res.ok) throw new Error();
      setUser(await res.json());
    } catch {
      toast('Failed to load user', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUser(); }, [id]);

  const handleBanToggle = async () => {
    if (!user) return;
    setBanLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ banned: !user.banned }),
      });
      if (!res.ok) throw new Error();
      toast(`User ${user.banned ? 'unbanned' : 'banned'}`, 'success');
      setShowBanDialog(false);
      fetchUser();
    } catch {
      toast('Failed to update user', 'error');
    } finally {
      setBanLoading(false);
    }
  };

  const handleRoleChange = async (role: string) => {
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) throw new Error();
      toast('Role updated', 'success');
      fetchUser();
    } catch {
      toast('Failed to update role', 'error');
    }
  };

  const handleCoinAdjust = async () => {
    setCoinLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${id}/coins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Number(coinAmount), reason: coinReason }),
      });
      if (!res.ok) throw new Error();
      toast('Coins adjusted', 'success');
      setShowCoinModal(false);
      setCoinAmount('');
      setCoinReason('');
      fetchUser();
    } catch {
      toast('Failed to adjust coins', 'error');
    } finally {
      setCoinLoading(false);
    }
  };

  const formatDate = (s: string) =>
    new Date(s).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="h-8 bg-gray-800 rounded animate-pulse w-32" />
        <div className="h-40 bg-gray-900 border border-gray-800 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-20 text-gray-500">
        User not found.{' '}
        <Link href="/admin/users" className="text-red-500 hover:underline">Go back</Link>
      </div>
    );
  }

  const transactions = user.transactions ?? [];
  const watchHistory = user.watchHistory ?? [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-300 text-sm transition-colors"
      >
        <ArrowLeft size={15} /> Back to Users
      </button>

      {/* Profile card */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {/* Avatar */}
          <div className="shrink-0">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name ?? 'User'}
                className="w-20 h-20 rounded-full object-cover border-2 border-gray-700"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center border-2 border-gray-700">
                <User size={32} className="text-gray-500" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-white">{user.name ?? 'Unnamed User'}</h1>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                  user.banned
                    ? 'bg-red-900/50 text-red-400 border-red-700'
                    : 'bg-green-900/50 text-green-400 border-green-700'
                }`}
              >
                {user.banned ? 'Banned' : 'Active'}
              </span>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-gray-400">
              {user.email && (
                <span className="flex items-center gap-1.5">
                  <Mail size={13} /> {user.email}
                </span>
              )}
              {user.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone size={13} /> {user.phone}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Calendar size={13} /> Joined {formatDate(user.createdAt)}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 mt-3">
              {/* Coin balance */}
              <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2">
                <Coins size={14} className="text-yellow-400" />
                <span className="text-yellow-400 font-semibold">{user.coinBalance}</span>
                <span className="text-gray-500 text-xs">coins</span>
                <button
                  onClick={() => setShowCoinModal(true)}
                  className="ml-1 text-xs text-red-500 hover:text-red-400 transition-colors"
                >
                  Adjust
                </button>
              </div>

              {/* Role */}
              <div className="flex items-center gap-2">
                <Shield size={13} className="text-gray-500" />
                <select
                  value={user.role ?? 'user'}
                  onChange={(e) => handleRoleChange(e.target.value)}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-red-600"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="superadmin">Superadmin</option>
                </select>
              </div>
            </div>
          </div>

          {/* Ban button */}
          <button
            onClick={() => setShowBanDialog(true)}
            className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              user.banned
                ? 'bg-green-900/40 hover:bg-green-900/70 text-green-400 border border-green-700'
                : 'bg-red-900/40 hover:bg-red-900/70 text-red-400 border border-red-700'
            }`}
          >
            <Ban size={15} />
            {user.banned ? 'Unban User' : 'Ban User'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800">
        {(['transactions', 'watch'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors capitalize border-b-2 -mb-px ${
              activeTab === tab
                ? 'text-white border-red-600'
                : 'text-gray-500 border-transparent hover:text-gray-300'
            }`}
          >
            {tab === 'transactions' ? 'Transaction History' : 'Watch History'}
          </button>
        ))}
      </div>

      {/* Transaction History */}
      {activeTab === 'transactions' && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          {transactions.length === 0 ? (
            <div className="py-12 text-center text-gray-500">No transactions found.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id} className="border-b border-gray-800 hover:bg-gray-950 transition-colors">
                    <td className="px-4 py-3 text-gray-400 capitalize">{t.type}</td>
                    <td className="px-4 py-3">
                      <span className={t.amount >= 0 ? 'text-green-400' : 'text-red-400'}>
                        {t.amount >= 0 ? '+' : ''}{t.amount}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{t.description ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(t.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Watch History */}
      {activeTab === 'watch' && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          {watchHistory.length === 0 ? (
            <div className="py-12 text-center text-gray-500">No watch history found.</div>
          ) : (
            <div className="divide-y divide-gray-800">
              {watchHistory.map((item) => (
                <div key={item.id} className="flex items-center gap-4 px-4 py-3 hover:bg-gray-950 transition-colors">
                  <PlayCircle size={16} className="text-gray-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white truncate">
                      {item.seriesTitle ?? 'Unknown Series'} —{' '}
                      <span className="text-gray-400">{item.episodeTitle ?? 'Unknown Episode'}</span>
                    </div>
                    {item.progress !== undefined && (
                      <div className="flex items-center gap-2 mt-1">
                        <div className="h-1 w-24 bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-red-600 rounded-full"
                            style={{ width: `${Math.min(item.progress, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600">{item.progress}%</span>
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 shrink-0 flex items-center gap-1">
                    <Clock size={11} /> {formatDate(item.watchedAt)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Ban confirm */}
      <ConfirmDialog
        open={showBanDialog}
        title={user.banned ? 'Unban User' : 'Ban User'}
        message={
          user.banned
            ? `Unban "${user.name ?? user.email}"? They will regain access to the platform.`
            : `Ban "${user.name ?? user.email}"? They will lose access to the platform.`
        }
        confirmLabel={user.banned ? 'Unban' : 'Ban'}
        dangerous={!user.banned}
        loading={banLoading}
        onConfirm={handleBanToggle}
        onCancel={() => setShowBanDialog(false)}
      />

      {/* Coin adjust modal */}
      {showCoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowCoinModal(false)} />
          <div className="relative bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-md p-6 space-y-5">
            <h3 className="text-white font-semibold text-lg">Adjust Coin Balance</h3>
            <p className="text-gray-400 text-sm">
              Current: <span className="text-yellow-400 font-medium">{user.coinBalance} coins</span>
            </p>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-400 block mb-1.5">Amount (negative to subtract)</label>
                <input
                  type="number"
                  value={coinAmount}
                  onChange={(e) => setCoinAmount(e.target.value)}
                  placeholder="e.g. 100 or -50"
                  className="w-full px-3 py-2.5 bg-gray-950 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-600"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-400 block mb-1.5">Reason</label>
                <input
                  type="text"
                  value={coinReason}
                  onChange={(e) => setCoinReason(e.target.value)}
                  placeholder="Admin adjustment, refund, etc."
                  className="w-full px-3 py-2.5 bg-gray-950 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-600"
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowCoinModal(false)}
                className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleCoinAdjust}
                disabled={!coinAmount || coinLoading}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium disabled:opacity-50"
              >
                {coinLoading ? 'Saving...' : 'Apply'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
