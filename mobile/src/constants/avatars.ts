import type { AvatarId } from '@/types';

/** Only animal emojis — no stars, shapes, or human faces. */
export const AVATAR_EMOJI: Record<AvatarId, string> = {
  fox: '🦊',
  cat: '🐱',
  dog: '🐶',
  panda: '🐼',
  koala: '🐨',
  tiger: '🐯',
  lion: '🦁',
  monkey: '🐵',
  frog: '🐸',
  rabbit: '🐰',
  bear: '🐻',
  penguin: '🐧',
  owl: '🦉',
  turtle: '🐢',
  octopus: '🐙',
  unicorn: '🦄',
};

export const AVATAR_IDS = Object.keys(AVATAR_EMOJI) as AvatarId[];

export const APP_NAME = 'Elifba Kids';

/** Map legacy avatar ids from older installs. */
export function resolveAvatarId(id: string | undefined): AvatarId {
  if (id && id in AVATAR_EMOJI) return id as AvatarId;
  if (id === 'bird' || id === 'star') return 'owl';
  return 'fox';
}
