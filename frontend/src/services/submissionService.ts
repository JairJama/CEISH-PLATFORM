// Servicio de entregas — el frontend llama a estas funciones, nunca SQL directo.
import { apiGet } from './http';

export interface Submission {
  id: string;
  student_id: string;
  student_name: string;
  document_name: string;
  document_url: string;
  comment: string;
  status: 'pending' | 'submitted' | 'reviewed';
  submitted_at: string;
  reviewed_at: string | null;
  grade: number | null;
}

export const submissionService = {
  getAll: () => apiGet<Submission[]>('/api/submissions'),
  getByStudent: (studentId: string) =>
    apiGet<Submission | null>(`/api/submissions?studentId=${studentId}`),
  getById: (id: string) => apiGet<Submission>(`/api/submissions/${id}`),
};
