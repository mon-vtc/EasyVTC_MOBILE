// ══════════════════════════════════════════════════════════════════════════════
// TYPES — Module Admin
// Aligné avec EazyVTC_API
// ══════════════════════════════════════════════════════════════════════════════

import type { UserRole } from './auth.types';
import type { UserStatus } from './auth.types';

export interface UserProfile {
  id:                string;
  email:             string;
  role:              UserRole;
  first_name:        string;
  last_name:         string;
  phone:             string | null;
  profile_photo_url: string | null;
  status:            UserStatus;
  status_reason:     string | null;
  status_changed_at: string | null;
  status_changed_by: string | null;
  created_at:        string;
  updated_at:        string;
}

// ── Création d'un gestionnaire ────────────────────────────────────────────────
export interface CreateManagerDto {
  email: string;
  password?: string; // Optionnel — mot de passe temporaire auto-généré si absent
  first_name: string;
  last_name: string;
  phone?: string;
}

// ── Changement de statut ──────────────────────────────────────────────────────
export interface ChangeManagerStatusDto {
  status: UserStatus;
  reason: string;
}

// ── Filtres liste gestionnaires ───────────────────────────────────────────────
export interface ManagerListFilters {
  status?: UserStatus;
  search?: string;
  page?: number;
  limit?: number;
}

// ── Résultat paginé gestionnaires ─────────────────────────────────────────────
export interface ManagerListResult {
  managers: UserProfile[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// ── Filtres liste utilisateurs (admin global) ─────────────────────────────────
export interface AdminUserListFilters {
  role?: UserRole;
  status?: UserStatus;
  search?: string;
  page?: number;
  limit?: number;
}

