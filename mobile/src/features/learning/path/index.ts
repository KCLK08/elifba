export { LessonNode } from './LessonNode';
export { ProgressRing } from './ProgressRing';
export { LockState, type LockStateKind } from './LockState';
export { getLessonVisual, type LessonVisual } from './lessonVisuals';
export { resolveContinueLearning, type ContinueTarget } from './resolveContinueLearning';

import type { LockStateKind } from './LockState';

/**
 * Temporary testing flag: all lessons open.
 * Set to false to restore linear unlock (previous lesson must be 100%).
 */
export const UNLOCK_ALL_LESSONS = true;

/** Linear unlock: lesson 1 open; later lessons unlock when previous is complete. */
export function resolveLessonState(
  order: number,
  percent: number,
  previousPercent: number | null,
): LockStateKind {
  if (percent >= 100) return 'completed';
  if (UNLOCK_ALL_LESSONS) {
    return percent > 0 ? 'current' : 'available';
  }
  if (order === 1) return percent > 0 ? 'current' : 'available';
  if ((previousPercent ?? 0) < 100) return 'locked';
  return percent > 0 ? 'current' : 'available';
}
