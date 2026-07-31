import { getExerciseById } from '@/content';
import { isTrainerExercise } from '@/content/exerciseUtils';
import type { ContentCard, ContentTrainerExercise } from '@/content/types';

import { virtualWeaknessCardId } from './cardKey';
import { PERSONALIZED_EXERCISE_ID } from './constants';
import { listCardsByParentStatus } from './parentAnalytics';
import { prioritizeWeakCards, collectWeakCardEntries } from './selectWeakCards';
import type { AdaptiveCardStats, WeakCardEntry } from './types';
import type { WeaknessCardRef } from './selectWeakCards';

export const PERSONALIZED_SESSION_SIZE = 20;
const NEED_SHARE = 0.75;

function shuffle<T>(items: T[]): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j]!, next[i]!];
  }
  return next;
}

function refsFromEntries(entries: WeakCardEntry[]): WeaknessCardRef[] {
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

function refsFromCardRefs(
  cardRefs: { exerciseId: string; cardId: string; lessonId: string }[],
): WeaknessCardRef[] {
  const refs: WeaknessCardRef[] = [];
  for (const ref of cardRefs) {
    const exercise = getExerciseById(ref.exerciseId);
    if (!exercise || !isTrainerExercise(exercise)) continue;
    const card = exercise.cards.find((c) => c.id === ref.cardId);
    if (!card) continue;
    refs.push({
      virtualId: virtualWeaknessCardId(ref.exerciseId, ref.cardId),
      card,
      sourceExerciseId: ref.exerciseId,
      sourceLessonId: ref.lessonId,
      sourceCardId: ref.cardId,
    });
  }
  return refs;
}

export function selectPersonalizedCards(
  profileId: string,
  byCard: Record<string, AdaptiveCardStats>,
  limit = PERSONALIZED_SESSION_SIZE,
): { refs: WeaknessCardRef[]; needCards: number; secureCards: number } {
  const needCount = Math.max(1, Math.round(limit * NEED_SHARE));
  const secureCount = Math.max(0, limit - needCount);

  const repeatRefs = refsFromCardRefs(
    listCardsByParentStatus(profileId, byCard, 'repeat'),
  );
  const practiceRefs = refsFromCardRefs(
    listCardsByParentStatus(profileId, byCard, 'practice'),
  );
  const secureRefs = refsFromCardRefs(
    listCardsByParentStatus(profileId, byCard, 'secure'),
  );

  const prioritizedNeed = refsFromEntries(
    prioritizeWeakCards(collectWeakCardEntries(profileId, byCard), profileId),
  );

  const needPool = shuffle([
    ...prioritizedNeed,
    ...repeatRefs.filter(
      (r) => !prioritizedNeed.some((p) => p.virtualId === r.virtualId),
    ),
    ...practiceRefs.filter(
      (r) =>
        !prioritizedNeed.some((p) => p.virtualId === r.virtualId) &&
        !repeatRefs.some((x) => x.virtualId === r.virtualId),
    ),
  ]);

  const needSelected = needPool.slice(0, needCount);
  const needIds = new Set(needSelected.map((r) => r.virtualId));

  const secureSelected = shuffle(
    secureRefs.filter((r) => !needIds.has(r.virtualId)),
  ).slice(0, secureCount);

  const combined = shuffle([...needSelected, ...secureSelected]);

  if (combined.length >= limit) {
    const refs = combined.slice(0, limit);
    return {
      refs,
      needCards: Math.min(needSelected.length, refs.length),
      secureCards: refs.length - Math.min(needSelected.length, refs.length),
    };
  }

  // Fill remaining slots from any available cards
  const filler = shuffle([...needPool, ...secureRefs]).filter(
    (r) => !combined.some((c) => c.virtualId === r.virtualId),
  );
  const refs = [...combined, ...filler].slice(0, limit);
  const needCards = refs.filter((r) => needSelected.some((n) => n.virtualId === r.virtualId)).length;
  return { refs, needCards, secureCards: refs.length - needCards };
}

export function buildPersonalizedExercise(
  profileId: string,
  byCard: Record<string, AdaptiveCardStats>,
): {
  exercise: ContentTrainerExercise;
  refs: WeaknessCardRef[];
  needCards: number;
  secureCards: number;
} | null {
  const { refs, needCards, secureCards } = selectPersonalizedCards(profileId, byCard);
  if (refs.length === 0) return null;

  const exercise: ContentTrainerExercise = {
    id: PERSONALIZED_EXERCISE_ID,
    lessonId: 'adaptive',
    title: 'Persönliche Wiederholung',
    type: 'trainer',
    order: 0,
    audioBase: '',
    mode: 'shuffle',
    cards: refs.map((ref) => ({
      ...ref.card,
      id: ref.virtualId,
    })),
  };

  return { exercise, refs, needCards, secureCards };
}

export function buildPersonalizedCardPersistence(
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
