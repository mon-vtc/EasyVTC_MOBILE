// ══════════════════════════════════════════════════════════════════════════════
// API — Module Commissions
// Sprint 6 — EasyVTC
// ══════════════════════════════════════════════════════════════════════════════

import { api } from '../../lib/api';
import type { ApiResponse } from '../../types';
import type {
  CommissionZone,
  CommissionPeriod,
  CommissionSetting,
  CreateCommissionSettingDto,
  UpdateCommissionSettingDto,
  CommissionSummary,
  CommissionListFilters,
  CommissionListResult,
} from '../../types/commission.types';

export const commissionApi = {
  listSettings: (
    token: string,
    filters?: { zone?: CommissionZone; is_active?: boolean },
  ): Promise<ApiResponse<CommissionSetting[]>> => {
    const params = new URLSearchParams();
    if (filters?.zone) params.set('zone', filters.zone);
    if (filters?.is_active !== undefined) params.set('is_active', String(filters.is_active));
    const qs = params.toString() ? `?${params.toString()}` : '';
    return api.get(`/admin/commission-settings${qs}`, token);
  },

  getSettingById: (
    token: string,
    id: string,
  ): Promise<ApiResponse<CommissionSetting>> =>
    api.get(`/admin/commission-settings/${id}`, token),

  createSetting: (
    token: string,
    dto: CreateCommissionSettingDto,
  ): Promise<ApiResponse<CommissionSetting>> =>
    api.post('/admin/commission-settings', dto, token),

  updateSetting: (
    token: string,
    id: string,
    dto: UpdateCommissionSettingDto,
  ): Promise<ApiResponse<CommissionSetting>> =>
    api.patch(`/admin/commission-settings/${id}`, dto, token),

  deleteSetting: (
    token: string,
    id: string,
  ): Promise<ApiResponse<void>> =>
    api.delete(`/admin/commission-settings/${id}`, token),

  getSummary: (
    token: string,
    period: CommissionPeriod,
    date?: string,
  ): Promise<ApiResponse<CommissionSummary>> => {
    const params = new URLSearchParams();
    params.set('period', period);
    if (date) params.set('date', date);
    return api.get(`/admin/commissions/summary?${params.toString()}`, token);
  },

  listCommissions: (
    token: string,
    filters?: CommissionListFilters,
  ): Promise<ApiResponse<CommissionListResult>> => {
    const params = new URLSearchParams();
    if (filters?.period) params.set('period', filters.period);
    if (filters?.zone) params.set('zone', filters.zone);
    if (filters?.page !== undefined) params.set('page', String(filters.page));
    if (filters?.limit !== undefined) params.set('limit', String(filters.limit));
    const qs = params.toString() ? `?${params.toString()}` : '';
    return api.get(`/admin/commissions${qs}`, token);
  },
};
