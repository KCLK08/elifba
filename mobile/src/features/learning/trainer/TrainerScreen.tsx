import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { Stack, useNavigation, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';

import type { ContentExercise } from '@/content';
import { getExerciseById, getLessonById } from '@/content';
import { Button, IconButton, Modal, ScreenContainer } from '@/components/ui';
import { starsEarnedFromProgress } from '@/components/ui/starMilestones';
import { StarEarnBurst } from '@/features/rewards/StarEarnBurst';
import { useExerciseSettingsStore, type SessionLimit } from '@/store/exerciseSettingsStore';
import { useProfileStore } from '@/store/profileStore';
import { useProgressStore } from '@/store/progressStore';
import { EMPTY_REWARDS, summaryCopy, useRewardsStore } from '@/store/rewardsStore';
import { useSettingsStore } from '@/store/settingsStore';
import type { TrainerMode } from '@/types';

import { ArabicLetterView } from '../arabic';
import { useTrainer } from './useTrainer';
import { TrainerQueueBar } from './TrainerQueueBar';
import { TrainerSettingsModal } from './TrainerSettingsModal';
import type { TrainerAnswer } from './scoring';

interface TrainerScreenProps {
  exercise: ContentExercise;
  practice?: boolean;
  visualReset?: boolean;
  onPracticeAgain?: () => void;
  onContinueSession?: () => void;
  onSettingsApplied?: () => void;
  onRestartSession?: () => void;
}

function TrainerHeaderActions({
  onRestartPress,
  onSettingsPress,
  starTotal,
}: {
  onRestartPress: () => void;
  onSettingsPress: () => void;
  starTotal: number;
}) {
  return (
    <View className="mr-1 flex-row items-center">
      <View className="mr-1 flex-row items-center rounded-full bg-secondary-soft px-2 py-1">
        <Text className="text-base">⭐</Text>
        <Text className="ml-1 text-sm font-bold text-ink">{starTotal}</Text>
      </View>
      <IconButton
        name="refresh"
        accessibilityLabel="Übung neu starten"
        className="h-10 w-10 bg-transparent"
        onPress={onRestartPress}
      />
      <IconButton
        name="settings-outline"
        accessibilityLabel="Übungs-Einstellungen"
        className="h-10 w-10 bg-transparent"
        onPress={onSettingsPress}
      />
    </View>
  );
}

export function TrainerScreen({
  exercise,
  practice = false,
  visualReset = false,
  onPracticeAgain,
  onContinueSession,
  onSettingsApplied,
  onRestartSession,
}: TrainerScreenProps) {
  const router = useRouter();
  const navigation = useNavigation();
  const {
    currentCard,
    learned,
    total,
    completed,
    answer,
    listen,
    stats,
    queue,
    sessionIndices,
    masteryComplete,
    hasMoreSessions,
    sessionLimit,
    mode,
    masteryLearned,
    masteryTotal,
  } = useTrainer(exercise, { practice, visualReset });

  const profileId = useProfileStore((s) => s.activeProfileId) ?? '';
  const getLessonPercent = useProgressStore((s) => s.getLessonPercent);
  const getExercisePercent = useProgressStore((s) => s.getExercisePercent);
  const awardMilestones = useRewardsStore((s) => s.awardExerciseMilestones);
  const markExerciseCompleted = useRewardsStore((s) => s.markExerciseCompleted);
  const awardLesson = useRewardsStore((s) => s.awardLessonCompleted);
  const showCelebration = useRewardsStore((s) => s.showCelebration);
  const totalStars = useRewardsStore(
    (s) => (profileId ? s.byProfile[profileId]?.stars : 0) ?? EMPTY_REWARDS.stars,
  );
  const animationsEnabled = useSettingsStore((s) => s.animationsEnabled);
  const soundEnabled = useSettingsStore((s) => s.soundEnabled);
  const setExerciseSettings = useExerciseSettingsStore((s) => s.setSettings);
  const completionHandled = useRef(false);
  const sessionStarsEarned = useRef(0);
  const summaryShown = useRef(false);

  const [feedback, setFeedback] = useState<string | null>(null);
  const [audioHint, setAudioHint] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [restartConfirmOpen, setRestartConfirmOpen] = useState(false);
  const [burstKey, setBurstKey] = useState(0);
  const [showBurst, setShowBurst] = useState(false);

  const storeMasteryPercent = profileId
    ? getExercisePercent(profileId, exercise.id, exercise.cards.length)
    : 0;
  const showReplay = (storeMasteryPercent >= 100 || masteryComplete) && !hasMoreSessions;

  const masteryPercent = masteryTotal
    ? Math.round((masteryLearned / masteryTotal) * 100)
    : 0;

  // Award stars immediately when mastery milestones are reached
  useEffect(() => {
    if (!profileId || practice) return;
    const target = starsEarnedFromProgress(masteryPercent);
    void (async () => {
      const gained = await awardMilestones(profileId, exercise.id, target);
      if (gained <= 0) return;
      sessionStarsEarned.current += gained;
      setShowBurst(true);
      setBurstKey((k) => k + 1);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (soundEnabled) {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    })();
  }, [
    masteryPercent,
    profileId,
    practice,
    exercise.id,
    awardMilestones,
    soundEnabled,
  ]);

  const presentSummary = () => {
    if (summaryShown.current) return;
    summaryShown.current = true;
    const earned = sessionStarsEarned.current;
    const copy = summaryCopy(earned);
    showCelebration({
      title: copy.title,
      message: copy.message,
      starsEarned: earned,
      kind: copy.kind,
    });
  };

  // Session / exercise finished → mark complete (stars already granted at milestones)
  useEffect(() => {
    if (!completed || completionHandled.current || !profileId || practice) return;
    if (hasMoreSessions) {
      completionHandled.current = true;
      return;
    }
    if (masteryLearned < masteryTotal) return;
    completionHandled.current = true;
    void (async () => {
      await markExerciseCompleted(profileId, exercise.id);
      const lesson = getLessonById(exercise.lessonId);
      if (lesson) {
        const totals = lesson.exerciseIds.map((id) => ({
          exerciseId: id,
          total: getExerciseById(id)?.cards.length ?? 0,
        }));
        const lessonPercent = getLessonPercent(profileId, lesson.id, totals);
        if (lessonPercent >= 100) {
          await awardLesson(profileId, lesson.id);
        }
      }
    })();
  }, [
    completed,
    practice,
    hasMoreSessions,
    masteryLearned,
    masteryTotal,
    profileId,
    markExerciseCompleted,
    awardLesson,
    exercise.id,
    exercise.lessonId,
    getLessonPercent,
  ]);

  // Leaving mid-exercise → summary modal (completion screen already summarizes)
  useEffect(() => {
    const unsub = navigation.addListener('beforeRemove', () => {
      if (practice || summaryShown.current || completed) return;
      presentSummary();
    });
    return unsub;
  });

  const handleAnswer = (value: TrainerAnswer) => {
    if (value === 'richtig') {
      setFeedback('Toll! ✅');
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else if (value === 'unsicher') {
      setFeedback('Noch unsicher – üben wir weiter 🟡');
      void Haptics.selectionAsync();
    } else {
      setFeedback('Nochmal versuchen 😊');
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
    }
    answer(value);
    setTimeout(() => setFeedback(null), 700);
  };

  const handleListen = async () => {
    const result = await listen();
    if (result === 'ok') {
      setAudioHint(null);
      void Haptics.selectionAsync();
      return;
    }
    if (result === 'muted') setAudioHint('Sound ist aus – in den Einstellungen anschalten.');
    else if (result === 'missing') setAudioHint('Audio fehlt für diese Karte.');
    else setAudioHint('Audio konnte nicht abgespielt werden.');
  };

  const applyLimit = async (limit: SessionLimit) => {
    await setExerciseSettings(exercise.id, { sessionLimit: limit });
    onSettingsApplied?.();
  };

  const applyMode = async (nextMode: TrainerMode) => {
    await setExerciseSettings(exercise.id, { mode: nextMode });
    onSettingsApplied?.();
  };

  const confirmRestart = () => {
    setRestartConfirmOpen(false);
    void Haptics.selectionAsync();
    onRestartSession?.();
  };

  const leaveToPath = () => {
    if (!practice && !summaryShown.current) presentSummary();
    router.replace('/(tabs)/learn');
  };

  const headerRight = () => (
    <TrainerHeaderActions
      starTotal={totalStars}
      onRestartPress={() => setRestartConfirmOpen(true)}
      onSettingsPress={() => setSettingsOpen(true)}
    />
  );

  const restartModal = (
    <Modal
      visible={restartConfirmOpen}
      title="Übung neu starten?"
      message="Die aktuelle Runde beginnt von vorne. Dein gespeicherter Lernfortschritt bleibt erhalten."
      onClose={() => setRestartConfirmOpen(false)}
    >
      <View className="gap-3">
        <Button label="Neu starten" onPress={confirmRestart} />
        <Button label="Abbrechen" variant="ghost" onPress={() => setRestartConfirmOpen(false)} />
      </View>
    </Modal>
  );

  const settingsModal = (
    <TrainerSettingsModal
      visible={settingsOpen}
      sessionLimit={sessionLimit}
      mode={mode}
      onClose={() => setSettingsOpen(false)}
      onChangeLimit={(limit) => void applyLimit(limit)}
      onChangeMode={(m) => void applyMode(m)}
    />
  );

  const burst = (
    <StarEarnBurst
      burstKey={burstKey}
      visible={showBurst}
      onDone={() => setShowBurst(false)}
    />
  );

  if (completed || !currentCard) {
    const earned = sessionStarsEarned.current;
    const copy = summaryCopy(earned);

    return (
      <ScreenContainer>
        <Stack.Screen options={{ title: exercise.title, headerRight }} />
        {burst}
        <Text className="mb-2 text-center text-6xl">
          {earned > 0 ? copy.emoji : copy.emoji}
        </Text>
        <Text className="mb-2 text-center text-[28px] font-bold text-ink">{copy.title}</Text>
        <Text className="mb-6 text-center text-base text-ink-muted">{copy.message}</Text>
        {hasMoreSessions ? (
          <Text className="mb-4 text-center text-base text-ink-muted">
            Es gibt noch mehr Karten in dieser Übung.
          </Text>
        ) : null}
        <TrainerQueueBar
          queue={queue}
          sessionIndices={sessionIndices}
          cardIds={exercise.cards.map((c) => c.id)}
          stats={stats}
          starLearned={masteryLearned}
          starTotal={masteryTotal}
        />
        <View className="mt-8 gap-3">
          {hasMoreSessions && onContinueSession ? (
            <Button
              label="Mehr lernen"
              onPress={() => {
                summaryShown.current = true;
                onContinueSession();
              }}
            />
          ) : null}
          {showReplay && onPracticeAgain ? (
            <Button
              label="Nochmal lernen"
              variant={hasMoreSessions ? 'ghost' : 'primary'}
              onPress={() => {
                summaryShown.current = true;
                onPracticeAgain();
              }}
            />
          ) : null}
          <Button label="Zurück zum Lernpfad" variant="ghost" onPress={leaveToPath} />
        </View>
        {settingsModal}
        {restartModal}
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scroll={false} className="justify-start">
      <Stack.Screen options={{ title: exercise.title, headerRight }} />
      {burst}

      <View className="mb-1 flex-row items-center justify-between">
        <Text className="flex-1 text-sm font-semibold text-ink-muted" numberOfLines={1}>
          {practice ? 'Wiederholung · ' : ''}
          {learned} von {total}
          {practice ? ' (diese Runde)' : ' diese Session'}
          {!practice && masteryTotal > total
            ? ` · ${masteryLearned}/${masteryTotal} gelernt`
            : ''}
        </Text>
      </View>

      <TrainerQueueBar
        queue={queue}
        sessionIndices={sessionIndices}
        cardIds={exercise.cards.map((c) => c.id)}
        stats={stats}
        starLearned={masteryLearned}
        starTotal={masteryTotal}
      />

      <View className="mt-1">
        <ArabicLetterView card={currentCard} />
      </View>

      <View className="mt-3 items-center">
        <IconButton
          name="volume-high"
          accessibilityLabel="Anhören"
          onPress={() => void handleListen()}
        />
        <Text className="mt-0.5 text-sm font-semibold text-primary">Anhören</Text>
        {audioHint ? (
          <Text className="mt-1 px-2 text-center text-sm text-warning">{audioHint}</Text>
        ) : null}
        {feedback ? (
          animationsEnabled ? (
            <Animated.Text
              entering={FadeInDown.duration(150)}
              className="mt-1 text-center text-base font-bold text-primary"
            >
              {feedback}
            </Animated.Text>
          ) : (
            <Text className="mt-1 text-center text-base font-bold text-primary">{feedback}</Text>
          )
        ) : (
          <View className="mt-1 h-5" />
        )}
      </View>

      <View className="mt-2 gap-2">
        <Button
          label="✅ Richtig"
          variant="success"
          accessibilityLabel="Richtig"
          onPress={() => handleAnswer('richtig')}
        />
        <Button
          label="🟡 Unsicher"
          variant="warning"
          accessibilityLabel="Unsicher"
          onPress={() => handleAnswer('unsicher')}
        />
        <Button
          label="❌ Falsch"
          variant="danger"
          accessibilityLabel="Falsch"
          onPress={() => handleAnswer('falsch')}
        />
      </View>

      {settingsModal}
      {restartModal}
    </ScreenContainer>
  );
}
