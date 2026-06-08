// ══════════════════════════════════════════════════════════════════════════════
// TYPES — Module Drivers (Frontend)
// ══════════════════════════════════════════════════════════════════════════════

import type { VehicleType } from './user.types';

// ── Planning ──────────────────────────────────────────────────────────────────

export type PlanningPeriod = 'week' | 'month';

export interface PlanningReservation {
  id: string;
  status: string;
  scheduled_at: string;
  pickup_address: string;
  dest_address: string;
  vehicle_type: VehicleType | null;
  price_final: number | null;
  price_estimated: number;
  country: string;
  client: {
    first_name: string;
    last_name: string;
    phone: string | null;
  } | null;
  trip: {
    id: string;
    started_at: string | null;
    ended_at: string | null;
    actual_distance_km: number | null;
    actual_duration_min: number | null;
  } | null;
}

export interface DriverPlanningResult {
  period: PlanningPeriod;
  date_from: string;
  date_to: string;
  reservations: PlanningReservation[];
  total: number;
}

// ── Revenus ───────────────────────────────────────────────────────────────────

export type RevenuesPeriod = 'week' | 'month' | 'all';

export interface RevenueTrip {
  reservation_id: string;
  scheduled_at: string;
  price_final: number;
  currency: string;
}
export interface DriverRevenuesResult {
  period: RevenuesPeriod;
  date_from: string | null;
  date_to: string | null;
  total_trips: number;
  total_gross: number;         // total brut avant commission
  total_commission: number;    // total prélevé par la plateforme
  total_net: number;           // ce que le chauffeur perçoit réellement
  total_revenue: number;       // alias de total_net (rétro-compatibilité)
  currency: string;
  revenue_by_currency: { EUR: number; XOF: number };
  trips: RevenueTrip[];
}