import { Text, View } from 'react-native';

import { colors } from '@/constants/theme';

export interface ProgressBarProps {
  progress: number;
  label?: string;
  height?: number;
}

export function ProgressBar({ progress, label, height = 14 }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, progress));

  return (
    <View className="w-full gap-2">
      {label ? <Text className="text-base font-semibold text-ink-muted">{label}</Text> : null}
      <View
        className="w-full overflow-hidden rounded-full bg-primary-soft"
        style={{ height }}
        accessibilityRole="progressbar"
        accessibilityValue={{ now: clamped, min: 0, max: 100 }}
      >
        <View
          className="h-full rounded-full"
          style={{ width: `${clamped}%`, backgroundColor: colors.primary }}
        />
      </View>
    </View>
  );
}
