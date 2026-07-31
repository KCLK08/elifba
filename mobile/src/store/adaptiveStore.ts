import { create } from 'zustand';

import {
  adaptiveCardKey,
  applyAdaptiveAnswer,
  classifyWeakness,
  collectWeakCardEntries,
  countMasteredCards,
  createAdaptiveCardStats,
  getEffectiveWeaknessScore,
  prioritizeWeakCards,
} from '@/adaptive';
import type {
  AdaptiveCardStats,
  AdaptiveProfileSummary,
  WeakCardEntry,
} from '@/adaptive';
import type { WeaknessCardRef } from '@/adaptive';
import type { TrainerAnswer } from '@/features/learning/trainer/scoring';
import { getItem, setItem, storageKeys } from '@/services/storage';

interface RecordAnswerInput {
  profileId: string;
  exerciseId: string;
  lessonId: string;
  cardId: string;
  answer: TrainerAnswer;
}

export interface PersonalizedSession {
  profileId: string;
  refs: WeaknessCardRef[];
  needCards: number;
  secureCards: number;
}

interface AdaptiveState {
  byCard: Record<string, AdaptiveCardStats>;
  hydrated: boolean;
  personalizedSessions: Record<string, PersonalizedSession>;
  hydrate: () => Promise<void>;
  recordAnswer: (input: RecordAnswerInput) => Promise<void>;
  getCardStats: (
    profileId: string,
    exerciseId: string,
    cardId: string,
  ) => AdaptiveCardStats | null;
  getProfileSummary: (profileId: string) => AdaptiveProfileSummary;
  getWeakCards: (profileId: string, limit?: number) => WeakCardEntry[];
  setPersonalizedSession: (
    profileId: string,
    session: Omit<PersonalizedSession, 'profileId'>,
  ) => void;
  getPersonalizedSession: (profileId: string) => PersonalizedSession | null;
  clearPersonalizedSession: (profileId: string) => void;
  removeProfileAdaptive: (profileId: string) => Promise<void>;
  resetAllAdaptive: () => Promise<void>;
}

async function persist(byCard: Record<string, AdaptiveCardStats>) {
  await setItem(storageKeys.adaptive, byCard);
}

export const useAdaptiveStore = create<AdaptiveState>((set, get) => ({
  byCard: {},
  hydrated: false,
  personalizedSessions: {},

  hydrate: async () => {
    const byCard =
      (await getItem<Record<string, AdaptiveCardStats>>(storageKeys.adaptive)) ?? {};
    set({ byCard, hydrated: true });
  },

  getCardStats: (profileId, exerciseId, cardId) => {
    const key = adaptiveCardKey(profileId, exerciseId, cardId);
    return get().byCard[key] ?? null;
  },

  recordAnswer: async ({ profileId, exerciseId, lessonId, cardId, answer }) => {
    const key = adaptiveCardKey(profileId, exerciseId, cardId);
    const existing =
      get().byCard[key] ??
      createAdaptiveCardStats({ profileId, exerciseId, cardId, lessonId });

    const next = applyAdaptiveAnswer(existing, answer);
    const byCard = { ...get().byCard, [key]: next };
    set({ byCard });
    await persist(byCard);
  },

  getProfileSummary: (profileId) => {
    const cards = Object.values(get().byCard).filter((s) => s.profileId === profileId);
    const now = new Date();
    let stableCards = 0;
    let observeCards = 0;
    let weaknessCards = 0;
    let recentAttempts = 0;
    const weekAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;

    for (const stats of cards) {
      const level = classifyWeakness(stats, now);
      if (level === 'stabil') stableCards += 1;
      else if (level === 'beobachten') observeCards += 1;
      else if (level === 'schwäche') weaknessCards += 1;

      if (stats.lastAttemptAt && new Date(stats.lastAttemptAt).getTime() >= weekAgo) {
        recentAttempts += 1;
      }
    }

    return {
      attemptedCards: cards.filter((c) => c.attemptCount > 0).length,
      completedCards: countMasteredCards(profileId),
      stableCards,
      observeCards,
      weaknessCards,
      recentAttempts,
    };
  },

  getWeakCards: (profileId, limit = 10) => {
    const entries = collectWeakCardEntries(profileId, get().byCard);
    return prioritizeWeakCards(entries, profileId)
      .filter((e: WeakCardEntry) => e.stats.attemptCount >= 5 && e.effectiveWeakness >= 4)
      .slice(0, limit);
  },

  setPersonalizedSession: (profileId, session) => {
    set((state) => ({
      personalizedSessions: {
        ...state.personalizedSessions,
        [profileId]: { profileId, ...session },
      },
    }));
  },

  getPersonalizedSession: (profileId) => get().personalizedSessions[profileId] ?? null,

  clearPersonalizedSession: (profileId) => {
    set((state) => {
      const { [profileId]: _removed, ...rest } = state.personalizedSessions;
      return { personalizedSessions: rest };
    });
  },

  removeProfileAdaptive: async (profileId) => {
    get().clearPersonalizedSession(profileId);
    const prefix = `${profileId}::`;
    const byCard = Object.fromEntries(
      Object.entries(get().byCard).filter(([key]) => !key.startsWith(prefix)),
    );
    set({ byCard });
    await persist(byCard);
  },

  resetAllAdaptive: async () => {
    set({ byCard: {} });
    await persist({});
  },
}));

export function getEffectiveWeaknessForCard(
  stats: AdaptiveCardStats | null,
  now: Date = new Date(),
): number {
  if (!stats) return 0;
  return getEffectiveWeaknessScore(stats, now);
}
