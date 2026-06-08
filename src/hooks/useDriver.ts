// hooks/useDriver.ts
import { useState, useCallback, useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAuth }        from './useAuth';
import { useAuthStore }   from '../store/auth.store';
import { mapApiUser }     from '../store/auth.store';
import { driverApi }      from '../services/api/drivers.api';
import { vehicleApi }     from '../services/api/vehicle.api';
import { authApi }        from '../services/api/auth.api';
import type { DriverPlanningResult, PlanningPeriod } from '../types/drivers.types';
import type { DriverUser, Vehicle, DriverRevenuesResult, RevenuesPeriod }                          from '../types';
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

  // ── Références pour synchronisation ─────────────────────────
  const appStateSubscriptionRef = useRef<any>(null);
  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSyncRef = useRef<number>(Date.now());

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
    const res = await driverApi.setOnlineStatus(token(), is_online);
    if (!res.ok || !res.data) throw new Error(res.message ?? 'Erreur statut en ligne');

    // Sync status + is_online depuis la réponse backend
    useAuthStore.setState(state => ({
      user: state.user ? {
        ...state.user,
        is_online: res.data!.is_online,
        status:    (res.data as any).status ?? state.user.status,
      } : state.user,
    }));
  }, [accessToken]);

  // ── Synchronisation du statut chauffeur avec le serveur ──────
  // Cette fonction récupère le profil actuel du serveur et met à jour le store
  // En cas d'erreur réseau, elle échoue silencieusement pour ne pas perturber l'UX
  const syncDriverStatus = useCallback(async () => {
    try {
      const now = Date.now();
      // Éviter les syncs trop fréquentes (max 1 par 5 secondes)
      if (now - lastSyncRef.current < 5000) return;
      lastSyncRef.current = now;

      const res = await authApi.me(token());
      if (!res.ok || !res.data) {
        console.warn('[useDriver] Sync échouée: réponse invalide');
        return;
      }

      const mappedUser = mapApiUser(res.data);
      // Mettre à jour le store avec les données fraîches du serveur
      useAuthStore.setState({
        user: mappedUser,
      });

      console.log('[useDriver] Sync réussie:', { 
        is_online: (mappedUser as any).is_online, 
        status: (mappedUser as any).driverStatus 
      });
    } catch (err: any) {
      console.warn('[useDriver] Erreur sync statut:', err?.message ?? 'Erreur inconnue');
      // Ne pas lever l'erreur - on continue simplement
    }
  }, [accessToken]);

  // ── AppState listener: synchroniser quand l'app revient au premier plan ────
  const handleAppStateChange = useCallback((nextAppState: AppStateStatus) => {
    if (nextAppState === 'active') {
      console.log('[useDriver] App est passée en avant-plan, synchronisation en cours...');
      syncDriverStatus();
    }
  }, [syncDriverStatus]);

  // ── Setup: listeners et polling ──────────────────────────────
  useEffect(() => {
    // Écouter les changements d'AppState (foreground/background)
    appStateSubscriptionRef.current = AppState.addEventListener('change', handleAppStateChange);

    // Polling léger: toutes les 30 secondes (quand l'app est en avant-plan)
    pollingTimerRef.current = setInterval(() => {
      const currentAppState = AppState.currentState;
      if (currentAppState === 'active') {
        console.log('[useDriver] Polling du statut chauffeur...');
        syncDriverStatus();
      }
    }, 30 * 1000); // 30 secondes

    // Cleanup
    return () => {
      if (appStateSubscriptionRef.current) {
        appStateSubscriptionRef.current.remove();
      }
      if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current);
      }
    };
  }, [handleAppStateChange, syncDriverStatus]);

  const getMyPlanning = useCallback(async (period: PlanningPeriod, date?: string): Promise<DriverPlanningResult | null> => {
    const res = await driverApi.getMyPlanning(token(), period, date);
    if (!res.ok || !res.data) throw new Error(res.message ?? 'Erreur récupération planning');
    return res.data;
  }, [accessToken]);

  const getMyRevenues = useCallback(async (period: RevenuesPeriod, date?: string): Promise<DriverRevenuesResult | null> => {
    const res = await driverApi.getMyRevenues(token(), period, date);
    if (!res.ok || !res.data) throw new Error(res.message ?? 'Erreur récupération revenus');
    return res.data;
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
    status:      driver?.driverStatus       ?? null,

    // Véhicule actif
    vehicle:     activeVehicle,

    // Actions profil
    updateDriverProfile,
    uploadAvatar:   auth.uploadAvatar,
    changePassword: auth.changePassword,
    setOnlineStatus,
    syncDriverStatus,
    login:  auth.login,
    logout: auth.logout,

    // Actions véhicule
    createVehicle,
    uploadVehiclePhoto,
    updateVehicle,
    deleteVehicle,

    // Planning
    getMyPlanning,

    //Revenues
    getMyRevenues,
  };
}