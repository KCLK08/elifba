export type BetaIssueCategory = 'audio' | 'letters' | 'both';

export interface BetaCardIssue {
  cardId: string;
  arabic: string;
  audioId: string | null;
  category: BetaIssueCategory;
  note: string;
  markedAt: string;
}

export interface BetaExerciseReport {
  id: string;
  createdAt: string;
  exerciseId: string;
  exerciseTitle: string;
  lessonId: string;
  issues: BetaCardIssue[];
}

export const BETA_ISSUE_LABELS: Record<BetaIssueCategory, string> = {
  audio: 'Audio',
  letters: 'Buchstaben',
  both: 'Audio & Buchstaben',
};
