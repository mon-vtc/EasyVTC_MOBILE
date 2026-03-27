import type { ApiResponse } from '../types';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://192.168.1.118:4000';

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

  patch: <T>(url: string, body: unknown, token?: string) => 
    request<T>(url, { 
      method: 'PATCH', 
      body: body instanceof FormData ? body : JSON.stringify(body) 
    }, token),

  delete: <T>(url: string, token?: string) => 
    request<T>(url, { method: 'DELETE' }, token),
};
