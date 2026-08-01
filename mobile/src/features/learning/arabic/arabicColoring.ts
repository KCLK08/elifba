/**
 * Lesson-specific Arabic letter coloring rules.
 *
 * Red highlights only where pedagogy requires them; all other text stays ink-colored.
 */

/** Dumpfe / emphatic letters (Elifba: „stumme“ Buchstaben). */
export const EMPHATIC_LETTERS = new Set(['خ', 'ص', 'ض', 'ط', 'ظ', 'غ', 'ق']);

/** Combining harakat and related vowel marks. */
const HARAKAT_PATTERN = /[\u064B-\u065F\u0670]/;

export type ArabicColoringMode =
  | 'none'
  | 'lesson1-emphatic'
  | 'lesson2-position'
  | 'lesson3-vowels';

export function resolveArabicColoringMode(
  exerciseId?: string,
  lessonId?: string,
): ArabicColoringMode {
  if (lessonId === 'lesson-1') return 'lesson1-emphatic';
  if (lessonId === 'lesson-2') return 'lesson2-position';
  // Lektion 3, Fetha – erste Übung (Einzelnd)
  if (exerciseId === 'k1-l3-a1-ue2') return 'lesson3-vowels';
  return 'none';
}

function normalizeTargets(
  targets: string | string[] | null | undefined,
): string[] {
  if (!targets) return [];
  return Array.isArray(targets) ? targets : [targets];
}

function isHarakatString(value: string): boolean {
  return [...value].every((ch) => HARAKAT_PATTERN.test(ch));
}

function isEmphaticString(value: string): boolean {
  return [...value].some((ch) => EMPHATIC_LETTERS.has(ch));
}

/** Targets allowed for highlighting under the given coloring mode. */
export function resolveHighlightTargets(
  mode: ArabicColoringMode,
  targets: string | string[] | null | undefined,
): string | string[] | null {
  const list = normalizeTargets(targets);
  if (!list.length) return null;

  switch (mode) {
    case 'lesson1-emphatic': {
      const emphatic = list.filter(isEmphaticString);
      return emphatic.length === 1 ? emphatic[0]! : emphatic.length ? emphatic : null;
    }
    case 'lesson3-vowels': {
      const harakat = list.filter(isHarakatString);
      return harakat.length === 1 ? harakat[0]! : harakat.length ? harakat : null;
    }
    case 'lesson2-position':
      return list.length === 1 ? list[0]! : list;
    case 'none':
    default:
      return null;
  }
}

export function resolveHighlightMode(
  mode: ArabicColoringMode,
  highlightMode: string | null | undefined,
): 'initial' | 'middle' | 'final' | 'all' | null {
  if (mode !== 'lesson2-position') return null;
  if (
    highlightMode === 'initial' ||
    highlightMode === 'middle' ||
    highlightMode === 'final'
  ) {
    return highlightMode;
  }
  return null;
}
