// ══════════════════════════════════════════════════════════════════════════════
// TYPES — Module Promo Codes
// Sprint 6 — EazyVTC
// ══════════════════════════════════════════════════════════════════════════════

export type DiscountType = 'percent' | 'fixed';
export type ConditionType  = 'none' | 'pickup_location';

export interface PromoCode {
  id: string;
  code: string;
  name: string | null;
  description: string | null;
  discount_type: DiscountType;
  discount_value: number;
  valid_from: string | null;
  valid_until: string | null;
  max_uses: number | null;
  uses_count: number;
  min_order_amount: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreatePromoCodeDto {
  code?: string;
  name?: string;
  description?: string;
  code_radical?: string;
  assigned_user_id?: string;
  discount_type: DiscountType;
  discount_value: number;
  valid_from?: string;
  valid_until?: string;
  max_uses?: number;
  max_uses_per_user?: number;
  min_order_amount?: number;
  condition_type?: ConditionType;
  condition_label?: string;
  pickup_lat?: number;
  pickup_lng?: number;
  pickup_radius_meters?: number;
}

export interface UpdatePromoCodeDto {
  code?: string;
  name?: string;
  description?: string | null;
  discount_type?: DiscountType;
  discount_value?: number;
  valid_until?: string | null;
  max_uses?: number | null;
  min_order_amount?: number | null;
  is_active?: boolean;
}

export interface PromoCodeListFilters {
  page?: number;
  limit?: number;
  is_active?: boolean;
  search?: string;
}

export interface PromoCodeListResult {
  promo_codes: PromoCode[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// ── Client-specific types ─────────────────────────────────────────────────────
export interface UserPromoCodeItem {
  id: string;
  code: string;
  name: string | null;
  description: string | null;
  discount_type: DiscountType;
  discount_value: number;
  valid_until: string | null;
  is_active: boolean;
  is_expired: boolean;
}

export interface UserPromoCodesResult {
  stats: {
    active_count: number;
    total_savings: number;
  };
  active: UserPromoCodeItem[];
  expired: UserPromoCodeItem[];
}

// ── Assignation en masse ──────────────────────────────────────────────────────
export interface BulkAssignDto {
  user_ids: string[];
  // Surcharge la valid_until du template pour cette assignation seulement
  valid_until?: string;
  // Equivalent pratique à valid_until = maintenant + N jours
  validity_days?: number;
}

export interface BulkAssignResult {
  created: number;
  codes: PromoCode[];
}
