import type { TrainerAnswer } from '@/features/learning/trainer/scoring';

export type WeaknessLevel = 'stabil' | 'beobachten' | 'schwäche' | 'unbekannt';

export interface AdaptiveAnswerRecord {
  answer: TrainerAnswer;
  answeredAt: string;
}

export interface AdaptiveCardStats {
  profileId: string;
  exerciseId: string;
  cardId: string;
  lessonId: string;
  attemptCount: number;
  correctCount: number;
  incorrectCount: number;
  weaknessScore: number;
  learningStage: number;
  consecutiveErrors: number;
  lastAttemptAt: string | null;
  lastIncorrectAt: string | null;
  history: AdaptiveAnswerRecord[];
}

export interface AdaptiveProfileSummary {
  attemptedCards: number;
  completedCards: number;
  stableCards: number;
  observeCards: number;
  weaknessCards: number;
  recentAttempts: number;
}

export interface WeakCardEntry {
  stats: AdaptiveCardStats;
  effectiveWeakness: number;
  level: WeaknessLevel;
  arabic: string;
  exerciseTitle: string;
}
