// hooks/useDriver.ts
import { useState, useCallback } from 'react';
import { useAuth }        from './useAuth';
import { useAuthStore }   from '../store/auth.store';
import { driverApi }      from '../services/api/drivers.api';
import { vehicleApi }     from '../services/api/vehicle.api';
import type { DriverUser, Vehicle }                                    from '../types/user.types';
import type { UpdateUserMePayload, UpdateDriverMePayload }             from '../types/payload.types';
import type { CreateVehiclePayload, UpdateVehiclePayload }             from '../services/api/vehicle.api';

export function useDriver() {
  const auth        = useAuth();
  const accessToken = useAuthStore(s => s.accessToken);

  if (!auth.isDriver) {
    throw new Error('useDriver() ne peut être utilisé que par un chauffeur.');
  }

  const driver = auth.user as DriverUser;

  // ── Véhicule actif local ────────────────────────────────────
  const [activeVehicle, setActiveVehicle] = useState<Vehicle | null>(driver?.vehicle ?? null);

  // ── Résoudre le token ou throw ──────────────────────────────
  const token = () => {
    if (!accessToken) throw new Error('Token manquant');
    return accessToken;
  };

  // ── Update profil (2 appels parallèles) ─────────────────────
  const updateDriverProfile = useCallback(async (
    userPayload:   UpdateUserMePayload,
    driverPayload: UpdateDriverMePayload,
  ) => {
    const calls: Promise<any>[] = [];
    console.log(driverPayload);
    if (Object.keys(userPayload).length > 0)   calls.push(auth.updateProfile(userPayload));
    if (Object.keys(driverPayload).length > 0) calls.push(driverApi.updateMe(token(), driverPayload));
    await Promise.all(calls);
  }, [accessToken]);

  // ── Véhicule : créer ────────────────────────────────────────
  const createVehicle = useCallback(async (payload: CreateVehiclePayload): Promise<Vehicle> => {
    const res = await vehicleApi.createVehicle(token(), payload);
    if (!res.ok || !res.data) throw new Error(res.message ?? 'Erreur création véhicule');
    setActiveVehicle(res.data);
    return res.data;
  }, [accessToken]);

  // ── Véhicule : upload photo ─────────────────────────────────
  const uploadVehiclePhoto = useCallback(async (vehicleId: string, formData: FormData): Promise<Vehicle> => {
    const res = await vehicleApi.uploadVehiclePhoto(token(), vehicleId, formData);
    if (!res.ok || !res.data) throw new Error(res.message ?? 'Erreur upload photo');
    setActiveVehicle(res.data);
    return res.data;
  }, [accessToken]);

  // ── Véhicule : mettre à jour ────────────────────────────────
  const updateVehicle = useCallback(async (vehicleId: string, payload: UpdateVehiclePayload): Promise<Vehicle> => {
    const res = await vehicleApi.updateMyVehicle(token(), vehicleId, payload);
    if (!res.ok || !res.data) throw new Error(res.message ?? 'Erreur mise à jour véhicule');
    setActiveVehicle(res.data);
    return res.data;
  }, [accessToken]);

  // ── Véhicule : supprimer ────────────────────────────────────
  const deleteVehicle = useCallback(async (vehicleId: string): Promise<void> => {
    const res = await vehicleApi.deleteVehicle(token(), vehicleId);
    if (!res.ok) throw new Error(res.message ?? 'Erreur suppression véhicule');
    setActiveVehicle(null);
  }, [accessToken]);

  // ── Online status ───────────────────────────────────────────
  // FIX : après l'appel API réussi, on patche `user.is_online` directement
  // dans le store Zustand. Sans ce patch, le store conserve l'ancienne valeur
  // et tous les composants abonnés (Switch, StatusCard…) ne se re-rendent pas.
  const setOnlineStatus = useCallback(async (is_online: boolean) => {
    await driverApi.setOnlineStatus(token(), is_online);

    useAuthStore.setState(state => ({
      user: state.user ? { ...state.user, is_online } : state.user,
    }));
  }, [accessToken]);

  return {
    user:           driver,
    localAvatarUri: auth.localAvatarUri,
    isLoading:      auth.isLoading,
    error:          auth.error,
    clearError:     auth.clearError,

    // Champs chauffeur
    vtcLicense:  driver?.vtc_license  ?? null,
    iban:        driver?.iban         ?? null,
    siret:       driver?.siret        ?? null,
    zone:        driver?.zone         ?? null,
    vehicleType: driver?.vehicle_type ?? null,
    isOnline:    driver?.is_online    ?? false,
    status:      driver?.status       ?? null,

    // Véhicule actif
    vehicle:     activeVehicle,

    // Actions profil
    updateDriverProfile,
    uploadAvatar:   auth.uploadAvatar,
    changePassword: auth.changePassword,
    setOnlineStatus,
    login:  auth.login,
    logout: auth.logout,

    // Actions véhicule
    createVehicle,
    uploadVehiclePhoto,
    updateVehicle,
    deleteVehicle,
  };
}