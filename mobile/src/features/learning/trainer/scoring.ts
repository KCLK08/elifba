import type { CardStatus } from '@/types';

export type TrainerAnswer = 'richtig' | 'unsicher' | 'falsch';

export interface CardStat {
  status: CardStatus;
  correctCount: number;
}

export const REQUIRED_CORRECT = 3;
/** Re-show wrong cards after this many other cards. */
export const RED_POS = 3;
/** Re-show unsure cards after this many other cards. */
export const YELLOW_POS = 9;

export function createInitialStat(): CardStat {
  return { status: 'unbeantwortet', correctCount: 0 };
}

/**
 * Card color / learning-status transitions (SRS).
 *
 * Color meaning:
 * - unbeantwortet (neutral)
 * - falsch (rot) — safety step after error
 * - unsicher (gelb) — recovery after rot; first richtig after rot lands here (does NOT count)
 * - richtig (hellgrün) — learning streak (correctCount 1..2)
 * - gelernt (dunkelgrün) — only this counts as mastered
 *
 * Progress / stars increase only when status becomes `gelernt`.
 */
export function applyAnswer(stat: CardStat, answer: TrainerAnswer): CardStat {
  if (answer === 'falsch') {
    // Any stage → rot; learning chain restarts
    return { status: 'falsch', correctCount: 0 };
  }

  if (answer === 'unsicher') {
    return { status: 'unsicher', correctCount: 0 };
  }

  // —— richtig ——
  if (stat.status === 'gelernt') {
    return stat;
  }

  // Rot + Richtig → Gelb (recovery check; does NOT count as a correct answer)
  if (stat.status === 'falsch') {
    return { status: 'unsicher', correctCount: 0 };
  }

  // Gelb + Richtig → Hellgrün (1st counted correct)
  if (stat.status === 'unsicher') {
    return { status: 'richtig', correctCount: 1 };
  }

  // Hellgrün + Richtig → streak; at 3 → Dunkelgrün
  if (stat.status === 'richtig') {
    const correctCount = stat.correctCount + 1;
    if (correctCount >= REQUIRED_CORRECT) {
      return { status: 'gelernt', correctCount };
    }
    return { status: 'richtig', correctCount };
  }

  // Neutral + Richtig → Hellgrün (1st counted correct)
  return { status: 'richtig', correctCount: 1 };
}

/** Fortschritt = dauerhaft gelernte Karten only (dunkelgrün). */
export function countLearned(stats: Record<string, CardStat>): number {
  return Object.values(stats).filter((s) => s.status === 'gelernt').length;
}
