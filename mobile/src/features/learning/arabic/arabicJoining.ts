/**
 * Arabic cursive joining rules.
 *
 * Arabic is written cursively: a letter takes an initial / medial / final /
 * isolated shape depending on whether it connects to its neighbours. When we
 * split a word into per-grapheme <Text> runs (needed for coloured highlights),
 * each run is shaped in isolation and letters fall back to their isolated form,
 * so the word looks broken apart.
 *
 * To keep the contextual shape we wrap each split segment with ZERO WIDTH
 * JOINER (U+200D) on the sides where the letter connects to a neighbour. A ZWJ
 * tells the shaper "there is a joining letter here", producing the correct
 * initial / medial / final glyph plus the connecting stroke, so adjacent runs
 * read as one connected group.
 */

export const ZWJ = '\u200D';

/**
 * Letters that connect to the FOLLOWING letter (dual-joining + join-causing).
 * These take initial/medial forms. Excludes the right-joining letters
 * (ا آ أ إ ٱ د ذ ر ز و ؤ ة) which never connect onward, and non-joining ء.
 */
const JOINS_NEXT = new Set<number>([
  0x0626, // ئ
  0x0628, // ب
  0x062a, // ت
  0x062b, // ث
  0x062c, // ج
  0x062d, // ح
  0x062e, // خ
  0x0633, // س
  0x0634, // ش
  0x0635, // ص
  0x0636, // ض
  0x0637, // ط
  0x0638, // ظ
  0x0639, // ع
  0x063a, // غ
  0x0640, // ـ tatweel (join-causing)
  0x0641, // ف
  0x0642, // ق
  0x0643, // ك
  0x0644, // ل
  0x0645, // م
  0x0646, // ن
  0x0647, // ه
  0x0649, // ى
  0x064a, // ي
]);

/**
 * Letters that accept a connection FROM the previous letter (take medial/final
 * forms). This is every joining letter: dual-joining + right-joining, plus
 * tatweel. Only truly non-joining marks (e.g. ء) and non-letters are excluded.
 */
const ACCEPTS_PREV = new Set<number>([
  ...JOINS_NEXT,
  0x0622, // آ
  0x0623, // أ
  0x0624, // ؤ
  0x0625, // إ
  0x0627, // ا
  0x0629, // ة
  0x062f, // د
  0x0630, // ذ
  0x0631, // ر
  0x0632, // ز
  0x0648, // و
  0x0671, // ٱ
]);

/** First base-letter codepoint of a grapheme cluster (skips leading joiners). */
function baseCodePoint(grapheme: string): number | undefined {
  for (const ch of grapheme) {
    const cp = ch.codePointAt(0);
    if (cp === undefined) continue;
    if (ch === ZWJ || ch === '\u200C') continue;
    return cp;
  }
  return undefined;
}

function joinsNext(grapheme: string | undefined): boolean {
  if (!grapheme) return false;
  const cp = baseCodePoint(grapheme);
  return cp !== undefined && JOINS_NEXT.has(cp);
}

function acceptsPrev(grapheme: string | undefined): boolean {
  if (!grapheme) return false;
  const cp = baseCodePoint(grapheme);
  return cp !== undefined && ACCEPTS_PREV.has(cp);
}

/**
 * Wrap the grapheme at `index` with ZWJ on the sides where it connects to its
 * neighbours, so it keeps its contextual (initial/medial/final) shape when
 * rendered in its own <Text> run.
 */
export function bridgeGrapheme(graphemes: string[], index: number): string {
  const current = graphemes[index];
  if (current === undefined) return '';

  const prev = graphemes[index - 1];
  const next = graphemes[index + 1];

  // Connects to the previous letter when that letter joins onward and the
  // current letter can accept a right-side connection.
  const connectPrev = joinsNext(prev) && acceptsPrev(current);
  // Connects to the next letter when the current letter joins onward and the
  // next letter can accept a right-side connection.
  const connectNext = joinsNext(current) && acceptsPrev(next);

  return `${connectPrev ? ZWJ : ''}${current}${connectNext ? ZWJ : ''}`;
}
