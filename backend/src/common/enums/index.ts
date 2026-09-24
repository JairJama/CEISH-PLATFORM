export const UserType = {
  INVESTIGATOR: "INVESTIGATOR",
  CEISH_MEMBER: "CEISH_MEMBER",
  ADMIN: "ADMIN",
} as const;

export type UserType = (typeof UserType)[keyof typeof UserType];

export const InvestigatorType = {
  INTERNAL: "INTERNAL",
  EXTERNAL: "EXTERNAL",
} as const;

export type InvestigatorType =
  (typeof InvestigatorType)[keyof typeof InvestigatorType];

export const CeishMemberType = {
  INTERNAL: "INTERNAL",
  EXTERNAL: "EXTERNAL",
} as const;

export type CeishMemberType =
  (typeof CeishMemberType)[keyof typeof CeishMemberType];

export const InvestigationStatus = {
  CREATED: "CREATED",
  PENDING_ADMIN_REVIEW: "PENDING_ADMIN_REVIEW",
  REJECTED: "REJECTED",
  APPROVED: "APPROVED",
  WAITING_STRATIFICATION: "WAITING_STRATIFICATION",
  STRATIFICATION: "STRATIFICATION",
  RISK_DEFINED: "RISK_DEFINED",
  ADMIN_RISK_REVIEW: "ADMIN_RISK_REVIEW",
  RESTRATIFICATION: "RESTRATIFICATION",
  WAITING_EVALUATORS: "WAITING_EVALUATORS",
  WAITING_CONFLICT_CHECK: "WAITING_CONFLICT_CHECK",
  UNDER_EVALUATION: "UNDER_EVALUATION",
  WAITING_RESEARCHER_RESPONSE: "WAITING_RESEARCHER_RESPONSE",
  FINAL_REVIEW: "FINAL_REVIEW",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;

export type InvestigationStatus =
  (typeof InvestigationStatus)[keyof typeof InvestigationStatus];

export const RiskLevel = {
  NO_RISK: "NO_RISK",
  MINIMUM_RISK: "MINIMUM_RISK",
  GREATER_THAN_MINIMUM_RISK: "GREATER_THAN_MINIMUM_RISK",
} as const;

export type RiskLevel = (typeof RiskLevel)[keyof typeof RiskLevel];

export const RiskAssessmentStatus = {
  ACTIVE: "ACTIVE",
  REPLACED: "REPLACED",
  COMPLETED: "COMPLETED",
} as const;

export type RiskAssessmentStatus =
  (typeof RiskAssessmentStatus)[keyof typeof RiskAssessmentStatus];

export const EvaluationAssignmentStatus = {
  PENDING: "PENDING",
  ACTIVE: "ACTIVE",
  CONFLICT: "CONFLICT",
  REMOVED: "REMOVED",
  FINISHED: "FINISHED",
} as const;

export type EvaluationAssignmentStatus =
  (typeof EvaluationAssignmentStatus)[keyof typeof EvaluationAssignmentStatus];

export const EvaluationStatus = {
  CREATED: "CREATED",
  IN_PROGRESS: "IN_PROGRESS",
  OBSERVATIONS_FOUND: "OBSERVATIONS_FOUND",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;

export type EvaluationStatus =
  (typeof EvaluationStatus)[keyof typeof EvaluationStatus];

export const EvaluationProcessStatus = {
  CREATED: "CREATED",
  IN_PROGRESS: "IN_PROGRESS",
  OBSERVATIONS_FOUND: "OBSERVATIONS_FOUND",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;

export type EvaluationProcessStatus =
  (typeof EvaluationProcessStatus)[keyof typeof EvaluationProcessStatus];

export const CorrectionRoundStatus = {
  OPEN: "OPEN",
  SUBMITTED: "SUBMITTED",
  EXPIRED: "EXPIRED",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;

export type CorrectionRoundStatus =
  (typeof CorrectionRoundStatus)[keyof typeof CorrectionRoundStatus];

export const AnnexFieldType = {
  TEXT: "TEXT",
  TEXTAREA: "TEXTAREA",
  CHECKLIST: "CHECKLIST",
  DATE: "DATE",
  NUMERIC: "NUMERIC",
  FILE_UPLOAD: "FILE_UPLOAD",
} as const;

export type AnnexFieldType =
  (typeof AnnexFieldType)[keyof typeof AnnexFieldType];

export const DocumentType = {
  ANNEX_UPLOAD: "ANNEX_UPLOAD",
  CONFLICT_DECLARATION: "CONFLICT_DECLARATION",
  CORRECTION_RESPONSE: "CORRECTION_RESPONSE",
  EVALUATION_EVIDENCE: "EVALUATION_EVIDENCE",
  OTHER: "OTHER",
} as const;

export type DocumentType = (typeof DocumentType)[keyof typeof DocumentType];

export const WorkflowEventType = {
  USER_REGISTERED: "USER_REGISTERED",
  USER_APPROVED: "USER_APPROVED",
  USER_REJECTED: "USER_REJECTED",
  INVESTIGATION_CREATED: "INVESTIGATION_CREATED",
  INVESTIGATION_SUBMITTED: "INVESTIGATION_SUBMITTED",
  INVESTIGATION_APPROVED: "INVESTIGATION_APPROVED",
  INVESTIGATION_REJECTED: "INVESTIGATION_REJECTED",
  STRATIFICATION_CREATED: "STRATIFICATION_CREATED",
  STRATIFICATION_REPLACED: "STRATIFICATION_REPLACED",
  STRATIFICATION_COMPLETED: "STRATIFICATION_COMPLETED",
  RISK_DEFINED: "RISK_DEFINED",
  EVALUATOR_ASSIGNED: "EVALUATOR_ASSIGNED",
  CONFLICT_DECLARED: "CONFLICT_DECLARED",
  EVALUATOR_REMOVED: "EVALUATOR_REMOVED",
  EVALUATION_STARTED: "EVALUATION_STARTED",
  EVALUATION_COMPLETED: "EVALUATION_COMPLETED",
  OBSERVATION_ADDED: "OBSERVATION_ADDED",
  CORRECTION_ROUND_OPENED: "CORRECTION_ROUND_OPENED",
  CORRECTION_SUBMITTED: "CORRECTION_SUBMITTED",
  CORRECTION_APPROVED: "CORRECTION_APPROVED",
  CORRECTION_REJECTED: "CORRECTION_REJECTED",
  INVESTIGATION_COMPLETED: "INVESTIGATION_COMPLETED",
  INVESTIGATION_CANCELLED: "INVESTIGATION_CANCELLED",
  ADMIN_ACTION: "ADMIN_ACTION",
  REESTRATIFICATION_REQUESTED: "REESTRATIFICATION_REQUESTED",
} as const;

export type WorkflowEventType =
  (typeof WorkflowEventType)[keyof typeof WorkflowEventType];

export const UserAccountStatus = {
  PENDING_APPROVAL: "PENDING_APPROVAL",
  ACTIVE: "ACTIVE",
  REJECTED: "REJECTED",
  SUSPENDED: "SUSPENDED",
} as const;

export type UserAccountStatus =
  (typeof UserAccountStatus)[keyof typeof UserAccountStatus];
