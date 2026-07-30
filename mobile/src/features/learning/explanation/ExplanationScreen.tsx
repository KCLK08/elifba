import { useEffect } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import type { ContentExplanationExercise } from '@/content';
import { explanationCardId } from '@/content/exerciseUtils';
import { Button, Card, ScreenContainer } from '@/components/ui';
import { useProfileStore } from '@/store/profileStore';
import { useProgressStore } from '@/store/progressStore';

interface ExplanationScreenProps {
  exercise: ContentExplanationExercise;
}

export function ExplanationScreen({ exercise }: ExplanationScreenProps) {
  const router = useRouter();
  const profileId = useProfileStore((s) => s.activeProfileId) ?? 'profile-1';
  const markExerciseVisited = useProgressStore((s) => s.markExerciseVisited);
  const saveCardProgress = useProgressStore((s) => s.saveCardProgress);

  useEffect(() => {
    markExerciseVisited({
      profileId,
      lessonId: exercise.lessonId,
      exerciseId: exercise.id,
    });
  }, [exercise.id, exercise.lessonId, markExerciseVisited, profileId]);

  const handleContinue = async () => {
    await saveCardProgress({
      profileId,
      lessonId: exercise.lessonId,
      exerciseId: exercise.id,
      cardId: explanationCardId(exercise.id),
      status: 'gelernt',
      correctCount: 1,
    });
    router.replace(`/lesson/${exercise.lessonId}`);
  };

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text className="mb-2 text-sm font-semibold text-primary">Erklärung</Text>
        <Text className="mb-4 text-[28px] font-bold text-ink">{exercise.title}</Text>

        <Card className="mb-6">
          <Text className="text-lg leading-8 text-ink">{exercise.explanation}</Text>
        </Card>

        <View className="gap-3">
          <Button label="Verstanden – weiter" onPress={() => void handleContinue()} />
          <Button
            label="Zurück zur Lektion"
            variant="ghost"
            onPress={() => router.replace(`/lesson/${exercise.lessonId}`)}
          />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
