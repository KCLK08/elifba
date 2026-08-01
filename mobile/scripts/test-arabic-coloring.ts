/**
 * Arabic letter coloring rules.
 * Run: npm run test-arabic-coloring
 */
import {
  EMPHATIC_LETTERS,
  resolveArabicColoringMode,
  resolveHighlightMode,
  resolveHighlightTargets,
} from '../src/features/learning/arabic/arabicColoring';

function assert(cond: boolean, message: string) {
  if (!cond) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`OK: ${message}`);
}

assert(EMPHATIC_LETTERS.has('خ'), 'Emphatic set includes kha');
assert(!EMPHATIC_LETTERS.has('ب'), 'Emphatic set excludes ba');

assert(
  resolveArabicColoringMode('k1-l1-a2', 'lesson-1') === 'lesson1-emphatic',
  'Lesson 1 — emphatic mode',
);
assert(
  resolveArabicColoringMode('k1-l2-a1', 'lesson-2') === 'lesson2-position',
  'Lesson 2 — position mode',
);
assert(
  resolveArabicColoringMode('k1-l3-a1-ue2', 'lesson-3') === 'lesson3-vowels',
  'L3 Fetha Einzelnd — vowel mode',
);
assert(
  resolveArabicColoringMode('k1-l3-a1-ue3', 'lesson-3') === 'none',
  'L3 Gruppen — no coloring',
);
assert(
  resolveArabicColoringMode('k1-l4-a1-ue2', 'lesson-4') === 'none',
  'Lesson 4 — no coloring',
);

assert(
  resolveHighlightTargets('lesson1-emphatic', 'خ') === 'خ',
  'L1 — emphatic target kept',
);
assert(
  resolveHighlightTargets('lesson1-emphatic', null) === null,
  'L1 — no target',
);
assert(
  resolveHighlightTargets('lesson1-emphatic', 'ب') === null,
  'L1 — non-emphatic target removed',
);
assert(
  resolveHighlightTargets('lesson1-emphatic', ['lispel']) === null,
  'L1 — lispel tag target ignored',
);

assert(
  resolveHighlightTargets('lesson3-vowels', ['َ', 'خ']) === 'َ',
  'L3 — only harakat kept from mixed targets',
);
assert(
  resolveHighlightTargets('lesson3-vowels', 'َ') === 'َ',
  'L3 — fatha kept',
);
assert(
  resolveHighlightTargets('lesson3-vowels', 'ب') === null,
  'L3 — letter-only target removed',
);

assert(
  resolveHighlightMode('lesson2-position', 'initial') === 'initial',
  'L2 — initial mode kept',
);
assert(
  resolveHighlightMode('lesson1-emphatic', 'initial') === null,
  'L1 — position mode suppressed',
);
assert(
  resolveHighlightMode('none', 'initial') === null,
  'None — position mode suppressed',
);

console.log('\nAll arabic coloring checks passed.');
