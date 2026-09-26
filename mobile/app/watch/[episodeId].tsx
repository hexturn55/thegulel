import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type AccessibilityActionEvent,
  type GestureResponderEvent,
  type LayoutChangeEvent,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useVideoPlayer, VideoView, type VideoPlayerStatus } from 'expo-video';
import { ApiRequestError, type PlaybackInfo } from '@gulel/shared';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

/**
 * Vertical full-screen player with custom controls (tap to toggle, play/pause,
 * ±10s skip, scrubber, time). Native controls are disabled so the UX is
 * consistent across iOS/Android.
 *
 * The stream URL is never passed through the route: on mount (and on Retry)
 * the screen asks the API for a short-lived signed URL, which also enforces
 * entitlement and returns the resume position and next episode. Watch
 * progress is saved periodically, on exit and on completion.
 */

const ACCENT = '#E11D48';
const HIDE_CONTROLS_MS = 3500;
const SAVE_EVERY_S = 5;
const RESUME_MARGIN_S = 5;
const SKIP_S = 10;

const isDemoId = (id: string) => id.startsWith('demo-');

function fmt(s: number): string {
  const v = !isFinite(s) || s < 0 ? 0 : s;
  const m = Math.floor(v / 60);
  const sec = Math.floor(v % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

/** Development-only offline playback for `demo-` episode ids. */
function devSamplePlayback(episodeId: string): PlaybackInfo | null {
  if (__DEV__ && isDemoId(episodeId)) {
    const { samplePlayback } = require('@/lib/sampleData') as typeof import('@/lib/sampleData');
    return samplePlayback(episodeId);
  }
  return null;
}

type Phase = 'fetching' | 'ready' | 'error' | 'locked' | 'unavailable';

export default function WatchScreen() {
  const { episodeId } = useLocalSearchParams<{ episodeId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();

  const player = useVideoPlayer(null, (p) => {
    p.loop = false;
    p.timeUpdateEventInterval = 0.5;
  });

  const [phase, setPhase] = useState<Phase>('fetching');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [seriesId, setSeriesId] = useState<string | null>(null);
  const [nextEpisodeId, setNextEpisodeId] = useState<string | null>(null);
  const [status, setStatus] = useState<VideoPlayerStatus>('idle');
  const [isPlaying, setIsPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [interaction, setInteraction] = useState(0);
  const [ended, setEnded] = useState(false);

  const reqId = useRef(0);
  const playbackRef = useRef<PlaybackInfo | null>(null);
  /** The resume seek has been attempted; progress is only saved after that. */
  const resumedRef = useRef(false);
  const lastSaved = useRef(0);
  const currentRef = useRef(0);
  const endedRef = useRef(false);
  const barWidth = useRef(0);
  const sessionRef = useRef(session);
  sessionRef.current = session;

  const close = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }, [router]);

  const saveProgress = useCallback(
    (epId: string | undefined, seconds: number, completed: boolean) => {
      // Progress is per-account, and demo episodes don't exist on the server.
      if (!epId || !sessionRef.current || isDemoId(epId)) return;
      void api
        .saveProgress({ episodeId: epId, progress: Math.max(0, Math.floor(seconds)), completed })
        .catch(() => {});
    },
    [],
  );

  const bump = useCallback(() => setInteraction((i) => i + 1), []);

  /** Fetch a fresh signed URL and (re)load it into the player. */
  const loadPlayback = useCallback(async () => {
    if (!episodeId) return;
    const rid = ++reqId.current;
    setPhase('fetching');
    setErrorMessage(null);
    setEnded(false);
    endedRef.current = false;
    resumedRef.current = false;

    try {
      const info = devSamplePlayback(episodeId) ?? (await api.getPlayback(episodeId));
      if (rid !== reqId.current) return;

      // A retry (e.g. after the signed URL expired) resumes where the viewer
      // actually was, not at the server's older saved position.
      const resumeAt =
        playbackRef.current && currentRef.current > 0 ? currentRef.current : info.progress;
      playbackRef.current = { ...info, progress: resumeAt };
      lastSaved.current = resumeAt;
      if (info.seriesId) setSeriesId(info.seriesId);
      setNextEpisodeId(info.nextEpisodeId);

      await player.replaceAsync({
        uri: info.url,
        contentType: /\.m3u8(\?|$)/i.test(info.url) ? 'hls' : 'auto',
      });
      if (rid !== reqId.current) return;
      if (player.status === 'error') {
        // The source failed while loading (the statusChange event may have
        // fired before replaceAsync resolved).
        setErrorMessage("This episode couldn't be played. Please try again.");
        setPhase('error');
        return;
      }
      player.play();
      setPhase('ready');
    } catch (e) {
      if (rid !== reqId.current) return;
      if (e instanceof ApiRequestError) {
        if (e.status === 401) {
          router.replace('/auth');
          return;
        }
        if (e.status === 402 || e.status === 403 || e.code === 'LOCKED') {
          const body = e.data as { seriesId?: unknown } | undefined;
          if (typeof body?.seriesId === 'string') setSeriesId(body.seriesId);
          setPhase('locked');
          return;
        }
        if (e.status === 404) {
          setErrorMessage("This episode isn't available.");
          setPhase('unavailable');
          return;
        }
        setErrorMessage(
          e.status === 0
            ? 'No connection. Check your internet and try again.'
            : "This episode couldn't be loaded. Please try again.",
        );
      } else {
        setErrorMessage("This episode couldn't be loaded. Please try again.");
      }
      setPhase('error');
    }
  }, [episodeId, player, router]);

  // Load on mount / when the episode changes. Bumping reqId on cleanup drops
  // any response that arrives after the screen is gone.
  useEffect(() => {
    playbackRef.current = null;
    currentRef.current = 0;
    setCurrent(0);
    setDuration(0);
    void loadPlayback();
    return () => {
      reqId.current += 1;
    };
  }, [loadPlayback]);

  // Save the position when leaving this episode (unmount or episode change).
  useEffect(() => {
    return () => {
      if (!resumedRef.current || endedRef.current) return;
      let t = currentRef.current;
      try {
        t = player.currentTime;
      } catch {
        // The native player may already be released; use the last known time.
      }
      if (t > 0) saveProgress(episodeId, Math.floor(t), false);
    };
  }, [episodeId, player, saveProgress]);

  // Seek once to the saved position when the source is ready and the
  // duration is known (ignore positions at the very start or end).
  const maybeResume = useCallback(() => {
    if (resumedRef.current) return;
    const d = player.duration;
    if (!(d > 0)) return;
    resumedRef.current = true;
    const at = playbackRef.current?.progress ?? 0;
    if (at > RESUME_MARGIN_S && at < d - RESUME_MARGIN_S) {
      player.currentTime = at;
      currentRef.current = at;
      lastSaved.current = at;
      setCurrent(at);
    } else {
      lastSaved.current = 0;
    }
  }, [player]);

  useEffect(() => {
    const subStatus = player.addListener('statusChange', ({ status: next }) => {
      setStatus(next);
      if (next === 'readyToPlay') {
        if (player.duration > 0) setDuration(player.duration);
        maybeResume();
      } else if (next === 'error' && playbackRef.current) {
        // Most often an expired signed URL: Retry refetches a fresh one.
        setErrorMessage('Playback stopped. Tap Retry to continue.');
        setPhase('error');
      }
    });
    const subTime = player.addListener('timeUpdate', ({ currentTime }) => {
      currentRef.current = currentTime;
      setCurrent(currentTime);
      const d = player.duration;
      if (d > 0) setDuration((prev) => (Math.abs(prev - d) > 0.5 ? d : prev));
      maybeResume();
      if (resumedRef.current && Math.abs(currentTime - lastSaved.current) >= SAVE_EVERY_S) {
        lastSaved.current = currentTime;
        saveProgress(episodeId, currentTime, false);
      }
    });
    const subPlay = player.addListener('playingChange', ({ isPlaying: playing }) => {
      setIsPlaying(playing);
    });
    const subEnd = player.addListener('playToEnd', () => {
      endedRef.current = true;
      const d = player.duration || currentRef.current;
      lastSaved.current = d;
      saveProgress(episodeId, d, true);
      setEnded(true);
      setShowControls(false);
    });
    return () => {
      subStatus.remove();
      subTime.remove();
      subPlay.remove();
      subEnd.remove();
    };
  }, [episodeId, player, maybeResume, saveProgress]);

  // Auto-hide the controls a few seconds after the last interaction while
  // playing.
  useEffect(() => {
    if (!showControls || !isPlaying) return;
    const t = setTimeout(() => setShowControls(false), HIDE_CONTROLS_MS);
    return () => clearTimeout(t);
  }, [showControls, isPlaying, interaction]);

  const replay = useCallback(() => {
    endedRef.current = false;
    setEnded(false);
    player.currentTime = 0;
    currentRef.current = 0;
    lastSaved.current = 0;
    setCurrent(0);
    player.play();
    setShowControls(true);
    bump();
  }, [player, bump]);

  const togglePlay = useCallback(() => {
    bump();
    if (player.playing) player.pause();
    else if (endedRef.current) replay();
    else player.play();
  }, [player, bump, replay]);

  const skip = useCallback(
    (delta: number) => {
      bump();
      const max = duration || Number.MAX_SAFE_INTEGER;
      const next = Math.max(0, Math.min(max, player.currentTime + delta));
      player.currentTime = next;
      currentRef.current = next;
      setCurrent(next);
    },
    [player, duration, bump],
  );

  const seekTo = useCallback(
    (e: GestureResponderEvent) => {
      bump();
      if (!barWidth.current || !duration) return;
      const frac = Math.max(0, Math.min(1, e.nativeEvent.locationX / barWidth.current));
      const t = frac * duration;
      player.currentTime = t;
      currentRef.current = t;
      setCurrent(t);
    },
    [player, duration, bump],
  );

  const onScrubberAction = useCallback(
    (e: AccessibilityActionEvent) => {
      if (e.nativeEvent.actionName === 'increment') skip(SKIP_S);
      else if (e.nativeEvent.actionName === 'decrement') skip(-SKIP_S);
    },
    [skip],
  );

  const toggleControls = useCallback(() => {
    setShowControls((s) => !s);
    bump();
  }, [bump]);

  const goToSeries = useCallback(() => {
    // dismissTo pops back to the series screen already in the stack (no
    // duplicate copy); if there is none it replaces this screen with it.
    if (seriesId) router.dismissTo(`/series/${seriesId}`);
    else close();
  }, [router, seriesId, close]);

  const pct = duration > 0 ? Math.min(100, (current / duration) * 100) : 0;
  const busy = phase === 'fetching' || (phase === 'ready' && status === 'loading');
  const closeButton = (
    <Pressable
      style={[styles.close, { top: insets.top + 8 }]}
      onPress={close}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel="Close player"
    >
      <Text style={styles.closeText}>✕</Text>
    </Pressable>
  );

  let panel: ReactNode = null;
  if (phase === 'locked') {
    panel = (
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>This episode is locked</Text>
        <Text style={styles.panelBody}>Unlock it with coins or VIP to keep watching.</Text>
        <PanelButton label={seriesId ? 'View episodes' : 'Close'} primary onPress={goToSeries} />
      </View>
    );
  } else if (phase === 'error' || phase === 'unavailable') {
    panel = (
      <View style={styles.panel}>
        <Text style={styles.panelBody}>{errorMessage}</Text>
        {phase === 'error' && (
          <PanelButton label="Retry" primary onPress={() => void loadPlayback()} />
        )}
        <PanelButton label="Close" onPress={close} />
      </View>
    );
  } else if (ended) {
    panel = (
      <View style={styles.panel}>
        {nextEpisodeId ? (
          <PanelButton
            label="Next episode"
            primary
            onPress={() => router.replace(`/watch/${nextEpisodeId}`)}
          />
        ) : null}
        <PanelButton label="Replay" primary={!nextEpisodeId} onPress={replay} />
        <PanelButton label="Close" onPress={close} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar hidden animated />
      <VideoView style={styles.video} player={player} contentFit="contain" nativeControls={false} />

      {panel ? (
        <View style={styles.overlay}>{panel}</View>
      ) : (
        <>
          {/* Tap anywhere to toggle the control overlay. */}
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={toggleControls}
            accessible={false}
          />

          {busy && (
            <View style={styles.overlay} pointerEvents="none">
              <ActivityIndicator color="#fff" size="large" />
            </View>
          )}

          {showControls && phase === 'ready' && (
            <>
              <View style={styles.centerRow} pointerEvents="box-none">
                <Pressable
                  style={styles.skipBtn}
                  onPress={() => skip(-SKIP_S)}
                  hitSlop={12}
                  accessibilityRole="button"
                  accessibilityLabel="Rewind 10 seconds"
                >
                  <Text style={styles.skipText}>⏪</Text>
                </Pressable>
                <Pressable
                  style={styles.playBtn}
                  onPress={togglePlay}
                  hitSlop={12}
                  accessibilityRole="button"
                  accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
                >
                  <Text style={styles.playText}>{isPlaying ? '⏸' : '▶'}</Text>
                </Pressable>
                <Pressable
                  style={styles.skipBtn}
                  onPress={() => skip(SKIP_S)}
                  hitSlop={12}
                  accessibilityRole="button"
                  accessibilityLabel="Forward 10 seconds"
                >
                  <Text style={styles.skipText}>⏩</Text>
                </Pressable>
              </View>

              <View style={[styles.bottom, { bottom: insets.bottom + 16 }]} pointerEvents="box-none">
                <Text style={styles.time}>{fmt(current)}</Text>
                <Pressable
                  style={styles.track}
                  hitSlop={10}
                  onLayout={(e: LayoutChangeEvent) => {
                    barWidth.current = e.nativeEvent.layout.width;
                  }}
                  onPress={seekTo}
                  accessibilityRole="adjustable"
                  accessibilityLabel="Playback position"
                  accessibilityValue={{
                    min: 0,
                    max: Math.max(0, Math.floor(duration)),
                    now: Math.max(0, Math.floor(current)),
                    text: `${fmt(current)} of ${fmt(duration)}`,
                  }}
                  accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
                  onAccessibilityAction={onScrubberAction}
                >
                  <View style={styles.trackBg} />
                  <View style={[styles.fill, { width: `${pct}%` }]} />
                </Pressable>
                <Text style={styles.time}>{fmt(duration)}</Text>
              </View>
            </>
          )}
        </>
      )}

      {/* The close button stays reachable in every state. */}
      {(showControls || phase !== 'ready' || ended) && closeButton}
    </View>
  );
}

function PanelButton({
  label,
  onPress,
  primary = false,
}: {
  label: string;
  onPress: () => void;
  primary?: boolean;
}) {
  return (
    <Pressable
      style={[styles.panelBtn, primary && styles.panelBtnPrimary]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={styles.panelBtnText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', justifyContent: 'center' },
  video: { width: '100%', height: '100%' },
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  close: {
    position: 'absolute',
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { color: '#fff', fontSize: 18 },
  centerRow: {
    ...StyleSheet.absoluteFill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 36,
  },
  skipBtn: { padding: 8, minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
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
  fill: { position: 'absolute', left: 0, height: 4, borderRadius: 2, backgroundColor: ACCENT },
  panel: {
    width: '80%',
    maxWidth: 360,
    backgroundColor: 'rgba(17,17,24,0.92)',
    borderRadius: 16,
    padding: 20,
    gap: 12,
    alignItems: 'stretch',
  },
  panelTitle: { color: '#fff', fontSize: 18, fontWeight: '700', textAlign: 'center' },
  panelBody: { color: '#D1D5DB', fontSize: 14, lineHeight: 20, textAlign: 'center' },
  panelBtn: {
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: '#1F1F29',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  panelBtnPrimary: { backgroundColor: ACCENT },
  panelBtnText: { color: '#fff', fontWeight: '700' },
});
