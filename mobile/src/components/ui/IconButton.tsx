import { Pressable, type PressableProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '@/constants/theme';

export interface IconButtonProps extends PressableProps {
  name: keyof typeof Ionicons.glyphMap;
  size?: number;
  color?: string;
  accessibilityLabel: string;
  className?: string;
}

export function IconButton({
  name,
  size = 28,
  color = colors.primary,
  accessibilityLabel,
  className,
  disabled,
  ...props
}: IconButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      className={`h-14 w-14 items-center justify-center rounded-full bg-primary-soft ${
        disabled ? 'opacity-50' : 'active:opacity-80'
      } ${className ?? ''}`}
      {...props}
    >
      <Ionicons name={name} size={size} color={color} />
    </Pressable>
  );
}
