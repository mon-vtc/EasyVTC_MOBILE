import { api } from '../../lib/api';
import type {
  ApiResponse, AuthUser, PaginatedUsers,
  UpdateProfilePayload, UpdateUserStatusPayload,
  ListUsersParams,
} from '../../types';

export const userApi = {

  // // GET /users/me — profil complet
  // getMe: (token: string) =>
  //   api.get<ApiResponse<AuthUser>>('/users/me', token),

  // // PATCH /users/me
  updateMe: (token: string, payload: UpdateProfilePayload) =>
    api.patch<AuthUser>('/users/me', payload, token),

  // // POST /users/me/avatar
  // uploadAvatar: (token: string, formData: FormData) =>
  //   api.upload<ApiResponse<{ profile_photo_url: string }>>('/users/me/avatar', formData, token),

  // GET /users (admin) — liste paginée avec filtres
  listUsers: (token: string, params?: ListUsersParams) => {
    const query = new URLSearchParams();
    if (params?.page)   query.set('page',   String(params.page));
    if (params?.limit)  query.set('limit',  String(params.limit));
    if (params?.role)   query.set('role',   params.role);
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);
    const qs = query.toString();
    return api.get<PaginatedUsers>(`/users${qs ? `?${qs}` : ''}`, token);
  },

  // GET /users/:id (admin)
  getUserById: (token: string, userId: string) =>
    api.get<AuthUser>(`/users/${userId}`, token),

  // PATCH /users/:id/status (admin)
  updateUserStatus: (token: string, userId: string, payload: UpdateUserStatusPayload) =>
    api.patch<AuthUser>(`/users/${userId}/status`, payload, token),
};