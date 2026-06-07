'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/components/admin/Toast';

export default function EditEpisodePage() {
  const { id: seriesId, episodeId } = useParams<{ id: string; episodeId: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const [form, setForm] = useState({
    episodeNumber: 1,
    title: '',
    titleHi: '',
    titleZh: '',
    duration: '',
    isFree: false,
  });
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const update = (field: string, value: unknown) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  useEffect(() => {
    fetch(`/api/admin/series/${seriesId}`)
      .then((r) => r.json())
      .then((data) => {
        const ep = (data.series?.episodes ?? data.episodes ?? []).find(
          (e: { id: string }) => e.id === episodeId,
        );
        if (!ep) {
          setNotFound(true);
          return;
        }
        setForm({
          episodeNumber: ep.episodeNumber ?? 1,
          title: ep.title ?? '',
          titleHi: ep.titleHi ?? '',
          titleZh: ep.titleZh ?? '',
          duration: ep.duration != null ? String(ep.duration) : '',
          isFree: !!ep.isFree,
        });
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [seriesId, episodeId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) {
      toast('Title is required', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        episodeNumber: Number(form.episodeNumber),
        title: form.title,
        titleHi: form.titleHi || null,
        titleZh: form.titleZh || null,
        duration: form.duration ? Number(form.duration) : null,
        isFree: form.isFree,
      };
      const res = await fetch(`/api/admin/series/${seriesId}/episodes/${episodeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? 'Failed to update episode');
      }
      toast('Episode updated!', 'success');
      router.push(`/admin/series/${seriesId}`);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Something went wrong', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="max-w-3xl mx-auto py-12 text-gray-500 text-sm">Loading episode…</div>;
  }

  if (notFound) {
    return (
      <div className="max-w-3xl mx-auto py-12 space-y-3">
        <p className="text-gray-400">Episode not found.</p>
        <button
          onClick={() => router.push(`/admin/series/${seriesId}`)}
          className="text-red-500 hover:underline text-sm"
        >
          Back to series
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Edit Episode</h1>
        <p className="text-gray-500 text-sm mt-0.5">Update this episode&apos;s details.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Episode Details</h2>

          <div className="grid grid-cols-2 gap-5">
            <Field label="Episode Number" required>
              <input
                type="number"
                min={1}
                required
                value={form.episodeNumber}
                onChange={(e) => update('episodeNumber', e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Duration (seconds)">
              <input
                type="number"
                min={0}
                value={form.duration}
                onChange={(e) => update('duration', e.target.value)}
                placeholder="e.g. 1320"
                className={inputClass}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Field label="Title (EN)" required>
              <input
                required
                value={form.title}
                onChange={(e) => update('title', e.target.value)}
                placeholder="Episode title"
                className={inputClass}
              />
            </Field>
            <Field label="Title (Hindi)">
              <input
                value={form.titleHi}
                onChange={(e) => update('titleHi', e.target.value)}
                placeholder="हिंदी शीर्षक"
                className={inputClass}
              />
            </Field>
            <Field label="Title (Chinese)">
              <input
                value={form.titleZh}
                onChange={(e) => update('titleZh', e.target.value)}
                placeholder="中文标题"
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="Access">
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => update('isFree', !form.isFree)}
                className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${
                  form.isFree ? 'bg-green-600' : 'bg-gray-700'
                }`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    form.isFree ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </div>
              <span className="text-sm text-gray-300">{form.isFree ? 'Free episode' : 'Paid (coin required)'}</span>
            </label>
          </Field>
        </section>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {submitting ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={() => router.push(`/admin/series/${seriesId}`)}
            className="px-6 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-gray-400">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  'w-full px-3 py-2.5 bg-gray-950 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-600 transition-colors';
