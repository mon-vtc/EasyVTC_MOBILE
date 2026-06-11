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
  reservation_id:    string;
  scheduled_at:      string;
  pickup_address:    string;
  dest_address:      string;
  price_final:       number;
  commission_amount: number;
  net_amount:        number;
  currency:          string;
  client_first_name: string | null;
  client_last_name:  string | null;
  rating:            number | null;
}

export interface DriverRevenuesResult {
  period:              RevenuesPeriod;
  date_from:           string | null;
  date_to:             string | null;
  total_trips:         number;
  total_gross:         number;
  total_commission:    number;
  total_net:           number;
  currency:            string;
  revenue_by_currency: { EUR: number; XOF: number };
  trips:               RevenueTrip[];
}