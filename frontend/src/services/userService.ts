// Servicio de usuarios — el frontend llama a estas funciones, nunca SQL directo.
import { apiGet } from './http';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

export const userService = {
  getAll: () => apiGet<User[]>('/api/users'),
  getByRole: (role: 'student' | 'teacher' | 'admin') =>
    apiGet<User[]>(`/api/users?role=${encodeURIComponent(role)}`),
  getById: (id: string) => apiGet<User>(`/api/users/${id}`),
};
