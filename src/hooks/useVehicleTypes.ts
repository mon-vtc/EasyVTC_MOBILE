// ══════════════════════════════════════════════════════════════════════════════
// HOOK — useVehicleTypes
// Sprint 3 — EasyVTC
// ══════════════════════════════════════════════════════════════════════════════

import { useCallback } from 'react';
import { useAuthStore }         from '../store/auth.store';
import { useVehicleTypesStore } from '../store/vehicleTypes.store';
import type {
  CreateVehicleTypePayload,
  UpdateVehicleTypePayload,
} from '../services/api/vehicleTypes.api';

export function useVehicleTypes() {
  const accessToken = useAuthStore(s => s.accessToken);

  if (!accessToken) {
    throw new Error('useVehicleTypes() ne peut être utilisé que par un utilisateur authentifié.');
  }

  const allTypes   = useVehicleTypesStore(s => s.allTypes);
  const isLoading  = useVehicleTypesStore(s => s.isLoading);
  const error      = useVehicleTypesStore(s => s.error);
  const clearError = useVehicleTypesStore(s => s.clearError);

  const _fetchAllTypes = useVehicleTypesStore(s => s.fetchAllTypes);
  const _createType    = useVehicleTypesStore(s => s.createType);
  const _updateType    = useVehicleTypesStore(s => s.updateType);
  const _deleteType    = useVehicleTypesStore(s => s.deleteType);

  const refresh = useCallback(() => {
    return _fetchAllTypes(accessToken);
  }, [_fetchAllTypes, accessToken]);

  const createType = useCallback((dto: CreateVehicleTypePayload) => {
    return _createType(accessToken, dto);
  }, [_createType, accessToken]);

  const updateType = useCallback((id: string, dto: UpdateVehicleTypePayload) => {
    return _updateType(accessToken, id, dto);
  }, [_updateType, accessToken]);

  const deleteType = useCallback((id: string) => {
    return _deleteType(accessToken, id);
  }, [_deleteType, accessToken]);

  return {
    allTypes,
    isLoading,
    error,
    clearError,
    refresh,
    createType,
    updateType,
    deleteType,
  };
}
