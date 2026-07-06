// ══════════════════════════════════════════════════════════════════════════════
// API — Module Promo Codes
// Sprint 6 — EasyVTC
// ══════════════════════════════════════════════════════════════════════════════

import { api } from '../../lib/api';
import type { ApiResponse, PromoCode, CreatePromoCodeDto, UpdatePromoCodeDto, PromoCodeListFilters, PromoCodeListResult, UserPromoCodesResult, BulkAssignDto, BulkAssignResult } from '../../types';

class PromoCodesApi {
  listPromoCodes(
    token: string,
    filters?: PromoCodeListFilters,
  ): Promise<ApiResponse<PromoCodeListResult>> {
    const params = new URLSearchParams();
    if (filters?.page !== undefined) params.set('page', String(filters.page));
    if (filters?.limit !== undefined) params.set('limit', String(filters.limit));
    if (filters?.is_active !== undefined) params.set('is_active', String(filters.is_active));
    if (filters?.search) params.set('search', filters.search);
    const queryString = params.toString();
    return api.get(`/admin/promo-codes${queryString ? `?${queryString}` : ''}`, token);
  }

  createPromoCode(
    token: string,
    dto: CreatePromoCodeDto,
  ): Promise<ApiResponse<PromoCode>> {
    return api.post('/admin/promo-codes/', dto, token);
  }

  updatePromoCode(
    token: string,
    id: string,
    dto: UpdatePromoCodeDto,
  ): Promise<ApiResponse<PromoCode>> {
    return api.patch(`/admin/promo-codes/${id}`, dto, token);
  }

  deletePromoCode(
    token: string,
    id: string,
  ): Promise<ApiResponse<void>> {
    return api.delete(`/admin/promo-codes/${id}`, token);
  }

  bulkAssign(
    token: string,
    templateId: string,
    dto: BulkAssignDto,
  ): Promise<ApiResponse<BulkAssignResult>> {
    return api.post(`/admin/promo-codes/${templateId}/bulk-assign`, dto, token);
  }

  fetchMyPromoCodes(token: string): Promise<ApiResponse<UserPromoCodesResult>> {
    return api.get('/promo-codes/mine', token);
  }
}

export const promoCodesApi = new PromoCodesApi();
