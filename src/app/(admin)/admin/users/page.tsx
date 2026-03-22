'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Search, User, Ban, Coins, ChevronDown, ShieldCheck } from 'lucide-react';
import DataTable from '@/components/admin/DataTable';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import { useToast } from '@/components/admin/Toast';

interface AdminUser {
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
}

interface CoinAdjustState {
  user: AdminUser;
  amount: string;
  reason: string;
  loading: boolean;
}

export default function UsersPage() {
  const { toast } = useToast();
  const [data, setData] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [banTarget, setBanTarget] = useState<AdminUser | null>(null);
  const [banLoading, setBanLoading] = useState(false);
  const [coinAdjust, setCoinAdjust] = useState<CoinAdjustState | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
        ...(search && { search }),
      });
      const res = await fetch(`/api/admin/users?${params}`);
      if (!res.ok) throw new Error();
      const json = await res.json();
      setData(json.users ?? []);
      setTotal(json.total ?? 0);
    } catch {
      toast('Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search, toast]);

  useEffect(() => {
    const t = setTimeout(fetchData, 300);
    return () => clearTimeout(t);
  }, [fetchData]);

  const handleBanToggle = async () => {
    if (!banTarget) return;
    setBanLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${banTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ banned: !banTarget.banned }),
      });
      if (!res.ok) throw new Error();
      toast(`User ${banTarget.banned ? 'unbanned' : 'banned'}`, 'success');
      setBanTarget(null);
      fetchData();
    } catch {
      toast('Failed to update user', 'error');
    } finally {
      setBanLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, role: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) throw new Error();
      toast('Role updated', 'success');
      fetchData();
    } catch {
      toast('Failed to update role', 'error');
    }
  };

  const handleCoinAdjust = async () => {
    if (!coinAdjust) return;
    setCoinAdjust((prev) => prev ? { ...prev, loading: true } : null);
    try {
      const res = await fetch(`/api/admin/users/${coinAdjust.user.id}/coins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(coinAdjust.amount),
          reason: coinAdjust.reason,
        }),
      });
      if (!res.ok) throw new Error();
      toast('Coin balance adjusted', 'success');
      setCoinAdjust(null);
      fetchData();
    } catch {
      toast('Failed to adjust coins', 'error');
      setCoinAdjust((prev) => prev ? { ...prev, loading: false } : null);
    }
  };

  const formatDate = (s: string) =>
    new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const ROLE_BADGE: Record<string, string> = {
    admin: 'bg-red-900/50 text-red-400 border-red-700',
    superadmin: 'bg-purple-900/50 text-purple-400 border-purple-700',
    user: 'bg-gray-800 text-gray-400 border-gray-700',
  };

  const columns = [
    {
      key: 'user',
      label: 'User',
      render: (row: AdminUser) => (
        <div className="flex items-center gap-3">
          {row.avatar ? (
            <img src={row.avatar} alt={row.name ?? ''} className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center">
              <User size={14} className="text-gray-500" />
            </div>
          )}
          <div>
            <div className="font-medium text-white text-sm">{row.name ?? '—'}</div>
            <div className="text-xs text-gray-500">{row.email ?? row.phone ?? '—'}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'provider',
      label: 'Provider',
      render: (row: AdminUser) => (
        <span className="text-xs text-gray-400 capitalize">{row.provider ?? 'phone'}</span>
      ),
    },
    {
      key: 'coinBalance',
      label: 'Coins',
      render: (row: AdminUser) => (
        <span className="text-yellow-400 font-medium text-sm">{row.coinBalance}</span>
      ),
    },
    {
      key: 'role',
      label: 'Role',
      render: (row: AdminUser) => (
        <select
          value={row.role ?? 'user'}
          onChange={(e) => handleRoleChange(row.id, e.target.value)}
          className={`text-xs px-2 py-1 rounded border bg-transparent cursor-pointer focus:outline-none ${
            ROLE_BADGE[row.role] ?? ROLE_BADGE.user
          }`}
        >
          <option value="user">User</option>
          <option value="admin">Admin</option>
          <option value="superadmin">Superadmin</option>
        </select>
      ),
    },
    {
      key: 'banned',
      label: 'Status',
      render: (row: AdminUser) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
            row.banned
              ? 'bg-red-900/50 text-red-400 border-red-700'
              : 'bg-green-900/50 text-green-400 border-green-700'
          }`}
        >
          {row.banned ? 'Banned' : 'Active'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Joined',
      render: (row: AdminUser) => (
        <span className="text-xs text-gray-500">{formatDate(row.createdAt)}</span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row: AdminUser) => (
        <div className="flex items-center gap-1">
          <Link
            href={`/admin/users/${row.id}`}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
            title="View detail"
          >
            <ShieldCheck size={14} />
          </Link>
          <button
            onClick={() =>
              setCoinAdjust({ user: row, amount: '', reason: '', loading: false })
            }
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-yellow-400 transition-colors"
            title="Adjust coins"
          >
            <Coins size={14} />
          </button>
          <button
            onClick={() => setBanTarget(row)}
            className={`p-1.5 rounded-lg transition-colors ${
              row.banned
                ? 'text-green-500 hover:bg-green-900/30'
                : 'text-gray-400 hover:bg-red-900/30 hover:text-red-400'
            }`}
            title={row.banned ? 'Unban' : 'Ban'}
          >
            <Ban size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white">Users</h1>
          <p className="text-gray-500 text-sm mt-0.5">{total} total users</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by name, email, or phone..."
          className="w-full pl-9 pr-4 py-2.5 bg-gray-900 border border-gray-800 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-600 transition-colors"
        />
      </div>

      {/* Table */}
      <DataTable
        columns={columns as unknown as Parameters<typeof DataTable>[0]['columns']}
        data={data as unknown as Record<string, unknown>[]}
        loading={loading}
        emptyMessage="No users found."
        page={page}
        pageSize={20}
        total={total}
        onPageChange={setPage}
      />

      {/* Ban confirm */}
      <ConfirmDialog
        open={!!banTarget}
        title={banTarget?.banned ? 'Unban User' : 'Ban User'}
        message={
          banTarget?.banned
            ? `Unban "${banTarget?.name ?? banTarget?.email}"? They will regain access.`
            : `Ban "${banTarget?.name ?? banTarget?.email}"? They will lose access to the platform.`
        }
        confirmLabel={banTarget?.banned ? 'Unban' : 'Ban'}
        dangerous={!banTarget?.banned}
        loading={banLoading}
        onConfirm={handleBanToggle}
        onCancel={() => setBanTarget(null)}
      />

      {/* Coin adjust modal */}
      {coinAdjust && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setCoinAdjust(null)} />
          <div className="relative bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-md p-6 space-y-5">
            <h3 className="text-white font-semibold text-lg">Adjust Coins</h3>
            <p className="text-gray-400 text-sm">
              Current balance:{' '}
              <span className="text-yellow-400 font-medium">{coinAdjust.user.coinBalance} coins</span>
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-400 block mb-1.5">
                  Amount (use negative to subtract)
                </label>
                <input
                  type="number"
                  value={coinAdjust.amount}
                  onChange={(e) => setCoinAdjust((prev) => prev ? { ...prev, amount: e.target.value } : null)}
                  placeholder="e.g. 100 or -50"
                  className="w-full px-3 py-2.5 bg-gray-950 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-600"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-400 block mb-1.5">Reason</label>
                <input
                  type="text"
                  value={coinAdjust.reason}
                  onChange={(e) => setCoinAdjust((prev) => prev ? { ...prev, reason: e.target.value } : null)}
                  placeholder="Admin adjustment, refund, etc."
                  className="w-full px-3 py-2.5 bg-gray-950 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-600"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setCoinAdjust(null)}
                className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleCoinAdjust}
                disabled={!coinAdjust.amount || coinAdjust.loading}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium disabled:opacity-50"
              >
                {coinAdjust.loading ? 'Saving...' : 'Apply'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
