'use client';

import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Play, Pause, Volume2, VolumeX, Subtitles, ChevronUp, ChevronDown } from 'lucide-react';
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
  const [showControls, setShowControls] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isBuffering, setIsBuffering] = useState(true);
  const touchStartY = useRef(0);

  const { isPlaying, setIsPlaying, currentTime, setCurrentTime, subtitlesEnabled, toggleSubtitles } = usePlayerStore();
  const { user } = useAuthStore();
  const t = useTranslations('player');

  const canPlay = isFree || isUnlocked;

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !canPlay) return;

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
      });
      
      hls.loadSource(videoUrl);
      hls.attachMedia(video);
      
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log('HLS manifest loaded');
        setIsBuffering(false);
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          console.error('HLS fatal error:', data);
        }
      });

      hlsRef.current = hls;

      return () => {
        hls.destroy();
      };
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = videoUrl;
    }
  }, [videoUrl, canPlay]);

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
  }, [hasNext, onNextEpisode, user]);

  const saveProgress = async (time: number) => {
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
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  };

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
        onClick={(e) => e.stopPropagation()}
      />

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
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
            {/* Progress bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-white text-xs mb-1">
                <span>{formatDuration(Math.floor(currentTime))}</span>
                <span>{formatDuration(Math.floor(duration))}</span>
              </div>
              <div className="w-full h-1 bg-white/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-red-500 transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Control buttons */}
            <div className="flex items-center justify-between">
              <button
                onClick={togglePlay}
                className="p-3 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition"
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6 text-white" />
                ) : (
                  <Play className="w-6 h-6 text-white" />
                )}
              </button>

              <div className="flex gap-2">
                <button
                  onClick={toggleSubtitles}
                  className={`p-3 rounded-full backdrop-blur-sm transition ${
                    subtitlesEnabled ? 'bg-red-500' : 'bg-white/20 hover:bg-white/30'
                  }`}
                >
                  <Subtitles className="w-5 h-5 text-white" />
                </button>

                <button
                  onClick={toggleMute}
                  className="p-3 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition"
                >
                  {isMuted ? (
                    <VolumeX className="w-5 h-5 text-white" />
                  ) : (
                    <Volume2 className="w-5 h-5 text-white" />
                  )}
                </button>
              </div>
            </div>

            {/* Next episode hint */}
            {hasNext && (
              <div className="mt-4 flex items-center justify-center text-white/60 text-sm">
                <ChevronDown className="w-4 h-4" />
                <span className="ml-1">{t('swipeNext')}</span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
