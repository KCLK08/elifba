import { useMemo, useState } from 'react';
import { Text } from 'react-native';
import { Stack, useRouter } from 'expo-router';

import {
  WEAKNESS_EXERCISE_ID,
  buildWeaknessCardPersistence,
  buildWeaknessExercise,
  selectWeaknessCards,
} from '@/adaptive';
import { Button, ScreenContainer } from '@/components/ui';
import { TrainerScreen } from '@/features/learning/trainer';
import { useAdaptiveStore } from '@/store/adaptiveStore';
import { useProfileStore } from '@/store/profileStore';

export function WeaknessExerciseScreen() {
  const router = useRouter();
  const profileId = useProfileStore((s) => s.activeProfileId) ?? '';
  const byCard = useAdaptiveStore((s) => s.byCard);
  const [runKey, setRunKey] = useState(0);

  const { exercise, cardPersistence } = useMemo(() => {
    const built = buildWeaknessExercise(profileId, byCard);
    if (!built) return { exercise: null, cardPersistence: undefined };
    const refs = selectWeaknessCards(profileId, byCard);
    return {
      exercise: built,
      cardPersistence: buildWeaknessCardPersistence(refs),
    };
  }, [profileId, byCard]);

  if (!exercise || !cardPersistence) {
    return (
      <>
        <Stack.Screen options={{ title: 'Meine Schwächen üben' }} />
        <ScreenContainer>
          <Text className="mb-4 text-center text-xl font-bold text-ink">Noch keine Schwächen</Text>
          <Text className="mb-8 text-center text-base text-ink-muted">
            Übe zuerst in den normalen Lektionen. Nach mindestens fünf Versuchen pro Karte erkennt
            das System, wo du noch üben solltest.
          </Text>
          <Button label="Zurück" variant="ghost" onPress={() => router.back()} />
        </ScreenContainer>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: exercise.title }} />
      <TrainerScreen
        key={`${WEAKNESS_EXERCISE_ID}-${runKey}`}
        exercise={exercise}
        cardPersistence={cardPersistence}
        onRestartSession={() => setRunKey((n) => n + 1)}
        onContinueSession={() => setRunKey((n) => n + 1)}
        onSettingsApplied={() => setRunKey((n) => n + 1)}
      />
    </>
  );
}
