// ══════════════════════════════════════════════════════════════════════════════
// HOOK — useCommissionSettings
// Sprint 6 — EazyVTC
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
    fetchSettings: _fetch,
    createSetting: _create,
    updateSetting: _update,
    deleteSetting: _delete,
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

  return {
    settings,
    isLoading,
    isSaving,
    error,
    fetchSettings,
    createSetting,
    updateSetting,
    deleteSetting,
    clearError,
  };
}