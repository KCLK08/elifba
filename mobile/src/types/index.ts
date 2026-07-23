/**
 * Domain models for Elifba Kids.
 * Content migration happens in later phases — Phase 2 only defines the shape.
 */

export type AvatarId =
  | 'fox'
  | 'cat'
  | 'dog'
  | 'panda'
  | 'koala'
  | 'tiger'
  | 'lion'
  | 'monkey'
  | 'frog'
  | 'rabbit'
  | 'bear'
  | 'penguin'
  | 'owl'
  | 'turtle'
  | 'octopus'
  | 'unicorn';

export type ExerciseType =
  | 'trainer'
  | 'explanation'
  | 'multiple_choice'
  | 'matching'
  | 'input'
  | 'drag_drop';

export type HighlightMode = 'all' | 'initial' | 'middle' | 'final';

export type CardStatus =
  | 'unbeantwortet'
  | 'richtig'
  | 'unsicher'
  | 'falsch'
  | 'gelernt';

export type TrainerMode = 'sequence' | 'shuffle';

/** Child profile (local, no cloud account). */
export interface Profile {
  id: string;
  name: string;
  avatar: AvatarId;
  createdAt: string;
}

export interface Chapter {
  id: string;
  title: string;
  description: string;
  order: number;
}

export interface Lesson {
  id: string;
  chapterId: string;
  title: string;
  order: number;
  locked: boolean;
}

export interface Section {
  id: string;
  lessonId: string;
  title: string;
  order: number;
}

export interface Exercise {
  id: string;
  lessonId: string;
  sectionId?: string;
  type: ExerciseType;
  title: string;
  order: number;
  /** Optional link for linear flow (web nextUrl equivalent). */
  nextExerciseId?: string;
}

/** One learning card (letter / word / vowel group). */
export interface Card {
  id: string;
  arabic: string;
  audio?: string;
  highlight?: string | string[];
  highlightMode?: HighlightMode;
  tags?: string[];
}

/** Persisted progress for one exercise under one profile. */
export interface Progress {
  profileId: string;
  lessonId: string;
  exerciseId: string;
  mode: TrainerMode;
  completed: boolean;
  stars: number;
  learned: number;
  total: number;
  lastVisited: string;
}

/** Resume / continue-learning snapshot. */
export interface Session {
  profileId: string;
  exerciseId: string;
  lessonId: string;
  mode: TrainerMode;
  lastCardPreview?: string;
  updatedAt: string;
}
