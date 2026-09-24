import { create } from 'zustand';
import type { Review } from '../shared/types/platform.types';
import type { CriterionStatus } from '../features/evaluation/types/evaluation.types';

interface ReviewState {
  review: Review | null;
  setReview: (review: Review | null) => void;
  advanceStage: () => void;
  completeReview: (finalComment: string, grade: number) => void;
  updateStageCriterionStatus: (stageIdx: number, criterionId: string, status: CriterionStatus) => void;
  updateStageCriterionObservation: (stageIdx: number, criterionId: string, observation: string) => void;
  updateStageCriterionPageRef: (stageIdx: number, criterionId: string, page: number | undefined) => void;
}

function mapCriteria<T extends { id: string }>(
  stages: Review['stages'],
  stageIdx: number,
  criterionId: string,
  update: (c: T) => T
): Review['stages'] {
  return stages.map((stage, i) =>
    i === stageIdx
      ? { ...stage, criteria: stage.criteria.map((c) => (c.id === criterionId ? update(c as unknown as T) as unknown as typeof c : c)) }
      : stage
  );
}

export const useReviewStore = create<ReviewState>((set) => ({
  review: null,

  setReview: (review) => set({ review }),

  advanceStage: () =>
    set((state) => {
      if (!state.review) return state;
      const cur = state.review.currentStageIndex;
      const next = Math.min(cur + 1, state.review.stages.length - 1);
      return {
        review: {
          ...state.review,
          currentStageIndex: next,
          stages: state.review.stages.map((s, i) =>
            i === cur ? { ...s, status: 'completed' as const }
            : i === next ? { ...s, status: 'in-progress' as const }
            : s
          ),
        },
      };
    }),

  completeReview: (finalComment, grade) =>
    set((state) => {
      if (!state.review) return state;
      return {
        review: {
          ...state.review,
          finalComment,
          grade,
          completedAt: new Date().toISOString(),
          stages: state.review.stages.map((s) => ({ ...s, status: 'completed' as const })),
        },
      };
    }),

  updateStageCriterionStatus: (stageIdx, criterionId, status) =>
    set((state) => {
      if (!state.review) return state;
      return {
        review: {
          ...state.review,
          stages: mapCriteria(state.review.stages, stageIdx, criterionId, (c) => ({ ...c, status })),
        },
      };
    }),

  updateStageCriterionObservation: (stageIdx, criterionId, observation) =>
    set((state) => {
      if (!state.review) return state;
      return {
        review: {
          ...state.review,
          stages: mapCriteria(state.review.stages, stageIdx, criterionId, (c) => ({ ...c, observation })),
        },
      };
    }),

  updateStageCriterionPageRef: (stageIdx, criterionId, pageReference) =>
    set((state) => {
      if (!state.review) return state;
      return {
        review: {
          ...state.review,
          stages: mapCriteria(state.review.stages, stageIdx, criterionId, (c) => ({ ...c, pageReference })),
        },
      };
    }),
}));
