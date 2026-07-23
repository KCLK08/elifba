import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { getExerciseById, getLessonsForChapter } from '@/content';
import { ScreenContainer } from '@/components/ui';
import { LessonNode, resolveLessonState } from '@/features/learning/path';
import { useProfileStore } from '@/store/profileStore';
import { useProgressStore } from '@/store/progressStore';

export default function LearnScreen() {
  const router = useRouter();
  const profileId = useProfileStore((s) => s.activeProfileId) ?? '';
  const getLessonPercent = useProgressStore((s) => s.getLessonPercent);
  const progressEpoch = useProgressStore((s) => s.progressEpoch);
  const byExercise = useProgressStore((s) => s.byExercise);
  const chapterLessons = getLessonsForChapter('elifba');

  const percents = chapterLessons.map((lesson) => {
    const totals = lesson.exerciseIds.map((id) => ({
      exerciseId: id,
      total: getExerciseById(id)?.cards.length ?? 0,
    }));
    // Depend on byExercise / progressEpoch so reset refreshes rings
    void byExercise;
    void progressEpoch;
    return profileId ? getLessonPercent(profileId, lesson.id, totals) : 0;
  });

  return (
    <ScreenContainer>
      <Text className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink-muted">
        Dein Lernpfad
      </Text>
      <Text className="mb-2 text-[28px] font-bold text-ink">Elifba</Text>
      <Text className="mb-6 text-base text-ink-muted">
        Folge den Sternen – eine Lektion nach der anderen.
      </Text>

      <View>
        {chapterLessons.map((lesson, index) => {
          const percent = percents[index] ?? 0;
          const previousPercent = index === 0 ? null : (percents[index - 1] ?? 0);
          const state = resolveLessonState(lesson.order, percent, previousPercent);

          return (
            <LessonNode
              key={lesson.id}
              order={lesson.order}
              title={lesson.title}
              progress={percent}
              state={state}
              onPress={() => router.push(`/lesson/${lesson.id}`)}
            />
          );
        })}
      </View>
    </ScreenContainer>
  );
}
