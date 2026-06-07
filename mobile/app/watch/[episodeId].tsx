import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { api } from '@/lib/api';

/**
 * Vertical full-screen player. Plays the episode HLS stream from Cloudflare
 * Stream and persists watch progress periodically so the user can resume.
 *
 * The episode's playback URL is passed via route params from the series screen
 * (kept simple here); a production build would also re-validate entitlement
 * server-side before issuing a signed playback URL.
 */
export default function WatchScreen() {
  const { episodeId, url } = useLocalSearchParams<{ episodeId: string; url?: string }>();
  const router = useRouter();
  const lastSaved = useRef(0);

  const player = useVideoPlayer(url ?? '', (p) => {
    p.loop = false;
    if (url) p.play();
  });

  useEffect(() => {
    if (!episodeId) return;
    const sub = player.addListener('timeUpdate', ({ currentTime }) => {
      // Throttle progress saves to roughly once every 5s.
      if (currentTime - lastSaved.current >= 5) {
        lastSaved.current = currentTime;
        void api
          .saveProgress({ episodeId, progress: Math.floor(currentTime), completed: false })
          .catch(() => {});
      }
    });
    return () => sub.remove();
  }, [episodeId, player]);

  return (
    <View style={styles.container}>
      {url ? (
        <VideoView
          style={styles.video}
          player={player}
          contentFit="contain"
          fullscreenOptions={{ enable: true }}
          nativeControls
        />
      ) : (
        <Text style={styles.note}>No playback URL provided for this episode.</Text>
      )}
      <Pressable style={styles.close} onPress={() => router.back()}>
        <Text style={styles.closeText}>✕</Text>
      </Pressable>
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { color: '#fff', fontSize: 18 },
});
