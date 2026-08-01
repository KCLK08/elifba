import { useCallback, useMemo, useState } from 'react';

import type { ContentCard, ContentTrainerExercise } from '@/content';

import { buildBetaExerciseReport } from './formatReport';
import type { BetaCardIssue, BetaIssueCategory } from './types';

export type BetaFeedbackPhase = 'marking' | 'finish';

export function useBetaFeedbackSession(exercise: ContentTrainerExercise) {
  const [issuesByCardId, setIssuesByCardId] = useState<Record<string, BetaCardIssue>>({});
  const [phase, setPhase] = useState<BetaFeedbackPhase>('marking');
  const [issueModalOpen, setIssueModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [draftCategory, setDraftCategory] = useState<BetaIssueCategory>('audio');
  const [draftNote, setDraftNote] = useState('');
  const [activeCard, setActiveCard] = useState<ContentCard | null>(null);

  const issues = useMemo(() => Object.values(issuesByCardId), [issuesByCardId]);
  const markedCardIds = useMemo(() => new Set(Object.keys(issuesByCardId)), [issuesByCardId]);
  const issueCount = issues.length;

  const openIssueModal = useCallback((card: ContentCard) => {
    const existing = issuesByCardId[card.id];
    setActiveCard(card);
    setDraftCategory(existing?.category ?? 'audio');
    setDraftNote(existing?.note ?? '');
    setIssueModalOpen(true);
  }, [issuesByCardId]);

  const closeIssueModal = useCallback(() => {
    setIssueModalOpen(false);
    setActiveCard(null);
  }, []);

  const saveIssue = useCallback(() => {
    if (!activeCard) return;
    const issue: BetaCardIssue = {
      cardId: activeCard.id,
      arabic: activeCard.arabic,
      audioId: activeCard.audioId,
      category: draftCategory,
      note: draftNote.trim(),
      markedAt: new Date().toISOString(),
    };
    setIssuesByCardId((prev) => ({ ...prev, [activeCard.id]: issue }));
    closeIssueModal();
  }, [activeCard, draftCategory, draftNote, closeIssueModal]);

  const removeIssue = useCallback((cardId: string) => {
    setIssuesByCardId((prev) => {
      const next = { ...prev };
      delete next[cardId];
      return next;
    });
    closeIssueModal();
  }, [closeIssueModal]);

  const handlePrimaryAction = useCallback(
    (currentCard: ContentCard | null) => {
      if (phase === 'finish') {
        setReportModalOpen(true);
        return;
      }
      if (!currentCard) return;
      openIssueModal(currentCard);
    },
    [phase, openIssueModal],
  );

  const switchToFinishPhase = useCallback(() => {
    if (issueCount === 0) return;
    setPhase('finish');
  }, [issueCount]);

  const switchToMarkingPhase = useCallback(() => {
    setPhase('marking');
  }, []);

  const closeReportModal = useCallback(() => {
    setReportModalOpen(false);
    setPhase('marking');
  }, []);

  const report = useMemo(
    () => buildBetaExerciseReport(exercise, issues),
    [exercise, issues],
  );

  const primaryButtonLabel =
    phase === 'finish' ? `Abschließen (${issueCount})` : 'Markieren';

  return {
    phase,
    issueCount,
    markedCardIds,
    issues,
    report,
    issueModalOpen,
    reportModalOpen,
    activeCard,
    draftCategory,
    draftNote,
    primaryButtonLabel,
    setDraftCategory,
    setDraftNote,
    openIssueModal,
    closeIssueModal,
    saveIssue,
    removeIssue,
    handlePrimaryAction,
    switchToFinishPhase,
    switchToMarkingPhase,
    closeReportModal,
    isCardMarked: (cardId: string) => Boolean(issuesByCardId[cardId]),
  };
}
