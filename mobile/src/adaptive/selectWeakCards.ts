import { exercises, getExerciseById } from '@/content';
import { isTrainerExercise } from '@/content/exerciseUtils';
import type { ContentCard, ContentTrainerExercise } from '@/content/types';
import { useProgressStore } from '@/store/progressStore';

import { virtualWeaknessCardId } from './cardKey';
import { WEAKNESS_EXERCISE_ID, WEAKNESS_SESSION_LIMIT } from './constants';
import { classifyWeakness, getEffectiveWeaknessScore } from './scoring';
import type { AdaptiveCardStats, WeakCardEntry } from './types';

export interface WeaknessCardRef {
  virtualId: string;
  card: ContentCard;
  sourceExerciseId: string;
  sourceLessonId: string;
  sourceCardId: string;
}

function isMastered(profileId: string, exerciseId: string, cardId: string): boolean {
  const record = useProgressStore.getState().loadExerciseProgress(profileId, exerciseId);
  return record?.cards[cardId]?.status === 'gelernt';
}

export function collectWeakCardEntries(
  profileId: string,
  byCard: Record<string, AdaptiveCardStats>,
  now: Date = new Date(),
): WeakCardEntry[] {
  const entries: WeakCardEntry[] = [];

  for (const stats of Object.values(byCard)) {
    if (stats.profileId !== profileId) continue;
    if (stats.attemptCount < 1) continue;

    const exercise = getExerciseById(stats.exerciseId);
    if (!exercise || !isTrainerExercise(exercise)) continue;
    const card = exercise.cards.find((c) => c.id === stats.cardId);
    if (!card) continue;

    const effectiveWeakness = getEffectiveWeaknessScore(stats, now);
    const level = classifyWeakness(stats, now);

    entries.push({
      stats,
      effectiveWeakness,
      level,
      arabic: card.arabic,
      exerciseTitle: exercise.title,
    });
  }

  return entries;
}

export function prioritizeWeakCards(
  entries: WeakCardEntry[],
  profileId: string,
  now: Date = new Date(),
): WeakCardEntry[] {
  return [...entries].sort((a, b) => {
    const aAnalyzable = a.stats.attemptCount >= 5;
    const bAnalyzable = b.stats.attemptCount >= 5;

    // 1. Highest effective weakness (analyzable cards first)
    if (aAnalyzable !== bAnalyzable) return aAnalyzable ? -1 : 1;
    if (a.effectiveWeakness !== b.effectiveWeakness) {
      return b.effectiveWeakness - a.effectiveWeakness;
    }

    // 2. Consecutive errors
    if (a.stats.consecutiveErrors !== b.stats.consecutiveErrors) {
      return b.stats.consecutiveErrors - a.stats.consecutiveErrors;
    }

    // 3. Lower mastery progress (not gelernt)
    const aMastered = isMastered(profileId, a.stats.exerciseId, a.stats.cardId) ? 1 : 0;
    const bMastered = isMastered(profileId, b.stats.exerciseId, b.stats.cardId) ? 1 : 0;
    if (aMastered !== bMastered) return aMastered - bMastered;

    // 4. Longest since last secure (correct) answer
    const aLast = a.stats.lastAttemptAt ? new Date(a.stats.lastAttemptAt).getTime() : 0;
    const bLast = b.stats.lastAttemptAt ? new Date(b.stats.lastAttemptAt).getTime() : 0;
    return aLast - bLast;
  });
}

export function selectWeaknessCards(
  profileId: string,
  byCard: Record<string, AdaptiveCardStats>,
  limit = WEAKNESS_SESSION_LIMIT,
  now: Date = new Date(),
): WeaknessCardRef[] {
  const entries = collectWeakCardEntries(profileId, byCard, now);

  const prioritized = prioritizeWeakCards(entries, profileId, now).filter(
    (e) => e.stats.attemptCount >= 5 && e.effectiveWeakness >= 4,
  );

  if (prioritized.length === 0) {
    // Fallback: cards with any learning signal, still prioritized
    const fallback = prioritizeWeakCards(entries, profileId, now).filter(
      (e) => e.stats.attemptCount >= 1,
    );
    return buildRefs(fallback.slice(0, limit));
  }

  return buildRefs(prioritized.slice(0, limit));
}

function buildRefs(entries: WeakCardEntry[]): WeaknessCardRef[] {
  const refs: WeaknessCardRef[] = [];
  for (const entry of entries) {
    const exercise = getExerciseById(entry.stats.exerciseId);
    if (!exercise || !isTrainerExercise(exercise)) continue;
    const card = exercise.cards.find((c) => c.id === entry.stats.cardId);
    if (!card) continue;
    refs.push({
      virtualId: virtualWeaknessCardId(entry.stats.exerciseId, entry.stats.cardId),
      card,
      sourceExerciseId: entry.stats.exerciseId,
      sourceLessonId: entry.stats.lessonId,
      sourceCardId: entry.stats.cardId,
    });
  }
  return refs;
}

export function buildWeaknessExercise(
  profileId: string,
  byCard: Record<string, AdaptiveCardStats>,
): ContentTrainerExercise | null {
  const refs = selectWeaknessCards(profileId, byCard);
  if (refs.length === 0) return null;

  return {
    id: WEAKNESS_EXERCISE_ID,
    lessonId: 'adaptive',
    title: 'Meine Schwächen üben',
    type: 'trainer',
    order: 0,
    audioBase: '',
    mode: 'shuffle',
    cards: refs.map((ref) => ({
      ...ref.card,
      id: ref.virtualId,
    })),
  };
}

export function buildWeaknessCardPersistence(
  refs: WeaknessCardRef[],
): Record<string, { exerciseId: string; lessonId: string; cardId: string }> {
  const map: Record<string, { exerciseId: string; lessonId: string; cardId: string }> = {};
  for (const ref of refs) {
    map[ref.virtualId] = {
      exerciseId: ref.sourceExerciseId,
      lessonId: ref.sourceLessonId,
      cardId: ref.sourceCardId,
    };
  }
  return map;
}

/** Count mastered cards across all trainer exercises for profile overview. */
export function countMasteredCards(profileId: string): number {
  let count = 0;
  for (const exercise of exercises) {
    if (!isTrainerExercise(exercise)) continue;
    const record = useProgressStore.getState().loadExerciseProgress(profileId, exercise.id);
    if (!record) continue;
    count += exercise.cards.filter((c) => record.cards[c.id]?.status === 'gelernt').length;
  }
  return count;
}
