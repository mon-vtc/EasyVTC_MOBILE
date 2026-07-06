// ══════════════════════════════════════════════════════════════════════════════
// TYPES — Module Admin
// Aligné avec EasyVTC_API
// ══════════════════════════════════════════════════════════════════════════════

import type { UserRole } from './auth.types';
import type { UserStatus } from './auth.types';

// ── Permissions RBAC gestionnaire ────────────────────────────────────────────

export const MANAGER_PERMISSIONS = [
  // Réservations
  'view_reservations',
  'assign_reservation',
  'cancel_reservation',
  // Utilisateurs & chauffeurs
  'view_users',
  'view_drivers',
  'view_clients',
  // Tarification
  'view_pricing',
  // Documents
  'view_documents',
  // Finances
  'view_orders',
  'view_invoices',
  // Évaluations
  'view_ratings',
  // Support
  'manage_support',
] as const;

export type ManagerPermission = typeof MANAGER_PERMISSIONS[number];

export interface SetManagerPermissionsDto {
  permissions: ManagerPermission[];
}

export interface ManagerPermissionsResult {
  manager_id:  string;
  permissions: ManagerPermission[];
}

// ── Configuration app (coordonnées support) ──────────────────────────────────

export type SupportConfigKey =
  | 'support_phone'
  | 'support_email'
  | 'support_address'
  | 'support_hours';

export interface SupportConfig {
  support_phone:   string;
  support_email:   string;
  support_address: string;
  support_hours:   string;
}

export interface AppConfigEntry {
  key:        string;
  value:      string;
  updated_at: string;
  updated_by: string | null;
}

export const PERMISSION_LABELS: Record<ManagerPermission, string> = {
  view_reservations:  'Voir les réservations',
  assign_reservation: 'Attribuer un chauffeur',
  cancel_reservation: 'Annuler une réservation',
  view_users:         'Voir les utilisateurs',
  view_drivers:       'Voir les chauffeurs',
  view_clients:       'Voir les clients',
  view_pricing:       'Voir les tarifs',
  view_documents:     'Valider les documents chauffeurs',
  view_orders:        'Voir les bons de commande',
  view_invoices:      'Voir les factures',
  view_ratings:       'Voir les évaluations',
  manage_support:     'Gérer le support / chat',
};

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
  coverage_zone:     string | null;
  priority_level:    number | null;
  created_at:        string;
  updated_at:        string;
}

// ── Création d'un gestionnaire ────────────────────────────────────────────────
export interface CreateManagerDto {
  email: string;
  password?: string;
  first_name: string;
  last_name: string;
  phone?: string;
  coverage_zone?: string;
  priority_level?: number;
}

// ── Mise à jour d'un gestionnaire ─────────────────────────────────────────────
export interface UpdateManagerDto {
  first_name?: string;
  last_name?: string;
  phone?: string;
  coverage_zone?: string;
  priority_level?: number;
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

// ── Module Clients (admin) ────────────────────────────────────────────────────

export interface ClientGlobalStats {
  active_count:  number;
  total_trips:   number;
  total_revenue: number;
}

export interface ClientWithStats {
  id:                string;
  email:             string;
  first_name:        string;
  last_name:         string;
  phone:             string | null;
  profile_photo_url: string | null;
  status:            UserStatus;
  status_reason:     string | null;
  status_changed_at: string | null;
  status_changed_by: string | null;
  rgpd_consent:      boolean;
  rgpd_consent_at:   string | null;
  created_at:        string;
  updated_at:        string;
  total_trips:        number;
  total_spent:        number;
  last_trip_date:     string | null;
  avg_rating:         number | null;
  cancellation_rate:  number;
}

export interface ClientListFilters {
  status?: UserStatus;
  search?: string;
  page?:   number;
  limit?:  number;
}

export interface ClientListResult {
  clients:      ClientWithStats[];
  total:        number;
  page:         number;
  limit:        number;
  total_pages:  number;
  global_stats: ClientGlobalStats;
}

export interface ClientTripItem {
  id:                string;
  scheduled_at:      string;
  pickup_address:    string;
  dest_address:      string;
  price_final:       number | null;
  price_estimated:   number;
  status:            string;
  driver_first_name: string | null;
  driver_last_name:  string | null;
  rating:            number | null;
}

export interface ClientTripsResult {
  trips:       ClientTripItem[];
  total:       number;
  page:        number;
  limit:       number;
  total_pages: number;
}

export type AdminStatsPeriod = 'all' | 'day' | 'week' | 'month';

export interface AdminStatsFilters {
  period?:    AdminStatsPeriod;
  date?:      string;
  date_from?: string;
  date_to?:   string;
}

export interface AdminStats {
  date_from?: string | null;
  date_to?:   string | null;
  reservations: {
    total: number;
    by_status:   Record<string, number>;
  };
  revenue: {
    total_eur: number;
    total_xof: number;
  };
  drivers: {
    total:       number;
    active:      number;
    online:      number;
    on_trip:     number;
  };
  clients: {
    total: number;
    active: number;
  };
  vehicle_type_distribution: Record<string, number>;
}

// ── Dashboard analytique avancé ───────────────────────────────────────────────

export type AdminDashboardPeriod = 'week' | 'month' | 'year';

export interface RevenueChartEntry {
  label: string;
  eur:   number;
  xof:   number;
}

export interface TopDriver {
  rank:        number;
  driver_id:   string;
  first_name:  string;
  last_name:   string;
  trip_count:  number;
  avg_rating:  number | null;
  revenue_eur: number;
}

export interface PopularRoute {
  pickup_address: string;
  dest_address:   string;
  count:          number;
}

export interface PeakHourSlot {
  slot:  string;
  count: number;
}

export interface AdminDashboard {
  period:    AdminDashboardPeriod;
  date_from: string;
  date_to:   string;

  revenue: {
    total_eur: number;
    total_xof: number;
    trend_pct: number | null;
    chart:     RevenueChartEntry[];
  };

  trips: {
    total:           number;
    completed:       number;
    cancelled:       number;
    completion_rate: number;
    trend_pct:       number | null;
  };

  drivers: { total:  number; active: number; };
  clients: { total:  number; active: number; };

  avg_rating:     number | null;
  top_drivers:    TopDriver[];
  popular_routes: PopularRoute[];
  peak_hours:     PeakHourSlot[];
}