/**
 * Quality checks for adaptive learning scoring.
 * Run: npm run test-adaptive
 */
import {
  applyAdaptiveAnswer,
  classifyWeakness,
  createAdaptiveCardStats,
  getEffectiveWeaknessScore,
  needsLearningAttention,
  MIN_ATTEMPTS_FOR_ANALYSIS,
} from '../src/adaptive';
import type { TrainerAnswer } from '../src/features/learning/trainer/scoring';

const PROFILE = 'test-profile';
const EXERCISE = 'test-exercise';
const CARD = 'test-card';
const LESSON = 'lesson-1';

function baseStats() {
  return createAdaptiveCardStats({
    profileId: PROFILE,
    exerciseId: EXERCISE,
    cardId: CARD,
    lessonId: LESSON,
  });
}

function simulate(
  answers: TrainerAnswer[],
  start = new Date('2026-01-01T10:00:00Z'),
): { stats: ReturnType<typeof baseStats>; now: Date } {
  let stats = baseStats();
  let now = start;
  for (const answer of answers) {
    stats = applyAdaptiveAnswer(stats, answer, now);
    now = new Date(now.getTime() + 60_000);
  }
  return { stats, now };
}

function assert(cond: boolean, message: string) {
  if (!cond) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`OK: ${message}`);
}

// Fall 1: ❌ ❌ ✅ ✅ ❌
{
  const { stats, now } = simulate(['falsch', 'falsch', 'richtig', 'richtig', 'falsch']);
  assert(stats.attemptCount === 5, 'Fall 1 — 5 Versuche');
  assert(
    needsLearningAttention(stats, now),
    'Fall 1 — Karte mit Lernbedarf (Schwächewert ≥ 4 nach 5 Versuchen)',
  );
  assert(stats.weaknessScore === 4, `Fall 1 — Schwächewert 4 (ist ${stats.weaknessScore})`);
}

// Fall 2: ❌ ✅ ✅ ✅ ✅
{
  const { stats, now } = simulate(['falsch', 'richtig', 'richtig', 'richtig', 'richtig']);
  assert(stats.attemptCount === 5, 'Fall 2 — 5 Versuche');
  assert(
    classifyWeakness(stats, now) === 'stabil',
    `Fall 2 — Karte stabilisiert sich (ist ${classifyWeakness(stats, now)})`,
  );
  assert(stats.weaknessScore === 0, `Fall 2 — Schwächewert 0 (ist ${stats.weaknessScore})`);
}

// Fall 3: Abgeschlossene Karte nach Wochen falsch
{
  const { stats: stable, now: stableNow } = simulate([
    'richtig',
    'richtig',
    'richtig',
    'richtig',
    'richtig',
  ]);
  assert(classifyWeakness(stable, stableNow) === 'stabil', 'Fall 3 — zunächst stabil');
  const weeksLater = new Date('2026-02-15T10:00:00Z');
  const stats = applyAdaptiveAnswer(stable, 'falsch', weeksLater);
  assert(stats.weaknessScore >= 1, 'Fall 3 — Schwäche steigt nach erneutem Fehler');
  assert(stats.learningStage < 5, 'Fall 3 — Lernstufe reduziert');
  assert(
    stats.attemptCount >= MIN_ATTEMPTS_FOR_ANALYSIS,
    'Fall 3 — weiterhin auswertbar für Schwächenübung',
  );
}

// Zeitliche Gewichtung: alter Fehler verliert Gewicht
{
  const { stats, now } = simulate(['falsch', 'falsch', 'falsch', 'falsch']);
  const beforeDecay = stats.weaknessScore;
  const monthLater = new Date(now.getTime() + 31 * 24 * 60 * 60 * 1000);
  const effective = getEffectiveWeaknessScore(stats, monthLater);
  assert(
    effective < beforeDecay,
    `Fall Decay — effektiver Wert sinkt (${effective} < ${beforeDecay})`,
  );
}

console.log('\nAll adaptive learning checks passed.');
