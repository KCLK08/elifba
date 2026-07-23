import { View } from 'react-native';

import { cardStatusColors } from '@/constants/theme';
import type { CardStatus } from '@/types';
import type { CardStat } from './scoring';

interface TrainerStatusBarProps {
  cardIds: string[];
  stats: Record<string, CardStat>;
}

function colorFor(status: CardStatus | undefined): string {
  switch (status) {
    case 'gelernt':
      return cardStatusColors.gelernt;
    case 'richtig':
      return cardStatusColors.richtig;
    case 'unsicher':
      return cardStatusColors.unsicher;
    case 'falsch':
      return cardStatusColors.falsch;
    case 'unbeantwortet':
    default:
      return cardStatusColors.unbeantwortet;
  }
}

/**
 * One segment per card — shows round progress, not only “gelernt”.
 * Neutral · Falsch rot · Unsicher gelb · Richtig hellgrün · Gelernt dunkelgrün
 */
export function TrainerStatusBar({ cardIds, stats }: TrainerStatusBarProps) {
  return (
    <View
      className="mb-3 h-3 w-full flex-row overflow-hidden rounded-full bg-primary-soft"
      accessibilityRole="progressbar"
    >
      {cardIds.map((id) => (
        <View
          key={id}
          className="h-full flex-1"
          style={{
            backgroundColor: colorFor(stats[id]?.status),
            marginHorizontal: 0.5,
          }}
        />
      ))}
    </View>
  );
}
