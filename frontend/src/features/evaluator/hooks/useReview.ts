import { useEffect } from 'react';
import { useReviewStore } from '../../../store/reviewStore';
import { useAuthStore } from '../../../store/authStore';
import { platformService } from '../../../shared/services/platformService';
import type { CriterionStatus } from '../../../features/evaluation/types/evaluation.types';
import type { EvaluationStats } from '../../../features/evaluation/types/evaluation.types';

export function useReview(submissionId: string) {
  const currentUser = useAuthStore((s) => s.currentUser);
  const {
    review,
    setReview,
    advanceStage,
    completeReview,
    updateStageCriterionStatus,
    updateStageCriterionObservation,
    updateStageCriterionPageRef,
  } = useReviewStore();

  useEffect(() => {
    if (!currentUser) return;
    platformService.getOrCreateReview(submissionId, currentUser.id).then(setReview);
  }, [submissionId, currentUser, setReview]);

  const currentStage = review ? review.stages[review.currentStageIndex] : null;
  const isLastStage = review ? review.currentStageIndex === review.stages.length - 1 : false;
  const isComplete = Boolean(review?.completedAt);

  const stageStats: EvaluationStats | null = currentStage
    ? (() => {
        const approved = currentStage.criteria.filter((c) => c.status === 'approved').length;
        const rejected = currentStage.criteria.filter((c) => c.status === 'rejected').length;
        const pending = currentStage.criteria.filter((c) => c.status === 'pending').length;
        const total = currentStage.criteria.length;
        return {
          total,
          approved,
          rejected,
          pending,
          completionRate: total > 0 ? Math.round(((approved + rejected) / total) * 100) : 0,
        };
      })()
    : null;

  const handleAdvance = async () => {
    advanceStage();
    const updated = useReviewStore.getState().review;
    if (updated) await platformService.saveReview(updated);
  };

  const handleComplete = async (finalComment: string, grade: number) => {
    completeReview(finalComment, grade);
    const updated = useReviewStore.getState().review;
    if (updated) await platformService.saveReview(updated);
  };

  const handleSave = async () => {
    const current = useReviewStore.getState().review;
    if (current) await platformService.saveReview(current);
  };

  const updateStatus = (criterionId: string, status: CriterionStatus) => {
    if (!review) return;
    updateStageCriterionStatus(review.currentStageIndex, criterionId, status);
  };

  const updateObservation = (criterionId: string, observation: string) => {
    if (!review) return;
    updateStageCriterionObservation(review.currentStageIndex, criterionId, observation);
  };

  const updatePageRef = (criterionId: string, page: number | undefined) => {
    if (!review) return;
    updateStageCriterionPageRef(review.currentStageIndex, criterionId, page);
  };

  return {
    review,
    currentStage,
    stageStats,
    isLastStage,
    isComplete,
    handleAdvance,
    handleComplete,
    handleSave,
    updateStatus,
    updateObservation,
    updatePageRef,
  };
}
