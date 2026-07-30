import { Pressable, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Stack } from 'expo-router';

import { getLessonById, getLessonExerciseGroups } from '@/content';
import type { ContentExercise } from '@/content';
import { Card, ScreenContainer, StarProgressBar } from '@/components/ui';
import { useProfileStore } from '@/store/profileStore';
import { useProgressStore } from '@/store/progressStore';

function ExerciseCard({
  exercise,
  percent,
  onPress,
}: {
  exercise: ContentExercise;
  percent: number;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress}>
      <Card className="mb-4">
        <Text className="mb-1 text-sm font-semibold text-primary">Trainer</Text>
        <Text className="mb-3 text-lg font-bold text-ink">{exercise.title}</Text>
        <Text className="mb-2 text-sm text-ink-muted">
          {exercise.cards.length} Karten
          {percent >= 100 ? ' · Geschafft' : ''}
        </Text>
        <StarProgressBar progress={percent} />
      </Card>
    </Pressable>
  );
}

export default function LessonScreen() {
  const router = useRouter();
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  const lesson = getLessonById(lessonId ?? '');
  const exerciseGroups = lesson ? getLessonExerciseGroups(lesson) : [];
  const profileId = useProfileStore((s) => s.activeProfileId) ?? 'profile-1';
  const getExercisePercent = useProgressStore((s) => s.getExercisePercent);
  const byExercise = useProgressStore((s) => s.byExercise);
  const progressEpoch = useProgressStore((s) => s.progressEpoch);
  void byExercise;
  void progressEpoch;

  if (!lesson) {
    return (
      <ScreenContainer>
        <Text className="text-lg text-ink">Lektion nicht gefunden.</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Stack.Screen options={{ title: lesson.title }} />
      <Text className="mb-2 text-sm font-semibold text-ink-muted">
        Lektion {lesson.order}
      </Text>
      <Text className="mb-2 text-[28px] font-bold text-ink">{lesson.title}</Text>
      <Text className="mb-6 text-base text-ink-muted">
        Wähle eine Übung. Tippe auf Anhören und bewerte dich selbst.
      </Text>

      {exerciseGroups.map((group) => (
        <View key={group.sectionTitle ?? 'default'} className="mb-2">
          {group.sectionTitle ? (
            <Text className="mb-3 text-xl font-bold text-ink">{group.sectionTitle}</Text>
          ) : null}
          {group.exercises.map((exercise) => {
            const percent = getExercisePercent(profileId, exercise.id, exercise.cards.length);
            return (
              <ExerciseCard
                key={exercise.id}
                exercise={exercise}
                percent={percent}
                onPress={() => router.push(`/exercise/${exercise.id}`)}
              />
            );
          })}
        </View>
      ))}
    </ScreenContainer>
  );
}
