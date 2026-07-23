import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

interface StarEarnBurstProps {
  /** Increments to trigger a new burst. */
  burstKey: number;
  visible: boolean;
  onDone?: () => void;
}

/**
 * Short, gentle star pop when a milestone is earned mid-exercise.
 */
export function StarEarnBurst({ burstKey, visible, onDone }: StarEarnBurstProps) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(0);

  useEffect(() => {
    if (!visible || burstKey <= 0) return;
    scale.value = 0.3;
    opacity.value = 1;
    translateY.value = 0;
    scale.value = withSequence(
      withSpring(1.25, { damping: 8, stiffness: 200 }),
      withSpring(1, { damping: 12 }),
    );
    translateY.value = withTiming(-36, { duration: 700 });
    opacity.value = withTiming(0, { duration: 700 }, (finished) => {
      if (finished && onDone) runOnJS(onDone)();
    });
  }, [burstKey, visible, onDone, scale, opacity, translateY]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!visible && burstKey <= 0) return null;

  return (
    <View
      pointerEvents="none"
      className="absolute left-0 right-0 top-16 z-50 items-center"
    >
      <Animated.View style={style} className="items-center rounded-full bg-secondary-soft px-4 py-2">
        <Text className="text-3xl">⭐</Text>
        <Text className="text-sm font-bold text-ink">+1 Stern!</Text>
      </Animated.View>
    </View>
  );
}
