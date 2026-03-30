import { api } from '../../lib/api';
import type { ApiResponse, AuthUser, LoginPayload, RegisterPayload } from '../../types/auth.types';

export const authApi = {
  login: async (payload: LoginPayload): Promise<ApiResponse<{ user: AuthUser; access_token: string; refresh_token: string }>> => {
    return api.post('/auth/login', payload);
  },

  register: async (payload: RegisterPayload): Promise<ApiResponse<{ user: AuthUser; access_token: string; refresh_token: string }>> => {
    return api.post('/auth/register', payload);
  },

  me: async (token: string): Promise<ApiResponse<AuthUser>> => {
    return api.get('/auth/me', token);
  },

  logout: async (token: string): Promise<ApiResponse<null>> => {
    return api.post('/auth/logout', {}, token);
  },

  refresh: async (refreshToken: string): Promise<ApiResponse<{ access_token: string; refresh_token: string }>> => {
    return api.post('/auth/refresh', { refresh_token: refreshToken });
  },

  forgotPassword: async (email: string): Promise<ApiResponse<null>> => {
    return api.post('/auth/forgot-password', { email });
  },
};