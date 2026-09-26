'use client';

import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Play } from 'lucide-react';

/** Minimal 9:16 HLS player for the pitch-only brand showcase episodes. */
export default function ShowcasePlayer({ src, poster, label }: { src: string; poster: string; label: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !started) return;
    let hls: Hls | null = null;
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
    } else if (Hls.isSupported()) {
      hls = new Hls({ enableWorker: true });
      hls.loadSource(src);
      hls.attachMedia(video);
    }
    video.play().catch(() => {});
    return () => hls?.destroy();
  }, [src, started]);

  return (
    <div className="relative aspect-[9/16] w-full overflow-hidden rounded-2xl border border-zinc-800 bg-black">
      <video
        ref={videoRef}
        poster={poster}
        controls={started}
        playsInline
        className="h-full w-full object-cover"
        aria-label={label}
      />
      {!started && (
        <button
          type="button"
          onClick={() => setStarted(true)}
          className="absolute inset-0 flex items-center justify-center bg-black/30 transition hover:bg-black/20"
          aria-label={`Play ${label}`}
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-black shadow-xl">
            <Play className="ml-1 h-7 w-7 fill-black" />
          </span>
        </button>
      )}
    </div>
  );
}
