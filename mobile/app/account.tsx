import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth';

export default function AccountScreen() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.note}>Loading…</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.note}>You’re not signed in.</Text>
        <Pressable style={styles.button} onPress={() => router.push('/auth')}>
          <Text style={styles.buttonText}>Sign in</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.name}>{user.name ?? user.phone ?? user.email ?? 'Member'}</Text>
        <Text style={styles.row}>Coins: {user.coinBalance} 🪙</Text>
        <Text style={styles.row}>{user.isVip ? 'VIP active ⭐' : 'No active VIP'}</Text>
      </View>

      <Pressable style={styles.button} onPress={() => router.push('/coins')}>
        <Text style={styles.buttonText}>Get coins</Text>
      </Pressable>

      <Pressable style={[styles.button, styles.secondary]} onPress={() => void signOut()}>
        <Text style={styles.buttonText}>Sign out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0B0F', padding: 16, gap: 16 },
  center: { flex: 1, backgroundColor: '#0B0B0F', alignItems: 'center', justifyContent: 'center', gap: 16 },
  card: { backgroundColor: '#1A1A22', borderRadius: 12, padding: 20, gap: 8 },
  name: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 4 },
  row: { color: '#D1D5DB', fontSize: 15 },
  note: { color: '#9CA3AF' },
  button: { backgroundColor: '#E11D48', borderRadius: 12, padding: 16, alignItems: 'center' },
  secondary: { backgroundColor: '#374151' },
  buttonText: { color: '#fff', fontWeight: '700' },
});
