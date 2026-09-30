// Servicio de asignaciones — el frontend llama a estas funciones, nunca SQL directo.
import { apiGet } from './http';

export interface Assignment {
  id: string;
  teacher_id: string;
  teacher_name: string;
  student_id: string;
  student_name: string;
  created_at: string;
}

export const assignmentService = {
  getAll: () => apiGet<Assignment[]>('/api/assignments'),
  getByTeacher: (teacherId: string) =>
    apiGet<Assignment[]>(`/api/assignments?teacherId=${teacherId}`),
};
