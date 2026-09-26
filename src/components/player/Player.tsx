'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import {
  ChevronLeft,
  Gauge,
  LayoutGrid,
  Lock,
  Pause,
  Play,
  RotateCcw,
  Share2,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/stores/useAuthStore';
import { formatDuration } from '@/lib/utils';
import { analytics, type EpisodeContext } from '@/lib/analytics';
import UnlockSheet from './UnlockSheet';
import NotifyButton from './NotifyButton';

// Browsers only allow autoplay while muted, so playback starts muted until the
// viewer turns sound on once; after that it stays on for the session (each
// episode is its own route, so the player remounts between episodes).
let soundOnForSession = false;
function wantsSound(): boolean {
  if (soundOnForSession) return true;
  try {
    return sessionStorage.getItem('gulel:sound') === 'on';
  } catch {
    return false;
  }
}
function rememberSound(on: boolean) {
  soundOnForSession = on;
  try {
    sessionStorage.setItem('gulel:sound', on ? 'on' : 'off');
  } catch {
    /* storage unavailable — the in-memory flag still works */
  }
}

let speedForSession = 1;
const SPEEDS = [1, 1.25, 1.5, 2];

export interface PlayerEpisode {
  id: string;
  episodeNumber: number;
  title: string;
  isFree: boolean;
  unlocked: boolean;
}

export interface PlayerProps {
  series: { id: string; title: string; thumbnail: string; coinPrice: number; genre?: string };
  episode: { id: string; episodeNumber: number; title: string; thumbnail: string };
  /** Signed stream URL, or null when the episode is locked for this viewer. */
  videoUrl: string | null;
  episodes: PlayerEpisode[];
  nextEpisodeId?: string;
  prevEpisodeId?: string;
  onNavigate: (episodeId: string) => void;
  onClose: () => void;
  onUnlocked: () => void;
  /** Back from signing in to "notify me": open the end card straight away. */
  notifyReturn?: boolean;
}

export default function Player({
  series,
  episode,
  videoUrl,
  episodes,
  nextEpisodeId,
  prevEpisodeId,
  onNavigate,
  onClose,
  onUnlocked,
  notifyReturn = false,
}: PlayerProps) {
  const t = useTranslations('player');
  const { user } = useAuthStore();
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const recoverRef = useRef(0);
  const lastSavedRef = useRef(0);
  const touchRef = useRef<{ y: number; t: number } | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Funnel events fire once per episode mount (the player remounts per episode).
  const startedRef = useRef(false);
  const completedRef = useRef(false);

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [buffering, setBuffering] = useState(!!videoUrl);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [scrub, setScrub] = useState<number | null>(null);
  const [chrome, setChrome] = useState(true);
  const [speed, setSpeed] = useState(speedForSession);
  const [drawer, setDrawer] = useState(false);
  const [flash, setFlash] = useState<'play' | 'pause' | null>(null);
  const [ended, setEnded] = useState(false);
  // A viewer returning from login to finish "notify me" lands on the end card
  // of the last available episode, with autoplay held until they pick replay.
  const returningToNotify = notifyReturn && !nextEpisodeId && !!videoUrl;
  const [notifyCard, setNotifyCard] = useState(returningToNotify);
  const holdAutoplay = useRef(returningToNotify);
  const [copied, setCopied] = useState(false);

  const locked = !videoUrl;

  const trackingContext = (): EpisodeContext => ({
    seriesId: series.id,
    seriesTitle: series.title,
    genre: series.genre,
    episodeId: episode.id,
    episodeNumber: episode.episodeNumber,
    isFree: episodes.find((e) => e.id === episode.id)?.isFree ?? false,
  });

  /* ── Stream setup ─────────────────────────────────────────────────────── */
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoUrl) return;
    setError(false);
    setEnded(false);
    setBuffering(true);
    recoverRef.current = 0;

    const withSound = wantsSound();
    video.muted = !withSound;
    setMuted(!withSound);
    video.playbackRate = speedForSession;

    const autoplay = () => {
      if (holdAutoplay.current) return;
      video.play().catch(() => {
        if (!video.muted) {
          // Sound autoplay blocked on this page load — continue muted; the
          // "tap for sound" pill brings audio back with one tap.
          video.muted = true;
          setMuted(true);
          video.play().catch(() => setPlaying(false));
        } else {
          setPlaying(false);
        }
      });
    };

    if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true });
      hls.loadSource(videoUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, autoplay);
      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (!data.fatal) return;
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR && recoverRef.current < 3) {
          recoverRef.current += 1;
          hls.startLoad();
        } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR && recoverRef.current < 3) {
          recoverRef.current += 1;
          hls.recoverMediaError();
        } else {
          setBuffering(false);
          setError(true);
          hls.destroy();
        }
      });
      hlsRef.current = hls;
      return () => {
        hls.destroy();
        hlsRef.current = null;
      };
    }
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = videoUrl;
      const onMeta = () => autoplay();
      const onErr = () => {
        setBuffering(false);
        setError(true);
      };
      video.addEventListener('loadedmetadata', onMeta, { once: true });
      video.addEventListener('error', onErr, { once: true });
      return () => {
        video.removeEventListener('loadedmetadata', onMeta);
        video.removeEventListener('error', onErr);
      };
    }
    setBuffering(false);
    setError(true);
  }, [videoUrl, reloadKey]);

  /* ── Progress persistence (every ~10s of playback) ────────────────────── */
  const saveProgress = useCallback(
    (seconds: number, total: number) => {
      if (!user || !total) return;
      fetch('/api/watch/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          episodeId: episode.id,
          progress: Math.floor(seconds),
          completed: seconds / total > 0.9,
        }),
      }).catch(() => undefined);
    },
    [user, episode.id]
  );

  /* ── Chrome auto-hide ─────────────────────────────────────────────────── */
  const showChrome = useCallback(() => {
    setChrome(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setChrome(false), 3000);
  }, []);

  // Controls stay up while paused; while playing they fade after 3s idle.
  useEffect(() => {
    if (playing) showChrome();
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [playing, showChrome]);
  const chromeVisible = chrome || !playing;

  /* ── Actions ──────────────────────────────────────────────────────────── */
  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v || locked) return;
    if (v.paused) {
      v.play().catch(() => undefined);
      setFlash('play');
    } else {
      v.pause();
      setFlash('pause');
    }
    setTimeout(() => setFlash(null), 500);
  }, [locked]);

  const toggleSound = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    if (!v.muted) {
      v.volume = 1;
      if (v.paused) v.play().catch(() => undefined);
    }
    setMuted(v.muted);
    rememberSound(!v.muted);
  }, []);

  const cycleSpeed = () => {
    const next = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length];
    speedForSession = next;
    setSpeed(next);
    if (videoRef.current) videoRef.current.playbackRate = next;
    showChrome();
  };

  const seekBy = useCallback((delta: number) => {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    v.currentTime = Math.max(0, Math.min(v.duration, v.currentTime + delta));
  }, []);

  const share = async () => {
    const url = window.location.href;
    const title = `${series.title} · EP ${episode.episodeNumber}`;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* user dismissed the share sheet */
    }
  };

  const goNext = useCallback(() => {
    if (nextEpisodeId) onNavigate(nextEpisodeId);
  }, [nextEpisodeId, onNavigate]);
  const goPrev = useCallback(() => {
    if (prevEpisodeId) onNavigate(prevEpisodeId);
  }, [prevEpisodeId, onNavigate]);

  /* ── Keyboard (desktop) ───────────────────────────────────────────────── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest('input,textarea')) return;
      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'm':
          toggleSound();
          break;
        case 'ArrowRight':
          seekBy(5);
          break;
        case 'ArrowLeft':
          seekBy(-5);
          break;
        case 'ArrowDown':
          e.preventDefault();
          goNext();
          break;
        case 'ArrowUp':
          e.preventDefault();
          goPrev();
          break;
        case 'Escape':
          if (drawer) setDrawer(false);
          else onClose();
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [togglePlay, toggleSound, seekBy, goNext, goPrev, onClose, drawer]);

  /* ── Scrubbing ────────────────────────────────────────────────────────── */
  const fracFromEvent = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  };

  const shown = scrub ?? (duration ? time / duration : 0);

  /* ── Render ───────────────────────────────────────────────────────────── */
  return (
    <div className="fixed inset-0 overflow-hidden bg-black">
      {/* Blurred poster backdrop (visible around the 9:16 stage on wide screens) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={series.thumbnail}
        alt=""
        className="absolute inset-0 h-full w-full scale-110 object-cover opacity-40 blur-3xl"
      />

      <div
        className="relative mx-auto h-full w-full md:w-auto md:aspect-[9/16] bg-black select-none"
        onClick={() => {
          if (drawer) return setDrawer(false);
          togglePlay();
          showChrome();
        }}
        onMouseMove={() => playing && showChrome()}
        onTouchStart={(e) => (touchRef.current = { y: e.touches[0].clientY, t: Date.now() })}
        onTouchEnd={(e) => {
          const start = touchRef.current;
          touchRef.current = null;
          if (!start || drawer) return;
          const dy = e.changedTouches[0].clientY - start.y;
          if (Math.abs(dy) > 70 && Date.now() - start.t < 800) {
            e.preventDefault();
            if (dy < 0) goNext();
            else goPrev();
          }
        }}
      >
        {locked ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={episode.thumbnail || series.thumbnail}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-50 blur-md scale-105"
          />
        ) : (
          <video
            ref={videoRef}
            className="absolute inset-0 h-full w-full object-contain"
            playsInline
            autoPlay={!notifyCard}
            muted
            poster={episode.thumbnail || undefined}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onWaiting={() => setBuffering(true)}
            onPlaying={() => {
              setBuffering(false);
              if (!startedRef.current) {
                startedRef.current = true;
                analytics.videoStart(trackingContext());
              }
            }}
            onCanPlay={() => setBuffering(false)}
            onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
            onTimeUpdate={(e) => {
              const v = e.currentTarget;
              setTime(v.currentTime);
              if (!completedRef.current && v.duration && v.currentTime / v.duration >= 0.9) {
                completedRef.current = true;
                analytics.videoComplete(trackingContext());
              }
              if (Math.abs(v.currentTime - lastSavedRef.current) >= 10) {
                lastSavedRef.current = v.currentTime;
                saveProgress(v.currentTime, v.duration);
              }
            }}
            onEnded={(e) => {
              saveProgress(e.currentTarget.duration, e.currentTarget.duration);
              // Straight into the next episode — which, after a pilot, is the
              // locked episode's unlock (coin) flow.
              if (nextEpisodeId) onNavigate(nextEpisodeId);
              else setEnded(true);
            }}
          />
        )}

        {/* Readability gradients */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/70 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-black/85 to-transparent" />

        {/* Buffering */}
        {buffering && !locked && !error && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-[3px] border-white/20 border-t-white" />
          </div>
        )}

        {/* Play/pause flash + paused state */}
        {!locked && !error && (flash || (!playing && !buffering && !ended)) && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div
              className={`flex h-20 w-20 items-center justify-center rounded-full bg-black/45 backdrop-blur-sm transition ${
                flash ? 'scale-110 opacity-100' : 'opacity-90'
              }`}
            >
              {flash === 'pause' ? (
                <Pause className="h-9 w-9 fill-white text-white" />
              ) : (
                <Play className="ml-1 h-9 w-9 fill-white text-white" />
              )}
            </div>
          </div>
        )}

        {/* Top bar */}
        <div
          className={`absolute inset-x-0 top-0 z-30 flex items-center justify-between px-3 transition-opacity duration-300 ${
            chromeVisible || locked ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
          style={{ paddingTop: 'calc(0.75rem + env(safe-area-inset-top))' }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex items-center gap-1 rounded-full bg-black/40 py-2 pl-2 pr-3 text-sm font-semibold text-white backdrop-blur"
          >
            <ChevronLeft className="h-5 w-5" />
            <span className="max-w-[40vw] truncate">{series.title}</span>
          </button>
          <span className="rounded-full bg-black/40 px-3 py-1.5 text-xs font-bold tracking-wide text-white backdrop-blur">
            EP {episode.episodeNumber}/{episodes.length}
          </span>
        </div>

        {/* Tap for sound — always visible while muted */}
        {!locked && muted && !error && !ended && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleSound();
            }}
            className="absolute left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-black shadow-lg animate-pulse"
            style={{ top: 'calc(4rem + env(safe-area-inset-top))' }}
          >
            <VolumeX className="h-4 w-4" /> {t('tapForSound')}
          </button>
        )}

        {/* Right action rail */}
        {!locked && (
          <div
            className={`absolute bottom-28 right-3 z-30 flex flex-col items-center gap-5 text-white transition-opacity duration-300 ${
              chromeVisible ? 'opacity-100' : 'pointer-events-none opacity-0'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <RailButton label={muted ? t('soundOff') : t('soundOn')} onClick={toggleSound}>
              {muted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
            </RailButton>
            <RailButton label={t('episodes')} onClick={() => setDrawer(true)}>
              <LayoutGrid className="h-6 w-6" />
            </RailButton>
            <RailButton label={`${speed}x`} onClick={cycleSpeed}>
              <Gauge className="h-6 w-6" />
            </RailButton>
            <RailButton label={copied ? t('copied') : t('share')} onClick={share}>
              <Share2 className="h-6 w-6" />
            </RailButton>
          </div>
        )}

        {/* Bottom: title + scrubber */}
        {!locked && (
          <div
            className={`absolute inset-x-0 bottom-0 z-30 px-4 transition-opacity duration-300 ${
              chromeVisible || scrub !== null ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 pr-16 text-white">
              <p className="text-base font-bold leading-tight drop-shadow">{series.title}</p>
              <p className="text-sm text-white/80 drop-shadow">
                EP {episode.episodeNumber} · {episode.title}
              </p>
            </div>
            <div className="mb-1 flex justify-between text-[11px] font-medium text-white/80">
              <span>{formatDuration(Math.floor(scrub !== null ? scrub * duration : time))}</span>
              <span>{formatDuration(Math.floor(duration))}</span>
            </div>
            <div
              className="group relative flex h-6 cursor-pointer touch-none items-center"
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                setScrub(fracFromEvent(e));
              }}
              onPointerMove={(e) => scrub !== null && setScrub(fracFromEvent(e))}
              onPointerUp={(e) => {
                const f = fracFromEvent(e);
                const v = videoRef.current;
                if (v && v.duration) v.currentTime = f * v.duration;
                setScrub(null);
                showChrome();
              }}
              onPointerCancel={() => setScrub(null)}
            >
              <div
                className={`relative w-full rounded-full bg-white/30 transition-[height] ${
                  scrub !== null ? 'h-1.5' : 'h-1 group-hover:h-1.5'
                }`}
              >
                <div className="absolute inset-y-0 left-0 rounded-full bg-rose-500" style={{ width: `${shown * 100}%` }} />
                <div
                  className={`absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow transition-transform ${
                    scrub !== null ? 'scale-125' : 'scale-0 group-hover:scale-100'
                  }`}
                  style={{ left: `${shown * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Thin always-on progress line when chrome is hidden */}
        {!locked && !chromeVisible && scrub === null && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-0.5 bg-white/20">
            <div className="h-full bg-rose-500" style={{ width: `${shown * 100}%` }} />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/85 px-6 text-center" onClick={(e) => e.stopPropagation()}>
            <p className="mb-4 text-lg font-semibold text-white">{t('loadError')}</p>
            <button
              onClick={() => setReloadKey((k) => k + 1)}
              className="flex items-center gap-2 rounded-full bg-rose-500 px-6 py-3 font-semibold text-white hover:bg-rose-600"
            >
              <RotateCcw className="h-4 w-4" /> {t('retry')}
            </button>
          </div>
        )}

        {/* End of the available story */}
        {(ended || notifyCard) && (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/85 px-6 text-center backdrop-blur-sm" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-2 text-2xl font-bold text-white">{t('stayTuned')}</h2>
            <p className="mb-6 text-sm text-gray-400">{t('moreSoon')}</p>
            <NotifyButton
              seriesId={series.id}
              seriesTitle={series.title}
              episodeId={episode.id}
              episodeNumber={episode.episodeNumber}
              autoSubscribe={notifyReturn}
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  const v = videoRef.current;
                  if (!v) return;
                  holdAutoplay.current = false;
                  v.currentTime = 0;
                  v.play().catch(() => undefined);
                  setEnded(false);
                  setNotifyCard(false);
                }}
                className="flex items-center gap-2 rounded-full bg-rose-500 px-6 py-3 font-semibold text-white hover:bg-rose-600"
              >
                <RotateCcw className="h-4 w-4" /> {t('replay')}
              </button>
              <button onClick={onClose} className="rounded-full border border-white/30 px-6 py-3 font-semibold text-white hover:bg-white/10">
                {t('moreSeries')}
              </button>
            </div>
          </div>
        )}

        {/* Locked → the coin monetization flow */}
        {locked && (
          <UnlockSheet
            episodeId={episode.id}
            episodeNumber={episode.episodeNumber}
            seriesId={series.id}
            seriesTitle={series.title}
            coinPrice={series.coinPrice}
            onUnlocked={onUnlocked}
          />
        )}

        {/* Episodes drawer */}
        {drawer && (
          <div
            className="absolute inset-x-0 bottom-0 z-50 max-h-[70%] overflow-y-auto rounded-t-3xl border-t border-white/10 bg-zinc-950/95 px-5 pt-4 text-white backdrop-blur-xl"
            style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/25" />
            <div className="mb-4 flex items-center justify-between">
              <p className="font-bold">
                {series.title} · {t('episodesCount', { count: episodes.length })}
              </p>
              <button onClick={() => setDrawer(false)} aria-label="Close" className="rounded-full p-1 hover:bg-white/10">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-5 gap-2.5">
              {episodes.map((ep) => {
                const current = ep.id === episode.id;
                return (
                  <button
                    key={ep.id}
                    onClick={() => {
                      setDrawer(false);
                      if (!current) onNavigate(ep.id);
                    }}
                    className={`relative flex aspect-square items-center justify-center rounded-xl text-base font-bold transition ${
                      current
                        ? 'bg-rose-500 text-white'
                        : ep.unlocked
                          ? 'bg-zinc-800 text-white hover:bg-zinc-700'
                          : 'bg-zinc-900 text-zinc-500 hover:bg-zinc-800'
                    }`}
                  >
                    {ep.episodeNumber}
                    {!ep.unlocked && <Lock className="absolute right-1.5 top-1.5 h-3 w-3" />}
                    {ep.isFree && (
                      <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 rounded bg-amber-400 px-1 text-[9px] font-bold uppercase text-black">
                        {t('free')}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function RailButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1" aria-label={label}>
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/35 backdrop-blur-sm ring-1 ring-white/15 transition hover:bg-black/55">
        {children}
      </span>
      <span className="text-[11px] font-semibold drop-shadow">{label}</span>
    </button>
  );
}
