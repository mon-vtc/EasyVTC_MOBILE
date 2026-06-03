// ══════════════════════════════════════════════════════════════════════════════
// TYPES — Module Commissions
// Sprint 6 — EasyVTC
// ══════════════════════════════════════════════════════════════════════════════

export type CommissionZone = 'france' | 'senegal';
export type CommissionRateType = 'percentage' | 'flat';
export type CommissionPeriod = 'day' | 'week' | 'month' | 'all';

// ── Paramétrage d'un taux de commission ───────────────────────────────────────
export interface CommissionSetting {
  id: string;
  label: string;
  zone: CommissionZone;
  vehicle_type: string | null;
  rate_type: CommissionRateType;
  rate_value: number;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateCommissionSettingDto {
  label: string;
  zone: CommissionZone;
  vehicle_type?: string | null;
  rate_type: CommissionRateType;
  rate_value: number;
}

export interface UpdateCommissionSettingDto {
  label?: string;
  zone?: CommissionZone;
  vehicle_type?: string | null;
  rate_type?: CommissionRateType;
  rate_value?: number;
  is_active?: boolean;
}

// ── Commission calculée par course ────────────────────────────────────────────
export interface Commission {
  id: string;
  reservation_id: string;
  driver_id: string;
  commission_setting_id: string | null;
  zone: string;
  rate_type: string;
  rate_value: number;
  gross_amount: number;
  commission_amount: number;
  driver_net_amount: number;
  currency: string;
  calculated_at: string;
}

export interface CommissionDetail extends Commission {
  reservation: {
    scheduled_at: string;
    pickup_address: string;
    dest_address: string;
    vehicle_type: string | null;
  } | null;
  driver: {
    first_name: string;
    last_name: string;
  } | null;
}

// ── Résumé agrégé — admin
export interface CommissionSummary {
  period: string;
  date_from: string | null;
  date_to: string | null;
  total_rides: number;
  total_gross_eur: number;
  total_commission_eur: number;
  total_net_eur: number;
  total_gross_xof: number;
  total_commission_xof: number;
  total_net_xof: number;
  commissions: CommissionDetail[];
}

export interface CommissionListFilters {
  period?: CommissionPeriod;
  zone?: CommissionZone;
  page?: number;
  limit?: number;
}

export interface CommissionListResult {
  commissions: CommissionDetail[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}
