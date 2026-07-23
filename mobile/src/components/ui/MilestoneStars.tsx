import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { starsEarnedFromProgress } from './starMilestones';
import { useSettingsStore } from '@/store/settingsStore';

interface MilestoneStarsProps {
  /** 0–100 learned percent for this display context */
  progress: number;
}

function PopStar({ visible, animate }: { visible: boolean; animate: boolean }) {
  const scale = useSharedValue(visible && !animate ? 1 : 0.2);

  useEffect(() => {
    if (!visible) {
      scale.value = 0.2;
      return;
    }
    if (animate) {
      scale.value = 0.2;
      scale.value = withSpring(1, { damping: 8, stiffness: 180 });
    } else {
      scale.value = 1;
    }
  }, [visible, animate, scale]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: visible ? 1 : 0.15,
  }));

  return (
    <Animated.View style={style} className="mx-2">
      <Text className="text-2xl">{visible ? '⭐' : '☆'}</Text>
    </Animated.View>
  );
}

/**
 * Three milestone stars centered above a progress bar.
 * Pop-animates only when a new threshold is crossed (not on remount of already-earned).
 */
export function MilestoneStars({ progress }: MilestoneStarsProps) {
  const animationsEnabled = useSettingsStore((s) => s.animationsEnabled);
  const earned = starsEarnedFromProgress(progress);
  const initialized = useRef(false);
  const [popIndex, setPopIndex] = useState<number | null>(null);
  const revealed = useRef(0);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      revealed.current = earned;
      return;
    }
    if (earned > revealed.current) {
      const newly = revealed.current; // index of first new star (0-based)
      revealed.current = earned;
      if (animationsEnabled) {
        setPopIndex(newly);
        const t = setTimeout(() => setPopIndex(null), 600);
        return () => clearTimeout(t);
      }
    }
    return undefined;
  }, [earned, animationsEnabled]);

  return (
    <View
      className="mb-2 w-full flex-row items-center justify-center"
      accessibilityLabel={`${earned} von 3 Sternen`}
    >
      {[0, 1, 2].map((index) => (
        <PopStar
          key={index}
          visible={index < earned}
          animate={animationsEnabled && popIndex === index}
        />
      ))}
    </View>
  );
}
