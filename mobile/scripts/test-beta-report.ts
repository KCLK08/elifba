/**
 * Betatest report formatting checks.
 * Run: npm run test-beta-report
 */
import { buildBetaExerciseReport, formatBetaReportText } from '../src/features/beta/formatReport';

function assert(cond: boolean, message: string) {
  if (!cond) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`OK: ${message}`);
}

const report = buildBetaExerciseReport(
  { id: 'k1-l1-a2', title: 'Buchstaben des Korans', lessonId: 'lesson-1' },
  [
    {
      cardId: 'k1-l1-a2-card-7',
      arabic: 'خ',
      audioId: 'k1-l1-a2-7',
      category: 'audio',
      note: 'Knacken im Audio',
      markedAt: '2026-08-01T10:00:00.000Z',
    },
  ],
);

const text = formatBetaReportText(report);
assert(text.includes('Betatest-Report'), 'Report title');
assert(text.includes('k1-l1-a2-card-7'), 'Card id in report');
assert(text.includes('Problem: Audio'), 'Issue category label');
assert(text.includes('Knacken im Audio'), 'Issue note');

console.log('\nAll beta report checks passed.');
