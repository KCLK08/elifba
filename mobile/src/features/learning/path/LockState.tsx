import { Text, View } from 'react-native';

export type LockStateKind = 'locked' | 'current' | 'completed' | 'available';

interface LockStateProps {
  state: LockStateKind;
}

export function LockState({ state }: LockStateProps) {
  if (state === 'locked') {
    return (
      <View className="h-12 w-12 items-center justify-center rounded-full bg-ink-light/30">
        <Text className="text-2xl">🔒</Text>
      </View>
    );
  }
  if (state === 'completed') {
    return (
      <View className="h-12 w-12 items-center justify-center rounded-full bg-secondary-soft">
        <Text className="text-2xl">⭐</Text>
      </View>
    );
  }
  return (
    <View className="h-12 w-12 items-center justify-center rounded-full bg-primary-soft">
      <Text className="text-2xl">{state === 'current' ? '▶️' : '📖'}</Text>
    </View>
  );
}
