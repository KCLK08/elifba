import { Text, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';

import { Button, Modal } from '@/components/ui';
import { useRewardsStore } from '@/store/rewardsStore';

export function CelebrationModal() {
  const celebration = useRewardsStore((s) => s.celebration);
  const dismiss = useRewardsStore((s) => s.dismissCelebration);

  if (!celebration?.visible) return null;

  const isEncourage = celebration.kind === 'encourage';

  return (
    <Modal
      visible
      title={celebration.title}
      message={celebration.message}
      onClose={dismiss}
    >
      <Animated.View entering={ZoomIn.springify()} className="mb-4 items-center">
        {!isEncourage && celebration.starsEarned > 0 ? (
          <>
            <Text className="text-5xl">
              {'⭐'.repeat(Math.min(3, celebration.starsEarned))}
            </Text>
            <Text className="mt-2 text-2xl font-bold text-secondary">
              +{celebration.starsEarned}{' '}
              {celebration.starsEarned === 1 ? 'Stern' : 'Sterne'}
            </Text>
          </>
        ) : (
          <Text className="text-6xl">{isEncourage ? '🌱' : '⭐'}</Text>
        )}
      </Animated.View>
      <Animated.View entering={FadeIn.delay(150)}>
        <Button label="Weiter" onPress={dismiss} />
      </Animated.View>
    </Modal>
  );
}

/** Compact star + streak strip for Home. */
export function RewardsStrip({ stars, streak }: { stars: number; streak: number }) {
  return (
    <View className="mb-5 flex-row gap-3">
      <View className="flex-1 flex-row items-center rounded-card bg-secondary-soft px-4 py-3">
        <Text className="mr-2 text-2xl">⭐</Text>
        <View>
          <Text className="text-xs font-semibold text-ink-muted">Sterne</Text>
          <Text className="text-xl font-bold text-ink">{stars}</Text>
        </View>
      </View>
      <View className="flex-1 flex-row items-center rounded-card bg-primary-soft px-4 py-3">
        <Text className="mr-2 text-2xl">🔥</Text>
        <View>
          <Text className="text-xs font-semibold text-ink-muted">Serie</Text>
          <Text className="text-xl font-bold text-ink">{streak} Tage</Text>
        </View>
      </View>
    </View>
  );
}
