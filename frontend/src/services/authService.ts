// src/services/authService.ts
// Corre en el NAVEGADOR — solo fetch, sin pg ni minio
import { apiErrorMessage, apiFetch, apiRequest } from './http';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'evaluator' | 'admin';
}

export interface LoginResult {
  success: boolean;
  user?: AuthUser;
  error?: string;
}

export type ResearcherType = 'internal' | 'external';

export interface RegistrationRequest {
  name: string;
  email: string;
  password: string;
  researcherType: ResearcherType;
  affiliation: string;
}

export interface RegistrationResult {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Llama a POST /api/auth/login y devuelve el usuario autenticado
 * o un mensaje de error normalizado.
 */
export async function login(
  email: string,
  password: string
): Promise<LoginResult> {
  try {
    const res = await apiFetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      return { success: false, error: await apiErrorMessage(res, 'Error al iniciar sesión') };
    }

    const data = await res.json() as { user: AuthUser };
    return { success: true, user: data.user };
  } catch {
    return {
      success: false,
      error: 'Error de conexión. Verifica tu red e intenta de nuevo.',
    };
  }
}

export async function register(request: RegistrationRequest): Promise<RegistrationResult> {
  try {
    const res = await apiFetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!res.ok) {
      return { success: false, error: await apiErrorMessage(res, 'No se pudo enviar la solicitud') };
    }
    const data = await res.json() as { message: string };
    return { success: true, message: data.message };
  } catch {
    return { success: false, error: 'Error de conexión. Verifica tu red e intenta de nuevo.' };
  }
}

export async function getSession(): Promise<AuthUser | null> {
  try {
    return await apiRequest<AuthUser>('/api/auth/session');
  } catch {
    return null;
  }
}

export async function logout(): Promise<void> {
  await apiRequest('/api/auth/logout', { method: 'POST' });
}
