import { exercises } from '@/content';
import { isTrainerExercise } from '@/content/exerciseUtils';
import { useProgressStore } from '@/store/progressStore';
import type { CardStatus } from '@/types';

import { MIN_ATTEMPTS_FOR_ANALYSIS, WEAKNESS_THRESHOLD } from './constants';
import { classifyWeakness, getEffectiveWeaknessScore } from './scoring';
import type { AdaptiveCardStats } from './types';

export type ParentCardStatus = 'secure' | 'practice' | 'repeat';

export interface ParentDashboardStats {
  totalCards: number;
  attemptedCards: number;
  completedCards: number;
  inProgressCards: number;
  stillToLearn: number;
  statusCounts: Record<ParentCardStatus, number>;
  weekly: ParentWeeklyStats;
}

export interface ParentWeeklyStats {
  /** Estimated practice sessions in the last 7 days. */
  practiceSessions: number;
  totalAnswers: number;
  correctAnswers: number;
  incorrectAnswers: number;
  correctPercent: number;
  activeDays: number;
}

interface CardRef {
  exerciseId: string;
  cardId: string;
  lessonId: string;
}

function listAllTrainerCards(): CardRef[] {
  const refs: CardRef[] = [];
  for (const exercise of exercises) {
    if (!isTrainerExercise(exercise)) continue;
    for (const card of exercise.cards) {
      refs.push({
        exerciseId: exercise.id,
        cardId: card.id,
        lessonId: exercise.lessonId,
      });
    }
  }
  return refs;
}

function getCardProgress(
  profileId: string,
  exerciseId: string,
  cardId: string,
): CardStatus | null {
  const record = useProgressStore.getState().loadExerciseProgress(profileId, exerciseId);
  return record?.cards[cardId]?.status ?? null;
}

function getAdaptiveStats(
  profileId: string,
  exerciseId: string,
  cardId: string,
  byCard: Record<string, AdaptiveCardStats>,
): AdaptiveCardStats | null {
  const key = `${profileId}::${exerciseId}::${cardId}`;
  return byCard[key] ?? null;
}

export function classifyParentCardStatus(
  progressStatus: CardStatus | null,
  adaptive: AdaptiveCardStats | null,
  now: Date = new Date(),
): ParentCardStatus {
  const mastered = progressStatus === 'gelernt';
  const attempted = progressStatus != null || (adaptive?.attemptCount ?? 0) > 0;

  if (adaptive && adaptive.attemptCount >= MIN_ATTEMPTS_FOR_ANALYSIS) {
    const weakness = getEffectiveWeaknessScore(adaptive, now);
    const level = classifyWeakness(adaptive, now);

    if (weakness >= WEAKNESS_THRESHOLD.observeMax + 1 || level === 'schwäche') {
      return 'repeat';
    }
    if (weakness > WEAKNESS_THRESHOLD.stableMax || level === 'beobachten') {
      return mastered ? 'practice' : 'repeat';
    }
    if (mastered) return 'secure';
    return 'practice';
  }

  if (mastered) return 'secure';
  if (attempted) return 'practice';
  return 'repeat';
}

function collectWeeklyAnswers(
  profileId: string,
  byCard: Record<string, AdaptiveCardStats>,
  now: Date = new Date(),
): ParentWeeklyStats {
  const weekAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
  let totalAnswers = 0;
  let correctAnswers = 0;
  let incorrectAnswers = 0;
  const answersByDay = new Map<string, number>();

  for (const stats of Object.values(byCard)) {
    if (stats.profileId !== profileId) continue;
    for (const entry of stats.history) {
      const ts = new Date(entry.answeredAt).getTime();
      if (ts < weekAgo) continue;
      totalAnswers += 1;
      if (entry.answer === 'richtig') correctAnswers += 1;
      else incorrectAnswers += 1;
      const day = entry.answeredAt.slice(0, 10);
      answersByDay.set(day, (answersByDay.get(day) ?? 0) + 1);
    }
  }

  let practiceSessions = 0;
  for (const count of answersByDay.values()) {
    practiceSessions += Math.max(1, Math.round(count / 10));
  }

  const correctPercent =
    totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0;

  return {
    practiceSessions,
    totalAnswers,
    correctAnswers,
    incorrectAnswers,
    correctPercent,
    activeDays: answersByDay.size,
  };
}

export function computeParentDashboardStats(
  profileId: string,
  byCard: Record<string, AdaptiveCardStats>,
  now: Date = new Date(),
): ParentDashboardStats {
  const allCards = listAllTrainerCards();
  const statusCounts: Record<ParentCardStatus, number> = {
    secure: 0,
    practice: 0,
    repeat: 0,
  };

  let attemptedCards = 0;
  let completedCards = 0;
  let inProgressCards = 0;

  for (const ref of allCards) {
    const progressStatus = getCardProgress(profileId, ref.exerciseId, ref.cardId);
    const adaptive = getAdaptiveStats(profileId, ref.exerciseId, ref.cardId, byCard);
    const attempted = progressStatus != null || (adaptive?.attemptCount ?? 0) > 0;
    const mastered = progressStatus === 'gelernt';

    if (attempted) attemptedCards += 1;
    if (mastered) completedCards += 1;
    if (attempted && !mastered) inProgressCards += 1;

    const status = classifyParentCardStatus(progressStatus, adaptive, now);
    statusCounts[status] += 1;
  }

  const stillToLearn = statusCounts.practice + statusCounts.repeat;

  return {
    totalCards: allCards.length,
    attemptedCards,
    completedCards,
    inProgressCards,
    stillToLearn,
    statusCounts,
    weekly: collectWeeklyAnswers(profileId, byCard, now),
  };
}

export function listCardsByParentStatus(
  profileId: string,
  byCard: Record<string, AdaptiveCardStats>,
  status: ParentCardStatus,
  now: Date = new Date(),
): CardRef[] {
  const refs: CardRef[] = [];
  for (const ref of listAllTrainerCards()) {
    const progressStatus = getCardProgress(profileId, ref.exerciseId, ref.cardId);
    const adaptive = getAdaptiveStats(profileId, ref.exerciseId, ref.cardId, byCard);
    if (classifyParentCardStatus(progressStatus, adaptive, now) === status) {
      refs.push(ref);
    }
  }
  return refs;
}
