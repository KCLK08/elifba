import { Audio } from 'expo-av';

import { log } from '@/services/logger';

import { resolveAudioSource } from './audioRegistry';

let sound: Audio.Sound | null = null;

export async function configureAudio(): Promise<void> {
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });
  } catch (err) {
    log.error('audio', 'configureAudio failed', err);
  }
}

export async function playAudio(audioId: string): Promise<void> {
  const source = resolveAudioSource(audioId);
  if (source == null) {
    log.warn('audio', `missing asset for ${audioId}`);
    throw new Error(`AUDIO_MISSING:${audioId}`);
  }

  await stopAudio();

  try {
    const { sound: next } = await Audio.Sound.createAsync(source, { shouldPlay: true });
    sound = next;
    next.setOnPlaybackStatusUpdate((status) => {
      if (!status.isLoaded) {
        if ('error' in status && status.error) {
          log.error('audio', `playback error ${audioId}`, status.error);
        }
        return;
      }
      if (status.didJustFinish) {
        void stopAudio();
      }
    });
  } catch (err) {
    log.error('audio', `playAudio failed ${audioId}`, err);
    await stopAudio();
    throw err;
  }
}

export async function stopAudio(): Promise<void> {
  if (!sound) return;
  const current = sound;
  sound = null;
  try {
    current.setOnPlaybackStatusUpdate(null);
    const status = await current.getStatusAsync();
    if (status.isLoaded && status.isPlaying) {
      await current.stopAsync();
    }
  } catch (err) {
    log.warn('audio', 'stopAudio stop failed', err);
  }
  try {
    await current.unloadAsync();
  } catch (err) {
    log.warn('audio', 'stopAudio unload failed', err);
  }
}

/** @deprecated use configureAudio */
export const configureAudioMode = configureAudio;
