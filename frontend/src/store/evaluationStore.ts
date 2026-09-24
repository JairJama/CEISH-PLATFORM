import { create } from 'zustand';
import type { CriterionStatus, EvaluationSession } from '../features/evaluation/types/evaluation.types';

interface EvaluationState {
  session: EvaluationSession | null;
  activeCriterionId: string | null;
  isSaving: boolean;
  lastSaved: string | null;

  setSession: (session: EvaluationSession) => void;
  setActiveCriterion: (id: string | null) => void;
  updateCriterionStatus: (id: string, status: CriterionStatus) => void;
  updateCriterionObservation: (id: string, observation: string) => void;
  updateCriterionPageRef: (id: string, page: number | undefined) => void;
  setIsSaving: (val: boolean) => void;
  setLastSaved: (ts: string) => void;
}

export const useEvaluationStore = create<EvaluationState>((set) => ({
  session: null,
  activeCriterionId: null,
  isSaving: false,
  lastSaved: null,

  setSession: (session) => set({ session }),
  setActiveCriterion: (id) => set({ activeCriterionId: id }),
  setIsSaving: (val) => set({ isSaving: val }),
  setLastSaved: (ts) => set({ lastSaved: ts }),

  updateCriterionStatus: (id, status) =>
    set((state) => {
      if (!state.session) return state;
      return {
        session: {
          ...state.session,
          matrix: {
            ...state.session.matrix,
            criteria: state.session.matrix.criteria.map((c) =>
              c.id === id ? { ...c, status, updatedAt: new Date().toISOString() } : c
            ),
          },
        },
      };
    }),

  updateCriterionObservation: (id, observation) =>
    set((state) => {
      if (!state.session) return state;
      return {
        session: {
          ...state.session,
          matrix: {
            ...state.session.matrix,
            criteria: state.session.matrix.criteria.map((c) =>
              c.id === id ? { ...c, observation } : c
            ),
          },
        },
      };
    }),

  updateCriterionPageRef: (id, pageReference) =>
    set((state) => {
      if (!state.session) return state;
      return {
        session: {
          ...state.session,
          matrix: {
            ...state.session.matrix,
            criteria: state.session.matrix.criteria.map((c) =>
              c.id === id ? { ...c, pageReference } : c
            ),
          },
        },
      };
    }),
}));
