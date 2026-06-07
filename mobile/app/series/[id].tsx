import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ApiRequestError, type Episode } from '@gulel/shared';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { sampleEpisodes } from '@/lib/sampleData';

export default function SeriesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user, refresh } = useAuth();
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [unlockingId, setUnlockingId] = useState<string | null>(null);

  function play(ep: Episode) {
    router.push({
      pathname: '/watch/[episodeId]',
      params: { episodeId: ep.id, url: ep.videoUrl },
    });
  }

  async function open(ep: Episode) {
    // Free episodes and active VIPs play immediately.
    if (ep.isFree || user?.isVip) return play(ep);
    if (!user) return router.push('/auth');

    Alert.alert('Unlock episode', `Spend coins to unlock “${ep.title}”?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Unlock',
        onPress: async () => {
          setUnlockingId(ep.id);
          try {
            await api.unlockEpisode(ep.id);
            await refresh();
            play(ep);
          } catch (e) {
            if (e instanceof ApiRequestError) {
              // Already purchased previously — just play it.
              if (/already unlocked/i.test(e.message)) return play(ep);
              // Not enough coins — send them to the paywall.
              if (e.status === 400 || /insufficient/i.test(e.message)) {
                return router.push('/coins');
              }
            }
            Alert.alert('Could not unlock', e instanceof Error ? e.message : 'Try again.');
          } finally {
            setUnlockingId(null);
          }
        },
      },
    ]);
  }

  useEffect(() => {
    if (!id) return;
    let active = true;
    (async () => {
      try {
        const data = await api.getEpisodes(id);
        if (active) setEpisodes(data);
      } catch {
        // Fall back to demo episodes when the live API isn't reachable.
        if (active) setEpisodes(sampleEpisodes(id));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) return <ActivityIndicator color="#E11D48" style={styles.center} />;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Episodes' }} />
      <FlatList
        data={episodes}
        keyExtractor={(e) => e.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>No episodes available.</Text>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.row}
            disabled={unlockingId !== null}
            onPress={() => void open(item)}
          >
            <View style={styles.iconWrap}>
              {unlockingId === item.id ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.icon}>
                  {item.isFree || user?.isVip ? '▶' : '🔒'}
                </Text>
              )}
            </View>
            <View style={styles.meta}>
              <Text style={styles.title}>
                E{item.episodeNumber} · {item.title}
              </Text>
              <Text style={styles.sub}>
                {Math.round(item.duration / 60)} min
                {item.isFree || user?.isVip ? '' : ' · locked'}
              </Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0B0F' },
  center: { flex: 1, backgroundColor: '#0B0B0F' },
  list: { padding: 16 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
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
});
