import { Text, View } from 'react-native';

import { AVATAR_EMOJI, resolveAvatarId } from '@/constants/avatars';
import type { AvatarId } from '@/types';

export interface AvatarProps {
  avatar: AvatarId | string;
  size?: 'sm' | 'md' | 'lg';
}

export function Avatar({ avatar, size = 'md' }: AvatarProps) {
  const resolved = resolveAvatarId(avatar);
  const emojiClass = size === 'lg' ? 'text-5xl' : size === 'md' ? 'text-4xl' : 'text-2xl';
  const boxClass =
    size === 'lg' ? 'h-24 w-24' : size === 'md' ? 'h-16 w-16' : 'h-12 w-12';

  return (
    <View
      className={`items-center justify-center rounded-full bg-secondary-soft ${boxClass}`}
      accessibilityLabel={`Avatar ${resolved}`}
    >
      <Text className={emojiClass}>{AVATAR_EMOJI[resolved]}</Text>
    </View>
  );
}
