import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useAuth } from '@/lib/auth';
import { config } from '@/lib/config';
import {
  getStoreOfferings,
  hasActiveVip,
  purchaseOffering,
  restorePurchases,
  type StoreOfferings,
  type VipOffering,
} from '@/lib/purchases';

/**
 * VIP subscription paywall. Carries everything App Review Guideline 3.1.2
 * requires next to the buy buttons: plan title, localized price and billing
 * period, intro terms, auto-renewal disclosure, Terms of Use (EULA) and
 * Privacy Policy links, restore, and how to manage/cancel.
 */

const POLL_INTERVAL_MS = 1500;
const POLL_MAX_ATTEMPTS = 8;

const IS_IOS = Platform.OS === 'ios';
const STORE_ACCOUNT = IS_IOS ? 'Apple ID account' : 'Google Play account';
const STORE_NAME = IS_IOS ? 'App Store' : 'Google Play';
const MANAGE_SUBSCRIPTIONS_URL = IS_IOS
  ? 'https://apps.apple.com/account/subscriptions'
  : 'https://play.google.com/store/account/subscriptions';

const DISCLOSURE =
  `Payment will be charged to your ${STORE_ACCOUNT} at confirmation of purchase. ` +
  'Subscription automatically renews unless it is cancelled at least 24 hours before the ' +
  'end of the current period. Your account will be charged for renewal within 24 hours ' +
  'prior to the end of the current period. You can manage and cancel your subscriptions ' +
  `in your ${STORE_NAME} account settings.`;

type Notice = { text: string; tone: 'info' | 'success' | 'warn' } | null;

export default function VipScreen() {
  const router = useRouter();
  const { user, refresh } = useAuth();
  const userId = user?.id;

  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;
  const mountedRef = useRef(true);

  const [store, setStore] = useState<StoreOfferings | null>(null);
  const [loading, setLoading] = useState(false);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [pullRefreshing, setPullRefreshing] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollPendingRef = useRef(false);
  // Latest VIP state for async callbacks (closures would see a stale `user`).
  const isVipRef = useRef(false);
  isVipRef.current = !!user?.isVip;

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current !== null) clearTimeout(pollTimerRef.current);
    pollTimerRef.current = null;
    pollPendingRef.current = false;
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (pollTimerRef.current !== null) clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
      pollPendingRef.current = false;
    };
  }, []);

  /** Re-fetch the user every 1.5s, up to 8 times, until the server shows VIP. */
  const pollForVip = useCallback(() => {
    stopPolling();
    pollPendingRef.current = true;
    let attempts = 0;
    const tick = async () => {
      pollTimerRef.current = null;
      if (!mountedRef.current || !pollPendingRef.current) return;
      // Already VIP (e.g. before the poll started, so the settle effect below
      // never re-fires): settle instead of timing out.
      if (isVipRef.current) {
        stopPolling();
        setNotice({ text: 'VIP is active. Enjoy!', tone: 'success' });
        return;
      }
      if (attempts >= POLL_MAX_ATTEMPTS) {
        stopPolling();
        setNotice({ text: 'Still processing — pull to refresh', tone: 'warn' });
        return;
      }
      attempts += 1;
      try {
        await refreshRef.current();
      } catch {
        // transient; try again next tick
      }
      if (!mountedRef.current || !pollPendingRef.current) return;
      pollTimerRef.current = setTimeout(tick, POLL_INTERVAL_MS);
    };
    pollTimerRef.current = setTimeout(tick, POLL_INTERVAL_MS);
  }, [stopPolling]);

  // Settle the poll as soon as the refreshed user shows VIP.
  useEffect(() => {
    if (user?.isVip && pollPendingRef.current) {
      stopPolling();
      setNotice({ text: 'VIP is active. Enjoy!', tone: 'success' });
    }
  }, [user?.isVip, stopPolling]);

  const load = useCallback(async (id: string) => {
    setLoading(true);
    const result = await getStoreOfferings(id);
    if (!mountedRef.current) return;
    setStore(result);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (userId) void load(userId);
  }, [userId, load]);

  const onPullRefresh = useCallback(async () => {
    setPullRefreshing(true);
    try {
      await refreshRef.current();
      if (userId) await load(userId);
    } finally {
      if (mountedRef.current) setPullRefreshing(false);
    }
  }, [userId, load]);

  async function buy(plan: VipOffering) {
    if (buyingId) return;
    setBuyingId(plan.id);
    try {
      const { completed, customerInfo } = await purchaseOffering(plan);
      if (!completed || !mountedRef.current) return;
      if (hasActiveVip(customerInfo)) {
        Alert.alert("You're VIP!", 'Thanks for subscribing. All episodes are now unlocked.');
      }
      setNotice({ text: 'Purchase complete — activating VIP…', tone: 'info' });
      pollForVip();
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
        vip ? 'Your VIP subscription is active.' : 'No active VIP subscription was found.',
      );
      if (vip && mountedRef.current && !isVipRef.current) pollForVip();
    } catch {
      Alert.alert('Restore failed', 'Could not restore purchases. Please try again later.');
    } finally {
      if (mountedRef.current) setRestoring(false);
    }
  }

  function openUrl(url: string) {
    WebBrowser.openBrowserAsync(url).catch(() => {
      Linking.openURL(url).catch(() => undefined);
    });
  }

  const header = <Stack.Screen options={{ title: 'VIP' }} />;

  if (!user) {
    return (
      <View style={styles.center}>
        {header}
        <Text style={styles.note}>Sign in to become a VIP member.</Text>
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

  const plans = store?.status === 'ok' ? store.vip : [];
  const unavailable = !loading && store !== null && plans.length === 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={pullRefreshing} onRefresh={onPullRefresh} tintColor="#fff" />
      }
    >
      {header}

      <Text style={styles.heading}>Gulel VIP</Text>
      <Text style={styles.sub}>Watch every episode of every series, no coins needed.</Text>

      {user.isVip ? (
        <View style={[styles.notice, styles.noticeSuccess]}>
          <Text style={styles.noticeText}>You're a VIP member. ⭐</Text>
        </View>
      ) : null}

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

      {loading || store === null ? (
        <ActivityIndicator color="#E11D48" style={styles.spinner} />
      ) : unavailable ? (
        <View style={styles.unavailable}>
          <Text style={styles.note}>VIP is temporarily unavailable. Please try again later.</Text>
          <Pressable
            style={[styles.button, styles.secondary]}
            onPress={() => void load(user.id)}
            accessibilityRole="button"
          >
            <Text style={styles.buttonText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.plans}>
          {plans.map((plan) => (
            <Pressable
              key={plan.id}
              style={styles.plan}
              disabled={buyingId !== null}
              onPress={() => buy(plan)}
              accessibilityRole="button"
              accessibilityLabel={`${plan.title}, ${plan.priceString} per ${plan.periodLabel}`}
              accessibilityState={{ disabled: buyingId !== null, busy: buyingId === plan.id }}
            >
              <View style={styles.planMeta}>
                <Text style={styles.planTitle}>{plan.title}</Text>
                <Text style={styles.planPrice}>
                  {`${plan.priceString} / ${plan.periodLabel}`}
                </Text>
                {plan.introText ? <Text style={styles.planIntro}>{plan.introText}</Text> : null}
              </View>
              {buyingId === plan.id ? <ActivityIndicator color="#fff" /> : null}
            </Pressable>
          ))}
        </View>
      )}

      <Text style={styles.disclosure}>{DISCLOSURE}</Text>

      <View style={styles.legalRow}>
        <Pressable
          onPress={() => openUrl(config.termsUrl)}
          accessibilityRole="link"
          hitSlop={8}
        >
          <Text style={styles.link}>Terms of Use (EULA)</Text>
        </Pressable>
        <Text style={styles.legalSep}>·</Text>
        <Pressable
          onPress={() => openUrl(config.privacyUrl)}
          accessibilityRole="link"
          hitSlop={8}
        >
          <Text style={styles.link}>Privacy Policy</Text>
        </Pressable>
      </View>

      <View style={styles.actions}>
        <Pressable
          style={styles.actionRow}
          onPress={restore}
          disabled={restoring}
          accessibilityRole="button"
          accessibilityState={{ disabled: restoring, busy: restoring }}
        >
          <Text style={styles.actionText}>Restore purchases</Text>
          {restoring ? <ActivityIndicator color="#fff" /> : null}
        </Pressable>
        <Pressable
          style={styles.actionRow}
          onPress={() => Linking.openURL(MANAGE_SUBSCRIPTIONS_URL).catch(() => undefined)}
          accessibilityRole="link"
        >
          <Text style={styles.actionText}>Manage subscription</Text>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0B0F' },
  content: { padding: 16, paddingBottom: 40, gap: 12 },
  center: {
    flex: 1,
    backgroundColor: '#0B0B0F',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 24,
  },
  spinner: { marginVertical: 24 },
  heading: { color: '#fff', fontSize: 24, fontWeight: '800' },
  sub: { color: '#D1D5DB', fontSize: 15 },
  notice: { backgroundColor: '#1E293B', borderRadius: 10, padding: 12 },
  noticeSuccess: { backgroundColor: '#12241C' },
  noticeWarn: { backgroundColor: '#3A2A12' },
  noticeText: { color: '#fff', fontSize: 14 },
  plans: { gap: 12, marginTop: 4 },
  plan: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A22',
    borderColor: '#E11D48',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    minHeight: 72,
  },
  planMeta: { flex: 1, gap: 4 },
  planTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  planPrice: { color: '#E11D48', fontSize: 16, fontWeight: '700' },
  planIntro: { color: '#7FD1A8', fontSize: 13 },
  unavailable: { alignItems: 'center', paddingVertical: 24, gap: 12 },
  disclosure: { color: '#9CA3AF', fontSize: 12, lineHeight: 17, marginTop: 8 },
  legalRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  link: { color: '#93C5FD', fontSize: 13, textDecorationLine: 'underline' },
  legalSep: { color: '#6B7280' },
  actions: { gap: 8, marginTop: 8 },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1A1A22',
    borderRadius: 12,
    paddingHorizontal: 16,
    minHeight: 52,
  },
  actionText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  chevron: { color: '#9CA3AF', fontSize: 22 },
  note: { color: '#9CA3AF', textAlign: 'center' },
  button: {
    backgroundColor: '#E11D48',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  secondary: { backgroundColor: '#374151' },
  buttonText: { color: '#fff', fontWeight: '700' },
});
