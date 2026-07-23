import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Avatar, Button, Card, ProgressBar, ScreenContainer } from '@/components/ui';
import { arabicTextStyle } from '@/features/learning/arabic/arabicDisplay';
import { resolveContinueLearning } from '@/features/learning/path/resolveContinueLearning';
import { RewardsStrip } from '@/features/rewards';
import { useProfileStore } from '@/store/profileStore';
import { useProgressStore } from '@/store/progressStore';
import { EMPTY_REWARDS, useRewardsStore } from '@/store/rewardsStore';

export default function HomeScreen() {
  const router = useRouter();
  const profile = useProfileStore((s) => {
    const id = s.activeProfileId;
    return s.profiles.find((p) => p.id === id) ?? null;
  });
  const profileId = useProfileStore((s) => s.activeProfileId) ?? '';
  const session = useProgressStore((s) => s.session);
  const getLessonPercent = useProgressStore((s) => s.getLessonPercent);
  const getExercisePercent = useProgressStore((s) => s.getExercisePercent);
  const byExercise = useProgressStore((s) => s.byExercise);
  const progressEpoch = useProgressStore((s) => s.progressEpoch);
  const rewards = useRewardsStore((s) => s.byProfile[profileId] ?? EMPTY_REWARDS);
  void byExercise;
  void progressEpoch;

  const target = resolveContinueLearning({
    profileId,
    sessionExerciseId: session?.exerciseId,
    getExercisePercent,
    getLessonPercent,
  });

  const allDone = target.kind === 'all_done';
  const lesson = target.kind === 'exercise' ? target.lesson : null;
  const exercise = target.kind === 'exercise' ? target.exercise : null;
  const percent = target.kind === 'exercise' ? target.lessonPercent : 100;

  return (
    <ScreenContainer>
      <View className="mb-5 flex-row items-center justify-between">
        <View className="flex-1 pr-4">
          <Text className="text-sm font-semibold text-primary">Elifba Kids</Text>
          <Text className="mt-1 text-[30px] font-bold leading-9 text-ink">
            Assalamu alaikum,{'\n'}
            {profile?.name ?? 'Freund'}!
          </Text>
        </View>
        {profile ? <Avatar avatar={profile.avatar} size="md" /> : null}
      </View>

      <RewardsStrip stars={rewards.stars} streak={rewards.streak} />

      <Card className="mb-4 border-2 border-primary bg-primary-soft">
        <Text className="mb-1 text-sm font-semibold text-primary-dark">
          {allDone ? 'Geschafft' : 'Weiterlernen'}
        </Text>
        {allDone ? (
          <>
            <Text className="mb-2 text-2xl font-bold text-ink">Alle Übungen geschafft</Text>
            <Text className="mb-3 text-base text-ink-muted">
              Du kannst jede Übung noch einmal üben – dein Fortschritt bleibt erhalten.
            </Text>
            <View className="mt-2">
              <Button label="Zum Lernpfad" onPress={() => router.push('/(tabs)/learn')} />
            </View>
          </>
        ) : (
          <>
            <Text className="mb-2 text-2xl font-bold text-ink">
              {lesson?.title ?? 'Buchstaben des Korans'}
            </Text>
            {session?.exerciseId === exercise?.id && session?.lastCardPreview ? (
              <Text
                className="mb-3 text-5xl font-bold text-primary"
                style={{ ...arabicTextStyle, direction: 'rtl' }}
              >
                {session.lastCardPreview}
              </Text>
            ) : null}
            <Text className="mb-3 text-base text-ink-muted">
              Lernziel: {exercise?.title ?? 'Nächste Übung'}
            </Text>
            <ProgressBar progress={percent} />
            <View className="mt-4">
              <Button
                label="Jetzt weiterlernen"
                onPress={() => {
                  if (exercise) router.push(`/exercise/${exercise.id}`);
                }}
              />
            </View>
          </>
        )}
      </Card>
    </ScreenContainer>
  );
}
