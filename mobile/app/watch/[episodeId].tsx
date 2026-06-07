import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
  type LayoutChangeEvent,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { api } from '@/lib/api';

/**
 * Vertical full-screen player with custom controls (tap to toggle, play/pause,
 * ±10s skip, scrubber, time). Native controls are disabled so the UX is
 * consistent across iOS/Android. Watch progress is saved periodically.
 */
function fmt(s: number): string {
  const v = !isFinite(s) || s < 0 ? 0 : s;
  const m = Math.floor(v / 60);
  const sec = Math.floor(v % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export default function WatchScreen() {
  const { episodeId, url } = useLocalSearchParams<{ episodeId: string; url?: string }>();
  const router = useRouter();
  const lastSaved = useRef(0);
  const barWidth = useRef(0);

  const [isPlaying, setIsPlaying] = useState(true);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);

  const player = useVideoPlayer(url ?? '', (p) => {
    p.loop = false;
    p.timeUpdateEventInterval = 0.5;
    if (url) p.play();
  });

  useEffect(() => {
    const subTime = player.addListener('timeUpdate', ({ currentTime }) => {
      setCurrent(currentTime);
      if (player.duration && Math.abs(player.duration - duration) > 0.5) {
        setDuration(player.duration);
      }
      if (episodeId && currentTime - lastSaved.current >= 5) {
        lastSaved.current = currentTime;
        void api
          .saveProgress({ episodeId, progress: Math.floor(currentTime), completed: false })
          .catch(() => {});
      }
    });
    const subPlay = player.addListener('playingChange', ({ isPlaying: playing }) => {
      setIsPlaying(playing);
    });
    return () => {
      subTime.remove();
      subPlay.remove();
    };
  }, [episodeId, player, duration]);

  // Auto-hide the controls a few seconds after they appear while playing.
  useEffect(() => {
    if (!showControls || !isPlaying) return;
    const t = setTimeout(() => setShowControls(false), 3500);
    return () => clearTimeout(t);
  }, [showControls, isPlaying, current]);

  const togglePlay = useCallback(() => {
    if (player.playing) player.pause();
    else player.play();
  }, [player]);

  const skip = useCallback(
    (delta: number) => {
      const max = duration || Number.MAX_SAFE_INTEGER;
      const next = Math.max(0, Math.min(max, player.currentTime + delta));
      player.currentTime = next;
      setCurrent(next);
    },
    [player, duration],
  );

  const seekTo = useCallback(
    (e: GestureResponderEvent) => {
      if (!barWidth.current || !duration) return;
      const frac = Math.max(0, Math.min(1, e.nativeEvent.locationX / barWidth.current));
      const t = frac * duration;
      player.currentTime = t;
      setCurrent(t);
    },
    [player, duration],
  );

  if (!url) {
    return (
      <View style={styles.container}>
        <Text style={styles.note}>No playback URL for this episode.</Text>
        <Pressable style={styles.close} onPress={() => router.back()}>
          <Text style={styles.closeText}>✕</Text>
        </Pressable>
      </View>
    );
  }

  const pct = duration > 0 ? Math.min(100, (current / duration) * 100) : 0;

  return (
    <View style={styles.container}>
      <VideoView style={styles.video} player={player} contentFit="contain" nativeControls={false} />

      {/* Tap anywhere to toggle the control overlay. */}
      <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowControls((s) => !s)} />

      {showControls && (
        <>
          <Pressable style={styles.close} onPress={() => router.back()}>
            <Text style={styles.closeText}>✕</Text>
          </Pressable>

          <View style={styles.centerRow} pointerEvents="box-none">
            <Pressable style={styles.skipBtn} onPress={() => skip(-10)} hitSlop={12}>
              <Text style={styles.skipText}>⏪</Text>
            </Pressable>
            <Pressable style={styles.playBtn} onPress={togglePlay} hitSlop={12}>
              <Text style={styles.playText}>{isPlaying ? '⏸' : '▶'}</Text>
            </Pressable>
            <Pressable style={styles.skipBtn} onPress={() => skip(10)} hitSlop={12}>
              <Text style={styles.skipText}>⏩</Text>
            </Pressable>
          </View>

          <View style={styles.bottom} pointerEvents="box-none">
            <Text style={styles.time}>{fmt(current)}</Text>
            <Pressable
              style={styles.track}
              hitSlop={10}
              onLayout={(e: LayoutChangeEvent) => {
                barWidth.current = e.nativeEvent.layout.width;
              }}
              onPress={seekTo}
            >
              <View style={styles.trackBg} />
              <View style={[styles.fill, { width: `${pct}%` }]} />
            </Pressable>
            <Text style={styles.time}>{fmt(duration)}</Text>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', justifyContent: 'center' },
  video: { width: '100%', height: '100%' },
  note: { color: '#9CA3AF', textAlign: 'center' },
  close: {
    position: 'absolute',
    top: 48,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { color: '#fff', fontSize: 18 },
  centerRow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 36,
  },
  skipBtn: { padding: 8 },
  skipText: { color: '#fff', fontSize: 30 },
  playBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playText: { color: '#fff', fontSize: 32 },
  bottom: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  time: { color: '#fff', fontSize: 12, width: 44, textAlign: 'center' },
  track: { flex: 1, height: 24, justifyContent: 'center' },
  trackBg: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  fill: { position: 'absolute', left: 0, height: 4, borderRadius: 2, backgroundColor: '#E11D48' },
});
