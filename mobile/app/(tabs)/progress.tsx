import { Text, View } from 'react-native';

import { getExerciseById, getLessonById, lessons } from '@/content';
import { getExerciseProgressTotal } from '@/content/exerciseUtils';
import { Card, ProgressBar, ScreenContainer } from '@/components/ui';
import { arabicTextStyle } from '@/features/learning/arabic/arabicDisplay';
import { getLessonVisual } from '@/features/learning/path';
import { RewardsStrip } from '@/features/rewards';
import { useProfileStore } from '@/store/profileStore';
import { useProgressStore } from '@/store/progressStore';
import { EMPTY_REWARDS, useRewardsStore } from '@/store/rewardsStore';
export default function ProgressScreen() {
  const profileId = useProfileStore((s) => s.activeProfileId) ?? '';
  const getLessonPercent = useProgressStore((s) => s.getLessonPercent);
  const getExercisePercent = useProgressStore((s) => s.getExercisePercent);
  const session = useProgressStore((s) => s.session);
  const byExercise = useProgressStore((s) => s.byExercise);
  const progressEpoch = useProgressStore((s) => s.progressEpoch);
  const rewards = useRewardsStore((s) => s.byProfile[profileId] ?? EMPTY_REWARDS);
  void byExercise;
  void progressEpoch;

  const completedLessons = lessons.filter((lesson) => {
    const totals = lesson.exerciseIds.map((id) => {
      const ex = getExerciseById(id);
      return {
        exerciseId: id,
        total: ex ? getExerciseProgressTotal(ex) : 0,
      };
    });
    return profileId ? getLessonPercent(profileId, lesson.id, totals) >= 100 : false;
  }).length;

  const lastExercise = session?.exerciseId ? getExerciseById(session.exerciseId) : null;
  const lastLesson = session?.lessonId ? getLessonById(session.lessonId) : null;

  return (
    <ScreenContainer>
      <Text className="mb-2 text-[28px] font-bold text-ink">Dein Fortschritt</Text>
      <Text className="mb-5 text-base text-ink-muted">Sterne, Übungen und geschaffte Lektionen.</Text>

      <RewardsStrip stars={rewards.stars} streak={rewards.streak} />

      <Card className="mb-4 bg-secondary-soft" elevated={false}>
        <Text className="text-center text-4xl font-bold text-ink">{completedLessons}</Text>
        <Text className="mt-1 text-center text-base font-semibold text-ink-muted">
          Lektionen geschafft
        </Text>
      </Card>

      {lastLesson || lastExercise ? (
        <Card className="mb-4">
          <Text className="mb-1 text-sm font-semibold text-ink-muted">Zuletzt geübt</Text>
          <Text className="text-lg font-bold text-ink">
            {lastLesson?.title ?? 'Lektion'}
            {lastExercise ? ` · ${lastExercise.title}` : ''}
          </Text>
          {session?.lastCardPreview ? (
            <Text
              className="mt-2 text-4xl font-bold text-primary"
              style={{ ...arabicTextStyle, direction: 'rtl' }}
            >
              {session.lastCardPreview}
            </Text>
          ) : null}
        </Card>
      ) : null}

      {lessons.map((lesson) => {
        const totals = lesson.exerciseIds.map((id) => {
          const ex = getExerciseById(id);
          return {
            exerciseId: id,
            total: ex ? getExerciseProgressTotal(ex) : 0,
          };
        });
        const percent = profileId ? getLessonPercent(profileId, lesson.id, totals) : 0;
        const done = percent >= 100;
        const visual = getLessonVisual(lesson.order);

        return (
          <Card key={lesson.id} className="mb-4">
            <View className="mb-3 flex-row items-center">
              <View
                className="mr-3 h-12 w-12 items-center justify-center rounded-full"
                style={{ backgroundColor: visual.accent }}
              >
                <Text className="text-2xl">{visual.emoji}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-ink-muted">
                  Lektion {lesson.order} · {visual.label}
                </Text>
                <Text className="text-xl font-bold text-ink">{lesson.title}</Text>
              </View>
            </View>
            <ProgressBar progress={percent} label={done ? 'Fertig!' : `${percent}%`} />
            {lesson.exerciseIds.map((exId) => {
              const ex = getExerciseById(exId);
              if (!ex) return null;
              const p = profileId
                ? getExercisePercent(profileId, exId, getExerciseProgressTotal(ex))
                : 0;
              return (
                <View key={exId} className="mt-3 flex-row items-center justify-between">
                  <Text className="flex-1 pr-2 text-base text-ink">{ex.title}</Text>
                  <Text className="text-base font-semibold text-primary">
                    {p >= 100 ? '⭐' : `${p}%`}
                  </Text>
                </View>
              );
            })}
          </Card>
        );
      })}
    </ScreenContainer>
  );
}
