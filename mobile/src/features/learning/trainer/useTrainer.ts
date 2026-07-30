import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';

import type { ContentCard, ContentTrainerExercise } from '@/content';
import { playAudio, resolveAudioSource, stopAudio } from '@/services/audio';
import { log } from '@/services/logger';
import {
  useExerciseSettingsStore,
  type SessionLimit,
} from '@/store/exerciseSettingsStore';
import { useProgressStore } from '@/store/progressStore';
import { useProfileStore } from '@/store/profileStore';
import { useSettingsStore } from '@/store/settingsStore';
import type { TrainerMode } from '@/types';

import { buildInitialQueue, repositionAfterAnswer } from './queue';
import {
  applyAnswer,
  countLearned,
  createInitialStat,
  type CardStat,
  type TrainerAnswer,
} from './scoring';

export interface UseTrainerOptions {
  /** Full replay including mastered cards; does not write mastery. */
  practice?: boolean;
  /**
   * resetTrainerSession: fresh visual/session card states (all neutral),
   * new queue from content — does NOT clear progressStore mastery.
   */
  visualReset?: boolean;
}

export interface UseTrainerResult {
  exercise: ContentTrainerExercise;
  currentCard: ContentCard | null;
  queue: number[];
  queueLength: number;
  /** Card indices in this session (fixed; drives progress bar length). */
  sessionIndices: number[];
  learned: number;
  total: number;
  masteryTotal: number;
  masteryLearned: number;
  percent: number;
  sessionComplete: boolean;
  masteryComplete: boolean;
  hasMoreSessions: boolean;
  completed: boolean;
  /** Session / visual card states (bar colors). */
  stats: Record<string, CardStat>;
  practice: boolean;
  sessionLimit: SessionLimit;
  mode: TrainerMode;
  answer: (value: TrainerAnswer) => void;
  listen: () => Promise<'ok' | 'muted' | 'missing' | 'error'>;
}

function buildFreshStats(exercise: ContentTrainerExercise): Record<string, CardStat> {
  const initial: Record<string, CardStat> = {};
  for (const card of exercise.cards) {
    initial[card.id] = createInitialStat();
  }
  return initial;
}

function buildPersistedStats(
  exercise: ContentTrainerExercise,
  persisted: ReturnType<ReturnType<typeof useProgressStore.getState>['loadExerciseProgress']>,
): Record<string, CardStat> {
  const initial: Record<string, CardStat> = {};
  for (const card of exercise.cards) {
    initial[card.id] = persisted?.cards[card.id] ?? createInitialStat();
  }
  return initial;
}

function countMasteryLearned(
  exercise: ContentTrainerExercise,
  persisted: ReturnType<ReturnType<typeof useProgressStore.getState>['loadExerciseProgress']>,
): number {
  if (!persisted) return 0;
  return exercise.cards.filter((c) => persisted.cards[c.id]?.status === 'gelernt').length;
}

export function useTrainer(
  exercise: ContentTrainerExercise,
  options: UseTrainerOptions = {},
): UseTrainerResult {
  const practice = options.practice === true;
  const visualReset = options.visualReset === true;

  const profileId = useProfileStore((s) => s.activeProfileId) ?? 'profile-1';
  const loadExerciseProgress = useProgressStore((s) => s.loadExerciseProgress);
  const saveCardProgress = useProgressStore((s) => s.saveCardProgress);
  const markExerciseVisited = useProgressStore((s) => s.markExerciseVisited);
  const byExercise = useProgressStore((s) => s.byExercise);
  const globalLimit = useSettingsStore((s) => s.sessionLimit);
  const storedExerciseSettings = useExerciseSettingsStore((s) => s.byExercise[exercise.id]);
  const sessionLimit = storedExerciseSettings?.sessionLimit ?? globalLimit;
  const mode = storedExerciseSettings?.mode ?? 'sequence';

  const persisted = useMemo(
    () => loadExerciseProgress(profileId, exercise.id),
    [loadExerciseProgress, profileId, exercise.id, byExercise],
  );

  const bootstrap = useMemo(() => {
    const masteryStats = buildPersistedStats(exercise, persisted);
    // Visual/session state: fresh on practice or restart — never wipe progressStore
    const sessionStats =
      practice || visualReset ? buildFreshStats(exercise) : masteryStats;

    const initialQueue = buildInitialQueue(
      exercise.cards.length,
      // Queue membership uses mastery so already-learned cards stay out of active queue
      // (unless practice). Visual colors still come from sessionStats.
      practice ? sessionStats : masteryStats,
      exercise.cards.map((c) => c.id),
      {
        filter: practice ? 'all' : 'skipLearned',
        sessionLimit,
        mode,
      },
    );
    const sessionCardIds = new Set<string>();
    for (const idx of initialQueue) {
      const id = exercise.cards[idx]?.id;
      if (id) sessionCardIds.add(id);
    }
    return { sessionStats, initialQueue, sessionCardIds };
    // Remount via key when practice / visualReset / settings / batch change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [stats, setStats] = useState(bootstrap.sessionStats);
  const [queue, setQueue] = useState(bootstrap.initialQueue);
  const sessionCardIds = bootstrap.sessionCardIds;

  const statsRef = useRef(stats);
  const queueRef = useRef(queue);
  statsRef.current = stats;
  queueRef.current = queue;

  useEffect(() => {
    if (practice) {
      return () => {
        void stopAudio();
      };
    }
    markExerciseVisited({
      profileId,
      lessonId: exercise.lessonId,
      exerciseId: exercise.id,
      lastCardPreview: exercise.cards[queueRef.current[0] ?? 0]?.arabic,
    });
    return () => {
      void stopAudio();
    };
  }, [exercise.id, exercise.lessonId, profileId, markExerciseVisited, exercise.cards, practice]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') void stopAudio();
    });
    return () => sub.remove();
  }, []);

  const currentIndex = queue[0];
  const currentCard =
    currentIndex === undefined ? null : (exercise.cards[currentIndex] ?? null);

  const sessionLearnedCount = Object.entries(stats).filter(
    ([id, s]) => sessionCardIds.has(id) && s.status === 'gelernt',
  ).length;
  const sessionTotal = sessionCardIds.size;
  const masteryTotal = exercise.cards.length;
  const masteryLearned = countMasteryLearned(exercise, persisted);

  const sessionComplete = queue.length === 0 && (sessionTotal > 0 || masteryTotal === 0);

  // Open cards from durable mastery — not from visual session stats
  const openRemaining = practice
    ? 0
    : exercise.cards.filter((c) => persisted?.cards[c.id]?.status !== 'gelernt').length;

  const hasMoreSessions = !practice && sessionComplete && openRemaining > 0;
  const masteryComplete = practice
    ? sessionComplete
    : masteryLearned >= masteryTotal && masteryTotal > 0;
  const percent = sessionTotal ? Math.round((sessionLearnedCount / sessionTotal) * 100) : 0;

  const answer = useCallback(
    (value: TrainerAnswer) => {
      const prevQueue = queueRef.current;
      const idx = prevQueue[0];
      if (idx === undefined) return;
      const card = exercise.cards[idx];
      if (!card) return;

      const prevStats = statsRef.current;
      const nextStat = applyAnswer(prevStats[card.id] ?? createInitialStat(), value);
      const nextStats = { ...prevStats, [card.id]: nextStat };
      const nextQueue = repositionAfterAnswer(prevQueue, idx, nextStat.status);

      setStats(nextStats);
      setQueue(nextQueue);

      // Practice: session-only — do not touch mastery store
      if (practice) return;

      void saveCardProgress({
        profileId,
        lessonId: exercise.lessonId,
        exerciseId: exercise.id,
        cardId: card.id,
        status: nextStat.status,
        correctCount: nextStat.correctCount,
      });

      markExerciseVisited({
        profileId,
        lessonId: exercise.lessonId,
        exerciseId: exercise.id,
        lastCardPreview: exercise.cards[nextQueue[0]]?.arabic,
      });
    },
    [exercise, profileId, saveCardProgress, markExerciseVisited, practice],
  );

  const listen = useCallback(async (): Promise<'ok' | 'muted' | 'missing' | 'error'> => {
    if (!currentCard) return 'error';
    if (!useSettingsStore.getState().soundEnabled) return 'muted';
    if (!currentCard.audioId || resolveAudioSource(currentCard.audioId) == null) {
      log.warn('audio', `listen missing ${currentCard.audioId ?? 'null'}`);
      return 'missing';
    }
    try {
      await playAudio(currentCard.audioId);
      return 'ok';
    } catch (err) {
      log.error('audio', `listen failed ${currentCard.audioId}`, err);
      return 'error';
    }
  }, [currentCard]);

  return {
    exercise,
    currentCard,
    queue,
    queueLength: queue.length,
    sessionIndices: bootstrap.initialQueue,
    learned: sessionLearnedCount,
    total: sessionTotal,
    masteryTotal,
    masteryLearned,
    percent,
    sessionComplete,
    masteryComplete,
    hasMoreSessions,
    completed: sessionComplete,
    stats,
    practice,
    sessionLimit,
    mode,
    answer,
    listen,
  };
}
