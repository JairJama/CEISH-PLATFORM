import { apiGet, apiRequest } from './http';
import { storageService } from './storage';
import type { Annex12ChecklistItem } from '../shared/annex12';

export type RegistrationStatus = 'pending' | 'approved' | 'rejected';
export type ResearcherType = 'internal' | 'external';
export type RiskLevel = 'no-risk' | 'minimal-risk' | 'greater-than-minimal';

export interface WorkflowDocument {
  id: string;
  document_name: string;
  mime_type: string;
  size_bytes: number | string;
  uploaded_at: string;
}

export interface NoRiskCriterion {
  indicator: string;
  answer: 'yes' | 'no';
  observations: string;
}

export interface Annex27Payload {
  researchType: string;
  location: string;
  responsibleInstitutions: string;
  principalInvestigatorId: string;
  principalInvestigatorDegree: string;
  criteria: NoRiskCriterion[];
}

export interface RegistrationRequestItem {
  id: string;
  name: string;
  email: string;
  researcher_type: ResearcherType;
  affiliation: string;
  status: RegistrationStatus;
  created_at: string;
  reviewed_at: string | null;
}

export interface StratificationTask {
  id: string;
  submission_id: string;
  stratifier_id: string;
  round_number: number;
  risk_level: RiskLevel | null;
  assigned_at: string;
  decided_at: string | null;
  research_code: string;
  title: string;
  document_name: string;
  researcher_name: string;
  researcher_email: string;
  classification_status: string;
  final_risk_level: RiskLevel | null;
  documents: WorkflowDocument[];
  annex_11_id: string | null;
  annex_11_status: string | null;
  annex_11_data: Record<string, unknown> | null;
  annex_23_id: string | null;
  has_conflict: boolean | null;
  conflict_data: Record<string, unknown> | null;
  annex_27_id: string | null;
  annex_27_status: string | null;
  annex_27_data: Partial<Annex27Payload> | null;
}

export type QualificationStatus =
  | 'pending-review'
  | 'corrections-required'
  | 'resubmitted'
  | 'approved'
  | 'cancelled'
  | 'expired';

export interface QualificationTask {
  id: string;
  submission_id: string;
  qualifier_id: string;
  status: QualificationStatus;
  current_cycle: number;
  document_name: string;
  researcher_name: string;
  researcher_email: string;
  cycle_id: string;
  cycle_status: string;
  observations: string;
  correction_due_at: string | null;
  correction_document_name: string | null;
  correction_submitted_at: string | null;
  updated_at: string;
  annexes: QualificationAnnex[];
}

export interface QualificationAnnex {
  id: string;
  annexNumber: 11 | 12 | 13;
  cycleNumber: number | null;
  revisionNumber: number | null;
  decision: string | null;
  createdAt: string;
  documentName: string;
  documentReady: boolean;
}

export interface AdminResearchItem {
  submission_id: string;
  document_name: string;
  submitted_at: string;
  researcher_name: string;
  researcher_email: string;
  classification_status: string;
  risk_level: RiskLevel | null;
  stratifier_id: string | null;
  stratifier_name: string | null;
  stratifier_email: string | null;
  stratification_decided_at: string | null;
  qualification_status: QualificationStatus | null;
  qualifier_id: string | null;
  qualifier_name: string | null;
  qualifier_email: string | null;
  annexes: Array<{
    id: string;
    annexNumber: 11 | 12 | 13 | 23 | 27;
    cycleNumber?: number | null;
    revisionNumber?: number | null;
    decision?: string | null;
    createdAt?: string;
    documentName: string;
    documentReady: boolean;
  }>;
}

async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  return apiRequest<T>(path, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  return apiRequest<T>(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export const workflowService = {
  getRegistrationRequests(): Promise<RegistrationRequestItem[]> {
    return apiGet('/api/registration-requests');
  },

  getAdminResearch(): Promise<AdminResearchItem[]> {
    return apiGet('/api/admin/research');
  },

  reassignStratifier(submissionId: string, stratifierId: string): Promise<{ message: string }> {
    return apiPatch(`/api/admin/research/${submissionId}/reassign`, { stratifierId });
  },

  reassignQualifier(submissionId: string, qualifierId: string): Promise<{ message: string }> {
    return apiPatch(`/api/admin/research/${submissionId}/qualifier`, { qualifierId });
  },

  cancelResearch(submissionId: string): Promise<{ message: string }> {
    return apiPatch(`/api/admin/research/${submissionId}/cancel`, {});
  },

  reviewRegistration(id: string, decision: 'approved' | 'rejected'): Promise<RegistrationRequestItem> {
    return apiPatch(`/api/registration-requests/${id}`, { decision });
  },

  getStratificationTasks(): Promise<StratificationTask[]> {
    return apiGet('/api/stratifications');
  },

  declareConflict(
    id: string,
    declaration: { placeDate: string; hasConflict: boolean; details: string },
  ): Promise<{ result: string; message: string }> {
    return apiPost(`/api/stratifications/${id}/conflict`, declaration);
  },

  updateAnnex11(id: string, data: Record<string, unknown>): Promise<{ message: string }> {
    return apiPatch(`/api/stratifications/${id}/annex-11`, { data });
  },

  getAnnexDocumentUrl(id: string): Promise<{ url: string; documentName: string }> {
    return apiGet(`/api/annexes/${id}/document`);
  },

  saveNoRiskDecision(id: string, annex27: Annex27Payload): Promise<{ result: string; message: string }> {
    return apiPatch(`/api/stratifications/${id}`, { annex27 });
  },

  getQualificationTasks(): Promise<QualificationTask[]> {
    return apiGet('/api/qualifications');
  },

  reviewQualification(
    id: string,
    decision: 'approved' | 'corrections-required' | 'cancelled',
    observations: string,
    checklist: Annex12ChecklistItem[],
  ): Promise<{ result: string; message: string }> {
    return apiPatch(`/api/qualifications/${id}/review`, { decision, observations, checklist });
  },

  async submitCorrection(id: string, file: File): Promise<{ message: string }> {
    const uploaded = await storageService.uploadDocument(file);
    return apiPost(`/api/qualifications/${id}/corrections`, {
      documentName: uploaded.documentName,
      documentPath: uploaded.documentPath,
    });
  },

  async getCorrectionDocumentUrl(cycleId: string): Promise<string> {
    const response = await apiGet<{ url: string }>(`/api/qualification-corrections/${cycleId}`);
    return response.url;
  },
};
