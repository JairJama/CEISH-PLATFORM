// src/services/authService.ts
// Corre en el NAVEGADOR — solo fetch, sin pg ni minio

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
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        error: data.error ?? 'Error al iniciar sesión',
      };
    }

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
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    const data = await res.json();
    return res.ok
      ? { success: true, message: data.message }
      : { success: false, error: data.error ?? 'No se pudo enviar la solicitud' };
  } catch {
    return { success: false, error: 'Error de conexión. Verifica tu red e intenta de nuevo.' };
  }
}

export async function getSession(): Promise<AuthUser | null> {
  const res = await fetch('/api/auth/session');
  if (!res.ok) return null;
  return res.json() as Promise<AuthUser>;
}

export async function logout(): Promise<void> {
  await fetch('/api/auth/logout', { method: 'POST' });
}
