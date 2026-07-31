import { create } from 'zustand';

import { getItem, setItem, storageKeys } from '@/services/storage';

export interface ProfileRewards {
  stars: number;
  streak: number;
  lastStudyDate: string | null;
  exercisesCompleted: number;
  lessonsCompleted: number;
  /** @deprecated migrated into exerciseStars */
  awardedExercises: string[];
  awardedLessons: string[];
  /** Stars already granted per exercise (0–3). Prevents double awards. */
  exerciseStars: Record<string, number>;
}

/** Stable empty rewards — safe for Zustand selectors (must be referentially stable). */
export const EMPTY_REWARDS: ProfileRewards = Object.freeze({
  stars: 0,
  streak: 0,
  lastStudyDate: null,
  exercisesCompleted: 0,
  lessonsCompleted: 0,
  awardedExercises: Object.freeze([]) as unknown as string[],
  awardedLessons: Object.freeze([]) as unknown as string[],
  exerciseStars: Object.freeze({}) as unknown as Record<string, number>,
});

interface RewardsState {
  byProfile: Record<string, ProfileRewards>;
  hydrated: boolean;
  celebration: {
    visible: boolean;
    title: string;
    message: string;
    starsEarned: number;
    kind: 'summary' | 'encourage';
  } | null;
  hydrate: () => Promise<void>;
  getRewards: (profileId: string) => ProfileRewards;
  getExerciseStars: (profileId: string, exerciseId: string) => number;
  /**
   * Award stars up to `targetStars` (0–3) for an exercise.
   * Only the delta is added to the global star balance.
   * Returns how many new stars were granted this call.
   */
  awardExerciseMilestones: (
    profileId: string,
    exerciseId: string,
    targetStars: number,
  ) => Promise<number>;
  /** Track exercise completion without granting stars again. */
  markExerciseCompleted: (profileId: string, exerciseId: string) => Promise<void>;
  awardLessonCompleted: (profileId: string, lessonId: string) => Promise<number>;
  touchStreak: (profileId: string) => Promise<void>;
  dismissCelebration: () => void;
  showCelebration: (input: {
    title: string;
    message: string;
    starsEarned: number;
    kind?: 'summary' | 'encourage';
  }) => void;
  resetAllRewards: () => Promise<void>;
  removeProfileRewards: (profileId: string) => Promise<void>;
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function normalize(raw: Partial<ProfileRewards> | undefined): ProfileRewards {
  if (!raw) {
    return {
      ...EMPTY_REWARDS,
      awardedExercises: [],
      awardedLessons: [],
      exerciseStars: {},
    };
  }
  const awardedExercises = [...(raw.awardedExercises ?? [])];
  const exerciseStars: Record<string, number> = { ...(raw.exerciseStars ?? {}) };
  // Migrate legacy: full exercise award → 3 stars already granted
  for (const id of awardedExercises) {
    if (exerciseStars[id] == null) exerciseStars[id] = 3;
  }
  return {
    stars: Number(raw.stars) || 0,
    streak: Number(raw.streak) || 0,
    lastStudyDate: raw.lastStudyDate ?? null,
    exercisesCompleted: Number(raw.exercisesCompleted) || 0,
    lessonsCompleted: Number(raw.lessonsCompleted) || 0,
    awardedExercises,
    awardedLessons: [...(raw.awardedLessons ?? [])],
    exerciseStars,
  };
}

export const useRewardsStore = create<RewardsState>((set, get) => ({
  byProfile: {},
  hydrated: false,
  celebration: null,

  hydrate: async () => {
    const stored =
      (await getItem<Record<string, Partial<ProfileRewards>>>(storageKeys.rewards)) ?? {};
    const byProfile: Record<string, ProfileRewards> = {};
    for (const [id, value] of Object.entries(stored)) {
      byProfile[id] = normalize(value);
    }
    set({ byProfile, hydrated: true });
  },

  getRewards: (profileId) => get().byProfile[profileId] ?? EMPTY_REWARDS,

  getExerciseStars: (profileId, exerciseId) => {
    const r = get().byProfile[profileId];
    return r?.exerciseStars[exerciseId] ?? 0;
  },

  showCelebration: ({ title, message, starsEarned, kind = 'summary' }) => {
    set({ celebration: { visible: true, title, message, starsEarned, kind } });
  },

  dismissCelebration: () => set({ celebration: null }),

  resetAllRewards: async () => {
    set({ byProfile: {}, celebration: null });
    await setItem(storageKeys.rewards, {});
  },

  removeProfileRewards: async (profileId) => {
    const byProfile = { ...get().byProfile };
    delete byProfile[profileId];
    set({ byProfile });
    await setItem(storageKeys.rewards, byProfile);
  },

  touchStreak: async (profileId) => {
    const current = normalize(get().byProfile[profileId]);
    const today = todayKey();
    if (current.lastStudyDate === today) return;

    let streak = 1;
    if (current.lastStudyDate === yesterdayKey()) {
      streak = current.streak + 1;
    }

    const next = { ...current, streak, lastStudyDate: today };
    const byProfile = { ...get().byProfile, [profileId]: next };
    set({ byProfile });
    await setItem(storageKeys.rewards, byProfile);
  },

  awardExerciseMilestones: async (profileId, exerciseId, targetStars) => {
    const clamped = Math.max(0, Math.min(3, Math.floor(targetStars)));
    await get().touchStreak(profileId);
    const current = normalize(get().byProfile[profileId]);
    const already = current.exerciseStars[exerciseId] ?? 0;
    const delta = clamped - already;
    if (delta <= 0) return 0;

    const next: ProfileRewards = {
      ...current,
      stars: current.stars + delta,
      exerciseStars: { ...current.exerciseStars, [exerciseId]: clamped },
    };
    // Keep awardedExercises in sync when all 3 earned (legacy / completion flags)
    if (clamped >= 3 && !next.awardedExercises.includes(exerciseId)) {
      next.awardedExercises = [...next.awardedExercises, exerciseId];
    }
    const byProfile = { ...get().byProfile, [profileId]: next };
    set({ byProfile });
    await setItem(storageKeys.rewards, byProfile);
    return delta;
  },

  markExerciseCompleted: async (profileId, exerciseId) => {
    await get().touchStreak(profileId);
    const current = normalize(get().byProfile[profileId]);
    if (current.awardedExercises.includes(exerciseId)) return;
    const next: ProfileRewards = {
      ...current,
      exercisesCompleted: current.exercisesCompleted + 1,
      awardedExercises: [...current.awardedExercises, exerciseId],
    };
    const byProfile = { ...get().byProfile, [profileId]: next };
    set({ byProfile });
    await setItem(storageKeys.rewards, byProfile);
  },

  awardLessonCompleted: async (profileId, lessonId) => {
    await get().touchStreak(profileId);
    const current = normalize(get().byProfile[profileId]);
    if (current.awardedLessons.includes(lessonId)) return 0;
    const next: ProfileRewards = {
      ...current,
      lessonsCompleted: current.lessonsCompleted + 1,
      awardedLessons: [...current.awardedLessons, lessonId],
    };
    const byProfile = { ...get().byProfile, [profileId]: next };
    set({ byProfile });
    await setItem(storageKeys.rewards, byProfile);
    return 0;
  },
}));

export function summaryCopy(starsEarned: number): {
  emoji: string;
  title: string;
  message: string;
  kind: 'summary' | 'encourage';
} {
  if (starsEarned >= 3) {
    return {
      emoji: '⭐⭐⭐',
      title: 'Super gemacht!',
      message: 'Du hast heute 3 Sterne gesammelt!',
      kind: 'summary',
    };
  }
  if (starsEarned === 2) {
    return {
      emoji: '⭐⭐',
      title: 'Klasse!',
      message: 'Du hast 2 Sterne gesammelt!',
      kind: 'summary',
    };
  }
  if (starsEarned === 1) {
    return {
      emoji: '⭐',
      title: 'Toll!',
      message: 'Du hast einen Stern gesammelt!',
      kind: 'summary',
    };
  }
  const encourages = [
    {
      emoji: '🙂',
      title: 'Das macht nichts.',
      message: 'Übung macht den Meister.\nVersuch es gleich noch einmal!',
    },
    {
      emoji: '🌱',
      title: 'Heute war es etwas schwer.',
      message: 'Beim nächsten Mal klappt es bestimmt!',
    },
    {
      emoji: '🐥',
      title: 'Jeder fängt einmal klein an.',
      message: 'Du schaffst das!',
    },
  ];
  const pick = encourages[Math.floor(Math.random() * encourages.length)]!;
  return { ...pick, kind: 'encourage' };
}
