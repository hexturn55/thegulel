'use client';

import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import {
  ChevronDown,
  ChevronUp,
  Coins,
  Crown,
  Heart,
  Lock,
  MessageCircle,
  Play,
  Share2,
  Volume2,
  VolumeX,
} from 'lucide-react';

export interface DemoEpisode {
  id: string;
  seriesId: string;
  seriesTitle: string;
  genre: string;
  episodeNumber: number;
  title: string;
  src: string | null;
}

export interface DemoLocked {
  seriesTitle: string;
  episodeNumber: number;
  title: string;
  poster: string;
}

/**
 * A phone-framed replica of the Gulel watch experience for the investor page.
 * Plays the real free episodes from the catalog (the same HLS streams the app
 * serves), swipes between them like the app does, and ends on the real coin
 * paywall moment the monetization slides describe.
 */
export default function DemoPhone({
  episodes,
  locked,
}: {
  episodes: DemoEpisode[];
  locked: DemoLocked | null;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const touchY = useRef<number | null>(null);
  const [index, setIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [failed, setFailed] = useState(false);
  const [liked, setLiked] = useState(false);

  const slides = episodes.length + (locked ? 1 : 0);
  const onPaywall = locked !== null && index === episodes.length;
  const current = onPaywall ? null : episodes[index];

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !current?.src) return;
    setFailed(false);
    setProgress(0);

    hlsRef.current?.destroy();
    hlsRef.current = null;

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = current.src;
    } else if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true });
      hls.loadSource(current.src);
      hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (data.fatal) setFailed(true);
      });
      hlsRef.current = hls;
    } else {
      setFailed(true);
      return;
    }
    video.muted = muted;
    video.play().catch(() => {
      if (!video.muted) {
        // Sound autoplay blocked — continue muted; the pill restores audio.
        video.muted = true;
        setMuted(true);
        video.play().catch(() => setPlaying(false));
      } else {
        setPlaying(false);
      }
    });

    return () => {
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
    // `muted` is applied imperatively below; reloading the stream on unmute
    // would restart the episode.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.src]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted;
  }, [muted]);

  const toggleSound = () => {
    const v = videoRef.current;
    const next = !muted;
    if (v) {
      v.muted = next;
      if (!next) {
        v.volume = 1;
        if (v.paused) v.play().catch(() => undefined);
      }
    }
    setMuted(next);
  };

  const go = (delta: number) => {
    setLiked(false);
    setIndex((i) => Math.min(Math.max(i + delta, 0), slides - 1));
  };

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => undefined);
    else v.pause();
  };

  return (
    <div className="flex items-center gap-4">
      {/* Phone */}
      <div
        className="relative w-[280px] sm:w-[300px] aspect-[9/19.5] rounded-[2.6rem] bg-black p-[10px] shadow-[0_0_0_2px_#27272a,0_30px_80px_-20px_rgba(244,63,94,0.45)]"
        onTouchStart={(e) => (touchY.current = e.touches[0].clientY)}
        onTouchEnd={(e) => {
          if (touchY.current === null) return;
          const dy = e.changedTouches[0].clientY - touchY.current;
          if (Math.abs(dy) > 50) go(dy < 0 ? 1 : -1);
          touchY.current = null;
        }}
      >
        <div className="relative h-full w-full overflow-hidden rounded-[2rem] bg-zinc-950">
          {/* Notch */}
          <div className="absolute left-1/2 top-2 z-30 h-5 w-24 -translate-x-1/2 rounded-full bg-black" />

          {current && (
            <>
              <video
                ref={videoRef}
                className="absolute inset-0 h-full w-full object-cover"
                playsInline
                autoPlay
                muted={muted}
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                onEnded={() => go(1)}
                onTimeUpdate={(e) => {
                  const v = e.currentTarget;
                  if (v.duration) setProgress(v.currentTime / v.duration);
                }}
                onClick={togglePlay}
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/40" />

              {muted && playing && !failed && (
                <button
                  onClick={toggleSound}
                  className="absolute left-1/2 top-[45%] z-20 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/60 px-4 py-2 text-xs font-semibold text-white ring-1 ring-white/30 backdrop-blur animate-pulse"
                >
                  <VolumeX className="h-4 w-4" /> Tap for sound
                </button>
              )}

              {(!playing || failed) && (
                <button
                  onClick={togglePlay}
                  className="absolute inset-0 z-10 flex items-center justify-center"
                  aria-label="Play"
                >
                  <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-black">
                    <Play className="ml-1 h-7 w-7 fill-black" />
                  </span>
                </button>
              )}

              {/* Top bar */}
              <div className="absolute left-0 right-0 top-9 z-20 flex items-center justify-between px-4 text-[11px] text-white/90">
                <span className="rounded-full bg-black/40 px-2.5 py-1 font-semibold backdrop-blur">
                  EP {current.episodeNumber} · FREE
                </span>
                <button
                  onClick={toggleSound}
                  className="rounded-full bg-black/40 p-1.5 backdrop-blur"
                  aria-label={muted ? 'Unmute' : 'Mute'}
                >
                  {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </button>
              </div>

              {/* Right rail */}
              <div className="absolute bottom-24 right-3 z-20 flex flex-col items-center gap-4 text-white">
                <button onClick={() => setLiked((l) => !l)} aria-label="Like" className="flex flex-col items-center">
                  <Heart className={`h-7 w-7 ${liked ? 'fill-rose-500 text-rose-500' : ''}`} />
                  <span className="text-[10px]">{liked ? '12.5K' : '12.4K'}</span>
                </button>
                <span className="flex flex-col items-center">
                  <MessageCircle className="h-7 w-7" />
                  <span className="text-[10px]">1.1K</span>
                </span>
                <span className="flex flex-col items-center">
                  <Share2 className="h-6 w-6" />
                  <span className="text-[10px]">Share</span>
                </span>
              </div>

              {/* Caption */}
              <div className="absolute bottom-7 left-4 right-16 z-20 text-white">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-400">
                  {current.genre}
                </p>
                <p className="text-sm font-bold leading-tight">{current.seriesTitle}</p>
                <p className="text-xs text-white/75">
                  Ep {current.episodeNumber} · {current.title}
                </p>
              </div>

              {/* Progress */}
              <div className="absolute bottom-3 left-4 right-4 z-20 h-[3px] rounded-full bg-white/20">
                <div
                  className="h-full rounded-full bg-rose-500 transition-[width] duration-200"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
            </>
          )}

          {onPaywall && locked && (
            <div className="absolute inset-0 flex flex-col">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={locked.poster} alt="" className="absolute inset-0 h-full w-full object-cover blur-md scale-110 opacity-40" />
              <div className="relative z-10 mt-auto mb-auto px-5 text-center text-white">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-pink-500">
                  <Lock className="h-8 w-8" />
                </div>
                <p className="text-xs uppercase tracking-widest text-amber-400">Cliffhanger</p>
                <p className="mb-1 text-lg font-bold">Episode {locked.episodeNumber} is locked</p>
                <p className="mb-5 text-xs text-white/70">
                  {locked.seriesTitle} · {locked.title}
                </p>
                <div className="space-y-2.5">
                  <div className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-3 text-sm font-semibold">
                    <Coins className="h-4 w-4" /> Unlock with 10 coins
                  </div>
                  <div className="flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800/80 py-3 text-sm font-semibold">
                    <Play className="h-4 w-4" /> Watch an ad · earn 5 coins
                  </div>
                  <div className="flex items-center justify-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 py-3 text-sm font-semibold text-amber-300">
                    <Crown className="h-4 w-4" /> Go VIP — unlimited
                  </div>
                </div>
                <p className="mt-4 text-[10px] text-white/50">This is the moment the coin economy monetizes.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Swipe controls + episode dots */}
      <div className="flex flex-col items-center gap-3">
        <button
          onClick={() => go(-1)}
          disabled={index === 0}
          className="rounded-full border border-zinc-700 p-2 text-white transition hover:border-rose-500 disabled:opacity-30"
          aria-label="Previous episode"
        >
          <ChevronUp className="h-5 w-5" />
        </button>
        {Array.from({ length: slides }).map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`h-2 w-2 rounded-full transition ${
              i === index ? 'scale-125 bg-rose-500' : locked && i === episodes.length ? 'bg-amber-500/60' : 'bg-zinc-600'
            }`}
          />
        ))}
        <button
          onClick={() => go(1)}
          disabled={index === slides - 1}
          className="rounded-full border border-zinc-700 p-2 text-white transition hover:border-rose-500 disabled:opacity-30"
          aria-label="Next episode"
        >
          <ChevronDown className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
