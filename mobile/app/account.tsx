import { useCallback, useState } from 'react';
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
import { useFocusEffect, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useAuth } from '@/lib/auth';
import { config } from '@/lib/config';

const MANAGE_SUBSCRIPTIONS_URL =
  Platform.OS === 'ios'
    ? 'https://apps.apple.com/account/subscriptions'
    : 'https://play.google.com/store/account/subscriptions';

function openUrl(url: string) {
  void WebBrowser.openBrowserAsync(url).catch(() => Linking.openURL(url).catch(() => {}));
}

function openExternal(url: string) {
  Linking.openURL(url).catch(() => {
    Alert.alert('Could not open link', url);
  });
}

export default function AccountScreen() {
  const router = useRouter();
  const { user, loading, userError, refresh, signOut, deleteAccount } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  const onSignOut = useCallback(async () => {
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setSigningOut(false);
    }
  }, [signOut]);

  const confirmDelete = useCallback(() => {
    const title = 'Delete account?';
    const message =
      'This permanently deletes your account, coins, unlocked episodes and watch history. Active App Store / Google Play subscriptions are not cancelled automatically — cancel them in your store account settings.';
    const failed = 'Could not delete account. Please try again.';
    const doDelete = async () => {
      setDeleting(true);
      try {
        await deleteAccount();
        router.replace('/');
      } catch {
        // react-native-web's Alert.alert is a no-op.
        if (Platform.OS === 'web') globalThis.alert?.(failed);
        else Alert.alert(failed);
      } finally {
        setDeleting(false);
      }
    };
    if (Platform.OS === 'web') {
      if (globalThis.confirm?.(`${title}\n\n${message}`)) void doDelete();
      return;
    }
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => void doDelete() },
    ]);
  }, [deleteAccount, router]);

  const busy = deleting || signingOut;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
      }
    >
      {loading ? (
        <View style={styles.centerBlock}>
          <ActivityIndicator color="#fff" />
        </View>
      ) : userError && !user ? (
        <View style={styles.centerBlock}>
          <Text style={styles.heading}>Couldn’t load your account</Text>
          <Text style={styles.note}>Check your connection and try again.</Text>
          <Pressable accessibilityRole="button" style={styles.button} onPress={onRefresh}>
            <Text style={styles.buttonText}>Retry</Text>
          </Pressable>
        </View>
      ) : !user ? (
        <View style={styles.centerBlock}>
          <Text style={styles.note}>You’re not signed in.</Text>
          <Pressable
            accessibilityRole="button"
            style={styles.button}
            onPress={() => router.push('/auth')}
          >
            <Text style={styles.buttonText}>Sign in</Text>
          </Pressable>
        </View>
      ) : (
        <>
          {userError && (
            <View style={styles.banner}>
              <Text style={styles.bannerText}>Couldn’t load your account. Showing saved info.</Text>
              <Pressable accessibilityRole="button" onPress={onRefresh} hitSlop={8}>
                <Text style={styles.bannerAction}>Retry</Text>
              </Pressable>
            </View>
          )}

          <View style={styles.card}>
            <Text style={styles.name}>{user.name || 'Member'}</Text>
            {(user.phone || user.email) && (
              <Text style={styles.detail}>{user.phone || user.email}</Text>
            )}
            <Text style={styles.row}>Coins: {user.coinBalance} 🪙</Text>
            <Text style={styles.row}>{user.isVip ? 'VIP active ⭐' : 'No active VIP'}</Text>
          </View>

          <Pressable
            accessibilityRole="button"
            style={styles.button}
            onPress={() => router.push('/coins')}
          >
            <Text style={styles.buttonText}>Get coins</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            style={[styles.button, styles.vip]}
            onPress={() => router.push('/vip')}
          >
            <Text style={styles.buttonText}>{user.isVip ? 'VIP' : 'Become VIP'}</Text>
          </Pressable>

          {Platform.OS !== 'web' && (
            <Pressable
              accessibilityRole="button"
              style={[styles.button, styles.secondary]}
              onPress={() => openExternal(MANAGE_SUBSCRIPTIONS_URL)}
            >
              <Text style={styles.buttonText}>Manage subscription</Text>
            </Pressable>
          )}

          <Pressable
            accessibilityRole="button"
            style={[styles.button, styles.secondary, busy && styles.disabled]}
            disabled={busy}
            onPress={() => void onSignOut()}
          >
            {signingOut ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Sign out</Text>
            )}
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityHint="Permanently deletes your account"
            style={[styles.dangerRow, busy && styles.disabled]}
            disabled={busy}
            onPress={confirmDelete}
          >
            {deleting ? (
              <ActivityIndicator color="#F87171" />
            ) : (
              <Text style={styles.dangerText}>Delete account</Text>
            )}
          </Pressable>
        </>
      )}

      <View style={styles.links}>
        <Pressable
          accessibilityRole="button"
          style={styles.linkRow}
          onPress={() => openUrl(config.privacyUrl)}
        >
          <Text style={styles.linkText}>Privacy Policy</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          style={styles.linkRow}
          onPress={() => openUrl(config.termsUrl)}
        >
          <Text style={styles.linkText}>Terms of Service</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          style={styles.linkRow}
          onPress={() => openUrl(config.deleteAccountUrl)}
        >
          <Text style={styles.linkText}>Delete account info</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          style={styles.linkRow}
          onPress={() => openExternal(`mailto:${config.supportEmail}`)}
        >
          <Text style={styles.linkText}>Contact support</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#0B0B0F' },
  container: { flexGrow: 1, backgroundColor: '#0B0B0F', padding: 16, gap: 16 },
  centerBlock: { alignItems: 'center', justifyContent: 'center', gap: 16, paddingVertical: 48 },
  heading: { color: '#fff', fontSize: 18, fontWeight: '700' },
  card: { backgroundColor: '#1A1A22', borderRadius: 12, padding: 20, gap: 8 },
  name: { color: '#fff', fontSize: 20, fontWeight: '700' },
  detail: { color: '#9CA3AF', fontSize: 14, marginBottom: 4 },
  row: { color: '#D1D5DB', fontSize: 15 },
  note: { color: '#9CA3AF' },
  banner: {
    backgroundColor: '#3F1D24',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bannerText: { color: '#FCA5A5', flex: 1 },
  bannerAction: { color: '#fff', fontWeight: '700' },
  button: {
    backgroundColor: '#E11D48',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  vip: { backgroundColor: '#B45309' },
  secondary: { backgroundColor: '#374151' },
  disabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '700' },
  dangerRow: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#7F1D1D',
  },
  dangerText: { color: '#F87171', fontWeight: '700' },
  links: { marginTop: 8, borderTopWidth: 1, borderTopColor: '#2A2A33', paddingTop: 8 },
  linkRow: { paddingVertical: 12 },
  linkText: { color: '#9CA3AF', fontSize: 15 },
});
