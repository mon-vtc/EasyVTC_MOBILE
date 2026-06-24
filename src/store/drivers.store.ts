import { create } from 'zustand';
import { driverApi } from '../services/api/drivers.api';
import type {
  DriverProfile,
  Vehicle,
  AuthUser,
  DriverWithUser,
  DriverWithUserAndVehicle,
  ListDriversParams,
  ChangeDriverStatusPayload,
  WeeklyScheduleResult,
  SetScheduleDto,
  DriverRevenuesResult,
  RevenueStatus,
} from '../types';

// ── Types pour stats mensuelles et historique ──────────────────────────────────
export interface DriverMonthlyStats {
  date: string;
  total_courses: number;
  total_earning: number;
  total_commission: number;
  total_distance_km: number;
  total_duration_min: number;
  average_rating: number | null;
  acceptance_rate: number;
  cancellation_rate: number;
}

export interface DriverTripHistory {
  reservation_id: string;
  scheduled_at: string;
  completed_at?: string;
  status: string;
  pickup_address: string;
  dest_address: string;
  distance_km: number | null;
  duration_min: number | null;
  price_final: number;
  commission_amount: number;
  net_amount: number;
  currency: string;
  client_first_name: string | null;
  client_last_name: string | null;
  client_rating: number | null;
  client_comment: string | null;
}

export interface DriverTripsHistoryResult {
  trips: DriverTripHistory[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// ── Fonction de mapping DriverWithUser → AuthUser ────────────────────────────
function mapDriverWithUserToAuthUser(driverWithUser: DriverWithUser | DriverWithUserAndVehicle): AuthUser {
  const vehicleData = (driverWithUser as any).vehicle || null;
  
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
      trips_count:  driverWithUser.trips_count,
      average_rating: driverWithUser.average_rating,
    },
    vehicle: vehicleData || null, // Inclure le véhicule s'il est fourni
  };
}

interface DriversState {
  drivers:    AuthUser[];
  total:      number;
  page:       number;
  totalPages: number;
  isLoading:  boolean;
  isFetchingNextPage: boolean;
  error:      string | null;
  weeklySchedule: WeeklyScheduleResult | null;
  isFetchingSchedule: boolean;
  scheduleError: string | null;
  revenues: DriverRevenuesResult | null;
  isFetchingRevenues: boolean;
  revenuesError: string | null;
  revenuesStatus: RevenueStatus | null;
  revenuesPage: number;
  
  // Nouveaux états pour stats mensuelles et historique
  monthlyStats: { [driverId: string]: DriverMonthlyStats } | null;
  isFetchingMonthlyStats: boolean;
  monthlyStatsError: string | null;
  
  tripsHistory: { [driverId: string]: DriverTripsHistoryResult } | null;
  isFetchingTripsHistory: boolean;
  tripsHistoryError: string | null;

  fetchDrivers:      (token: string, params?: ListDriversParams) => Promise<void>;
  fetchNextDriversPage: (token: string, params?: ListDriversParams) => Promise<void>;
  fetchDriverById:   (token: string, driverId: string)           => Promise<AuthUser | null>;
  changeDriverStatus:(token: string, driverId: string, payload: ChangeDriverStatusPayload) => Promise<AuthUser | null>;
  fetchWeeklySchedule: (token: string) => Promise<void>;
  setWeeklySchedule: (token: string, dto: SetScheduleDto) => Promise<boolean>;
  fetchRevenues: (token: string, period: 'week' | 'month' | 'all', status?: RevenueStatus, page?: number) => Promise<void>;
  
  // Nouvelles actions
  fetchMonthlyStats: (token: string, driverId: string, date?: string) => Promise<void>;
  fetchTripsHistory: (token: string, driverId: string, status?: string, page?: number, limit?: number) => Promise<void>;
  
  clearError:        () => void;
  
}

export const useDriversStore = create<DriversState>((set, _get) => ({
  drivers:    [],
  total:      0,
  page:       1,
  totalPages: 1,
  isLoading:  false,
  isFetchingNextPage: false,
  error:      null,
  weeklySchedule: null,
  isFetchingSchedule: false,
  scheduleError: null,
  revenues: null,
  isFetchingRevenues: false,
  revenuesError: null,
  revenuesStatus: null,
  revenuesPage: 1,
  
  // Nouveaux états pour stats mensuelles et historique
  monthlyStats: null,
  isFetchingMonthlyStats: false,
  monthlyStatsError: null,
  
  tripsHistory: null,
  isFetchingTripsHistory: false,
  tripsHistoryError: null,

  // ── Liste paginée (endpoint /admin/drivers) — Première page ou rechargement ───────────────────
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

  // ── Charger la page suivante (pagination infinie) ──────────────────
  fetchNextDriversPage: async (token, params) => {
    const state = _get();
    // Éviter de charger si on est déjà à la dernière page ou en train de charger
    if (state.page >= state.totalPages || state.isFetchingNextPage) {
      return;
    }
    
    set({ isFetchingNextPage: true, error: null });
    try {
      const nextPage = state.page + 1;
      const res = await driverApi.listDrivers(token, { ...params, page: nextPage });
      if (!res.ok || !res.data) throw new Error(res.message ?? 'Erreur lors du chargement');
      
      // Fusionner les chauffeurs existants avec les nouveaux
      set({
        drivers:    [...state.drivers, ...res.data.drivers.map(mapDriverWithUserToAuthUser)],
        total:      res.data.total,
        page:       res.data.page,
        totalPages: res.data.total_pages,
        isFetchingNextPage: false,
      });
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Erreur inconnue', isFetchingNextPage: false });
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

  
  fetchWeeklySchedule: async (token) => {
    set({ isFetchingSchedule: true, scheduleError: null });
    try {
      const res = await driverApi.getMySchedule(token);
      if (res.ok && res.data) {
        set({ weeklySchedule: res.data, isFetchingSchedule: false });
      } else {
        set({ scheduleError: res.message || 'Failed to fetch schedule', isFetchingSchedule: false });
      }
    } catch (err: any) {
      set({ scheduleError: err.message || 'An unexpected error occurred', isFetchingSchedule: false });
    }
  },

  setWeeklySchedule: async (token, dto) => {
    set({ isFetchingSchedule: true, scheduleError: null });
    try {
      const res = await driverApi.setMySchedule(token, dto);
      if (res.ok && res.data) {
        set({ weeklySchedule: res.data, isFetchingSchedule: false });
        return true;
      } else {
        set({ scheduleError: res.message || 'Failed to update schedule', isFetchingSchedule: false });
        return false;
      }
    } catch (err: any) {
      set({ scheduleError: err.message || 'An unexpected error occurred', isFetchingSchedule: false });
      return false;
    }
  },

  fetchRevenues: async (token, period, status, page = 1) => {
    set({ isFetchingRevenues: true, revenuesError: null });
    try {
      const res = await driverApi.getMyRevenues(token, period, {
        status,
        page,
        limit: 20,
      });
      if (res.ok && res.data) {
        // Si page = 1 (première charge ou changement de filtre), remplacer les données
        // Si page > 1, ajouter les trips aux données existantes (pagination cumulative)
        if (page === 1) {
          set({ 
            revenues: res.data, 
            revenuesStatus: status ?? null,
            revenuesPage: page,
            isFetchingRevenues: false 
          });
        } else {
          // Append trips to existing revenues data
          set(state => ({
            revenues: state.revenues ? {
              ...state.revenues,
              trips: [...(state.revenues.trips || []), ...(res.data?.trips || [])],
              page: res.data?.page ?? page,
            } : res.data,
            revenuesPage: page,
            isFetchingRevenues: false
          }));
        }
      } else {
        set({ revenuesError: res.message || 'Erreur lors du chargement des revenus', isFetchingRevenues: false });
      }
    } catch (err: any) {
      set({ revenuesError: err.message || 'Une erreur est survenue', isFetchingRevenues: false });
    }
  },

  // ── Statistiques mensuelles d'un chauffeur ──────────────────────────────────
  fetchMonthlyStats: async (token, driverId, date) => {
    set({ isFetchingMonthlyStats: true, monthlyStatsError: null });
    try {
      const res = await driverApi.getMonthlyStats(token, driverId, date);
      if (res.ok && res.data) {
        set(state => ({
          monthlyStats: {
            ...(state.monthlyStats || {}),
            [driverId]: res.data
          },
          isFetchingMonthlyStats: false
        }));
      } else {
        set({ monthlyStatsError: res.message || 'Erreur lors du chargement des stats', isFetchingMonthlyStats: false });
      }
    } catch (err: any) {
      set({ monthlyStatsError: err.message || 'Une erreur est survenue', isFetchingMonthlyStats: false });
    }
  },

  // ── Historique des courses d'un chauffeur ──────────────────────────────────
  fetchTripsHistory: async (token, driverId, status, page = 1, limit = 20) => {
    set({ isFetchingTripsHistory: true, tripsHistoryError: null });
    try {
      const res = await driverApi.getTripsHistory(token, driverId, status, page, limit);
      if (res.ok && res.data) {
        set(state => ({
          tripsHistory: {
            ...(state.tripsHistory || {}),
            [driverId]: res.data
          },
          isFetchingTripsHistory: false
        }));
      } else {
        set({ tripsHistoryError: res.message || 'Erreur lors du chargement de l\'historique', isFetchingTripsHistory: false });
      }
    } catch (err: any) {
      set({ tripsHistoryError: err.message || 'Une erreur est survenue', isFetchingTripsHistory: false });
    }
  },

  clearError: () => set({ error: null }),
}));
