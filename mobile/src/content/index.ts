import { elifbaChapter } from './chapters/elifba';
import {
  exercises,
  getExerciseById,
  getExercisesForLesson,
} from './exercises';
import { lesson1 } from './lessons/lesson1';
import { lesson2 } from './lessons/lesson2';
import { lesson3 } from './lessons/lesson3';
import { lesson4 } from './lessons/lesson4';
import { lesson5 } from './lessons/lesson5';
import { lesson6 } from './lessons/lesson6';
import { lesson7 } from './lessons/lesson7';
import { lesson8 } from './lessons/lesson8';
import { lesson9 } from './lessons/lesson9';
import { lesson10 } from './lessons/lesson10';
import { lesson11 } from './lessons/lesson11';
import { lesson12 } from './lessons/lesson12';
import type { ContentChapter, ContentExercise, ContentLesson } from './types';
import { CONTENT_VERSION } from './version';

export { CONTENT_VERSION };
export { exercises, getExerciseById, getExercisesForLesson };
export type { ContentCard, ContentExercise, ContentLesson, ContentLessonSection, ContentChapter } from './types';

export const chapters: ContentChapter[] = [elifbaChapter];

export const lessons: ContentLesson[] = [
  lesson1,
  lesson2,
  lesson3,
  lesson4,
  lesson5,
  lesson6,
  lesson7,
  lesson8,
  lesson9,
  lesson10,
  lesson11,
  lesson12,
];

export function getChapterById(id: string): ContentChapter | undefined {
  return chapters.find((c) => c.id === id);
}

export function getLessonById(id: string): ContentLesson | undefined {
  return lessons.find((l) => l.id === id);
}

export function getLessonsForChapter(chapterId: string): ContentLesson[] {
  return lessons.filter((l) => l.chapterId === chapterId).sort((a, b) => a.order - b.order);
}

export interface LessonExerciseGroup {
  sectionTitle: string | null;
  exercises: ContentExercise[];
}

/** Exercises for a lesson, optionally grouped into sections (e.g. Fetha / Kesra / Damme). */
export function getLessonExerciseGroups(lesson: ContentLesson): LessonExerciseGroup[] {
  if (lesson.sections?.length) {
    return [...lesson.sections]
      .sort((a, b) => a.order - b.order)
      .map((section) => ({
        sectionTitle: section.title,
        exercises: section.exerciseIds
          .map((id) => getExerciseById(id))
          .filter((exercise): exercise is ContentExercise => Boolean(exercise)),
      }));
  }

  return [
    {
      sectionTitle: null,
      exercises: getExercisesForLesson(lesson.id),
    },
  ];
}
