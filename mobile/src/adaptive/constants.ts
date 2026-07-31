/** Virtual exercise id — not part of static content. */
export const WEAKNESS_EXERCISE_ID = 'adaptive-weaknesses';

export const MIN_ATTEMPTS_FOR_ANALYSIS = 5;

export const WEAKNESS_DELTA = {
  falsch: 2,
  unsicher: 1,
  richtig: -1,
} as const;

export const WEAKNESS_THRESHOLD = {
  stableMax: 3,
  observeMax: 7,
} as const;

/** One weakness point decays per interval without a new mistake. */
export const DECAY_DAYS_PER_POINT = 7;

export const MAX_LEARNING_STAGE = 5;
export const HISTORY_LIMIT = 50;
export const WEAKNESS_SESSION_LIMIT = 20;
