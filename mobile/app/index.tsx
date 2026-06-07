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
import { Stack, useRouter } from 'expo-router';
import { GENRES, type Genre, type SeriesCard } from '@gulel/shared';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { mediaUrl } from '@/lib/media';
import { SAMPLE_SERIES } from '@/lib/sampleData';

function HeaderButton() {
  const router = useRouter();
  const { user } = useAuth();
  return (
    <Pressable
      onPress={() => router.push(user ? '/account' : '/auth')}
      style={headerStyles.btn}
    >
      <Text style={headerStyles.text}>
        {user ? `${user.coinBalance} 🪙` : 'Sign in'}
      </Text>
    </Pressable>
  );
}

export default function CatalogScreen() {
  const router = useRouter();
  const [genre, setGenre] = useState<Genre>('All');
  const [series, setSeries] = useState<SeriesCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [demo, setDemo] = useState(false);

  const load = useCallback(async (selected: Genre) => {
    setLoading(true);
    try {
      const data = await api.getSeries(selected === 'All' ? undefined : { genre: selected });
      setSeries(data);
      setDemo(false);
    } catch {
      // No live API reachable — show the bundled demo catalog so the app is
      // never empty. Real API data always wins when it's available.
      const sample =
        selected === 'All'
          ? SAMPLE_SERIES
          : SAMPLE_SERIES.filter((s) => s.genre === selected);
      setSeries(sample);
      setDemo(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(genre);
  }, [genre, load]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerRight: () => <HeaderButton /> }} />
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
          ListHeaderComponent={
            demo ? (
              <Text style={styles.demoBanner}>
                Demo content — connect your API (EXPO_PUBLIC_API_URL) to see real series.
              </Text>
            ) : null
          }
          ListEmptyComponent={<Text style={styles.empty}>No series in this genre.</Text>}
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() => router.push(`/series/${item.id}`)}
            >
              <Image source={{ uri: mediaUrl(item.thumbnail) }} style={styles.thumb} />
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
  demoBanner: {
    color: '#FCD34D',
    backgroundColor: '#1A1A22',
    borderRadius: 8,
    padding: 10,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 12,
  },
});

const headerStyles = StyleSheet.create({
  btn: {
    backgroundColor: '#1A1A22',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginRight: 8,
  },
  text: { color: '#fff', fontWeight: '600' },
});
