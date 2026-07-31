import { create } from 'zustand';

import { getItem, setItem, removeItem, storageKeys } from '@/services/storage';
import type { CardStatus, Session } from '@/types';

export interface CardProgressRecord {
  status: CardStatus;
  correctCount: number;
  updatedAt: string;
}

export interface ExerciseProgressRecord {
  profileId: string;
  lessonId: string;
  exerciseId: string;
  cards: Record<string, CardProgressRecord>;
  updatedAt: string;
}

interface ProgressState {
  byExercise: Record<string, ExerciseProgressRecord>;
  session: Session | null;
  /** Increments on full reset so UI rebinds even if maps look empty. */
  progressEpoch: number;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  loadExerciseProgress: (
    profileId: string,
    exerciseId: string,
  ) => ExerciseProgressRecord | null;
  saveCardProgress: (input: {
    profileId: string;
    lessonId: string;
    exerciseId: string;
    cardId: string;
    status: CardStatus;
    correctCount: number;
  }) => Promise<void>;
  markExerciseVisited: (input: {
    profileId: string;
    lessonId: string;
    exerciseId: string;
    lastCardPreview?: string;
  }) => void;
  getExercisePercent: (profileId: string, exerciseId: string, totalCards: number) => number;
  getLessonPercent: (
    profileId: string,
    lessonId: string,
    exerciseTotals: { exerciseId: string; total: number }[],
  ) => number;
  /** Clears all mastery progress + resume session (profiles stay). */
  resetLocalProgress: () => Promise<void>;
  removeProfileProgress: (profileId: string) => Promise<void>;
}

function exerciseKey(profileId: string, exerciseId: string): string {
  return `${profileId}::${exerciseId}`;
}

export const useProgressStore = create<ProgressState>((set, get) => ({
  byExercise: {},
  session: null,
  progressEpoch: 0,
  hydrated: false,

  hydrate: async () => {
    const byExercise =
      (await getItem<Record<string, ExerciseProgressRecord>>(storageKeys.progress)) ?? {};
    const session = (await getItem<Session>(storageKeys.session)) ?? null;
    set({ byExercise, session, hydrated: true });
  },

  loadExerciseProgress: (profileId, exerciseId) => {
    return get().byExercise[exerciseKey(profileId, exerciseId)] ?? null;
  },

  saveCardProgress: async ({
    profileId,
    lessonId,
    exerciseId,
    cardId,
    status,
    correctCount,
  }) => {
    const key = exerciseKey(profileId, exerciseId);
    const existing = get().byExercise[key];
    const updatedAt = new Date().toISOString();
    const cards = { ...(existing?.cards ?? {}) };
    cards[cardId] = { status, correctCount, updatedAt };

    const record: ExerciseProgressRecord = {
      profileId,
      lessonId,
      exerciseId,
      cards,
      updatedAt,
    };

    const byExercise = { ...get().byExercise, [key]: record };
    set({ byExercise });
    await setItem(storageKeys.progress, byExercise);
  },

  markExerciseVisited: ({ profileId, lessonId, exerciseId, lastCardPreview }) => {
    const session: Session = {
      profileId,
      lessonId,
      exerciseId,
      mode: 'sequence',
      lastCardPreview,
      updatedAt: new Date().toISOString(),
    };
    set({ session });
    void setItem(storageKeys.session, session);
  },

  getExercisePercent: (profileId, exerciseId, totalCards) => {
    if (!totalCards) return 0;
    const record = get().byExercise[exerciseKey(profileId, exerciseId)];
    if (!record) return 0;
    const learned = Object.values(record.cards).filter((c) => c.status === 'gelernt').length;
    return Math.round((learned / totalCards) * 100);
  },

  getLessonPercent: (profileId, lessonId, exerciseTotals) => {
    const total = exerciseTotals.reduce((sum, e) => sum + e.total, 0);
    if (!total) return 0;
    const learned = exerciseTotals.reduce((sum, e) => {
      const record = get().byExercise[exerciseKey(profileId, e.exerciseId)];
      if (!record) return sum;
      return (
        sum + Object.values(record.cards).filter((c) => c.status === 'gelernt').length
      );
    }, 0);
    return Math.round((learned / total) * 100);
  },

  resetLocalProgress: async () => {
    set({
      byExercise: {},
      session: null,
      progressEpoch: get().progressEpoch + 1,
    });
    await removeItem(storageKeys.progress);
    await removeItem(storageKeys.session);
    await setItem(storageKeys.progress, {});
  },

  removeProfileProgress: async (profileId) => {
    const prefix = `${profileId}::`;
    const byExercise = Object.fromEntries(
      Object.entries(get().byExercise).filter(([key]) => !key.startsWith(prefix)),
    );
    const session = get().session?.profileId === profileId ? null : get().session;
    set({
      byExercise,
      session,
      progressEpoch: get().progressEpoch + 1,
    });
    await setItem(storageKeys.progress, byExercise);
    if (session) {
      await setItem(storageKeys.session, session);
    } else {
      await removeItem(storageKeys.session);
    }
  },
}));
