import { apiGet } from './http';

export type RegistrationStatus = 'pending' | 'approved' | 'rejected';
export type ResearcherType = 'internal' | 'external';
export type RiskLevel = 'no-risk' | 'minimal-risk' | 'greater-than-minimal';

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
  document_name: string;
  researcher_name: string;
  researcher_email: string;
  classification_status: string;
  final_risk_level: RiskLevel | null;
  other_risk_level: RiskLevel | null;
}

async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(path, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error((data as { error?: string }).error ?? 'No se pudo completar la operación');
  return data as T;
}

export const workflowService = {
  getRegistrationRequests(): Promise<RegistrationRequestItem[]> {
    return apiGet('/api/registration-requests');
  },

  reviewRegistration(id: string, decision: 'approved' | 'rejected'): Promise<RegistrationRequestItem> {
    return apiPatch(`/api/registration-requests/${id}`, { decision });
  },

  getStratificationTasks(): Promise<StratificationTask[]> {
    return apiGet('/api/stratifications');
  },

  saveRiskDecision(id: string, riskLevel: RiskLevel): Promise<{ result: string; message: string }> {
    return apiPatch(`/api/stratifications/${id}`, { riskLevel });
  },
};
