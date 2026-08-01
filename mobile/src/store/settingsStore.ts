import { create } from 'zustand';

import { getItem, setItem, storageKeys } from '@/services/storage';
import type { SessionLimit } from '@/store/exerciseSettingsStore';

export interface AppSettings {
  soundEnabled: boolean;
  animationsEnabled: boolean;
  /** Global default for new exercises / fallback. */
  sessionLimit: SessionLimit;
  /** Betatest: Karten in Übungen markieren und Reports erstellen. */
  betaTestMode: boolean;
}

interface SettingsState extends AppSettings {
  hydrated: boolean;
  hydrate: () => Promise<void>;
  toggleSound: () => Promise<void>;
  toggleAnimations: () => Promise<void>;
  toggleBetaTestMode: () => Promise<void>;
  setSessionLimit: (limit: SessionLimit) => Promise<void>;
}

const defaults: AppSettings = {
  soundEnabled: true,
  animationsEnabled: true,
  sessionLimit: 10,
  betaTestMode: false,
};

function normalizeLimit(value: unknown): SessionLimit {
  if (value === 'all' || value === 10 || value === 20 || value === 30) return value;
  return 10;
}

function snapshot(state: AppSettings): AppSettings {
  return {
    soundEnabled: state.soundEnabled,
    animationsEnabled: state.animationsEnabled,
    sessionLimit: state.sessionLimit,
    betaTestMode: state.betaTestMode,
  };
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...defaults,
  hydrated: false,

  hydrate: async () => {
    const stored = await getItem<Partial<AppSettings>>(storageKeys.settings);
    set({
      ...defaults,
      ...stored,
      sessionLimit: normalizeLimit(stored?.sessionLimit ?? defaults.sessionLimit),
      betaTestMode: stored?.betaTestMode === true,
      hydrated: true,
    });
  },

  toggleSound: async () => {
    const soundEnabled = !get().soundEnabled;
    set({ soundEnabled });
    await setItem(storageKeys.settings, snapshot({ ...get(), soundEnabled }));
  },

  toggleAnimations: async () => {
    const animationsEnabled = !get().animationsEnabled;
    set({ animationsEnabled });
    await setItem(storageKeys.settings, snapshot({ ...get(), animationsEnabled }));
  },

  toggleBetaTestMode: async () => {
    const betaTestMode = !get().betaTestMode;
    set({ betaTestMode });
    await setItem(storageKeys.settings, snapshot({ ...get(), betaTestMode }));
  },

  setSessionLimit: async (sessionLimit) => {
    set({ sessionLimit });
    await setItem(storageKeys.settings, snapshot({ ...get(), sessionLimit }));
  },
}));
