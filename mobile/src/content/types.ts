import type { HighlightMode, TrainerMode } from '@/types';

export type ContentTarget = string | string[] | null;

export interface ContentCard {
  id: string;
  arabic: string;
  /** Audio asset id; null until Phase 7 audio import. */
  audioId: string | null;
  /** Official JPG page this card was extracted from. */
  sourcePage?: number;
  target?: ContentTarget;
  highlightMode?: HighlightMode | null;
  tags?: string[];
}

export interface ContentExercise {
  id: string;
  lessonId: string;
  title: string;
  type: 'trainer';
  cards: ContentCard[];
  /** Empty string when audio is not yet wired. */
  audioBase: string;
  mode: TrainerMode;
  order: number;
  /** Optional German explanation from the JPG source. */
  explanation?: string;
  /** JPG pages that contributed cards to this exercise. */
  sourcePages?: number[];
}

export interface ContentLessonSection {
  id: string;
  title: string;
  order: number;
  exerciseIds: string[];
}

export interface ContentLesson {
  id: string;
  chapterId: string;
  title: string;
  order: number;
  exerciseIds: string[];
  /** Optional sub-groups (e.g. Fetha / Kesra / Damme in Lektion 3). */
  sections?: ContentLessonSection[];
  /** JPG pages covered by this lesson (TOC Teil 1). */
  sourcePages?: number[];
}

export interface ContentChapter {
  id: string;
  title: string;
  description: string;
  order: number;
  lessonIds: string[];
}
