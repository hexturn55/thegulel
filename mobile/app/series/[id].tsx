import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { ApiRequestError, type Episode } from '@gulel/shared';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

const ACCENT = '#E11D48';

const isDemoId = (id: string) => id.startsWith('demo-');

/** Development-only demo episodes for `demo-` ids; null in release builds. */
function devSampleEpisodes(seriesId: string): Episode[] | null {
  if (__DEV__ && isDemoId(seriesId)) {
    const { sampleEpisodes } = require('@/lib/sampleData') as typeof import('@/lib/sampleData');
    return sampleEpisodes(seriesId);
  }
  return null;
}

/** Alert.alert is a no-op on react-native-web, so fall back to the DOM dialogs. */
function notify(title: string, message: string) {
  if (Platform.OS === 'web') {
    globalThis.alert?.(`${title}\n\n${message}`);
    return;
  }
  Alert.alert(title, message);
}

function confirm(
  title: string,
  message: string,
  confirmText: string,
  onConfirm: () => void,
  onCancel: () => void,
) {
  if (Platform.OS === 'web') {
    const ok = globalThis.confirm?.(`${title}\n\n${message}`) ?? false;
    if (ok) onConfirm();
    else onCancel();
    return;
  }
  Alert.alert(
    title,
    message,
    [
      { text: 'Cancel', style: 'cancel', onPress: onCancel },
      { text: confirmText, onPress: onConfirm },
    ],
    { cancelable: true, onDismiss: onCancel },
  );
}

function loadErrorMessage(e: unknown): string {
  if (e instanceof ApiRequestError) {
    if (e.status === 0) return 'No connection. Check your internet and try again.';
    if (e.status === 404) return "This series isn't available.";
  }
  return "Couldn't load episodes. Please try again.";
}

export default function SeriesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user, refresh } = useAuth();
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unlockingId, setUnlockingId] = useState<string | null>(null);

  // Guards against a second unlock dialog/request while one is in flight.
  const pendingRef = useRef(false);
  // Only the latest load may update state.
  const reqId = useRef(0);
  // Whether a good episode list has been shown, so a failed background reload
  // keeps it instead of replacing it with an error.
  const hasData = useRef(false);

  const load = useCallback(
    async (mode: 'load' | 'refresh' | 'silent' = 'load') => {
      if (!id) return;
      const rid = ++reqId.current;

      const sample = devSampleEpisodes(id);
      if (sample) {
        setEpisodes(sample);
        setError(null);
        setLoading(false);
        setRefreshing(false);
        hasData.current = true;
        return;
      }

      if (mode === 'refresh') setRefreshing(true);
      else if (mode === 'load') setLoading(true);
      if (mode !== 'silent') setError(null);

      try {
        const data = await api.getEpisodes(id);
        if (rid !== reqId.current) return;
        hasData.current = true;
        setEpisodes(data);
        setError(null);
      } catch (e) {
        if (rid !== reqId.current) return;
        if (!hasData.current) setError(loadErrorMessage(e));
      } finally {
        if (rid === reqId.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [id],
  );

  // Load on first focus, and reload whenever the screen regains focus (e.g.
  // back from the player, coins or sign-in) so isUnlocked stays fresh.
  useFocusEffect(
    useCallback(() => {
      void load(hasData.current ? 'silent' : 'load');
    }, [load]),
  );

  const canPlay = useCallback(
    (ep: Episode) => Boolean(ep.isFree || ep.isUnlocked || user?.isVip),
    [user?.isVip],
  );

  function play(ep: Episode) {
    // The watch screen requests a signed stream URL (entitlement is enforced
    // server-side); nothing playable is ever passed through the route.
    router.push({ pathname: '/watch/[episodeId]', params: { episodeId: ep.id } });
  }

  function handleUnlockError(e: unknown) {
    if (e instanceof ApiRequestError) {
      if (e.status === 401) return router.push('/auth');
      if (e.code === 'INSUFFICIENT_COINS' || /insufficient/i.test(e.message)) {
        return router.push('/coins');
      }
      if (e.status === 0) {
        return notify('No connection', 'Check your internet connection and try again.');
      }
      return notify('Could not unlock', e.message);
    }
    notify('Could not unlock', 'Please try again.');
  }

  async function unlock(ep: Episode) {
    setUnlockingId(ep.id);
    try {
      const res = await api.unlockEpisode(ep.id);
      if (!res.success && !res.alreadyUnlocked) {
        notify('Could not unlock', 'Please try again.');
        return;
      }
      setEpisodes((prev) => prev.map((e) => (e.id === ep.id ? { ...e, isUnlocked: true } : e)));
      // Update the coin balance shown elsewhere; playback must not wait on a
      // failed refresh.
      await refresh().catch(() => {});
      play(ep);
    } catch (e) {
      handleUnlockError(e);
    } finally {
      setUnlockingId(null);
      pendingRef.current = false;
    }
  }

  function open(ep: Episode) {
    if (canPlay(ep)) return play(ep);
    if (!user) return router.push('/auth');
    if (pendingRef.current) return;

    // Known price the viewer can't afford: go straight to the coin store.
    if (ep.coinPrice != null && user.coinBalance < ep.coinPrice) {
      return router.push('/coins');
    }

    pendingRef.current = true;
    const message =
      ep.coinPrice != null
        ? `Unlock “${ep.title}” for ${ep.coinPrice} coins? You have ${user.coinBalance}.`
        : `Spend coins to unlock “${ep.title}”? You have ${user.coinBalance}.`;
    confirm(
      'Unlock episode',
      message,
      'Unlock',
      () => void unlock(ep),
      () => {
        pendingRef.current = false;
      },
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Episodes' }} />
        <ActivityIndicator color={ACCENT} style={styles.spinner} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Episodes' }} />
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Retry"
            style={styles.retryBtn}
            onPress={() => void load('load')}
          >
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Episodes' }} />
      <FlatList
        data={episodes}
        keyExtractor={(e) => e.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void load('refresh')}
            tintColor="#fff"
            colors={[ACCENT]}
          />
        }
        ListEmptyComponent={<Text style={styles.empty}>No episodes available yet.</Text>}
        renderItem={({ item }) => {
          const playable = canPlay(item);
          const minutes = Math.max(1, Math.round(item.duration / 60));
          const lockText = item.coinPrice != null ? `${item.coinPrice} coins` : 'Locked';
          return (
            <Pressable
              style={styles.row}
              disabled={unlockingId !== null}
              accessibilityRole="button"
              accessibilityLabel={
                playable
                  ? `Play episode ${item.episodeNumber}, ${item.title}`
                  : `Episode ${item.episodeNumber}, ${item.title}, locked, ${lockText}`
              }
              onPress={() => open(item)}
            >
              <View style={styles.iconWrap}>
                {unlockingId === item.id ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.icon}>{playable ? '▶' : '🔒'}</Text>
                )}
              </View>
              <View style={styles.meta}>
                <Text style={styles.title}>
                  E{item.episodeNumber} · {item.title}
                </Text>
                <Text style={styles.sub}>
                  {minutes} min
                  {playable ? '' : ` · ${lockText}`}
                </Text>
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0B0F' },
  spinner: { marginTop: 48 },
  list: { padding: 16, flexGrow: 1 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12, minHeight: 56 },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1A1A22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { color: '#fff', fontSize: 16 },
  meta: { flex: 1 },
  title: { color: '#fff', fontWeight: '600' },
  sub: { color: '#9CA3AF', fontSize: 12, marginTop: 2 },
  empty: { color: '#9CA3AF', textAlign: 'center', marginTop: 48 },
  errorBox: { alignItems: 'center', marginTop: 64, paddingHorizontal: 32, gap: 16 },
  errorText: { color: '#D1D5DB', textAlign: 'center', fontSize: 15, lineHeight: 21 },
  retryBtn: {
    backgroundColor: ACCENT,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 28,
    minHeight: 44,
    justifyContent: 'center',
  },
  retryText: { color: '#fff', fontWeight: '700' },
});
