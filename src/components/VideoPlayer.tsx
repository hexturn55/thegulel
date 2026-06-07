'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Play, Pause, Volume2, VolumeX, Subtitles, ChevronUp, SkipBack, SkipForward } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { useAuthStore } from '@/stores/useAuthStore';
import PaywallOverlay from './PaywallOverlay';
import { formatDuration } from '@/lib/utils';

interface VideoPlayerProps {
  episodeId: string;
  videoUrl: string;
  videoId: string;
  isFree: boolean;
  isUnlocked: boolean;
  onNextEpisode?: () => void;
  onPrevEpisode?: () => void;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function VideoPlayer({
  episodeId,
  videoUrl,
  videoId,
  isFree,
  isUnlocked,
  onNextEpisode,
  onPrevEpisode,
  hasNext,
  hasPrev,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const recoverRef = useRef(0);
  const [showControls, setShowControls] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isBuffering, setIsBuffering] = useState(true);
  const [showEndCard, setShowEndCard] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const touchStartY = useRef(0);

  const { isPlaying, setIsPlaying, currentTime, setCurrentTime, subtitlesEnabled, toggleSubtitles } = usePlayerStore();
  const { user } = useAuthStore();
  const t = useTranslations('player');

  const canPlay = isFree || isUnlocked;

  const saveProgress = useCallback(
    async (time: number) => {
      if (!user) return;
      try {
        await fetch('/api/watch/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            episodeId,
            progress: Math.floor(time),
            completed: time / duration > 0.9,
          }),
        });
      } catch (err) {
        console.error('Failed to save progress:', err);
      }
    },
    [user, episodeId, duration],
  );

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !canPlay) return;
    setShowEndCard(false);
    setError(null);
    setIsBuffering(true);
    recoverRef.current = 0;

    // Vertical-drama UX: start muted so the browser permits autoplay.
    video.muted = true;
    setIsMuted(true);

    const tryAutoplay = () => {
      video
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false)); // blocked even muted — user can tap
    };

    if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, lowLatencyMode: false });
      hls.loadSource(videoUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsBuffering(false);
        tryAutoplay();
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (!data.fatal) return;
        // Recover from transient network/media errors instead of dying silently.
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR && recoverRef.current < 3) {
          recoverRef.current += 1;
          hls.startLoad();
        } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR && recoverRef.current < 3) {
          recoverRef.current += 1;
          hls.recoverMediaError();
        } else {
          console.error('HLS fatal error:', data);
          setIsBuffering(false);
          setError('This video could not be loaded.');
          hls.destroy();
        }
      });

      hlsRef.current = hls;

      return () => {
        hls.destroy();
        hlsRef.current = null;
      };
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS (Safari/iOS)
      video.src = videoUrl;
      const onReady = () => {
        setIsBuffering(false);
        tryAutoplay();
      };
      const onErr = () => {
        setIsBuffering(false);
        setError('This video could not be loaded.');
      };
      video.addEventListener('loadedmetadata', onReady, { once: true });
      video.addEventListener('error', onErr, { once: true });
      return () => {
        video.removeEventListener('loadedmetadata', onReady);
        video.removeEventListener('error', onErr);
      };
    } else {
      setIsBuffering(false);
      setError('Your browser cannot play this video.');
    }
  }, [videoUrl, canPlay, reloadKey]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      setProgress((video.currentTime / video.duration) * 100);
      
      // Save progress every 5 seconds
      if (Math.floor(video.currentTime) % 5 === 0 && user) {
        saveProgress(video.currentTime);
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      if (hasNext && onNextEpisode) {
        onNextEpisode();
      } else {
        // Last (or only) episode — close out with a "stay tuned" card.
        setShowEndCard(true);
      }
    };

    const handleWaiting = () => setIsBuffering(true);
    const handleCanPlay = () => setIsBuffering(false);
    const handlePlaying = () => setIsBuffering(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('playing', handlePlaying);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('playing', handlePlaying);
    };
  }, [hasNext, onNextEpisode, user, saveProgress]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchStartY.current - touchEndY;

    if (Math.abs(diff) > 50) {
      if (diff > 0 && hasNext && onNextEpisode) {
        onNextEpisode();
      } else if (diff < 0 && hasPrev && onPrevEpisode) {
        onPrevEpisode();
      }
    }
  };

  if (!canPlay) {
    return <PaywallOverlay episodeId={episodeId} />;
  }

  return (
    <div 
      className="relative w-full h-screen bg-black"
      onClick={() => setShowControls(!showControls)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        playsInline
        autoPlay
        muted
      />

      {/* Playback error — visible message + retry instead of a silent spinner */}
      {error && (
        <div
          className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/85 text-center px-6"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-white text-lg font-semibold mb-2">{error}</p>
          <button
            onClick={() => {
              setError(null);
              setReloadKey((k) => k + 1);
            }}
            className="mt-3 flex items-center gap-2 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-semibold px-6 py-3 rounded-full transition"
          >
            <Play className="w-4 h-4 fill-white" />
            {t('replay')}
          </button>
        </div>
      )}

      {/* End card — shown after the last/only episode finishes */}
      {showEndCard && (
        <div
          className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/85 backdrop-blur-sm text-center px-6"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-white text-2xl font-bold mb-2">{t('stayTuned')}</h2>
          <p className="text-gray-400 text-sm mb-8">{t('moreSoon')}</p>
          <button
            onClick={() => {
              const v = videoRef.current;
              if (!v) return;
              v.currentTime = 0;
              v.play();
              setIsPlaying(true);
              setShowEndCard(false);
            }}
            className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-semibold px-6 py-3 rounded-full transition"
          >
            <Play className="w-4 h-4 fill-white" />
            {t('replay')}
          </button>
        </div>
      )}

      {/* Buffering spinner */}
      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <svg
            className="animate-spin w-14 h-14 text-white/80"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        </div>
      )}

      {showControls && (
        <>
          {/* Top swipe indicator */}
          <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/60 to-transparent">
            {hasPrev && (
              <div className="flex items-center justify-center text-white/60 text-sm">
                <ChevronUp className="w-4 h-4" />
                <span className="ml-1">{t('swipePrev')}</span>
              </div>
            )}
          </div>

          {/* Bottom controls */}
          <div
            className="absolute bottom-0 left-0 right-0 px-4 pt-10 pb-5 bg-gradient-to-t from-black via-black/70 to-transparent"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Progress bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-white text-xs mb-1.5 [text-shadow:_0_1px_2px_rgb(0_0_0_/_80%)]">
                <span>{formatDuration(Math.floor(currentTime))}</span>
                <span>{formatDuration(Math.floor(duration))}</span>
              </div>
              <div
                className="w-full h-2 bg-white/40 rounded-full overflow-hidden cursor-pointer"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const frac = (e.clientX - rect.left) / rect.width;
                  const v = videoRef.current;
                  if (v && duration) v.currentTime = Math.max(0, Math.min(1, frac)) * duration;
                }}
              >
                <div
                  className="h-full bg-red-500 transition-all duration-200 pointer-events-none"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Control buttons */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {hasPrev && (
                  <button
                    onClick={() => onPrevEpisode?.()}
                    aria-label="Previous episode"
                    className="p-3 rounded-full bg-black/50 ring-1 ring-white/25 backdrop-blur-sm hover:bg-black/70 transition shadow-lg"
                  >
                    <SkipBack className="w-5 h-5 text-white fill-white" />
                  </button>
                )}
                <button
                  onClick={togglePlay}
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                  className="p-3.5 rounded-full bg-white text-black ring-1 ring-black/10 hover:bg-white/90 transition shadow-lg"
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6 fill-black" />
                  ) : (
                    <Play className="w-6 h-6 fill-black" />
                  )}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={toggleSubtitles}
                  aria-label="Subtitles"
                  className={`p-3 rounded-full ring-1 ring-white/25 backdrop-blur-sm transition shadow-lg ${
                    subtitlesEnabled ? 'bg-red-500 hover:bg-red-600' : 'bg-black/50 hover:bg-black/70'
                  }`}
                >
                  <Subtitles className="w-5 h-5 text-white" />
                </button>

                <button
                  onClick={toggleMute}
                  aria-label={isMuted ? 'Unmute' : 'Mute'}
                  className="p-3 rounded-full bg-black/50 ring-1 ring-white/25 backdrop-blur-sm hover:bg-black/70 transition shadow-lg"
                >
                  {isMuted ? (
                    <VolumeX className="w-5 h-5 text-white" />
                  ) : (
                    <Volume2 className="w-5 h-5 text-white" />
                  )}
                </button>

                {hasNext && (
                  <button
                    onClick={() => onNextEpisode?.()}
                    aria-label="Next episode"
                    className="flex items-center gap-1.5 pl-4 pr-3 py-3 rounded-full bg-red-500 ring-1 ring-white/25 hover:bg-red-600 transition shadow-lg text-white font-semibold text-sm"
                  >
                    <span>{t('next')}</span>
                    <SkipForward className="w-5 h-5 fill-white" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
