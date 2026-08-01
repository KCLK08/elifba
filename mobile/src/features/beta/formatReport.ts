import type { ContentTrainerExercise } from '@/content';

import { BETA_ISSUE_LABELS, type BetaCardIssue, type BetaExerciseReport } from './types';

export function buildBetaExerciseReport(
  exercise: Pick<ContentTrainerExercise, 'id' | 'title' | 'lessonId'>,
  issues: BetaCardIssue[],
): BetaExerciseReport {
  return {
    id: `beta-${Date.now()}`,
    createdAt: new Date().toISOString(),
    exerciseId: exercise.id,
    exerciseTitle: exercise.title,
    lessonId: exercise.lessonId,
    issues: [...issues].sort(
      (a, b) => new Date(a.markedAt).getTime() - new Date(b.markedAt).getTime(),
    ),
  };
}

export function formatBetaReportText(report: BetaExerciseReport, appVersion = '1.0.0'): string {
  const lines: string[] = [
    '# Elifba Kids — Betatest-Report',
    '',
    `Erstellt: ${new Date(report.createdAt).toLocaleString('de-DE')}`,
    `App-Version: ${appVersion}`,
    `Übung: ${report.exerciseId} — ${report.exerciseTitle}`,
    `Lektion: ${report.lessonId}`,
    `Gemeldete Karten: ${report.issues.length}`,
    '',
    '---',
    '',
  ];

  if (report.issues.length === 0) {
    lines.push('Keine Karten markiert.');
    return lines.join('\n');
  }

  report.issues.forEach((issue, index) => {
    lines.push(`## ${index + 1}. ${issue.cardId}`);
    lines.push(`Arabisch: ${issue.arabic}`);
    lines.push(`Audio-ID: ${issue.audioId ?? '—'}`);
    lines.push(`Problem: ${BETA_ISSUE_LABELS[issue.category]}`);
    if (issue.note.trim()) {
      lines.push(`Notiz: ${issue.note.trim()}`);
    }
    lines.push('');
  });

  lines.push('---');
  lines.push('Bitte diesen Report an das Entwicklungsteam senden. Danke!');
  return lines.join('\n');
}
