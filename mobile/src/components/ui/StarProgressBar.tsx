import { Text, View } from 'react-native';

import { colors } from '@/constants/theme';

import { MilestoneStars } from './MilestoneStars';

export { starsEarnedFromProgress } from './starMilestones';

export interface StarProgressBarProps {
  /** 0–100, based on gelernt cards */
  progress: number;
  label?: string;
  height?: number;
}

/**
 * Stars centered above the bar; bar is progress-only.
 */
export function StarProgressBar({ progress, label, height = 14 }: StarProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, progress));

  return (
    <View className="w-full gap-1">
      {label ? <Text className="mb-1 text-base font-semibold text-ink-muted">{label}</Text> : null}
      <MilestoneStars progress={clamped} />
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
