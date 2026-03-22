'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, Film, PlayCircle, DollarSign, PlusCircle, BarChart3, Clock, TrendingUp } from 'lucide-react';
import StatCard from '@/components/admin/StatCard';
import { useToast } from '@/components/admin/Toast';

interface AdminStats {
  totalUsers: number;
  totalSeries: number;
  totalEpisodes: number;
  revenue: number;
  newUsersToday?: number;
  viewsToday?: number;
}

interface ActivityItem {
  id: string;
  type: string;
  message: string;
  time: string;
}

export default function AdminDashboard() {
  const { toast } = useToast();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => r.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => {
        toast('Failed to load stats', 'error');
        setLoading(false);
      });
  }, [toast]);

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Welcome back — here's what's happening on Gulel.</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={loading ? '—' : (stats?.totalUsers ?? 0).toLocaleString()}
          subtitle={stats?.newUsersToday ? `+${stats.newUsersToday} today` : undefined}
          icon={Users}
          iconColor="text-blue-400"
        />
        <StatCard
          title="Total Series"
          value={loading ? '—' : (stats?.totalSeries ?? 0).toLocaleString()}
          icon={Film}
          iconColor="text-purple-400"
        />
        <StatCard
          title="Total Episodes"
          value={loading ? '—' : (stats?.totalEpisodes ?? 0).toLocaleString()}
          subtitle={stats?.viewsToday ? `${stats.viewsToday} views today` : undefined}
          icon={PlayCircle}
          iconColor="text-green-400"
        />
        <StatCard
          title="Revenue"
          value={loading ? '—' : formatCurrency(stats?.revenue ?? 0)}
          icon={DollarSign}
          iconColor="text-yellow-400"
        />
      </div>

      {/* Quick actions */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/series/new"
            className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <PlusCircle size={16} />
            Add Series
          </Link>
          <Link
            href="/admin/users"
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg text-sm font-medium transition-colors"
          >
            <Users size={16} />
            View Users
          </Link>
          <Link
            href="/admin/analytics"
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg text-sm font-medium transition-colors"
          >
            <BarChart3 size={16} />
            Analytics
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Activity */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={16} className="text-gray-500" />
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Recent Activity</h2>
          </div>
          <div className="space-y-3">
            {[
              { message: 'New user registered via Google', time: '2 min ago', type: 'user' },
              { message: 'Episode unlocked by user', time: '8 min ago', type: 'coin' },
              { message: 'New series published', time: '1 hr ago', type: 'series' },
              { message: 'Coin purchase completed', time: '2 hr ago', type: 'coin' },
              { message: 'User account banned', time: '3 hr ago', type: 'user' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-gray-700 mt-1.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-300">{item.message}</p>
                  <p className="text-xs text-gray-600 mt-0.5">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-600 mt-4 italic">Live activity feed coming soon</p>
        </div>

        {/* Platform overview */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-gray-500" />
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Platform Overview</h2>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 bg-gray-800 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {[
                { label: 'Users', value: stats?.totalUsers ?? 0, color: 'bg-blue-600', max: Math.max(stats?.totalUsers ?? 1, 1) },
                { label: 'Series', value: stats?.totalSeries ?? 0, color: 'bg-purple-600', max: Math.max(stats?.totalSeries ?? 1, 1) },
                { label: 'Episodes', value: stats?.totalEpisodes ?? 0, color: 'bg-green-600', max: Math.max(stats?.totalEpisodes ?? 1, 1) },
              ].map(({ label, value, color }) => (
                <div key={label}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-gray-400">{label}</span>
                    <span className="text-gray-300 font-medium">{value.toLocaleString()}</span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${color} rounded-full`}
                      style={{ width: value > 0 ? '60%' : '0%' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          <Link
            href="/admin/analytics"
            className="mt-4 text-xs text-red-500 hover:text-red-400 transition-colors inline-flex items-center gap-1"
          >
            View full analytics →
          </Link>
        </div>
      </div>
    </div>
  );
}
