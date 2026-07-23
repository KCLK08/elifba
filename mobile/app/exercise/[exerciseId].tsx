import { Text } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';

import { getExerciseById } from '@/content';
import { ScreenContainer } from '@/components/ui';
import {
  ExerciseCompletedGate,
  TrainerScreen,
} from '@/features/learning/trainer';
import { log } from '@/services/logger';
import { useProfileStore } from '@/store/profileStore';
import { useProgressStore } from '@/store/progressStore';

export default function ExerciseRoute() {
  const { exerciseId } = useLocalSearchParams<{ exerciseId: string }>();
  const exercise = getExerciseById(exerciseId ?? '');
  const profileId = useProfileStore((s) => s.activeProfileId) ?? '';
  const getExercisePercent = useProgressStore((s) => s.getExercisePercent);
  const [practiceStarted, setPracticeStarted] = useState(false);
  const [visualReset, setVisualReset] = useState(false);
  const [runKey, setRunKey] = useState(0);

  useEffect(() => {
    if (!exercise) {
      log.error('content', `Exercise not found: ${exerciseId ?? '(empty)'}`);
    }
  }, [exercise, exerciseId]);

  if (!exercise) {
    return (
      <ScreenContainer>
        <Text className="text-lg text-ink">Übung nicht gefunden.</Text>
      </ScreenContainer>
    );
  }

  const percent = profileId
    ? getExercisePercent(profileId, exercise.id, exercise.cards.length)
    : 0;
  const isMasteryComplete = percent >= 100;
  const showGate = isMasteryComplete && !practiceStarted;

  const remount = () => setRunKey((n) => n + 1);

  const startPractice = () => {
    setPracticeStarted(true);
    setVisualReset(false);
    remount();
  };

  /** resetTrainerSession — visual only, mastery untouched */
  const restartSession = () => {
    setVisualReset(true);
    remount();
  };

  const continueOrSettingsRemount = () => {
    setVisualReset(false);
    remount();
  };

  return (
    <>
      <Stack.Screen options={{ title: exercise.title }} />
      {showGate ? (
        <ExerciseCompletedGate
          title={exercise.title}
          lessonId={exercise.lessonId}
          onPracticeAgain={startPractice}
        />
      ) : (
        <TrainerScreen
          key={`${exercise.id}-${practiceStarted ? 'p' : 'l'}-v${visualReset ? 1 : 0}-${runKey}`}
          exercise={exercise}
          practice={practiceStarted}
          visualReset={visualReset}
          onPracticeAgain={startPractice}
          onContinueSession={continueOrSettingsRemount}
          onSettingsApplied={continueOrSettingsRemount}
          onRestartSession={restartSession}
        />
      )}
    </>
  );
}
