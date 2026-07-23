/**
 * Arabic RTL display helpers.
 * German UI stays LTR — only Arabic content uses these styles.
 */

import type { HighlightMode } from '@/types';

import { segmentGraphemes } from './graphemes';

export const arabicTextStyle = {
  writingDirection: 'rtl' as const,
  textAlign: 'center' as const,
};

/** Grapheme indices to highlight for initial / middle / final modes. */
export function positionalHighlightIndices(
  text: string,
  mode?: HighlightMode | null,
): number[] {
  if (!text.length) return [];
  const chars = segmentGraphemes(text);
  if (!mode || mode === 'all') return chars.map((_, i) => i);

  if (mode === 'initial') return [0];
  if (mode === 'final') return [chars.length - 1];

  if (chars.length < 3) return [Math.floor(chars.length / 2)];
  return chars.slice(1, -1).map((_, i) => i + 1);
}

export function mergeHighlightIndices(
  text: string,
  targets: string | string[] | null | undefined,
  mode?: HighlightMode | null,
): Set<number> {
  const result = new Set<number>();
  const chars = segmentGraphemes(text);

  if (mode && mode !== 'all') {
    positionalHighlightIndices(text, mode).forEach((i) => result.add(i));
  }

  if (targets) {
    const list = Array.isArray(targets) ? targets : [targets];
    chars.forEach((ch, i) => {
      // Match full grapheme or any codepoint inside it (e.g. target "َ" on "بَ").
      if (list.includes(ch) || [...ch].some((c) => list.includes(c))) {
        result.add(i);
      }
    });
  }

  return result;
}
