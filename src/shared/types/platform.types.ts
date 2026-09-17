import type { Criterion } from '../../features/evaluation/types/evaluation.types';

export type UserRole = 'student' | 'evaluator' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export type SubmissionStatus = 'pending' | 'under-review' | 'reviewed';
export type ClassificationStatus =
  | 'awaiting-assignment'
  | 'awaiting-first'
  | 'awaiting-second'
  | 'awaiting-consensus'
  | 'classified';
export type RiskLevel = 'no-risk' | 'minimal-risk' | 'greater-than-minimal';

export interface StudentSubmission {
  id: string;
  studentId: string;
  documentName: string;
  comment: string;
  status: SubmissionStatus;
  submittedAt: string;
  reviewedAt?: string;
  grade?: number;
  finalComment?: string; // shown anonymously to student
  classificationStatus: ClassificationStatus;
  riskLevel?: RiskLevel;
  classifiedAt?: string;
}

export type StageStatus = 'pending' | 'in-progress' | 'completed';

export interface ReviewStage {
  id: string;
  name: string;
  order: number;
  criteria: Criterion[];
  status: StageStatus;
}

export interface Review {
  id: string;
  submissionId: string;
  evaluatorId: string;
  studentId: string;
  stages: ReviewStage[];
  currentStageIndex: number;
  finalComment?: string;
  completedAt?: string;
  grade?: number;
}

export interface Assignment {
  id: string;
  evaluatorId: string;
  studentId: string;
  createdAt: string;
}
