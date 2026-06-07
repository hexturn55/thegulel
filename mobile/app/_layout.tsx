import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '@/lib/auth';

const BG = '#0B0B0F';

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
          <Stack.Screen name="account" options={{ title: 'Account' }} />
        </Stack>
      </SafeAreaProvider>
    </AuthProvider>
  );
}
