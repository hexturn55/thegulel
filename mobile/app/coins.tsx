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
import { useRouter } from 'expo-router';
import type { CoinPackage } from '@gulel/shared';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { getCoinOfferings, purchaseOffering, type CoinOffering } from '@/lib/purchases';
import { showRewardedAd } from '@/lib/ads';

export default function CoinsScreen() {
  const router = useRouter();
  const { user, refresh } = useAuth();
  const [offerings, setOfferings] = useState<CoinOffering[]>([]);
  const [packages, setPackages] = useState<CoinPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [watchingAd, setWatchingAd] = useState(false);

  useEffect(() => {
    (async () => {
      const [offs, pkgs] = await Promise.all([
        getCoinOfferings(),
        api.getCoinPackages().catch(() => [] as CoinPackage[]),
      ]);
      setOfferings(offs);
      setPackages(pkgs);
      setLoading(false);
    })();
  }, []);

  async function watchAd() {
    if (!user || watchingAd) return;
    setWatchingAd(true);
    try {
      const result = await showRewardedAd(user.id);
      if (result === 'earned') {
        // Coins are credited by Google's server-side callback (/api/ads/ssv),
        // which lands a beat after the ad closes — refresh the balance shortly.
        setTimeout(() => void refresh(), 2500);
        Alert.alert('Thanks for watching!', 'Your coins will appear in a moment.');
      } else if (result === 'unavailable') {
        Alert.alert('No ad available', 'No video is ready right now. Please try again shortly.');
      }
      // 'dismissed' (closed early) earns nothing — no alert needed.
    } catch {
      Alert.alert('Something went wrong', 'Please try again.');
    } finally {
      setWatchingAd(false);
    }
  }

  async function buy(offering: CoinOffering) {
    setBuyingId(offering.id);
    try {
      const ok = await purchaseOffering(offering);
      if (ok) {
        // The RevenueCat webhook credits coins server-side; give it a moment
        // then refresh the balance.
        setTimeout(() => void refresh(), 1500);
        Alert.alert('Purchase complete', 'Your coins will appear shortly.');
      }
    } catch (e) {
      Alert.alert('Purchase failed', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setBuyingId(null);
    }
  }

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.note}>Sign in to buy coins.</Text>
        <Pressable style={styles.button} onPress={() => router.push('/auth')}>
          <Text style={styles.buttonText}>Sign in</Text>
        </Pressable>
      </View>
    );
  }

  if (loading) return <ActivityIndicator color="#E11D48" style={styles.center} />;

  // Prefer live store offerings (real localized prices); fall back to the
  // catalog from the API for display when offerings aren't available (e.g. web).
  const hasStore = offerings.length > 0;

  return (
    <View style={styles.container}>
      <Text style={styles.balance}>Balance: {user.coinBalance} 🪙</Text>

      <Pressable
        style={[styles.watchAd, watchingAd && styles.watchAdBusy]}
        onPress={watchAd}
        disabled={watchingAd}
      >
        {watchingAd ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <View style={styles.watchAdMeta}>
              <Text style={styles.watchAdTitle}>▶  Watch a video</Text>
              <Text style={styles.watchAdSub}>Free coins, no purchase</Text>
            </View>
            <Text style={styles.watchAdReward}>+5 🪙</Text>
          </>
        )}
      </Pressable>

      {hasStore ? (
        <FlatList
          data={offerings}
          keyExtractor={(o) => o.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable
              style={styles.pack}
              disabled={buyingId !== null}
              onPress={() => buy(item)}
            >
              <View style={styles.packMeta}>
                <Text style={styles.packTitle}>{item.title}</Text>
                <Text style={styles.packSub}>{item.description}</Text>
              </View>
              {buyingId === item.id ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.price}>{item.priceString}</Text>
              )}
            </Pressable>
          )}
        />
      ) : (
        <FlatList
          data={packages}
          keyExtractor={(p) => p.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.note}>No coin packs available.</Text>}
          ListHeaderComponent={
            <Text style={styles.note}>
              In-app purchases run on a real device. These are the available packs:
            </Text>
          }
          renderItem={({ item }) => (
            <View style={styles.pack}>
              <View style={styles.packMeta}>
                <Text style={styles.packTitle}>
                  {item.coins} coins{item.popular ? '  ⭐' : ''}
                </Text>
                <Text style={styles.packSub}>{item.name}</Text>
              </View>
              <Text style={styles.price}>${item.priceUSD.toFixed(2)}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0B0F' },
  center: { flex: 1, backgroundColor: '#0B0B0F', alignItems: 'center', justifyContent: 'center', gap: 16 },
  balance: { color: '#fff', fontSize: 18, fontWeight: '700', padding: 16 },
  watchAd: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#12241C',
    borderColor: '#1F5C3E',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    minHeight: 64,
  },
  watchAdBusy: { opacity: 0.7 },
  watchAdMeta: { flex: 1, paddingRight: 12 },
  watchAdTitle: { color: '#fff', fontSize: 16, fontWeight: '600' },
  watchAdSub: { color: '#7FD1A8', fontSize: 12, marginTop: 2 },
  watchAdReward: { color: '#34D399', fontSize: 16, fontWeight: '700' },
  list: { paddingHorizontal: 16, gap: 12 },
  pack: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1A1A22',
    borderRadius: 12,
    padding: 16,
  },
  packMeta: { flex: 1, paddingRight: 12 },
  packTitle: { color: '#fff', fontSize: 16, fontWeight: '600' },
  packSub: { color: '#9CA3AF', fontSize: 12, marginTop: 2 },
  price: { color: '#E11D48', fontSize: 16, fontWeight: '700' },
  note: { color: '#9CA3AF', textAlign: 'center', marginBottom: 12 },
  button: { backgroundColor: '#E11D48', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  buttonText: { color: '#fff', fontWeight: '700' },
});
