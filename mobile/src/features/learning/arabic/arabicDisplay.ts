/**
 * Arabic RTL display helpers.
 * German UI stays LTR — only Arabic content uses these styles.
 */

import type { TextStyle } from 'react-native';

import type { HighlightMode } from '@/types';
import { colors as themeColors } from '@/constants/theme';

import { resolveArabicTrainerMetrics } from './arabicTrainerMetrics';
import { segmentGraphemes } from './graphemes';

export { resolveArabicTrainerMetrics } from './arabicTrainerMetrics';
export type { ArabicTrainerMetrics } from './arabicTrainerMetrics';

export function buildArabicTrainerTextStyle(
  fontSize: number,
  extra: TextStyle = {},
): TextStyle {
  const { lineHeight, harakatTopInset } = resolveArabicTrainerMetrics(fontSize);
  return {
    writingDirection: 'rtl',
    textAlign: 'center',
    fontSize,
    fontWeight: '700',
    lineHeight,
    paddingTop: harakatTopInset,
    ...extra,
  };
}

export interface PositionHighlightSegments {
  before: string;
  highlight: string;
  after: string;
}

export interface ArabicColorRun {
  text: string;
  color: string;
}

/** Merge adjacent graphemes with the same color into shaping-safe runs. */
export function buildArabicColorRuns(
  graphemes: string[],
  graphemeColors: string[],
): ArabicColorRun[] {
  const runs: ArabicColorRun[] = [];
  for (let i = 0; i < graphemes.length; i += 1) {
    const text = graphemes[i] ?? '';
    const color = graphemeColors[i] ?? themeColors.ink;
    const last = runs[runs.length - 1];
    if (last && last.color === color) {
      last.text += text;
    } else {
      runs.push({ text, color });
    }
  }
  return runs.filter((run) => run.text.length > 0);
}

export function segmentsToColorRuns(
  segments: PositionHighlightSegments,
  inkColor: string,
  highlightColor: string,
): ArabicColorRun[] {
  const runs: ArabicColorRun[] = [];
  if (segments.before) runs.push({ text: segments.before, color: inkColor });
  if (segments.highlight) runs.push({ text: segments.highlight, color: highlightColor });
  if (segments.after) runs.push({ text: segments.after, color: inkColor });
  return runs;
}

/**
 * Split a word for Anfangs-/Mittel-/Endstellung exercises.
 * Mirrors PWA `findTargetMatch` + `wrapOnce` — one highlighted run, rest connected.
 */
export function splitPositionHighlight(
  word: string,
  target: string | string[] | null | undefined,
  mode: HighlightMode,
): PositionHighlightSegments | null {
  if (!target || mode === 'all') return null;

  const targetList = Array.isArray(target) ? target : [target];
  let best: { index: number; length: number } | null = null;

  for (const t of targetList) {
    if (!t) continue;
    let startIndex = 0;
    while (startIndex <= word.length) {
      const idx = word.indexOf(t, startIndex);
      if (idx === -1) break;
      const end = idx + t.length;
      const isMiddle = idx > 0 && end < word.length;
      if (mode === 'initial') {
        if (!best || idx < best.index) best = { index: idx, length: t.length };
      } else if (mode === 'final') {
        if (!best || idx > best.index) best = { index: idx, length: t.length };
      } else if (isMiddle && (!best || idx < best.index)) {
        best = { index: idx, length: t.length };
      }
      startIndex = idx + 1;
    }
  }

  if (!best && mode === 'middle') {
    for (const t of targetList) {
      if (!t || best) continue;
      const idx = word.indexOf(t);
      if (idx !== -1) best = { index: idx, length: t.length };
    }
  }

  if (!best) return null;

  return {
    before: word.slice(0, best.index),
    highlight: word.slice(best.index, best.index + best.length),
    after: word.slice(best.index + best.length),
  };
}

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
