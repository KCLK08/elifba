import { View } from 'react-native';

import { MilestoneStars } from '@/components/ui/MilestoneStars';
import { cardStatusColors } from '@/constants/theme';
import type { CardStatus } from '@/types';
import type { CardStat } from './scoring';

interface TrainerQueueBarProps {
  /** Active learning queue (front = next card). */
  queue: number[];
  /** Card indices belonging to this session only (fixed length). */
  sessionIndices: number[];
  cardIds: string[];
  stats: Record<string, CardStat>;
  /**
   * Dauerhaft gelernte Karten for star milestones
   * (mastery — not merely session answers).
   */
  starLearned: number;
  /** Total exercise cards for star milestones. */
  starTotal: number;
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
 * Order within the current session only:
 * [gelernt in this session …][active queue …][rest of session …]
 * Segment count = sessionIndices.length (e.g. 10 / 20 / 30 / open cards).
 */
export function buildSessionProgressBarOrder(
  sessionIndices: number[],
  queue: number[],
  cardIds: string[],
  stats: Record<string, CardStat>,
): number[] {
  const inQueue = new Set(queue);
  const learned: number[] = [];
  const waiting: number[] = [];

  for (const i of sessionIndices) {
    const id = cardIds[i];
    if (!id) continue;
    if (stats[id]?.status === 'gelernt') {
      if (!inQueue.has(i)) learned.push(i);
    } else if (!inQueue.has(i)) {
      waiting.push(i);
    }
  }

  return [...learned, ...queue, ...waiting];
}

/**
 * Progress strip for the current session only (session-limit length).
 * Stars above use durable mastery percent.
 */
export function TrainerQueueBar({
  queue,
  sessionIndices,
  cardIds,
  stats,
  starLearned,
  starTotal,
}: TrainerQueueBarProps) {
  const order = buildSessionProgressBarOrder(sessionIndices, queue, cardIds, stats);
  const starPercent = starTotal ? Math.round((starLearned / starTotal) * 100) : 0;
  const sessionLearned = sessionIndices.filter((i) => {
    const id = cardIds[i];
    return id ? stats[id]?.status === 'gelernt' : false;
  }).length;

  return (
    <View className="mb-2 w-full">
      <MilestoneStars progress={starPercent} />
      <View
        className="min-h-[14px] w-full justify-center overflow-hidden rounded-full bg-primary-soft px-0.5 py-0.5"
        accessibilityRole="progressbar"
        accessibilityValue={{
          now: sessionLearned,
          min: 0,
          max: sessionIndices.length,
        }}
        accessibilityLabel={`Session: ${sessionLearned} von ${sessionIndices.length} Karten · Gesamt gelernt ${starLearned} von ${starTotal}`}
      >
        <View className="h-2.5 w-full flex-row items-stretch overflow-hidden rounded-full">
          {order.length === 0 ? (
            <View
              className="h-full flex-1 rounded-full"
              style={{ backgroundColor: cardStatusColors.unbeantwortet }}
            />
          ) : (
            order.map((cardIndex) => {
              const id = cardIds[cardIndex] ?? `idx-${cardIndex}`;
              return (
                <View
                  key={id}
                  className="h-full flex-1"
                  style={{
                    backgroundColor: colorFor(stats[id]?.status),
                    marginHorizontal: 0.5,
                    borderRadius: 2,
                  }}
                />
              );
            })
          )}
        </View>
      </View>
    </View>
  );
}
