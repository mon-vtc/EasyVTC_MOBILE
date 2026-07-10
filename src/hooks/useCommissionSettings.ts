// ══════════════════════════════════════════════════════════════════════════════
// HOOK — useCommissionSettings
// Sprint 6 — EasyVTC
// Réservé à l'admin
// ══════════════════════════════════════════════════════════════════════════════

import { useCallback } from 'react';
import { useAuth } from './useAuth';
import { useAuthStore } from '../store/auth.store';
import { useCommissionSettingsStore } from '../store/commission.store';
import type {
  CommissionZone,
  CreateCommissionSettingDto,
  UpdateCommissionSettingDto,
  CommissionPeriod,
  CommissionListFilters,
} from '../types/commission.types';

export function useCommissionSettings() {
  const { isAdmin, isManager } = useAuth();
  const accessToken = useAuthStore(s => s.accessToken);

  if (!isAdmin && !isManager) {
    throw new Error('useCommissionSettings() ne peut être utilisé que par un admin ou un manager.');
  }

  const {
    settings,
    isLoading,
    isSaving,
    error,
    commissions,
    summary,
    commissionsTotal,
    commissionsPage,
    fetchSettings: _fetch,
    createSetting: _create,
    updateSetting: _update,
    deleteSetting: _delete,
    fetchSummary: _fetchSummary,
    fetchCommissions: _fetchCommissions,
    clearError,
  } = useCommissionSettingsStore();

  const fetchSettings = useCallback((filters?: { zone?: CommissionZone; is_active?: boolean }) => {
    return _fetch(accessToken!, filters);
  }, [accessToken, _fetch]);

  const createSetting = useCallback((dto: CreateCommissionSettingDto) => {
    return _create(accessToken!, dto);
  }, [accessToken, _create]);

  const updateSetting = useCallback((id: string, dto: UpdateCommissionSettingDto) => {
    return _update(accessToken!, id, dto);
  }, [accessToken, _update]);

  const deleteSetting = useCallback((id: string) => {
    return _delete(accessToken!, id);
  }, [accessToken, _delete]);

  const fetchSummary = useCallback((period: CommissionPeriod, date?: string) => {
    return _fetchSummary(accessToken!, period, date);
  }, [accessToken, _fetchSummary]);

  const fetchCommissions = useCallback((filters: CommissionListFilters) => {
    return _fetchCommissions(accessToken!, filters);
  }, [accessToken, _fetchCommissions]);

  return {
    settings,
    isLoading,
    isSaving,
    error,
    commissions,
    summary,
    commissionsTotal,
    commissionsPage,
    fetchSettings,
    createSetting,
    updateSetting,
    deleteSetting,
    fetchSummary,
    fetchCommissions,
    clearError,
  };
}