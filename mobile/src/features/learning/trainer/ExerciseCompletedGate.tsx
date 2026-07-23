import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Button, ScreenContainer } from '@/components/ui';

interface ExerciseCompletedGateProps {
  title: string;
  lessonId: string;
  onPracticeAgain: () => void;
}

/**
 * Shown when opening an already completed exercise — before starting the trainer.
 */
export function ExerciseCompletedGate({
  title,
  lessonId,
  onPracticeAgain,
}: ExerciseCompletedGateProps) {
  const router = useRouter();

  return (
    <ScreenContainer>
      <Text className="mb-2 text-center text-6xl">🎉</Text>
      <Text className="mb-2 text-center text-[28px] font-bold text-ink">Übung abgeschlossen!</Text>
      <Text className="mb-2 text-center text-lg font-semibold text-ink">{title}</Text>
      <Text className="mb-8 text-center text-base text-ink-muted">
        Du hast alle Karten gelernt. Möchtest du noch einmal üben?
      </Text>

      <View className="gap-3">
        <Button label="Nochmal lernen" onPress={onPracticeAgain} />
        <Button
          label="Zurück zum Lernpfad"
          variant="ghost"
          onPress={() => router.replace(`/lesson/${lessonId}`)}
        />
      </View>
    </ScreenContainer>
  );
}
