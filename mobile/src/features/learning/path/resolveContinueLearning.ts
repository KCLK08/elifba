import {
  getExerciseById,
  getLessonById,
  getLessonsForChapter,
  type ContentExercise,
  type ContentLesson,
} from '@/content';
import { getExerciseProgressTotal } from '@/content/exerciseUtils';
import { resolveLessonState } from '@/features/learning/path';

export type ContinueTarget =
  | {
      kind: 'exercise';
      exercise: ContentExercise;
      lesson: ContentLesson;
      lessonPercent: number;
    }
  | { kind: 'all_done' };

/**
 * Next open learning task for Home “Weiterlernen”.
 * Ignores practice/replay — uses mastery progress only.
 */
export function resolveContinueLearning(input: {
  profileId: string;
  sessionExerciseId?: string | null;
  getExercisePercent: (profileId: string, exerciseId: string, total: number) => number;
  getLessonPercent: (
    profileId: string,
    lessonId: string,
    totals: { exerciseId: string; total: number }[],
  ) => number;
}): ContinueTarget {
  const { profileId, sessionExerciseId, getExercisePercent, getLessonPercent } = input;

  if (!profileId) {
    const first = getExerciseById('k1-l1-a2');
    const lesson = first ? getLessonById(first.lessonId) : undefined;
    if (first && lesson) {
      return { kind: 'exercise', exercise: first, lesson, lessonPercent: 0 };
    }
    return { kind: 'all_done' };
  }

  // 1. Resume incomplete exercise from session (mastery < 100%)
  if (sessionExerciseId) {
    const sessionEx = getExerciseById(sessionExerciseId);
    if (sessionEx) {
      const p = getExercisePercent(profileId, sessionEx.id, getExerciseProgressTotal(sessionEx));
      if (p < 100) {
        const lesson = getLessonById(sessionEx.lessonId);
        if (lesson) {
          const totals = lesson.exerciseIds.map((id) => ({
            exerciseId: id,
            total: (() => {
              const ex = getExerciseById(id);
              return ex ? getExerciseProgressTotal(ex) : 0;
            })(),
          }));
          return {
            kind: 'exercise',
            exercise: sessionEx,
            lesson,
            lessonPercent: getLessonPercent(profileId, lesson.id, totals),
          };
        }
      }
    }
  }

  // 2–3. Next open exercise in unlocked lessons
  const chapterLessons = getLessonsForChapter('elifba');
  const percents = chapterLessons.map((lesson) => {
    const totals = lesson.exerciseIds.map((id) => {
      const ex = getExerciseById(id);
      return {
        exerciseId: id,
        total: ex ? getExerciseProgressTotal(ex) : 0,
      };
    });
    return getLessonPercent(profileId, lesson.id, totals);
  });

  for (let i = 0; i < chapterLessons.length; i += 1) {
    const lesson = chapterLessons[i]!;
    const previousPercent = i === 0 ? null : (percents[i - 1] ?? 0);
    const state = resolveLessonState(lesson.order, percents[i] ?? 0, previousPercent);
    if (state === 'locked') continue;

    for (const exId of lesson.exerciseIds) {
      const ex = getExerciseById(exId);
      if (!ex) continue;
      if (getExercisePercent(profileId, ex.id, getExerciseProgressTotal(ex)) < 100) {
        return {
          kind: 'exercise',
          exercise: ex,
          lesson,
          lessonPercent: percents[i] ?? 0,
        };
      }
    }
  }

  return { kind: 'all_done' };
}
