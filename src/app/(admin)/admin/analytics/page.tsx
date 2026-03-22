'use client';

import { useEffect, useState, useCallback } from 'react';
import { BarChart3, TrendingUp, Users, PlayCircle, DollarSign, Eye } from 'lucide-react';
import StatCard from '@/components/admin/StatCard';
import { useToast } from '@/components/admin/Toast';

type Period = 7 | 30 | 90;

interface AnalyticsData {
  period: number;
  signups: { date: string; count: number }[];
  views: { date: string; count: number }[];
  topSeries: { id: string; title: string; views: number; revenue: number }[];
  revenue: { date: string; amount: number }[];
  totals: {
    signups: number;
    views: number;
    revenue: number;
    avgDailySignups: number;
    avgDailyViews: number;
  };
}

const PERIOD_OPTIONS: { label: string; value: Period }[] = [
  { label: '7 Days', value: 7 },
  { label: '30 Days', value: 30 },
  { label: '90 Days', value: 90 },
];

export default function AnalyticsPage() {
  const { toast } = useToast();
  const [period, setPeriod] = useState<Period>(30);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics?period=${period}`);
      if (!res.ok) throw new Error();
      setData(await res.json());
    } catch {
      toast('Failed to load analytics', 'error');
    } finally {
      setLoading(false);
    }
  }, [period, toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-gray-500 text-sm mt-0.5">Platform performance overview</p>
        </div>

        {/* Period selector */}
        <div className="flex gap-2">
          {PERIOD_OPTIONS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setPeriod(value)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                period === value
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-900 border border-gray-800 text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <StatCard
          title={`Signups (${period}d)`}
          value={loading ? '—' : (data?.totals.signups ?? 0).toLocaleString()}
          subtitle={data ? `~${data.totals.avgDailySignups.toFixed(1)}/day avg` : undefined}
          icon={Users}
          iconColor="text-blue-400"
        />
        <StatCard
          title={`Views (${period}d)`}
          value={loading ? '—' : (data?.totals.views ?? 0).toLocaleString()}
          subtitle={data ? `~${data.totals.avgDailyViews.toFixed(1)}/day avg` : undefined}
          icon={PlayCircle}
          iconColor="text-green-400"
        />
        <StatCard
          title={`Revenue (${period}d)`}
          value={loading ? '—' : formatCurrency(data?.totals.revenue ?? 0)}
          icon={DollarSign}
          iconColor="text-yellow-400"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Signups over time */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-5">
            <Users size={15} className="text-blue-400" />
            <h2 className="text-sm font-semibold text-gray-300">Signups Over Time</h2>
          </div>

          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="h-6 bg-gray-800 rounded animate-pulse" />
              ))}
            </div>
          ) : !data?.signups?.length ? (
            <p className="text-gray-600 text-sm text-center py-8">No signup data for this period.</p>
          ) : (
            <BarList
              data={data.signups.slice(-14).map((s) => ({
                label: formatDate(s.date),
                value: s.count,
              }))}
              color="bg-blue-600"
            />
          )}
        </div>

        {/* Views over time */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-5">
            <Eye size={15} className="text-green-400" />
            <h2 className="text-sm font-semibold text-gray-300">Views Over Time</h2>
          </div>

          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="h-6 bg-gray-800 rounded animate-pulse" />
              ))}
            </div>
          ) : !data?.views?.length ? (
            <p className="text-gray-600 text-sm text-center py-8">No view data for this period.</p>
          ) : (
            <BarList
              data={data.views.slice(-14).map((s) => ({
                label: formatDate(s.date),
                value: s.count,
              }))}
              color="bg-green-600"
            />
          )}
        </div>
      </div>

      {/* Top Series */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp size={15} className="text-red-400" />
          <h2 className="text-sm font-semibold text-gray-300">Top Series by Views</h2>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 bg-gray-800 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : !data?.topSeries?.length ? (
          <p className="text-gray-600 text-sm text-center py-8">No series data available.</p>
        ) : (
          <div className="space-y-3">
            {data.topSeries.map((series, i) => {
              const maxViews = data.topSeries[0]?.views ?? 1;
              const pct = maxViews > 0 ? (series.views / maxViews) * 100 : 0;
              return (
                <div key={series.id} className="flex items-center gap-4">
                  <div className="w-6 text-center text-sm font-bold text-gray-600">{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-white truncate">{series.title}</span>
                      <span className="text-xs text-gray-400 shrink-0 ml-2">
                        {series.views.toLocaleString()} views
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-600 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-xs text-yellow-400 font-medium shrink-0 w-16 text-right">
                    {formatCurrency(series.revenue)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Revenue over time */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-5">
          <DollarSign size={15} className="text-yellow-400" />
          <h2 className="text-sm font-semibold text-gray-300">Revenue Over Time</h2>
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-6 bg-gray-800 rounded animate-pulse" />
            ))}
          </div>
        ) : !data?.revenue?.length ? (
          <p className="text-gray-600 text-sm text-center py-8">No revenue data for this period.</p>
        ) : (
          <BarList
            data={data.revenue.slice(-14).map((s) => ({
              label: formatDate(s.date),
              value: s.amount,
              formatted: formatCurrency(s.amount),
            }))}
            color="bg-yellow-600"
          />
        )}
      </div>
    </div>
  );
}

interface BarListItem {
  label: string;
  value: number;
  formatted?: string;
}

function BarList({ data, color }: { data: BarListItem[]; color: string }) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="space-y-2">
      {data.map((item, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-16 text-xs text-gray-500 text-right shrink-0">{item.label}</div>
          <div className="flex-1 h-5 bg-gray-800 rounded-md overflow-hidden">
            <div
              className={`h-full ${color} rounded-md transition-all`}
              style={{ width: `${(item.value / max) * 100}%`, minWidth: item.value > 0 ? '4px' : '0' }}
            />
          </div>
          <div className="w-14 text-xs text-gray-400 text-right shrink-0">
            {item.formatted ?? item.value.toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
}
