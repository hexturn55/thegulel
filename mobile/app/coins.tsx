import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import type { AdStatus, CoinPackage } from '@gulel/shared';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import {
  getStoreOfferings,
  purchaseOffering,
  restorePurchases,
  type CoinOffering,
  type StoreOfferings,
} from '@/lib/purchases';
import {
  gatherAdsConsent,
  isPrivacyOptionsRequired,
  isRewardedAdSupported,
  showPrivacyOptions,
  showRewardedAd,
} from '@/lib/ads';

const IS_NATIVE = Platform.OS !== 'web';
const POLL_INTERVAL_MS = 1500;
const POLL_MAX_ATTEMPTS = 8;

type Notice = { text: string; tone: 'info' | 'success' | 'warn' } | null;

export default function CoinsScreen() {
  const router = useRouter();
  const { user, refresh } = useAuth();
  const userId = user?.id;

  // Latest values for use inside timers/async flows without stale closures.
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;
  const balanceRef = useRef<number | undefined>(user?.coinBalance);
  balanceRef.current = user?.coinBalance;
  const mountedRef = useRef(true);

  const [store, setStore] = useState<StoreOfferings | null>(null);
  const [storeLoading, setStoreLoading] = useState(false);
  const [packages, setPackages] = useState<CoinPackage[]>([]);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [pullRefreshing, setPullRefreshing] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  const adsSupported = IS_NATIVE && isRewardedAdSupported();
  const [watchingAd, setWatchingAd] = useState(false);
  const [adStatus, setAdStatus] = useState<AdStatus | null>(null);
  const [adReadyAt, setAdReadyAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [privacyRequired, setPrivacyRequired] = useState(false);

  // ---- timers (all tracked in refs, cleared on unmount) --------------------
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollRef = useRef<{ before: number; onSettled: (changed: boolean) => void } | null>(
    null,
  );
  const tickTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current !== null) clearTimeout(pollTimerRef.current);
    pollTimerRef.current = null;
    pollRef.current = null;
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (pollTimerRef.current !== null) clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
      pollRef.current = null;
      if (tickTimerRef.current !== null) clearInterval(tickTimerRef.current);
      tickTimerRef.current = null;
    };
  }, []);

  /**
   * Coins are credited server-side (RevenueCat webhook / AdMob SSV) a moment
   * after the client-side flow ends. Re-fetch the user every 1.5s, up to 8
   * times, until the balance differs from `before`.
   */
  const pollForBalanceChange = useCallback(
    (before: number, onSettled: (changed: boolean) => void) => {
      stopPolling();
      pollRef.current = { before, onSettled };
      let attempts = 0;
      const tick = async () => {
        pollTimerRef.current = null;
        if (!mountedRef.current || !pollRef.current) return;
        if (attempts >= POLL_MAX_ATTEMPTS) {
          const settle = pollRef.current.onSettled;
          stopPolling();
          settle(false);
          return;
        }
        attempts += 1;
        try {
          await refreshRef.current();
        } catch {
          // transient; try again next tick
        }
        if (!mountedRef.current || !pollRef.current) return;
        pollTimerRef.current = setTimeout(tick, POLL_INTERVAL_MS);
      };
      pollTimerRef.current = setTimeout(tick, POLL_INTERVAL_MS);
    },
    [stopPolling],
  );

  // Settle an in-flight poll as soon as the refreshed balance lands.
  useEffect(() => {
    const pending = pollRef.current;
    if (!pending || user?.coinBalance === undefined) return;
    if (user.coinBalance !== pending.before) {
      stopPolling();
      pending.onSettled(true);
    }
  }, [user?.coinBalance, stopPolling]);

  // ---- data loading ---------------------------------------------------------

  // Refresh the balance whenever the screen gains focus.
  useFocusEffect(
    useCallback(() => {
      void refreshRef.current();
    }, []),
  );

  // UMP consent + privacy-options state (native, and only when ads are offered).
  useEffect(() => {
    if (!adsSupported) return;
    let alive = true;
    (async () => {
      await gatherAdsConsent();
      const required = await isPrivacyOptionsRequired();
      if (alive) setPrivacyRequired(required);
    })();
    return () => {
      alive = false;
    };
  }, [adsSupported]);

  const loadStore = useCallback(async (id: string) => {
    setStoreLoading(true);
    const result = await getStoreOfferings(id);
    if (!mountedRef.current) return;
    setStore(result);
    setStoreLoading(false);
  }, []);

  const loadAdStatus = useCallback(async (): Promise<AdStatus | null> => {
    try {
      const status = await api.getAdStatus();
      if (!mountedRef.current) return status;
      setAdStatus(status);
      setAdReadyAt(
        !status.canWatch && status.retryInSeconds > 0
          ? Date.now() + status.retryInSeconds * 1000
          : null,
      );
      setNow(Date.now());
      return status;
    } catch {
      return null; // unknown: don't block the button; the server still enforces caps
    }
  }, []);

  useEffect(() => {
    if (!userId) return;
    if (IS_NATIVE) {
      void loadStore(userId);
    } else {
      // Web preview: show the API catalog (native IAP doesn't exist on web).
      api
        .getCoinPackages()
        .then((pkgs) => mountedRef.current && setPackages(pkgs))
        .catch(() => undefined);
    }
    if (adsSupported) void loadAdStatus();
  }, [userId, adsSupported, loadStore, loadAdStatus]);

  // Tick once a second while a rewarded-ad cooldown is running.
  useEffect(() => {
    if (adReadyAt === null) return;
    tickTimerRef.current = setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (t >= adReadyAt) {
        if (tickTimerRef.current !== null) clearInterval(tickTimerRef.current);
        tickTimerRef.current = null;
        setAdReadyAt(null);
        setAdStatus((s) => (s ? { ...s, canWatch: s.remainingToday > 0, retryInSeconds: 0 } : s));
        // The countdown may have been the daily-cap reset (remainingToday is
        // still 0 locally): ask the server for the fresh allowance.
        void loadAdStatus();
      }
    }, 1000);
    return () => {
      if (tickTimerRef.current !== null) clearInterval(tickTimerRef.current);
      tickTimerRef.current = null;
    };
  }, [adReadyAt, loadAdStatus]);

  const onPullRefresh = useCallback(async () => {
    setPullRefreshing(true);
    try {
      await refreshRef.current();
      if (userId && IS_NATIVE && store?.status !== 'ok') await loadStore(userId);
      if (adsSupported) await loadAdStatus();
    } finally {
      if (mountedRef.current) setPullRefreshing(false);
    }
  }, [userId, store?.status, adsSupported, loadStore, loadAdStatus]);

  // ---- actions ---------------------------------------------------------------

  async function watchAd() {
    if (!user || watchingAd) return;
    setWatchingAd(true);
    try {
      const status = await loadAdStatus();
      if (status && !status.canWatch) return; // the card now shows why

      const before = balanceRef.current ?? user.coinBalance;
      const result = await showRewardedAd(user.id);
      if (!mountedRef.current) return;
      if (result === 'earned') {
        // Coins are credited by Google's server-side callback (/api/ads/ssv),
        // which lands a beat after the ad closes.
        setNotice({ text: 'Thanks for watching! Adding your coins…', tone: 'info' });
        pollForBalanceChange(before, (changed) => {
          setNotice(
            changed
              ? { text: 'Coins added to your balance.', tone: 'success' }
              : { text: 'Still processing — pull to refresh', tone: 'warn' },
          );
          void loadAdStatus();
        });
      } else if (result === 'unavailable') {
        Alert.alert('No ad available', 'No video is ready right now. Please try again shortly.');
      } else {
        void loadAdStatus();
      }
      // 'dismissed' (closed early) earns nothing — no alert needed.
    } catch {
      Alert.alert('Something went wrong', 'Please try again.');
    } finally {
      if (mountedRef.current) setWatchingAd(false);
    }
  }

  async function buy(offering: CoinOffering) {
    if (!user || buyingId) return;
    setBuyingId(offering.id);
    const before = balanceRef.current ?? user.coinBalance;
    try {
      const { completed } = await purchaseOffering(offering);
      if (completed && mountedRef.current) {
        // The RevenueCat webhook credits coins server-side; poll for it.
        setNotice({ text: 'Purchase complete — updating your balance…', tone: 'info' });
        pollForBalanceChange(before, (changed) => {
          setNotice(
            changed
              ? { text: 'Coins added to your balance.', tone: 'success' }
              : { text: 'Still processing — pull to refresh', tone: 'warn' },
          );
        });
      }
    } catch (e) {
      Alert.alert('Purchase failed', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      if (mountedRef.current) setBuyingId(null);
    }
  }

  async function restore() {
    if (restoring) return;
    setRestoring(true);
    try {
      const vip = await restorePurchases();
      await refreshRef.current();
      Alert.alert(
        'Purchases restored',
        vip
          ? 'Your VIP subscription is active.'
          : 'No active subscriptions were found. Coin purchases are added to your account automatically.',
      );
    } catch {
      Alert.alert('Restore failed', 'Could not restore purchases. Please try again later.');
    } finally {
      if (mountedRef.current) setRestoring(false);
    }
  }

  // ---- render ----------------------------------------------------------------

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.note}>Sign in to buy coins.</Text>
        <Pressable
          style={styles.button}
          onPress={() => router.push('/auth')}
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>Sign in</Text>
        </Pressable>
      </View>
    );
  }

  const secondsLeft = adReadyAt !== null ? Math.max(0, Math.ceil((adReadyAt - now) / 1000)) : 0;
  const dailyLimitReached = adStatus !== null && !adStatus.canWatch && adStatus.remainingToday <= 0;
  const coolingDown = !dailyLimitReached && secondsLeft > 0;
  const adBlocked = dailyLimitReached || coolingDown;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={pullRefreshing}
          onRefresh={onPullRefresh}
          tintColor="#fff"
        />
      }
    >
      <Text style={styles.balance}>Balance: {user.coinBalance} 🪙</Text>

      {notice ? (
        <View
          style={[
            styles.notice,
            notice.tone === 'success' && styles.noticeSuccess,
            notice.tone === 'warn' && styles.noticeWarn,
          ]}
          accessibilityLiveRegion="polite"
        >
          <Text style={styles.noticeText}>{notice.text}</Text>
        </View>
      ) : null}

      {adsSupported ? (
        <Pressable
          style={[styles.watchAd, (watchingAd || adBlocked) && styles.watchAdBusy]}
          onPress={watchAd}
          disabled={watchingAd || adBlocked}
          accessibilityRole="button"
          accessibilityState={{ disabled: watchingAd || adBlocked, busy: watchingAd }}
          accessibilityLabel="Watch a video to earn free coins"
        >
          {watchingAd ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <View style={styles.watchAdMeta}>
                <Text style={styles.watchAdTitle}>▶  Watch a video</Text>
                <Text style={styles.watchAdSub}>
                  {dailyLimitReached
                    ? 'Daily limit reached'
                    : coolingDown
                      ? `Next video available in ${secondsLeft}s`
                      : 'Free coins, no purchase'}
                </Text>
              </View>
              <Text style={styles.watchAdReward}>+5 🪙</Text>
            </>
          )}
        </Pressable>
      ) : null}

      {IS_NATIVE ? renderStore() : renderWebCatalog()}

      {IS_NATIVE ? (
        <View style={styles.links}>
          <Pressable
            style={styles.linkRow}
            onPress={() => router.push('/vip')}
            accessibilityRole="button"
          >
            <Text style={styles.linkTitle}>⭐  Become VIP</Text>
            <Text style={styles.linkChevron}>›</Text>
          </Pressable>
          <Pressable
            style={styles.linkRow}
            onPress={restore}
            disabled={restoring}
            accessibilityRole="button"
            accessibilityState={{ disabled: restoring, busy: restoring }}
          >
            <Text style={styles.linkTitle}>Restore purchases</Text>
            {restoring ? <ActivityIndicator color="#fff" /> : null}
          </Pressable>
          {adsSupported && privacyRequired ? (
            <Pressable
              style={styles.linkRow}
              onPress={() => void showPrivacyOptions()}
              accessibilityRole="button"
            >
              <Text style={styles.linkTitle}>Ad privacy settings</Text>
              <Text style={styles.linkChevron}>›</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </ScrollView>
  );

  function renderStore() {
    if (storeLoading || store === null) {
      return <ActivityIndicator color="#E11D48" style={styles.spinner} />;
    }
    if (store.status !== 'ok' || store.coins.length === 0) {
      return (
        <View style={styles.unavailable}>
          <Text style={styles.note}>
            Purchases are temporarily unavailable. Please try again later.
          </Text>
          <Pressable
            style={[styles.button, styles.secondary]}
            onPress={() => userId && void loadStore(userId)}
            accessibilityRole="button"
          >
            <Text style={styles.buttonText}>Retry</Text>
          </Pressable>
        </View>
      );
    }
    return (
      <View style={styles.list}>
        {store.coins.map((item) => (
          <Pressable
            key={item.id}
            style={styles.pack}
            disabled={buyingId !== null}
            onPress={() => buy(item)}
            accessibilityRole="button"
            accessibilityLabel={`${item.title}, ${item.priceString}`}
            accessibilityState={{ disabled: buyingId !== null, busy: buyingId === item.id }}
          >
            <View style={styles.packMeta}>
              <Text style={styles.packTitle}>{item.title}</Text>
              {item.description ? <Text style={styles.packSub}>{item.description}</Text> : null}
            </View>
            {buyingId === item.id ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.price}>{item.priceString}</Text>
            )}
          </Pressable>
        ))}
      </View>
    );
  }

  function renderWebCatalog() {
    return (
      <View style={styles.list}>
        <Text style={styles.note}>
          In-app purchases run on a real device. These are the available packs:
        </Text>
        {packages.length === 0 ? (
          <Text style={styles.note}>No coin packs available.</Text>
        ) : (
          packages.map((item) => (
            <View key={item.id} style={styles.pack}>
              <View style={styles.packMeta}>
                <Text style={styles.packTitle}>
                  {item.coins} coins{item.popular ? '  ⭐' : ''}
                </Text>
                <Text style={styles.packSub}>{item.name}</Text>
              </View>
              <Text style={styles.price}>${item.priceUSD.toFixed(2)}</Text>
            </View>
          ))
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0B0F' },
  content: { paddingBottom: 32 },
  center: {
    flex: 1,
    backgroundColor: '#0B0B0F',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  spinner: { marginTop: 24 },
  balance: { color: '#fff', fontSize: 18, fontWeight: '700', padding: 16 },
  notice: {
    backgroundColor: '#1E293B',
    borderRadius: 10,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  noticeSuccess: { backgroundColor: '#12241C' },
  noticeWarn: { backgroundColor: '#3A2A12' },
  noticeText: { color: '#fff', fontSize: 14 },
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
  watchAdBusy: { opacity: 0.6 },
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
    minHeight: 64,
  },
  packMeta: { flex: 1, paddingRight: 12 },
  packTitle: { color: '#fff', fontSize: 16, fontWeight: '600' },
  packSub: { color: '#9CA3AF', fontSize: 12, marginTop: 2 },
  price: { color: '#E11D48', fontSize: 16, fontWeight: '700' },
  unavailable: { alignItems: 'center', paddingHorizontal: 24, paddingVertical: 24, gap: 12 },
  note: { color: '#9CA3AF', textAlign: 'center', marginBottom: 12 },
  links: { marginTop: 24, marginHorizontal: 16, gap: 8 },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1A1A22',
    borderRadius: 12,
    paddingHorizontal: 16,
    minHeight: 52,
  },
  linkTitle: { color: '#fff', fontSize: 15, fontWeight: '600' },
  linkChevron: { color: '#9CA3AF', fontSize: 22 },
  button: {
    backgroundColor: '#E11D48',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  secondary: { backgroundColor: '#374151' },
  buttonText: { color: '#fff', fontWeight: '700' },
});
