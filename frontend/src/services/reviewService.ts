// Servicio de revisiones — el frontend llama a estas funciones, nunca SQL directo.
import { apiGet } from './http';

export interface Annotation {
  id: string;
  page_number: number;
  x: number;
  y: number;
  width: number;
  height: number;
  comment: string;
}

export interface CriterionEvaluation {
  id: string;
  criterion: string;
  status: 'pending' | 'approved' | 'rejected';
  comment: string;
  annotations: Annotation[];
}

export interface ReviewStage {
  id: string;
  stage_number: number;
  status: 'pending' | 'in-progress' | 'completed';
  completed_at: string | null;
  criteria: CriterionEvaluation[];
}

export interface Review {
  id: string;
  submission_id: string;
  reviewer_id: string;
  reviewer_name: string;
  comment: string;
  grade: number | null;
  status: 'in-progress' | 'completed';
  created_at: string;
  stages: ReviewStage[];
}

export const reviewService = {
  getBySubmission: (submissionId: string) =>
    apiGet<Review | null>(`/api/reviews/${submissionId}`),
};
