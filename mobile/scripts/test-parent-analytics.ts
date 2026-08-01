/**
 * Parent dashboard analytics and personalized exercise checks.
 * Run: npm run test-parent
 */
import {
  applyAdaptiveAnswer,
  adaptiveCardKey,
  buildPersonalizedExercise,
  classifyParentCardStatus,
  computeParentDashboardStats,
  createAdaptiveCardStats,
  selectPersonalizedCards,
} from '../src/adaptive';
import { exercises } from '../src/content';
import { isTrainerExercise } from '../src/content/exerciseUtils';

const PROFILE = 'parent-test-profile';

function firstTrainerRef() {
  for (const exercise of exercises) {
    if (!isTrainerExercise(exercise)) continue;
    const card = exercise.cards[0];
    if (!card) continue;
    return { exerciseId: exercise.id, cardId: card.id, lessonId: exercise.lessonId };
  }
  throw new Error('No trainer exercise found');
}

const SAMPLE = firstTrainerRef();

function assert(cond: boolean, message: string) {
  if (!cond) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`OK: ${message}`);
}

// Fresh profile: all cards not_started, nothing to learn yet
{
  const stats = computeParentDashboardStats(PROFILE, {});
  assert(stats.stillToLearn === 0, 'Fresh profile — stillToLearn is 0');
  assert(stats.statusCounts.not_started > 0, 'Fresh profile — has not_started cards');
  assert(
    stats.statusCounts.repeat === 0,
    'Fresh profile — no repeat cards counted',
  );
  assert(
    buildPersonalizedExercise(PROFILE, {}) === null,
    'Fresh profile — no personalized exercise',
  );
  assert(
    selectPersonalizedCards(PROFILE, {}).refs.length === 0,
    'Fresh profile — personalized selection empty',
  );
}

// In-progress card counts toward stillToLearn, not not_started
{
  const byCard: Record<string, ReturnType<typeof createAdaptiveCardStats>> = {};
  let stats = createAdaptiveCardStats({
    profileId: PROFILE,
    exerciseId: SAMPLE.exerciseId,
    cardId: SAMPLE.cardId,
    lessonId: SAMPLE.lessonId,
  });
  stats = applyAdaptiveAnswer(stats, 'falsch');
  byCard[adaptiveCardKey(PROFILE, SAMPLE.exerciseId, SAMPLE.cardId)] = stats;

  assert(
    classifyParentCardStatus('lernen', stats) === 'practice',
    'Attempted in-progress card — practice',
  );

  const dashboard = computeParentDashboardStats(PROFILE, byCard);
  assert(dashboard.stillToLearn >= 1, 'Profile with practice card — stillToLearn >= 1');
  assert(
    selectPersonalizedCards(PROFILE, byCard).refs.length >= 1,
    'Profile with practice card — personalized selection non-empty',
  );
}

// need + secure counts always match selected refs
{
  const byCard: Record<string, ReturnType<typeof createAdaptiveCardStats>> = {};
  const exercise = exercises.find((e) => e.id === SAMPLE.exerciseId);
  if (!exercise || !isTrainerExercise(exercise)) {
    throw new Error('Sample exercise missing');
  }
  for (const card of exercise.cards.slice(0, 8)) {
    let stats = createAdaptiveCardStats({
      profileId: PROFILE,
      exerciseId: SAMPLE.exerciseId,
      cardId: card.id,
      lessonId: SAMPLE.lessonId,
    });
    for (let attempt = 0; attempt < 3; attempt += 1) {
      stats = applyAdaptiveAnswer(stats, attempt % 2 === 0 ? 'falsch' : 'richtig');
    }
    byCard[adaptiveCardKey(PROFILE, SAMPLE.exerciseId, card.id)] = stats;
  }

  const { refs, needCards, secureCards } = selectPersonalizedCards(PROFILE, byCard, 8);
  assert(refs.length > 0, 'Multi-card profile — selection returns cards');
  assert(
    needCards + secureCards === refs.length,
    `Need/secure sum matches refs (${needCards}+${secureCards}=${refs.length})`,
  );
}

console.log('\nAll parent analytics checks passed.');
