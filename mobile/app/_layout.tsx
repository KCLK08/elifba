import 'react-native-gesture-handler';
import '../global.css';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';

import { colors } from '@/constants/theme';
import { CelebrationModal } from '@/features/rewards';
import { useHydrateAppState } from '@/hooks/useHydrateAppState';
import { configureAudio } from '@/services/audio';
import { initDatabase } from '@/services/database';
import { log } from '@/services/logger';

export { ErrorBoundary } from 'expo-router';

export default function RootLayout() {
  const hydrated = useHydrateAppState();

  useEffect(() => {
    void initDatabase();
    void configureAudio().catch((err) => log.error('audio', 'init failed', err));
    log.info('app', 'RootLayout mounted');
  }, []);

  if (!hydrated) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style="dark" />
        <CelebrationModal />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.ink,
            headerTitleStyle: { fontWeight: '700' },
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="lesson/[lessonId]" options={{ title: 'Lektion' }} />
          <Stack.Screen
            name="exercise/[exerciseId]"
            options={{ title: 'Übung', headerBackTitle: 'Zurück' }}
          />
          <Stack.Screen name="settings" options={{ title: 'Einstellungen' }} />
          <Stack.Screen name="parent/index" options={{ title: 'Elternbereich' }} />
          <Stack.Screen name="parent/exercise-preview" options={{ title: 'Persönliche Wiederholung' }} />
          <Stack.Screen name="profile/[profileId]" options={{ title: 'Profil bearbeiten' }} />
        </Stack>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
