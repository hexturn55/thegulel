import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const BG = '#0B0B0F';

export default function RootLayout() {
  return (
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
          options={{ title: 'Watch', presentation: 'fullScreenModal', headerShown: false }}
        />
      </Stack>
    </SafeAreaProvider>
  );
}
