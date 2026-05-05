import { api } from '../../lib/api';
import type { ApiResponse, AuthUser, AvatarUploadResponseData, LoginPayload, RegisterPayload } from '../../types';

export const authApi = {

  // ── Auth endpoints ──────────────────────────────────────────
  login: async (payload: LoginPayload): Promise<ApiResponse<{ user: AuthUser; access_token: string; refresh_token: string | null }>> => {
    return api.post('/auth/login', payload);
  },

  /**
   * Connexion Google depuis l'app mobile.
   * Envoie l'access_token obtenu via expo-web-browser à /auth/google/token.
   * Ne pas utiliser /auth/google qui est une redirection web.
   */
  google: async (accessToken: string, refreshToken?: string): Promise<ApiResponse<{ user: AuthUser; access_token: string; refresh_token: string | null }>> => {
    return api.post('/auth/google/token', { access_token: accessToken, refresh_token: refreshToken });
  },

  register: async (payload: RegisterPayload): Promise<ApiResponse<{ user: AuthUser; access_token: string; refresh_token: string | null }>> => {
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

  /**
   * Réinitialisation du mot de passe.
   * Le token est le JWT issu du lien Supabase reçu par email (access_token dans le fragment #).
   */
  resetPassword: async (token: string, newPassword: string): Promise<ApiResponse<null>> => {
    return api.post('/auth/reset-password', { new_password: newPassword }, token);
  },

  changePassword: async (currentPassword: string, newPassword: string, confirmPassword: string, token: string): Promise<ApiResponse<null>> => {
    return api.post('/auth/change-password', { current_password: currentPassword, new_password: newPassword, confirm_password: confirmPassword }, token);
  },

  uploadAvatar: async (formData: FormData, token: string): Promise<ApiResponse<AvatarUploadResponseData>> => {
    return api.post('/users/me/avatar', formData, token);
  },
};