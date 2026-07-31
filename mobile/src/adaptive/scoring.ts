import type { TrainerAnswer } from '@/features/learning/trainer/scoring';

import {
  DECAY_DAYS_PER_POINT,
  HISTORY_LIMIT,
  MAX_LEARNING_STAGE,
  MIN_ATTEMPTS_FOR_ANALYSIS,
  WEAKNESS_DELTA,
  WEAKNESS_THRESHOLD,
} from './constants';
import type { AdaptiveCardStats, WeaknessLevel } from './types';

export function createAdaptiveCardStats(input: {
  profileId: string;
  exerciseId: string;
  cardId: string;
  lessonId: string;
}): AdaptiveCardStats {
  return {
    ...input,
    attemptCount: 0,
    correctCount: 0,
    incorrectCount: 0,
    weaknessScore: 0,
    learningStage: 0,
    consecutiveErrors: 0,
    lastAttemptAt: null,
    lastIncorrectAt: null,
    history: [],
  };
}

function daysBetween(fromIso: string, to: Date): number {
  const from = new Date(fromIso).getTime();
  const toMs = to.getTime();
  return Math.max(0, Math.floor((toMs - from) / (1000 * 60 * 60 * 24)));
}

/** Time decay: old mistakes matter less when there was no recent error. */
export function getEffectiveWeaknessScore(
  stats: AdaptiveCardStats,
  now: Date = new Date(),
): number {
  if (!stats.lastIncorrectAt) return stats.weaknessScore;
  const daysSinceError = daysBetween(stats.lastIncorrectAt, now);
  const decay = Math.floor(daysSinceError / DECAY_DAYS_PER_POINT);
  return Math.max(0, stats.weaknessScore - decay);
}

export function classifyWeakness(
  stats: AdaptiveCardStats,
  now: Date = new Date(),
): WeaknessLevel {
  if (stats.attemptCount < MIN_ATTEMPTS_FOR_ANALYSIS) return 'unbekannt';
  const score = getEffectiveWeaknessScore(stats, now);
  if (score <= WEAKNESS_THRESHOLD.stableMax) return 'stabil';
  if (score <= WEAKNESS_THRESHOLD.observeMax) return 'beobachten';
  return 'schwäche';
}

export function needsLearningAttention(
  stats: AdaptiveCardStats,
  now: Date = new Date(),
): boolean {
  if (stats.attemptCount < MIN_ATTEMPTS_FOR_ANALYSIS) return false;
  return getEffectiveWeaknessScore(stats, now) > WEAKNESS_THRESHOLD.stableMax;
}

export function applyAdaptiveAnswer(
  stats: AdaptiveCardStats,
  answer: TrainerAnswer,
  now: Date = new Date(),
): AdaptiveCardStats {
  const answeredAt = now.toISOString();
  const decayedScore = getEffectiveWeaknessScore(stats, now);
  const delta = WEAKNESS_DELTA[answer];
  const weaknessScore = Math.max(0, decayedScore + delta);
  const isCorrect = answer === 'richtig';

  let learningStage = stats.learningStage;
  let consecutiveErrors = stats.consecutiveErrors;

  if (isCorrect) {
    consecutiveErrors = 0;
    learningStage = Math.min(MAX_LEARNING_STAGE, learningStage + 1);
  } else {
    consecutiveErrors += 1;
    learningStage = Math.max(0, learningStage - 1);
  }

  return {
    ...stats,
    attemptCount: stats.attemptCount + 1,
    correctCount: stats.correctCount + (isCorrect ? 1 : 0),
    incorrectCount: stats.incorrectCount + (isCorrect ? 0 : 1),
    weaknessScore,
    learningStage,
    consecutiveErrors,
    lastAttemptAt: answeredAt,
    lastIncorrectAt: isCorrect ? stats.lastIncorrectAt : answeredAt,
    history: [...stats.history, { answer, answeredAt }].slice(-HISTORY_LIMIT),
  };
}
