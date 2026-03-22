'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  PlusCircle,
  Search,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Star,
  ChevronDown,
} from 'lucide-react';
import DataTable from '@/components/admin/DataTable';
import StatusBadge from '@/components/admin/StatusBadge';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import { useToast } from '@/components/admin/Toast';

interface Series {
  id: string;
  title: string;
  genre: string;
  status: string;
  featured: boolean;
  thumbnail?: string;
  _count?: { episodes: number };
  episodeCount?: number;
  createdAt: string;
}

interface ApiResponse {
  series: Series[];
  total: number;
  page: number;
  pageSize: number;
}

const STATUS_OPTIONS = ['All', 'Draft', 'Published', 'Archived'];

export default function SeriesListPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [data, setData] = useState<Series[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [deleteTarget, setDeleteTarget] = useState<Series | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
        ...(search && { search }),
        ...(statusFilter !== 'All' && { status: statusFilter.toLowerCase() }),
      });
      const res = await fetch(`/api/admin/series?${params}`);
      if (!res.ok) throw new Error();
      const json: ApiResponse = await res.json();
      setData(json.series ?? []);
      setTotal(json.total ?? 0);
    } catch {
      toast('Failed to load series', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, toast]);

  useEffect(() => {
    const t = setTimeout(fetchData, 300);
    return () => clearTimeout(t);
  }, [fetchData]);

  const handleToggleStatus = async (s: Series) => {
    const newStatus = s.status === 'published' ? 'draft' : 'published';
    try {
      const res = await fetch(`/api/admin/series/${s.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      toast(`Series ${newStatus === 'published' ? 'published' : 'set to draft'}`, 'success');
      fetchData();
    } catch {
      toast('Failed to update status', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/admin/series/${deleteTarget.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast('Series deleted', 'success');
      setDeleteTarget(null);
      fetchData();
    } catch {
      toast('Failed to delete series', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const columns = [
    {
      key: 'thumbnail',
      label: '',
      className: 'w-12',
      render: (row: Series) =>
        row.thumbnail ? (
          <img
            src={row.thumbnail}
            alt={row.title}
            className="w-10 h-10 rounded-lg object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center text-gray-600 text-xs">
            No img
          </div>
        ),
    },
    {
      key: 'title',
      label: 'Title',
      render: (row: Series) => (
        <div>
          <div className="font-medium text-white">{row.title}</div>
          <div className="text-xs text-gray-500 mt-0.5">{row.genre}</div>
        </div>
      ),
    },
    {
      key: 'episodes',
      label: 'Episodes',
      render: (row: Series) => (
        <span className="text-gray-400">
          {row._count?.episodes ?? row.episodeCount ?? 0}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row: Series) => <StatusBadge status={row.status} />,
    },
    {
      key: 'featured',
      label: 'Featured',
      render: (row: Series) =>
        row.featured ? (
          <span className="flex items-center gap-1 text-yellow-400 text-xs">
            <Star size={12} fill="currentColor" /> Featured
          </span>
        ) : (
          <span className="text-gray-600 text-xs">—</span>
        ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row: Series) => (
        <div className="flex items-center gap-1">
          <Link
            href={`/admin/series/${row.id}`}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
            title="Edit"
          >
            <Edit2 size={14} />
          </Link>
          <button
            onClick={() => handleToggleStatus(row)}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
            title={row.status === 'published' ? 'Set to Draft' : 'Publish'}
          >
            {row.status === 'published' ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
          <button
            onClick={() => setDeleteTarget(row)}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-red-900/50 hover:text-red-400 transition-colors"
            title="Delete"
          >
            <Trash2 size={14} />
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
          <h1 className="text-2xl font-bold text-white">Series</h1>
          <p className="text-gray-500 text-sm mt-0.5">{total} total series</p>
        </div>
        <Link
          href="/admin/series/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <PlusCircle size={16} />
          Add New Series
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search series..."
            className="w-full pl-9 pr-4 py-2.5 bg-gray-900 border border-gray-800 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-600 transition-colors"
          />
        </div>

        <div className="flex gap-2">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-900 border border-gray-800 text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns as unknown as Parameters<typeof DataTable>[0]['columns']}
        data={data as unknown as Record<string, unknown>[]}
        loading={loading}
        emptyMessage="No series found."
        page={page}
        pageSize={20}
        total={total}
        onPageChange={setPage}
      />

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Series"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        dangerous
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
