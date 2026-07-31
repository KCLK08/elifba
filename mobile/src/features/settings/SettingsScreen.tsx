import { useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Button, Card, Modal, ScreenContainer } from '@/components/ui';
import { useExerciseSettingsStore, type SessionLimit } from '@/store/exerciseSettingsStore';
import { useProgressStore } from '@/store/progressStore';
import { useRewardsStore } from '@/store/rewardsStore';
import { useAdaptiveStore } from '@/store/adaptiveStore';
import { useSettingsStore } from '@/store/settingsStore';

const LIMITS: SessionLimit[] = [10, 20, 30, 'all'];

export function SettingsScreen() {
  const router = useRouter();
  const soundEnabled = useSettingsStore((s) => s.soundEnabled);
  const animationsEnabled = useSettingsStore((s) => s.animationsEnabled);
  const sessionLimit = useSettingsStore((s) => s.sessionLimit);
  const toggleSound = useSettingsStore((s) => s.toggleSound);
  const toggleAnimations = useSettingsStore((s) => s.toggleAnimations);
  const setSessionLimit = useSettingsStore((s) => s.setSessionLimit);
  const resetProgress = useProgressStore((s) => s.resetLocalProgress);
  const resetRewards = useRewardsStore((s) => s.resetAllRewards);
  const resetExerciseSettings = useExerciseSettingsStore((s) => s.resetAll);
  const resetAdaptive = useAdaptiveStore((s) => s.resetAllAdaptive);
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetting, setResetting] = useState(false);

  const onReset = async () => {
    setResetting(true);
    try {
      await resetProgress();
      await resetRewards();
      await resetAdaptive();
      await resetExerciseSettings();
      setConfirmReset(false);
      router.replace('/(tabs)/learn');
    } finally {
      setResetting(false);
    }
  };

  return (
    <ScreenContainer>
      <Text className="mb-2 text-[28px] font-bold text-ink">Einstellungen</Text>
      <Text className="mb-6 text-base text-ink-muted">
        Hier kannst du die App an dich anpassen.
      </Text>

      <Card className="mb-4">
        <Text className="mb-3 text-lg font-bold text-ink">Sound</Text>
        <Button
          label={soundEnabled ? 'Sound an ✓' : 'Sound aus'}
          variant={soundEnabled ? 'primary' : 'ghost'}
          onPress={() => void toggleSound()}
        />
      </Card>

      <Card className="mb-4">
        <Text className="mb-3 text-lg font-bold text-ink">Animationen</Text>
        <Button
          label={animationsEnabled ? 'Animationen an ✓' : 'Animationen aus'}
          variant={animationsEnabled ? 'primary' : 'ghost'}
          onPress={() => void toggleAnimations()}
        />
      </Card>

      <Card className="mb-4">
        <Text className="mb-3 text-lg font-bold text-ink">Karten pro Session</Text>
        <View className="gap-3">
          {LIMITS.map((limit) => (
            <Button
              key={String(limit)}
              label={
                limit === 'all'
                  ? `Alle${sessionLimit === 'all' ? ' ✓' : ''}`
                  : `${limit} Karten${sessionLimit === limit ? ' ✓' : ''}`
              }
              variant={sessionLimit === limit ? 'secondary' : 'ghost'}
              size="md"
              onPress={() => void setSessionLimit(limit)}
            />
          ))}
        </View>
        <Text className="mt-3 text-sm text-ink-muted">
          Begrenzt, wie viele Karten du in einer Lernrunde übst. Gelernte Karten bleiben gespeichert.
        </Text>
      </Card>

      <Card className="mb-4 border border-warning">
        <Text className="mb-2 text-lg font-bold text-ink">Neu starten</Text>
        <Text className="mb-3 text-base text-ink-muted">
          Löscht den Lernfortschritt auf diesem Gerät. Profile bleiben erhalten.
        </Text>
        <Button label="Fortschritt löschen" variant="warning" onPress={() => setConfirmReset(true)} />
      </Card>

      <Modal
        visible={confirmReset}
        title="Wirklich löschen?"
        message="Dein Fortschritt und deine Sterne werden zurückgesetzt. Das kannst du nicht rückgängig machen."
        onClose={() => setConfirmReset(false)}
      >
        <View className="gap-3">
          <Button
            label="Ja, löschen"
            variant="warning"
            disabled={resetting}
            onPress={() => void onReset()}
          />
          <Button label="Abbrechen" variant="ghost" onPress={() => setConfirmReset(false)} />
        </View>
      </Modal>
    </ScreenContainer>
  );
}
