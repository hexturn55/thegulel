import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Stack, useRouter } from 'expo-router';
import { GENRES, type Genre, type SeriesCard } from '@gulel/shared';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { mediaUrl } from '@/lib/media';

const ACCENT = '#E11D48';

function HeaderButton() {
  const router = useRouter();
  const { user } = useAuth();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={user ? `Account, ${user.coinBalance} coins` : 'Sign in'}
      onPress={() => router.push(user ? '/account' : '/auth')}
      style={headerStyles.btn}
    >
      <Text style={headerStyles.text}>
        {user ? `${user.coinBalance} 🪙` : 'Sign in'}
      </Text>
    </Pressable>
  );
}

/**
 * Development-only fallback catalog. Loaded lazily so release bundles never
 * depend on (or show) the demo data.
 */
function devSampleSeries(selected: Genre): SeriesCard[] | null {
  if (__DEV__) {
    const { SAMPLE_SERIES } = require('@/lib/sampleData') as typeof import('@/lib/sampleData');
    return selected === 'All' ? SAMPLE_SERIES : SAMPLE_SERIES.filter((s) => s.genre === selected);
  }
  return null;
}

export default function CatalogScreen() {
  const router = useRouter();
  const [genre, setGenre] = useState<Genre>('All');
  const [series, setSeries] = useState<SeriesCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  /** Nothing to show for this genre because the request failed. */
  const [error, setError] = useState(false);
  /** A refresh failed but the last good list for this genre is still shown. */
  const [stale, setStale] = useState(false);

  // Only the latest load(genre) response may update state: a slow response for
  // a previous genre must never overwrite the current one.
  const reqId = useRef(0);
  // Last successful result per genre, kept so a failed refresh doesn't blank
  // the screen.
  const lastGood = useRef<Partial<Record<Genre, SeriesCard[]>>>({});

  const load = useCallback(async (selected: Genre, mode: 'load' | 'refresh' = 'load') => {
    const id = ++reqId.current;
    const cached = lastGood.current[selected];
    setError(false);
    setStale(false);
    if (mode === 'refresh') {
      setRefreshing(true);
    } else if (cached) {
      // Show the last good list instantly and revalidate in the background.
      setSeries(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }

    try {
      const data = await api.getSeries(selected === 'All' ? undefined : { genre: selected });
      if (id !== reqId.current) return;
      lastGood.current[selected] = data;
      setSeries(data);
    } catch {
      if (id !== reqId.current) return;
      if (cached) {
        setSeries(cached);
        setStale(true);
      } else {
        const sample = devSampleSeries(selected);
        if (sample) {
          setSeries(sample);
        } else {
          setSeries([]);
          setError(true);
        }
      }
    } finally {
      if (id === reqId.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    void load(genre);
  }, [genre, load]);

  const onRefresh = useCallback(() => {
    void load(genre, 'refresh');
  }, [genre, load]);

  let body: ReactNode;
  if (loading) {
    body = <ActivityIndicator color={ACCENT} style={styles.center} />;
  } else if (error) {
    body = (
      <View style={styles.errorBox}>
        <Text style={styles.errorText}>
          {"Couldn't load shows. Check your connection and try again."}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Retry"
          style={styles.retryBtn}
          onPress={() => void load(genre)}
        >
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      </View>
    );
  } else {
    body = (
      <FlatList
        data={series}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListHeaderComponent={
          stale ? (
            <Text style={styles.staleNote}>{"Couldn't refresh. Pull down to try again."}</Text>
          ) : null
        }
        ListEmptyComponent={<Text style={styles.empty}>No series in this genre yet.</Text>}
        renderItem={({ item }) => {
          const uri = mediaUrl(item.thumbnail);
          return (
            <Pressable
              style={styles.card}
              accessibilityRole="button"
              accessibilityLabel={item.title}
              onPress={() => router.push(`/series/${item.id}`)}
            >
              <Image
                source={uri ? { uri } : undefined}
                style={styles.thumb}
                cachePolicy="memory-disk"
                contentFit="cover"
                transition={150}
                accessible={false}
              />
              <Text numberOfLines={1} style={styles.cardTitle}>
                {item.title}
              </Text>
              <Text style={styles.cardMeta}>
                {item.genre} · {item.totalEpisodes} eps
              </Text>
            </Pressable>
          );
        }}
      />
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerRight: () => <HeaderButton /> }} />
      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          {GENRES.map((g) => (
            <Pressable
              key={g}
              accessibilityRole="button"
              accessibilityState={{ selected: g === genre }}
              onPress={() => setGenre(g)}
              style={[styles.chip, g === genre && styles.chipActive]}
            >
              <Text style={[styles.chipText, g === genre && styles.chipTextActive]}>{g}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
      {body}
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
  chipActive: { backgroundColor: ACCENT },
  chipText: { color: '#9CA3AF', fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  list: { padding: 8, flexGrow: 1 },
  row: { gap: 12, paddingHorizontal: 4 },
  card: { flex: 1, marginBottom: 16 },
  thumb: { width: '100%', aspectRatio: 2 / 3, borderRadius: 12, backgroundColor: '#1A1A22' },
  cardTitle: { color: '#fff', fontWeight: '600', marginTop: 6 },
  cardMeta: { color: '#9CA3AF', fontSize: 12, marginTop: 2 },
  empty: { color: '#9CA3AF', textAlign: 'center', marginTop: 48, paddingHorizontal: 24 },
  staleNote: {
    color: '#9CA3AF',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 12,
  },
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
