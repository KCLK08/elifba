/**
 * Kid-friendly lesson visuals — emoji + accent, easy to swap later.
 * No photographic images.
 */

export interface LessonVisual {
  emoji: string;
  /** Short child-facing label */
  label: string;
  /** Soft background accent (hex) */
  accent: string;
}

const BY_ORDER: Record<number, LessonVisual> = {
  1: { emoji: '🔤', label: 'Buchstaben', accent: '#CCFBF1' },
  2: { emoji: '🧩', label: 'Formen', accent: '#FEF3C7' },
  3: { emoji: '✨', label: 'Vokale', accent: '#E0E7FF' },
  4: { emoji: '📖', label: 'Dehnung', accent: '#FCE7F3' },
  5: { emoji: '⭕', label: 'Dschezm', accent: '#FFEDD5' },
  6: { emoji: '⭐', label: 'Schedde', accent: '#DCFCE7' },
  7: { emoji: '🌙', label: 'Tenwin', accent: '#E0F2FE' },
  8: { emoji: '🌟', label: 'Rundes Te', accent: '#F3E8FF' },
  9: { emoji: '📗', label: 'Dehnung', accent: '#CCFBF1' },
  10: { emoji: '🎯', label: 'Verlängerung', accent: '#FEF3C7' },
  11: { emoji: '🦋', label: 'Hemze', accent: '#FCE7F3' },
  12: { emoji: '🏆', label: 'Abschluss', accent: '#DCFCE7' },
};

const FALLBACK: LessonVisual = {
  emoji: '📘',
  label: 'Lektion',
  accent: '#CCFBF1',
};

export function getLessonVisual(order: number): LessonVisual {
  return BY_ORDER[order] ?? FALLBACK;
}
