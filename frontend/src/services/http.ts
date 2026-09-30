// Cliente HTTP único: mantiene las cookies y normaliza errores NestJS/Vite.
export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(path, { credentials: 'same-origin', ...init });
}

export async function apiErrorMessage(response: Response, fallback?: string): Promise<string> {
  const body = await response.json().catch(() => ({}));
  const payload = body as { message?: string | string[]; error?: string };
  const message = Array.isArray(payload.message)
    ? payload.message.join('. ')
    : payload.message;
  return message ?? payload.error ?? fallback ?? `Error ${response.status}`;
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await apiFetch(path, init);
  if (!response.ok) {
    throw new Error(await apiErrorMessage(response, `Error ${response.status} en ${path}`));
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function apiGet<T>(path: string): Promise<T> {
  return apiRequest<T>(path);
}
