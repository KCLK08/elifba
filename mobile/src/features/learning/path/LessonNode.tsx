import { Pressable, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';

import { Card } from '@/components/ui';

import type { LockStateKind } from './LockState';
import { ProgressRing } from './ProgressRing';
import { getLessonVisual } from './lessonVisuals';

interface LessonNodeProps {
  order: number;
  title: string;
  progress: number;
  state: LockStateKind;
  onPress?: () => void;
}

function statusLabel(state: LockStateKind, progress: number): string {
  if (state === 'locked') return 'Noch gesperrt';
  if (state === 'completed') return 'Geschafft';
  if (state === 'current') return `${Math.round(progress)}% · Weiter`;
  return progress > 0 ? `${Math.round(progress)}%` : 'Bereit';
}

export function LessonNode({ order, title, progress, state, onPress }: LessonNodeProps) {
  const pulse = useSharedValue(1);
  const locked = state === 'locked';
  const visual = getLessonVisual(order);

  useEffect(() => {
    if (state !== 'current') {
      pulse.value = 1;
      return;
    }
    pulse.value = withRepeat(
      withTiming(1.05, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [state, pulse]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: state === 'current' ? pulse.value : 1 }],
  }));

  return (
    <Pressable
      disabled={locked}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ disabled: locked }}
    >
      <Animated.View style={animatedStyle}>
        <Card
          className={`mb-4 flex-row items-center ${
            state === 'current' ? 'border-2 border-primary' : ''
          } ${locked ? 'opacity-50' : ''}`}
        >
          <View
            className="items-center justify-center rounded-full p-1"
            style={{ backgroundColor: visual.accent }}
          >
            <ProgressRing progress={locked ? 0 : progress} size={68}>
              <Text className="text-2xl" accessibilityLabel={visual.label}>
                {visual.emoji}
              </Text>
            </ProgressRing>
          </View>
          <View className="ml-4 flex-1">
            <Text className="mb-1 text-sm font-semibold text-ink-muted">
              Lektion {order} · {visual.label}
            </Text>
            <Text className="text-lg font-bold text-ink">{title}</Text>
            <Text className="mt-1 text-sm text-ink-muted">{statusLabel(state, progress)}</Text>
          </View>
        </Card>
      </Animated.View>
    </Pressable>
  );
}
