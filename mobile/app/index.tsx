import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { GENRES, type Genre, type SeriesCard } from '@gulel/shared';
import { api } from '@/lib/api';

export default function CatalogScreen() {
  const router = useRouter();
  const [genre, setGenre] = useState<Genre>('All');
  const [series, setSeries] = useState<SeriesCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (selected: Genre) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getSeries(selected === 'All' ? undefined : { genre: selected });
      setSeries(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load catalog');
      setSeries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(genre);
  }, [genre, load]);

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        {GENRES.map((g) => (
          <Pressable
            key={g}
            onPress={() => setGenre(g)}
            style={[styles.chip, g === genre && styles.chipActive]}
          >
            <Text style={[styles.chipText, g === genre && styles.chipTextActive]}>{g}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {loading ? (
        <ActivityIndicator color="#E11D48" style={styles.center} />
      ) : (
        <FlatList
          data={series}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>
              {error ? `Couldn't load series.\n${error}` : 'No series yet.'}
            </Text>
          }
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() => router.push(`/series/${item.id}`)}
            >
              <Image source={{ uri: item.thumbnail }} style={styles.thumb} />
              <Text numberOfLines={1} style={styles.cardTitle}>
                {item.title}
              </Text>
              <Text style={styles.cardMeta}>
                {item.genre} · {item.totalEpisodes} eps
              </Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0B0F' },
  center: { marginTop: 48 },
  chips: { paddingHorizontal: 12, paddingVertical: 12, gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#1A1A22',
  },
  chipActive: { backgroundColor: '#E11D48' },
  chipText: { color: '#9CA3AF', fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  list: { padding: 8 },
  row: { gap: 12, paddingHorizontal: 4 },
  card: { flex: 1, marginBottom: 16 },
  thumb: { width: '100%', aspectRatio: 2 / 3, borderRadius: 12, backgroundColor: '#1A1A22' },
  cardTitle: { color: '#fff', fontWeight: '600', marginTop: 6 },
  cardMeta: { color: '#9CA3AF', fontSize: 12, marginTop: 2 },
  empty: { color: '#9CA3AF', textAlign: 'center', marginTop: 48, paddingHorizontal: 24 },
});
