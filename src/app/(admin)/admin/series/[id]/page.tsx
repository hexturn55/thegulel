'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { PlusCircle, Edit2, Trash2, Clock, Lock, Unlock } from 'lucide-react';
import SeriesForm from '@/components/admin/SeriesForm';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import PikaStudioPanel from '@/components/admin/PikaStudioPanel';
import { useToast } from '@/components/admin/Toast';

interface Episode {
  id: string;
  episodeNumber: number;
  title: string;
  duration?: number;
  isFree: boolean;
  videoId?: string;
  createdAt: string;
}

interface SeriesDetail {
  id: string;
  title: string;
  titleHi?: string;
  titleZh?: string;
  description?: string;
  descriptionHi?: string;
  descriptionZh?: string;
  genre?: string;
  tags?: string[];
  thumbnail?: string;
  freeEpisodes?: number;
  coinPrice?: number;
  featured?: boolean;
  status?: string;
  episodes?: Episode[];
}

export default function EditSeriesPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const [series, setSeries] = useState<SeriesDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteEp, setDeleteEp] = useState<Episode | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/series/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setSeries(data);
        setLoading(false);
      })
      .catch(() => {
        toast('Failed to load series', 'error');
        setLoading(false);
      });
  }, [id, toast]);

  const handleDeleteEpisode = async () => {
    if (!deleteEp) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/admin/series/${id}/episodes/${deleteEp.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast('Episode deleted', 'success');
      setDeleteEp(null);
      // Refresh
      const updated = await fetch(`/api/admin/series/${id}`).then((r) => r.json());
      setSeries(updated);
    } catch {
      toast('Failed to delete episode', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '—';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-5">
        <div className="h-8 bg-gray-800 rounded animate-pulse w-48" />
        <div className="h-64 bg-gray-900 border border-gray-800 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!series) {
    return (
      <div className="text-center py-20 text-gray-500">
        Series not found.{' '}
        <Link href="/admin/series" className="text-red-500 hover:underline">Go back</Link>
      </div>
    );
  }

  const initialData = {
    title: series.title ?? '',
    titleHi: series.titleHi ?? '',
    titleZh: series.titleZh ?? '',
    description: series.description ?? '',
    descriptionHi: series.descriptionHi ?? '',
    descriptionZh: series.descriptionZh ?? '',
    genre: series.genre ?? '',
    tags: (series.tags ?? []).join(', '),
    thumbnail: series.thumbnail ?? '',
    freeEpisodes: series.freeEpisodes ?? 1,
    coinPrice: series.coinPrice ?? 5,
    featured: series.featured ?? false,
    status: series.status ?? 'draft',
  };

  const episodes = series.episodes ?? [];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Edit Series</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Editing: <span className="text-gray-300">{series.title}</span>
        </p>
      </div>

      {/* Edit form */}
      <SeriesForm initialData={initialData} seriesId={id} />

      {/* Episodes section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Episodes</h2>
            <p className="text-gray-500 text-sm">{episodes.length} episodes in this series</p>
          </div>
          <Link
            href={`/admin/series/${id}/episodes/new`}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <PlusCircle size={15} />
            Add Episode
          </Link>
        </div>

        {episodes.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
            <p className="text-gray-500 mb-3">No episodes yet.</p>
            <Link
              href={`/admin/series/${id}/episodes/new`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <PlusCircle size={15} />
              Add First Episode
            </Link>
          </div>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            {episodes
              .sort((a, b) => a.episodeNumber - b.episodeNumber)
              .map((ep, i) => (
                <div
                  key={ep.id}
                  className={`flex items-center gap-4 px-5 py-4 ${
                    i < episodes.length - 1 ? 'border-b border-gray-800' : ''
                  } hover:bg-gray-950 transition-colors`}
                >
                  {/* Episode number */}
                  <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-400 shrink-0">
                    {ep.episodeNumber}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white text-sm truncate">{ep.title}</div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock size={10} /> {formatDuration(ep.duration)}
                      </span>
                      {ep.videoId && (
                        <span className="text-xs text-gray-600 font-mono">ID: {ep.videoId.slice(0, 8)}…</span>
                      )}
                    </div>
                  </div>

                  {/* Free/locked */}
                  <div>
                    {ep.isFree ? (
                      <span className="flex items-center gap-1 text-xs text-green-400">
                        <Unlock size={11} /> Free
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Lock size={11} /> Paid
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <Link
                      href={`/admin/series/${id}/episodes/${ep.id}/edit`}
                      className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
                      title="Edit episode"
                    >
                      <Edit2 size={14} />
                    </Link>
                    <button
                      onClick={() => setDeleteEp(ep)}
                      className="p-1.5 rounded-lg text-gray-400 hover:bg-red-900/50 hover:text-red-400 transition-colors"
                      title="Delete episode"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </section>

      {/* Pika generative-media studio */}
      <PikaStudioPanel seriesId={id} />

      <ConfirmDialog
        open={!!deleteEp}
        title="Delete Episode"
        message={`Delete "Ep ${deleteEp?.episodeNumber}: ${deleteEp?.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        dangerous
        loading={deleteLoading}
        onConfirm={handleDeleteEpisode}
        onCancel={() => setDeleteEp(null)}
      />
    </div>
  );
}
