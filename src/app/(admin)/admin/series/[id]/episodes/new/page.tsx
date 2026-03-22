'use client';

import { useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Upload, CheckCircle, AlertCircle, Film } from 'lucide-react';
import { useToast } from '@/components/admin/Toast';

interface UploadData {
  uploadUrl: string;
  videoId: string;
  thumbnailUrl?: string;
}

export default function NewEpisodePage() {
  const { id: seriesId } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [form, setForm] = useState({
    episodeNumber: 1,
    title: '',
    titleHi: '',
    titleZh: '',
    duration: '',
    isFree: false,
  });

  // Upload state
  const [uploadData, setUploadData] = useState<UploadData | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'fetching-url' | 'uploading' | 'done' | 'error'>('idle');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const update = (field: string, value: unknown) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleGetUploadUrl = async () => {
    setUploadStatus('fetching-url');
    try {
      const res = await fetch('/api/admin/upload', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to get upload URL');
      const data: UploadData = await res.json();
      setUploadData(data);
      setUploadStatus('idle');
      toast('Upload URL ready — select a video file', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to get upload URL', 'error');
      setUploadStatus('error');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!uploadData || !selectedFile) return;
    setUploadStatus('uploading');
    setUploadProgress(0);

    try {
      // Use XHR for progress tracking
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            setUploadProgress(Math.round((e.loaded / e.total) * 100));
          }
        });
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Upload failed: ${xhr.status}`));
          }
        });
        xhr.addEventListener('error', () => reject(new Error('Network error')));
        xhr.open('POST', uploadData.uploadUrl);

        const formData = new FormData();
        formData.append('file', selectedFile);
        xhr.send(formData);
      });

      setUploadStatus('done');
      setUploadProgress(100);
      toast('Video uploaded successfully!', 'success');
    } catch (err) {
      setUploadStatus('error');
      toast(err instanceof Error ? err.message : 'Upload failed', 'error');
    }
  };

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
        titleHi: form.titleHi || undefined,
        titleZh: form.titleZh || undefined,
        duration: form.duration ? Number(form.duration) : undefined,
        isFree: form.isFree,
        videoId: uploadData?.videoId,
        thumbnail: uploadData?.thumbnailUrl,
      };

      const res = await fetch(`/api/admin/series/${seriesId}/episodes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? 'Failed to create episode');
      }

      toast('Episode created!', 'success');
      router.push(`/admin/series/${seriesId}`);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Something went wrong', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Add Episode</h1>
        <p className="text-gray-500 text-sm mt-0.5">Create a new episode for this series.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Episode Details */}
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

        {/* Video Upload */}
        <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Video Upload</h2>

          <div className="space-y-4">
            {/* Step 1: Get upload URL */}
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={handleGetUploadUrl}
                disabled={uploadStatus === 'fetching-url' || !!uploadData}
                className="flex items-center gap-2 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                <Film size={15} />
                {uploadStatus === 'fetching-url' ? 'Getting URL...' : uploadData ? 'URL Ready ✓' : 'Get Upload URL'}
              </button>
              {uploadData && (
                <span className="text-xs text-green-400 flex items-center gap-1">
                  <CheckCircle size={12} /> Upload URL ready
                </span>
              )}
            </div>

            {/* Step 2: Select and upload file */}
            {uploadData && uploadStatus !== 'done' && (
              <div className="border border-dashed border-gray-700 rounded-xl p-6 space-y-4">
                <div className="flex flex-col items-center gap-3 text-center">
                  <Upload size={32} className="text-gray-600" />
                  <div>
                    <p className="text-sm text-gray-400">Select a video file to upload</p>
                    <p className="text-xs text-gray-600 mt-0.5">MP4, MOV, or WebM</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors"
                  >
                    Choose File
                  </button>
                  {selectedFile && (
                    <p className="text-xs text-gray-400">
                      Selected: <span className="text-white">{selectedFile.name}</span>{' '}
                      ({(selectedFile.size / 1024 / 1024).toFixed(1)} MB)
                    </p>
                  )}
                </div>

                {selectedFile && uploadStatus !== 'uploading' && (
                  <button
                    type="button"
                    onClick={handleUpload}
                    className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Upload Video
                  </button>
                )}

                {uploadStatus === 'uploading' && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-600 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Upload success */}
            {uploadStatus === 'done' && uploadData && (
              <div className="bg-green-900/20 border border-green-800 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-green-400 font-medium text-sm">
                  <CheckCircle size={16} />
                  Video uploaded successfully!
                </div>
                <div className="text-xs text-gray-400 font-mono">
                  Video ID: <span className="text-white">{uploadData.videoId}</span>
                </div>
                {uploadData.thumbnailUrl && (
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">Auto-generated thumbnail:</p>
                    <img
                      src={uploadData.thumbnailUrl}
                      alt="Video thumbnail"
                      className="h-20 w-auto rounded-lg border border-gray-700 object-cover"
                    />
                  </div>
                )}
              </div>
            )}

            {uploadStatus === 'error' && (
              <div className="flex items-center gap-2 text-red-400 text-sm">
                <AlertCircle size={14} />
                Upload failed. Try again.
              </div>
            )}

            <p className="text-xs text-gray-600">
              You can save without a video — it can be added later by editing the episode.
            </p>
          </div>
        </section>

        {/* Submit */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {submitting ? 'Creating...' : 'Create Episode'}
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
