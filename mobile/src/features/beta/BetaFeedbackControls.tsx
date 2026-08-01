import { Pressable, Text, View } from 'react-native';

import type { BetaFeedbackPhase } from './useBetaFeedbackSession';

interface BetaFeedbackControlsProps {
  phase: BetaFeedbackPhase;
  issueCount: number;
  primaryLabel: string;
  onPrimaryPress: () => void;
  onSwitchToFinish: () => void;
  onSwitchToMarking: () => void;
}

export function BetaFeedbackControls({
  phase,
  issueCount,
  primaryLabel,
  onPrimaryPress,
  onSwitchToFinish,
  onSwitchToMarking,
}: BetaFeedbackControlsProps) {
  return (
    <View className="mb-2 rounded-2xl border border-warning bg-warning-soft px-3 py-3">
      <Text className="mb-2 text-center text-xs font-semibold uppercase tracking-wide text-ink-muted">
        Betatest
      </Text>

      <Pressable
        onPress={onPrimaryPress}
        className="min-h-[52px] items-center justify-center rounded-button bg-warning active:opacity-90"
        accessibilityRole="button"
        accessibilityLabel={primaryLabel}
      >
        <Text className="text-center text-lg font-bold text-ink">{primaryLabel}</Text>
      </Pressable>

      {issueCount > 0 ? (
        <View className="mt-2">
          {phase === 'marking' ? (
            <Pressable onPress={onSwitchToFinish} accessibilityRole="button">
              <Text className="text-center text-sm font-semibold text-primary">
                Fertig — Report erstellen ({issueCount})
              </Text>
            </Pressable>
          ) : (
            <Pressable onPress={onSwitchToMarking} accessibilityRole="button">
              <Text className="text-center text-sm font-semibold text-ink-muted">
                Weitere Karte markieren
              </Text>
            </Pressable>
          )}
        </View>
      ) : (
        <Text className="mt-2 text-center text-xs text-ink-muted">
          Aktuelle Karte markieren, wenn etwas falsch ist.
        </Text>
      )}
    </View>
  );
}
