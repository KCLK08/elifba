import type { ContentExercise, ContentTrainerExercise } from './types';

export function isTrainerExercise(exercise: ContentExercise): exercise is ContentTrainerExercise {
  return exercise.type === 'trainer';
}

export function getExerciseProgressTotal(exercise: ContentExercise): number {
  return exercise.type === 'trainer' ? exercise.cards.length : 1;
}

export function explanationCardId(exerciseId: string): string {
  return `${exerciseId}-read`;
}
