import { api } from '../../lib/api';
import type { ApiResponse, AuthUser, LoginPayload, RegisterPayload } from '../../types';

export const authApi = {

  // ── Auth endpoints ──────────────────────────────────────────
  login: async (payload: LoginPayload): Promise<ApiResponse<{ user: AuthUser; access_token: string; refresh_token: string }>> => {
    return api.post('/auth/login', payload);
  },

  google: async (token: string): Promise<ApiResponse<{ user: AuthUser; access_token: string; refresh_token: string }>> => {
    return api.post('/auth/google', { google_token: token });
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

  changePassword: async (currentPassword: string, newPassword: string, confirmPassword: string, token: string): Promise<ApiResponse<null>> => {
    return api.post('/auth/change-password', {current_password: currentPassword , new_password: newPassword, confirm_password: confirmPassword }, token);
  },

  updateProfile: async (data: FormData | { first_name?: string; last_name?: string; phone?: string }, token: string): Promise<ApiResponse<AuthUser>> => {
    return api.patch('/users/me', data, token);
  },

  uploadAvatar: async (formData: FormData, token: string): Promise<ApiResponse<{ avatarUrl: string }>> => {
    return api.post('/users/me/avatar', formData, token);
  }
  
};