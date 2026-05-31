'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { NextIntlClientProvider, useTranslations } from 'next-intl';
import Hls from 'hls.js';
import { Clapperboard, Image as ImageIcon, Smartphone, TrendingUp, RefreshCw } from 'lucide-react';

import {
  enqueuePikaPoster,
  enqueuePikaPromo,
  enqueuePikaReframe,
  enqueuePikaVirality,
  listPikaJobs,
  pollPikaJob,
  type PikaJobDTO,
} from '@/app/actions/pika';
import { getPikaMessages } from '@/i18n/pika-messages';

interface PikaStudioPanelProps {
  seriesId: string;
  /** UI locale (en | hi | zh). Defaults to English. */
  locale?: string;
}

/** Public entry: wraps the studio in its own next-intl provider. */
export default function PikaStudioPanel({ seriesId, locale = 'en' }: PikaStudioPanelProps) {
  return (
    <NextIntlClientProvider locale={locale} messages={getPikaMessages(locale)}>
      <PikaStudio seriesId={seriesId} />
    </NextIntlClientProvider>
  );
}

const POLL_INTERVAL_MS = 4000;
const TERMINAL = new Set(['COMPLETED', 'FAILED']);
const INPUT_CLS =
  'w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-600';

function PikaStudio({ seriesId }: { seriesId: string }) {
  const t = useTranslations('PikaStudio');
  const [jobs, setJobs] = useState<PikaJobDTO[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [promoPrompt, setPromoPrompt] = useState('');
  const [posterPrompt, setPosterPrompt] = useState('');
  const [reframeUrl, setReframeUrl] = useState('');
  const [viralityUrl, setViralityUrl] = useState('');

  const upsert = useCallback((job: PikaJobDTO) => {
    setJobs((prev) => {
      const next = prev.filter((j) => j.id !== job.id);
      return [job, ...next];
    });
  }, []);

  // Initial load.
  useEffect(() => {
    listPikaJobs(seriesId).then(setJobs).catch(() => {});
  }, [seriesId]);

  // Poll non-terminal jobs.
  useEffect(() => {
    const pending = jobs.filter((j) => !TERMINAL.has(j.status));
    if (pending.length === 0) return;
    const timer = setInterval(() => {
      pending.forEach((j) => {
        pollPikaJob(j.id).then(upsert).catch(() => {});
      });
    }, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [jobs, upsert]);

  async function run(key: string, fn: () => Promise<PikaJobDTO>) {
    setBusy(key);
    try {
      upsert(await fn());
    } catch (err) {
      // Surface enqueue failures (e.g. unconfigured virality model, auth).
      console.error('Pika action failed:', err);
    } finally {
      setBusy(null);
    }
  }

  const statusLabel = (status: string) =>
    ({
      PENDING: t('statusPending'),
      PROCESSING: t('statusProcessing'),
      COMPLETED: t('statusCompleted'),
      FAILED: t('statusFailed'),
    })[status] ?? status;

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Clapperboard size={18} /> {t('title')}
        </h2>
        <p className="text-gray-500 text-sm">{t('subtitle')}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Promo */}
        <Card icon={<Clapperboard size={15} />} title={t('promo')}>
          <textarea
            value={promoPrompt}
            onChange={(e) => setPromoPrompt(e.target.value)}
            placeholder={t('promptLabel')}
            className={`${INPUT_CLS} h-20 resize-none`}
          />
          <ActionButton
            disabled={!promoPrompt.trim() || busy !== null}
            busy={busy === 'promo'}
            label={t('generate')}
            busyLabel={t('working')}
            onClick={() => run('promo', () => enqueuePikaPromo(seriesId, { prompt: promoPrompt }))}
          />
        </Card>

        {/* Poster */}
        <Card icon={<ImageIcon size={15} />} title={t('poster')}>
          <textarea
            value={posterPrompt}
            onChange={(e) => setPosterPrompt(e.target.value)}
            placeholder={t('promptLabel')}
            className={`${INPUT_CLS} h-20 resize-none`}
          />
          <ActionButton
            disabled={!posterPrompt.trim() || busy !== null}
            busy={busy === 'poster'}
            label={t('generate')}
            busyLabel={t('working')}
            onClick={() => run('poster', () => enqueuePikaPoster(seriesId, { prompt: posterPrompt }))}
          />
        </Card>

        {/* Reframe */}
        <Card icon={<Smartphone size={15} />} title={t('reframe')}>
          <input
            value={reframeUrl}
            onChange={(e) => setReframeUrl(e.target.value)}
            placeholder={t('imageUrlLabel')}
            className={INPUT_CLS}
          />
          <ActionButton
            disabled={!reframeUrl.trim() || busy !== null}
            busy={busy === 'reframe'}
            label={t('generate')}
            busyLabel={t('working')}
            onClick={() => run('reframe', () => enqueuePikaReframe(seriesId, { imageUrl: reframeUrl }))}
          />
        </Card>

        {/* Virality */}
        <Card icon={<TrendingUp size={15} />} title={t('virality')}>
          <input
            value={viralityUrl}
            onChange={(e) => setViralityUrl(e.target.value)}
            placeholder={t('videoUrlLabel')}
            className={INPUT_CLS}
          />
          <ActionButton
            disabled={!viralityUrl.trim() || busy !== null}
            busy={busy === 'virality'}
            label={t('score')}
            busyLabel={t('working')}
            onClick={() => run('virality', () => enqueuePikaVirality(seriesId, { videoUrl: viralityUrl }))}
          />
        </Card>
      </div>

      {/* Jobs */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-300">{t('jobs')}</h3>
          <button
            onClick={() => listPikaJobs(seriesId).then(setJobs).catch(() => {})}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-white"
          >
            <RefreshCw size={12} /> {t('refresh')}
          </button>
        </div>

        {jobs.length === 0 ? (
          <p className="text-gray-500 text-sm">{t('noJobs')}</p>
        ) : (
          <ul className="space-y-2">
            {jobs.map((job) => (
              <li key={job.id} className="bg-gray-900 border border-gray-800 rounded-lg p-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium text-white">{job.kind}</span>
                  <span className="text-xs text-gray-400">{statusLabel(job.status)}</span>
                </div>
                {job.prompt && <p className="text-gray-500 text-xs mt-1 line-clamp-2">{job.prompt}</p>}
                {job.error && <p className="text-red-400 text-xs mt-1">{job.error}</p>}
                {typeof job.score === 'number' && (
                  <p className="text-emerald-400 text-xs mt-1">
                    {t('scorePrefix')}: {(job.score * 100).toFixed(0)}%
                  </p>
                )}
                {job.mediaUrl && job.kind !== 'POSTER' && <PromoPlayer src={job.mediaUrl} />}
                {job.mediaUrl && job.kind === 'POSTER' && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={job.mediaUrl} alt="poster" className="mt-2 max-h-48 rounded-md" />
                )}
                {job.mediaUrl && (
                  <a
                    href={job.mediaUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-red-400 hover:underline mt-1 inline-block"
                  >
                    {t('open')}
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function Card({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-gray-200">
        {icon} {title}
      </div>
      {children}
    </div>
  );
}

function ActionButton({
  disabled,
  busy,
  label,
  busyLabel,
  onClick,
}: {
  disabled: boolean;
  busy: boolean;
  label: string;
  busyLabel: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full px-3 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
    >
      {busy ? busyLabel : label}
    </button>
  );
}

/**
 * Plays a generated promo. fal returns MP4; if the stored media is an HLS
 * playlist (.m3u8) we drive it with hls.js, otherwise we fall back to native
 * playback (and native HLS on Safari).
 */
function PromoPlayer({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const isHls = src.split('?')[0].endsWith('.m3u8');
    if (isHls && Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true });
      hls.loadSource(src);
      hls.attachMedia(video);
      return () => hls.destroy();
    }
    video.src = src;
  }, [src]);

  return <video ref={videoRef} controls playsInline className="mt-2 w-full max-h-64 rounded-md bg-black" />;
}
