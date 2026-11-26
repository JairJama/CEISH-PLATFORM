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

export interface EvaluationStats {
  total: number;
  approved: number;
  rejected: number;
  pending: number;
  completionRate: number;
}
