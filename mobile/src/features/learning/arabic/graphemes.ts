/**
 * Split Arabic into grapheme clusters so harakat stay attached to their base letter.
 * Spreading by codepoint ([...str]) breaks diacritic positioning in nested Text.
 */

export function segmentGraphemes(text: string): string[] {
  if (!text) return [];

  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    const segmenter = new Intl.Segmenter('ar', { granularity: 'grapheme' });
    return [...segmenter.segment(text)].map((s) => s.segment);
  }

  // Fallback: attach combining marks (Mn/Me) to the previous base.
  const out: string[] = [];
  for (const ch of text) {
    const code = ch.codePointAt(0) ?? 0;
    const isMark =
      (code >= 0x064b && code <= 0x065f) || // Arabic harakat / sukun / shadda / subscript alef…
      (code >= 0x0670 && code <= 0x0670) || // superscript alef
      (code >= 0x06d6 && code <= 0x06ed) ||
      (code >= 0x08d3 && code <= 0x08ff) ||
      (code >= 0x0300 && code <= 0x036f);
    if (isMark && out.length > 0) {
      out[out.length - 1] += ch;
    } else {
      out.push(ch);
    }
  }
  return out;
}

/** Narrow no-break space — keeps dual letter forms (e.g. هـ ه) on one line. */
export const ARABIC_NBSP = '\u202F';

/** Normalize dual-form he spellings so forms sit side-by-side without wrapping. */
export function normalizeArabicDisplay(text: string): string {
  return text
    .replace(/\r\n|\n|\r/g, ' ')
    .replace(/هـ([ًٌٍَُِْٰ]*)\s+ه([ًٌٍَُِْٰ]*)/g, `هـ$1${ARABIC_NBSP}ه$2`)
    .replace(/ه([ًٌٍَُِْٰ]*)\s+ه([ًٌٍَُِْٰ]*)/g, `ه$1${ARABIC_NBSP}ه$2`);
}
