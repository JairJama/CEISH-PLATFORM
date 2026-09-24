export type CriterionStatus = 'pending' | 'approved' | 'rejected';

export interface Criterion {
  id: string;
  label: string;
  description?: string;
  category?: string;
  status: CriterionStatus;
  observation: string;
  pageReference?: number;
  updatedAt?: string;
}

export interface EvaluationMatrix {
  id: string;
  name: string;
  version: string;
  criteria: Criterion[];
}

export interface EvaluationSession {
  id: string;
  documentName: string;
  documentUrl?: string;
  evaluator: string;
  institution?: string;
  matrix: EvaluationMatrix;
  status: 'draft' | 'in-progress' | 'completed';
  createdAt: string;
  updatedAt: string;
}

// Prepared for future PDF annotation feature
export interface PDFAnnotation {
  id: string;
  criterionId: string;
  pageNumber: number;
  coordinates?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  note: string;
  createdAt: string;
}

export interface EvaluationStats {
  total: number;
  approved: number;
  rejected: number;
  pending: number;
  completionRate: number;
}
