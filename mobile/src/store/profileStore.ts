import { create } from 'zustand';

import { getItem, setItem, storageKeys } from '@/services/storage';
import { resolveAvatarId } from '@/constants/avatars';
import { useProgressStore } from '@/store/progressStore';
import { useRewardsStore } from '@/store/rewardsStore';
import { useAdaptiveStore } from '@/store/adaptiveStore';
import type { AvatarId, Profile } from '@/types';

interface ProfileState {
  profiles: Profile[];
  activeProfileId: string | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  hasProfiles: () => boolean;
  getActiveProfile: () => Profile | null;
  setActiveProfile: (id: string) => Promise<void>;
  createProfile: (input: { name: string; avatar: AvatarId }) => Promise<Profile>;
  upsertProfile: (profile: Profile) => Promise<void>;
  updateProfile: (
    id: string,
    patch: Partial<Pick<Profile, 'name' | 'avatar'>>,
  ) => Promise<void>;
  updateActiveProfile: (patch: Partial<Pick<Profile, 'name' | 'avatar'>>) => Promise<void>;
  /** Returns whether any profiles remain after deletion. */
  deleteProfile: (id: string) => Promise<boolean>;
}

async function persist(profiles: Profile[], activeProfileId: string | null) {
  await setItem(storageKeys.profiles, profiles);
  await setItem(storageKeys.activeProfileId, activeProfileId);
}

function newId(): string {
  return `profile-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profiles: [],
  activeProfileId: null,
  hydrated: false,

  hydrate: async () => {
    const raw = (await getItem<Profile[]>(storageKeys.profiles)) ?? [];
    const profiles = raw.map((p) => ({ ...p, avatar: resolveAvatarId(p.avatar) }));
    const storedActive = await getItem<string>(storageKeys.activeProfileId);
    const activeProfileId =
      (storedActive && profiles.some((p) => p.id === storedActive)
        ? storedActive
        : profiles[0]?.id) ?? null;
    set({ profiles, activeProfileId, hydrated: true });
    if (profiles.some((p, i) => p.avatar !== raw[i]?.avatar)) {
      await persist(profiles, activeProfileId);
    }
  },

  hasProfiles: () => get().profiles.length > 0,

  getActiveProfile: () => {
    const { profiles, activeProfileId } = get();
    return profiles.find((p) => p.id === activeProfileId) ?? null;
  },

  setActiveProfile: async (id) => {
    const { profiles } = get();
    if (!profiles.some((p) => p.id === id)) return;
    set({ activeProfileId: id });
    await persist(profiles, id);
  },

  createProfile: async ({ name, avatar }) => {
    const profile: Profile = {
      id: newId(),
      name: name.trim() || 'Freund',
      avatar,
      createdAt: new Date().toISOString(),
    };
    const profiles = [...get().profiles, profile];
    set({ profiles, activeProfileId: profile.id });
    await persist(profiles, profile.id);
    return profile;
  },

  upsertProfile: async (profile) => {
    const { profiles, activeProfileId } = get();
    const next = profiles.some((p) => p.id === profile.id)
      ? profiles.map((p) => (p.id === profile.id ? profile : p))
      : [...profiles, profile];
    const nextActive = activeProfileId ?? profile.id;
    set({ profiles: next, activeProfileId: nextActive });
    await persist(next, nextActive);
  },

  updateProfile: async (id, patch) => {
    const { profiles, activeProfileId } = get();
    if (!profiles.some((p) => p.id === id)) return;
    const next = profiles.map((p) =>
      p.id === id
        ? {
            ...p,
            ...patch,
            ...(patch.name != null ? { name: patch.name.trim() || 'Freund' } : {}),
          }
        : p,
    );
    set({ profiles: next });
    await persist(next, activeProfileId);
  },

  updateActiveProfile: async (patch) => {
    const { activeProfileId } = get();
    if (!activeProfileId) return;
    await get().updateProfile(activeProfileId, patch);
  },

  deleteProfile: async (id) => {
    const { profiles, activeProfileId } = get();
    if (!profiles.some((p) => p.id === id)) return true;

    const nextProfiles = profiles.filter((p) => p.id !== id);
    const nextActiveId =
      activeProfileId === id ? (nextProfiles[0]?.id ?? null) : activeProfileId;

    set({ profiles: nextProfiles, activeProfileId: nextActiveId });
    await persist(nextProfiles, nextActiveId);
    await useProgressStore.getState().removeProfileProgress(id);
    await useRewardsStore.getState().removeProfileRewards(id);
    await useAdaptiveStore.getState().removeProfileAdaptive(id);

    return nextProfiles.length > 0;
  },
}));
