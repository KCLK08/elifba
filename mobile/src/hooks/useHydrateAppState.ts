import { useEffect } from 'react';

import { useProfileStore } from '@/store/profileStore';
import { useProgressStore } from '@/store/progressStore';
import { useRewardsStore } from '@/store/rewardsStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useExerciseSettingsStore } from '@/store/exerciseSettingsStore';
import { useAdaptiveStore } from '@/store/adaptiveStore';

/** Hydrate profile, settings, progress, and rewards from AsyncStorage. */
export function useHydrateAppState(): boolean {
  const profileHydrated = useProfileStore((s) => s.hydrated);
  const settingsHydrated = useSettingsStore((s) => s.hydrated);
  const progressHydrated = useProgressStore((s) => s.hydrated);
  const rewardsHydrated = useRewardsStore((s) => s.hydrated);
  const exerciseSettingsHydrated = useExerciseSettingsStore((s) => s.hydrated);
  const adaptiveHydrated = useAdaptiveStore((s) => s.hydrated);
  const hydrateProfile = useProfileStore((s) => s.hydrate);
  const hydrateSettings = useSettingsStore((s) => s.hydrate);
  const hydrateProgress = useProgressStore((s) => s.hydrate);
  const hydrateRewards = useRewardsStore((s) => s.hydrate);
  const hydrateExerciseSettings = useExerciseSettingsStore((s) => s.hydrate);
  const hydrateAdaptive = useAdaptiveStore((s) => s.hydrate);

  useEffect(() => {
    void hydrateProfile();
    void hydrateSettings();
    void hydrateProgress();
    void hydrateRewards();
    void hydrateExerciseSettings();
    void hydrateAdaptive();
  }, [
    hydrateProfile,
    hydrateSettings,
    hydrateProgress,
    hydrateRewards,
    hydrateExerciseSettings,
    hydrateAdaptive,
  ]);

  return (
    profileHydrated &&
    settingsHydrated &&
    progressHydrated &&
    rewardsHydrated &&
    exerciseSettingsHydrated &&
    adaptiveHydrated
  );
}
