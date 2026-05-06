import type { ApiResponse } from '../types';
import { handleUnauthorized } from '../services/auth/auth-callback';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

// ── Client HTTP de base ───────────────────────────────────────────────────────
async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  token?: string
): Promise<ApiResponse<T>> {
  const isFormData = options.body instanceof FormData;

  const headers: Record<string, string> = {

    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),

    ...(options.headers as Record<string, string>),
  };

  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });
  
  const skipAuthRedirect = [
    '/auth/login',
    '/auth/refresh',
    '/auth/google/token',
    '/auth/register',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/auth/change-password',
    '/users/me/avatar',
  ]
  // Intercepter les 401 (token expiré) et rediriger vers connexion
  if (res.status === 401 && !skipAuthRedirect.includes(endpoint)) {
    handleUnauthorized();
    // Essayer de parser le JSON d'erreur, sinon retourner un message générique
    try {
      const json = await res.json();
      return {
        ok: false,
        message: json.message || 'Session expirée. Veuillez vous reconnecter.',
        ...json,
      } as ApiResponse<T>;
    } catch {
      return {
        ok: false,
        message: 'Session expirée. Veuillez vous reconnecter.',
      } as ApiResponse<T>;
    }
  }

  const json = await res.json();
  return json as ApiResponse<T>;
}

export const api = {
  get: <T>(url: string, token?: string) => 
    request<T>(url, { method: 'GET' }, token),

  post: <T>(url: string, body: unknown, token?: string) => 
    request<T>(url, { 
      method: 'POST', 
      body: body instanceof FormData ? body : JSON.stringify(body) 
    }, token),

  put: <T>(url: string, body: unknown, token?: string) =>
    request<T>(url, {
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }, token),

  patch: <T>(url: string, body: unknown, token?: string) =>
    request<T>(url, {
      method: 'PATCH',
      body: body instanceof FormData ? body : JSON.stringify(body)
    }, token),

  delete: <T>(url: string, token?: string) =>
    request<T>(url, { method: 'DELETE' }, token),
};