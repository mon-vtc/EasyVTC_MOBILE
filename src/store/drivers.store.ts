import { create } from 'zustand';
import { driverApi } from '../services/api/drivers.api';
import type { AuthUser, DriverWithUser, ListDriversParams, PaginatedDrivers, ChangeDriverStatusPayload } from '../types';

// ── Fonction de mapping DriverWithUser → AuthUser ────────────────────────────
function mapDriverWithUserToAuthUser(driverWithUser: DriverWithUser): AuthUser {
  return {
    id:                driverWithUser.user.id,
    email:             driverWithUser.user.email,
    role:              'driver' as const,
    first_name:        driverWithUser.user.first_name,
    last_name:         driverWithUser.user.last_name,
    phone:             driverWithUser.user.phone,
    profile_photo_url: driverWithUser.user.profile_photo_url,
    device_token:      null, // Non fourni par le backend
    status:            driverWithUser.user.status as any, // UserStatus
    status_reason:     null,
    status_changed_at: null,
    status_changed_by: null,
    rgpd_consent:      false, // Non fourni
    rgpd_consent_at:   null,
    deleted_at:        null,
    created_at:        driverWithUser.user.created_at,
    updated_at:        driverWithUser.created_at,
    // Profil chauffeur aplati
    driver: {
      id:           driverWithUser.id,
      status:       driverWithUser.status,
      vehicle_type: driverWithUser.vehicle_type,
      siret:        driverWithUser.siret,
      tva_rate:     driverWithUser.tva_rate,
      is_online:    driverWithUser.is_online,
      zone:         driverWithUser.zone,
      created_at:   driverWithUser.created_at,
      updated_at:   driverWithUser.updated_at,
    },
    vehicle: null, // Non fourni dans cette réponse
  };
}

interface DriversState {
  drivers:    AuthUser[];
  total:      number;
  page:       number;
  totalPages: number;
  isLoading:  boolean;
  error:      string | null;

  fetchDrivers:      (token: string, params?: ListDriversParams) => Promise<void>;
  fetchDriverById:   (token: string, driverId: string)           => Promise<AuthUser | null>;
  changeDriverStatus:(token: string, driverId: string, payload: ChangeDriverStatusPayload) => Promise<AuthUser | null>;
  clearError:        () => void;
}

export const useDriversStore = create<DriversState>((set, _get) => ({
  drivers:    [],
  total:      0,
  page:       1,
  totalPages: 1,
  isLoading:  false,
  error:      null,

  // ── Liste paginée (endpoint /admin/drivers) ───────────────────
  fetchDrivers: async (token, params) => {
    set({ isLoading: true, error: null });
    try {
      const res = await driverApi.listDrivers(token, params);
      if (!res.ok || !res.data) throw new Error(res.message ?? 'Erreur lors du chargement');
      set({
        drivers:    res.data.drivers.map(mapDriverWithUserToAuthUser),
        total:      res.data.total,
        page:       res.data.page,
        totalPages: res.data.total_pages,
        isLoading:  false,
      });
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Erreur inconnue', isLoading: false });
      throw err;
    }
  },

  // ── Détail chauffeur (endpoint /admin/drivers/:id) ────────────
  fetchDriverById: async (token, driverId) => {
    set({ isLoading: true, error: null });
    try {
      const res = await driverApi.getDriverById(token, driverId);
      if (!res.ok || !res.data) throw new Error(res.message ?? 'Chauffeur introuvable');
      set({ isLoading: false });
      return mapDriverWithUserToAuthUser(res.data as DriverWithUser);
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Erreur inconnue', isLoading: false });
      return null;
    }
  },

  changeDriverStatus: async (token, driverId, payload) => {
    set({ isLoading: true, error: null });
    try {
      const res = await driverApi.changeDriverStatus(token, driverId, payload);
      if (!res.ok || !res.data) throw new Error(res.message ?? 'Erreur lors du changement de statut');
      set({ isLoading: false });
      return mapDriverWithUserToAuthUser(res.data as DriverWithUser);
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Erreur inconnue', isLoading: false });
      return null;
    }
  },

  clearError: () => set({ error: null }),
}));
