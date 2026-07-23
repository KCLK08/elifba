import AsyncStorage from '@react-native-async-storage/async-storage';

import { log } from '@/services/logger';

const PREFIX = '@elifba_kids:';

export const storageKeys = {
  profiles: 'profiles',
  activeProfileId: 'active_profile_id',
  settings: 'settings',
  session: 'session',
  progress: 'progress',
  rewards: 'rewards',
  exerciseSettings: 'exercise_settings',
} as const;


export async function getItem<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(PREFIX + key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch (err) {
      log.error('storage', `JSON parse failed for ${key}`, err);
      return null;
    }
  } catch (err) {
    log.error('storage', `getItem failed for ${key}`, err);
    return null;
  }
}

export async function setItem<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch (err) {
    log.error('storage', `setItem failed for ${key}`, err);
    throw err;
  }
}

export async function removeItem(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(PREFIX + key);
  } catch (err) {
    log.error('storage', `removeItem failed for ${key}`, err);
    throw err;
  }
}
