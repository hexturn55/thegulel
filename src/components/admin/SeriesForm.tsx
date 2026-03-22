'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/admin/Toast';

const GENRES = [
  'Drama', 'Comedy', 'Thriller', 'Romance', 'Action', 'Horror',
  'Sci-Fi', 'Fantasy', 'Mystery', 'Documentary', 'Other',
];

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' },
];

interface SeriesFormData {
  title: string;
  titleHi: string;
  titleZh: string;
  description: string;
  descriptionHi: string;
  descriptionZh: string;
  genre: string;
  tags: string;
  thumbnail: string;
  freeEpisodes: number;
  coinPrice: number;
  featured: boolean;
  status: string;
}

interface SeriesFormProps {
  initialData?: Partial<SeriesFormData>;
  seriesId?: string;
}

const DEFAULT: SeriesFormData = {
  title: '',
  titleHi: '',
  titleZh: '',
  description: '',
  descriptionHi: '',
  descriptionZh: '',
  genre: '',
  tags: '',
  thumbnail: '',
  freeEpisodes: 1,
  coinPrice: 5,
  featured: false,
  status: 'draft',
};

export default function SeriesForm({ initialData, seriesId }: SeriesFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [form, setForm] = useState<SeriesFormData>({ ...DEFAULT, ...initialData });
  const [loading, setLoading] = useState(false);

  const update = (field: keyof SeriesFormData, value: SeriesFormData[keyof SeriesFormData]) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      ...form,
      tags: form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      freeEpisodes: Number(form.freeEpisodes),
      coinPrice: Number(form.coinPrice),
    };

    try {
      const url = seriesId ? `/api/admin/series/${seriesId}` : '/api/admin/series';
      const method = seriesId ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? 'Request failed');
      }

      toast(seriesId ? 'Series updated!' : 'Series created!', 'success');
      router.push('/admin/series');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Something went wrong', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Info */}
      <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Basic Information</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <FormField label="Title (EN)" required>
            <input
              required
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              placeholder="Series title"
              className={inputClass}
            />
          </FormField>
          <FormField label="Title (Hindi)">
            <input
              value={form.titleHi}
              onChange={(e) => update('titleHi', e.target.value)}
              placeholder="हिंदी शीर्षक"
              className={inputClass}
            />
          </FormField>
          <FormField label="Title (Chinese)">
            <input
              value={form.titleZh}
              onChange={(e) => update('titleZh', e.target.value)}
              placeholder="中文标题"
              className={inputClass}
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <FormField label="Description (EN)" className="md:col-span-3">
            <textarea
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              placeholder="Series description..."
              rows={3}
              className={inputClass}
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <FormField label="Description (Hindi)">
            <textarea
              value={form.descriptionHi}
              onChange={(e) => update('descriptionHi', e.target.value)}
              placeholder="हिंदी विवरण..."
              rows={2}
              className={inputClass}
            />
          </FormField>
          <FormField label="Description (Chinese)">
            <textarea
              value={form.descriptionZh}
              onChange={(e) => update('descriptionZh', e.target.value)}
              placeholder="中文简介..."
              rows={2}
              className={inputClass}
            />
          </FormField>
        </div>
      </section>

      {/* Media & Taxonomy */}
      <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Media & Taxonomy</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <FormField label="Thumbnail URL">
            <input
              value={form.thumbnail}
              onChange={(e) => update('thumbnail', e.target.value)}
              placeholder="https://..."
              className={inputClass}
            />
          </FormField>
          <FormField label="Genre" required>
            <select
              required
              value={form.genre}
              onChange={(e) => update('genre', e.target.value)}
              className={inputClass}
            >
              <option value="">Select genre...</option>
              {GENRES.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </FormField>
        </div>

        <FormField label="Tags (comma-separated)">
          <input
            value={form.tags}
            onChange={(e) => update('tags', e.target.value)}
            placeholder="romance, drama, urban"
            className={inputClass}
          />
        </FormField>

        {form.thumbnail && (
          <div>
            <p className="text-xs text-gray-500 mb-2">Thumbnail preview:</p>
            <img
              src={form.thumbnail}
              alt="Thumbnail preview"
              className="h-24 w-auto rounded-lg object-cover border border-gray-700"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}
      </section>

      {/* Monetization & Publishing */}
      <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Monetization & Publishing</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <FormField label="Free Episodes">
            <input
              type="number"
              min={0}
              value={form.freeEpisodes}
              onChange={(e) => update('freeEpisodes', parseInt(e.target.value) || 0)}
              className={inputClass}
            />
          </FormField>
          <FormField label="Coin Price (per episode)">
            <input
              type="number"
              min={0}
              value={form.coinPrice}
              onChange={(e) => update('coinPrice', parseInt(e.target.value) || 0)}
              className={inputClass}
            />
          </FormField>
          <FormField label="Status">
            <select
              value={form.status}
              onChange={(e) => update('status', e.target.value)}
              className={inputClass}
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Featured">
            <label className="flex items-center gap-3 cursor-pointer mt-2">
              <div
                onClick={() => update('featured', !form.featured)}
                className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${
                  form.featured ? 'bg-red-600' : 'bg-gray-700'
                }`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    form.featured ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </div>
              <span className="text-sm text-gray-300">{form.featured ? 'Yes' : 'No'}</span>
            </label>
          </FormField>
        </div>
      </section>

      {/* Submit */}
      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          {loading ? 'Saving...' : seriesId ? 'Update Series' : 'Create Series'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm font-medium transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function FormField({
  label,
  required,
  children,
  className = '',
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label className="text-xs font-medium text-gray-400">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  'w-full px-3 py-2.5 bg-gray-950 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-600 transition-colors resize-none';
