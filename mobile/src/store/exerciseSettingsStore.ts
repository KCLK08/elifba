import { create } from 'zustand';

import { getItem, setItem, storageKeys } from '@/services/storage';
import type { TrainerMode } from '@/types';

export type SessionLimit = 10 | 20 | 30 | 'all';

export interface ExerciseTrainerSettings {
  sessionLimit: SessionLimit;
  mode: TrainerMode;
}

interface ExerciseSettingsState {
  byExercise: Record<string, ExerciseTrainerSettings>;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  getSettings: (exerciseId: string, defaults: ExerciseTrainerSettings) => ExerciseTrainerSettings;
  setSettings: (exerciseId: string, patch: Partial<ExerciseTrainerSettings>) => Promise<void>;
  resetAll: () => Promise<void>;
}

export const useExerciseSettingsStore = create<ExerciseSettingsState>((set, get) => ({
  byExercise: {},
  hydrated: false,

  hydrate: async () => {
    const stored =
      (await getItem<Record<string, Partial<ExerciseTrainerSettings>>>(
        storageKeys.exerciseSettings,
      )) ?? {};
    const byExercise: Record<string, ExerciseTrainerSettings> = {};
    for (const [id, value] of Object.entries(stored)) {
      byExercise[id] = {
        sessionLimit: value.sessionLimit === 'all' || value.sessionLimit === 10 || value.sessionLimit === 20 || value.sessionLimit === 30
          ? value.sessionLimit
          : 10,
        mode: value.mode === 'shuffle' ? 'shuffle' : 'sequence',
      };
    }
    set({ byExercise, hydrated: true });
  },

  getSettings: (exerciseId, defaults) => {
    return get().byExercise[exerciseId] ?? defaults;
  },

  setSettings: async (exerciseId, patch) => {
    const current = get().byExercise[exerciseId] ?? {
      sessionLimit: 10 as SessionLimit,
      mode: 'sequence' as TrainerMode,
    };
    const next = { ...current, ...patch };
    const byExercise = { ...get().byExercise, [exerciseId]: next };
    set({ byExercise });
    await setItem(storageKeys.exerciseSettings, byExercise);
  },

  resetAll: async () => {
    set({ byExercise: {} });
    await setItem(storageKeys.exerciseSettings, {});
  },
}));
