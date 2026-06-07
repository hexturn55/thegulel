import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import type { Episode } from '@gulel/shared';
import { api } from '@/lib/api';

export default function SeriesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let active = true;
    (async () => {
      try {
        const data = await api.getEpisodes(id);
        if (active) setEpisodes(data);
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : 'Failed to load episodes');
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
          <Text style={styles.empty}>{error ?? 'No episodes available.'}</Text>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.row}
            onPress={() =>
              router.push({
                pathname: '/watch/[episodeId]',
                params: { episodeId: item.id, url: item.videoUrl },
              })
            }
          >
            <View style={styles.iconWrap}>
              <Text style={styles.icon}>{item.isFree ? '▶' : '🔒'}</Text>
            </View>
            <View style={styles.meta}>
              <Text style={styles.title}>
                E{item.episodeNumber} · {item.title}
              </Text>
              <Text style={styles.sub}>
                {Math.round(item.duration / 60)} min{item.isFree ? '' : ' · locked'}
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
