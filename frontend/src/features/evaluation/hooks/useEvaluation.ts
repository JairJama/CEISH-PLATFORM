import { useEffect } from 'react';
import { useEvaluationStore } from '../../../store/evaluationStore';
import { evaluationService } from '../services/evaluationService';
import type { EvaluationStats } from '../types/evaluation.types';

export function useEvaluation(sessionId: string) {
  const {
    session,
    activeCriterionId,
    isSaving,
    lastSaved,
    setSession,
    setActiveCriterion,
    updateCriterionStatus,
    updateCriterionObservation,
    updateCriterionPageRef,
    setIsSaving,
    setLastSaved,
  } = useEvaluationStore();

  useEffect(() => {
    evaluationService.getSession(sessionId).then(setSession);
  }, [sessionId, setSession]);

  const save = async () => {
    if (!session) return;
    setIsSaving(true);
    try {
      const saved = await evaluationService.saveSession(session);
      setSession(saved);
      setLastSaved(saved.updatedAt);
    } finally {
      setIsSaving(false);
    }
  };

  const stats: EvaluationStats | null = session
    ? (() => {
        const { criteria } = session.matrix;
        const approved = criteria.filter((c) => c.status === 'approved').length;
        const rejected = criteria.filter((c) => c.status === 'rejected').length;
        const pending = criteria.filter((c) => c.status === 'pending').length;
        const total = criteria.length;
        return {
          total,
          approved,
          rejected,
          pending,
          completionRate:
            total > 0 ? Math.round(((approved + rejected) / total) * 100) : 0,
        };
      })()
    : null;

  return {
    session,
    activeCriterionId,
    isSaving,
    lastSaved,
    stats,
    setActiveCriterion,
    updateCriterionStatus,
    updateCriterionObservation,
    updateCriterionPageRef,
    save,
  };
}
