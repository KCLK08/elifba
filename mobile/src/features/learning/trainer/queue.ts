import { RED_POS, YELLOW_POS, type CardStat } from './scoring';
import type { SessionLimit } from '@/store/exerciseSettingsStore';
import type { TrainerMode } from '@/types';

export type PracticeFilter = 'skipLearned' | 'all' | 'hardOnly';

export interface BuildQueueOptions {
  filter?: PracticeFilter;
  sessionLimit?: SessionLimit;
  mode?: TrainerMode;
}

function shuffleInPlace(indices: number[]): number[] {
  for (let i = indices.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = indices[i]!;
    indices[i] = indices[j]!;
    indices[j] = tmp;
  }
  return indices;
}

/**
 * Build session queue as card indices.
 * - skipLearned: omit mastery-gelernt (normal learning)
 * - all: practice replay (fresh session stats usually)
 * - sessionLimit: cap how many cards enter this session
 * - mode shuffle: randomize candidate order before capping
 */
export function buildInitialQueue(
  cardCount: number,
  stats: Record<string, CardStat>,
  cardIds: string[],
  options: BuildQueueOptions | PracticeFilter = 'skipLearned',
): number[] {
  const opts: BuildQueueOptions =
    typeof options === 'string' ? { filter: options } : options;
  const filter = opts.filter ?? 'skipLearned';
  const sessionLimit = opts.sessionLimit ?? 'all';
  const mode = opts.mode ?? 'sequence';

  const queue: number[] = [];
  for (let i = 0; i < cardCount; i += 1) {
    const id = cardIds[i];
    const status = stats[id]?.status;
    if (filter === 'skipLearned' && status === 'gelernt') continue;
    if (filter === 'hardOnly') {
      if (status !== 'falsch' && status !== 'unsicher') continue;
    }
    queue.push(i);
  }

  if (filter === 'hardOnly' && queue.length === 0) {
    return buildInitialQueue(cardCount, stats, cardIds, {
      filter: 'all',
      sessionLimit,
      mode,
    });
  }

  if (mode === 'shuffle') {
    shuffleInPlace(queue);
  }

  if (sessionLimit === 'all') return queue;
  return queue.slice(0, sessionLimit);
}

/**
 * Remove current index from front and re-insert based on status.
 * Learned cards leave the queue.
 */
export function repositionAfterAnswer(
  queue: number[],
  cardIndex: number,
  status: CardStat['status'],
): number[] {
  const next = queue.filter((i) => i !== cardIndex);
  if (status === 'gelernt') return next;

  const insertAt = (position: number) => {
    const pos = Math.min(position, next.length);
    next.splice(pos, 0, cardIndex);
  };

  if (status === 'falsch') insertAt(RED_POS);
  else if (status === 'unsicher') insertAt(YELLOW_POS);
  else next.push(cardIndex);

  return next;
}
