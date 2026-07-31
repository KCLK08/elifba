import { useMemo, useState } from 'react';
import { Text } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';

import {
  PERSONALIZED_EXERCISE_ID,
  buildPersonalizedCardPersistence,
  buildPersonalizedExercise,
  exerciseFromPersonalizedRefs,
} from '@/adaptive';
import { Button, ScreenContainer } from '@/components/ui';
import { TrainerScreen } from '@/features/learning/trainer';
import { useAdaptiveStore } from '@/store/adaptiveStore';
import { useProfileStore } from '@/store/profileStore';

export function PersonalizedExerciseScreen() {
  const router = useRouter();
  const { profileId: paramProfileId } = useLocalSearchParams<{ profileId?: string }>();
  const activeProfileId = useProfileStore((s) => s.activeProfileId) ?? '';
  const profileId = paramProfileId ?? activeProfileId;
  const byCard = useAdaptiveStore((s) => s.byCard);
  const getPersonalizedSession = useAdaptiveStore((s) => s.getPersonalizedSession);
  const [runKey, setRunKey] = useState(0);

  const { exercise, cardPersistence } = useMemo(() => {
    const session = getPersonalizedSession(profileId);
    if (session) {
      return {
        exercise: exerciseFromPersonalizedRefs(session.refs),
        cardPersistence: buildPersonalizedCardPersistence(session.refs),
      };
    }

    const built = buildPersonalizedExercise(profileId, byCard);
    if (!built) return { exercise: null, cardPersistence: undefined };
    return {
      exercise: built.exercise,
      cardPersistence: buildPersonalizedCardPersistence(built.refs),
    };
  }, [profileId, byCard, getPersonalizedSession, runKey]);

  if (!exercise || !cardPersistence) {
    return (
      <>
        <Stack.Screen options={{ title: 'Persönliche Wiederholung' }} />
        <ScreenContainer>
          <Text className="mb-4 text-center text-xl font-bold text-ink">
            Übung nicht verfügbar
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
        key={`${PERSONALIZED_EXERCISE_ID}-${runKey}`}
        exercise={exercise}
        cardPersistence={cardPersistence}
        profileIdOverride={profileId}
        onRestartSession={() => setRunKey((n) => n + 1)}
        onContinueSession={() => setRunKey((n) => n + 1)}
        onSettingsApplied={() => setRunKey((n) => n + 1)}
      />
    </>
  );
}
