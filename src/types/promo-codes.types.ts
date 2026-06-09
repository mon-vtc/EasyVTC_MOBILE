// ══════════════════════════════════════════════════════════════════════════════
// TYPES — Module Promo Codes
// Sprint 6 — EazyVTC
// ══════════════════════════════════════════════════════════════════════════════

export type DiscountType = 'percent' | 'fixed';

export interface PromoCode {
  id: string;
  code: string;
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
  code: string;
  discount_type: DiscountType;
  discount_value: number;
  valid_from?: string;
  valid_until?: string;
  max_uses?: number;
  min_order_amount?: number;
}

export interface UpdatePromoCodeDto {
  code?: string;
  discount_type?: DiscountType;
  discount_value?: number;
  valid_from?: string | null;
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
