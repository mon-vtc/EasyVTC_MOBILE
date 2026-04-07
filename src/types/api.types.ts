import type { AuthTokens, AuthUser }     from './auth.types';

// ── Réponse générique ───────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  ok:      boolean;
  message?: string;
  data?:   T;
  errors?: Record<string, string[]>;
}

// ── Réponses Auth ───────────────────────────────────────────────
export interface AuthResponseData extends AuthTokens {
  user: AuthUser;
}

export interface AvatarUploadResponseData {
  profile_photo_url: string;
  message?: string;
}

// ── Réponses Admin ──────────────────────────────────────────────
export interface PaginatedUsers {
  users:       AuthUser[];
  total:       number;
  page:        number;
  limit:       number;
  total_pages: number;
}

export interface ListUsersParams {
  page?:   number;
  limit?:  number;
  role?:   'client' | 'driver' | 'admin' | 'manager';
  status?: 'active' | 'inactive' | 'locked';
  search?: string;
}