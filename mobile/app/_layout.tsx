import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack, type ErrorBoundaryProps } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '@/lib/auth';

const BG = '#0B0B0F';

// Deep links straight into a nested screen (e.g. /series/123) still get the
// home screen underneath, so "back" always has somewhere to go.
export const unstable_settings = { initialRouteName: 'index' };

/** Root error boundary: catches render errors from any route. */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  if (__DEV__) console.error('[ErrorBoundary]', error);
  return (
    <View style={styles.errorContainer}>
      <StatusBar style="light" />
      <Text style={styles.errorTitle}>Something went wrong</Text>
      <Text style={styles.errorBody}>Please try again.</Text>
      <Pressable
        accessibilityRole="button"
        style={styles.errorButton}
        onPress={() => void retry()}
      >
        <Text style={styles.errorButtonText}>Try again</Text>
      </Pressable>
    </View>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: BG },
            headerTintColor: '#fff',
            contentStyle: { backgroundColor: BG },
          }}
        >
          <Stack.Screen name="index" options={{ title: 'Gulel' }} />
          <Stack.Screen name="series/[id]" options={{ title: 'Series' }} />
          <Stack.Screen
            name="watch/[episodeId]"
            options={{ presentation: 'fullScreenModal', headerShown: false }}
          />
          <Stack.Screen
            name="auth"
            options={{ title: 'Sign in', presentation: 'modal' }}
          />
          <Stack.Screen name="coins" options={{ title: 'Get Coins', presentation: 'modal' }} />
          <Stack.Screen name="vip" options={{ title: 'VIP', presentation: 'modal' }} />
          <Stack.Screen name="account" options={{ title: 'Account' }} />
        </Stack>
      </SafeAreaProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    backgroundColor: BG,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  errorTitle: { color: '#fff', fontSize: 20, fontWeight: '700' },
  errorBody: { color: '#9CA3AF', textAlign: 'center' },
  errorButton: {
    marginTop: 8,
    backgroundColor: '#E11D48',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 28,
  },
  errorButtonText: { color: '#fff', fontWeight: '700' },
});
