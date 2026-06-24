// ══════════════════════════════════════════════════════════════════════════════
// API — Module Drivers
// ══════════════════════════════════════════════════════════════════════════════

import { api } from '../../lib/api';
import type { ApiResponse, PaginatedDrivers, ListDriversParams, DriverPlanningResult } from '../../types';
import type { DriverUser, DriverWithUser, WeeklyScheduleResult, SetScheduleDto } from '../../types';
import type { UpdateDriverMePayload, ChangeDriverStatusPayload } from '../../types/payload.types';
import type { PlanningPeriod, PlanningReservation, DriverRevenuesResult, RevenuesPeriod} from '../../types';
export const driverApi = {

  /** PATCH /drivers/me — siret, zone, vehicle_type */
  updateMe: (token: string, payload: UpdateDriverMePayload): Promise<ApiResponse<DriverUser>> =>
    api.patch('/drivers/me', payload, token),

  /** PATCH /drivers/me/online — passer en ligne / hors ligne */
  setOnlineStatus: (token: string, is_online: boolean): Promise<ApiResponse<DriverUser>> =>
    api.patch('/drivers/me/online', { is_online }, token),

  /** GET /admin/drivers — liste paginée des chauffeurs */
  listDrivers: (token: string, params?: ListDriversParams): Promise<ApiResponse<PaginatedDrivers>> => {
    const query = new URLSearchParams();
    if (params?.page)         query.set('page', String(params.page));
    if (params?.limit)        query.set('limit', String(params.limit));
    if (params?.status)       query.set('status', params.status);
    if (params?.zone)         query.set('zone', params.zone);
    if (params?.vehicle_type) query.set('vehicle_type', params.vehicle_type);
    if (params?.is_online !== undefined) query.set('is_online', String(params.is_online));
    if (params?.search)       query.set('search', params.search);
    const qs = query.toString();
    return api.get(`/admin/drivers${qs ? `?${qs}` : ''}`, token);
  },

  /** GET /admin/drivers/:id — détail chauffeur */
  getDriverById: (token: string, driverId: string): Promise<ApiResponse<DriverWithUser>> =>
    api.get(`/admin/drivers/${driverId}`, token),

  /** PATCH /admin/drivers/:id/status — changement de statut chauffeur */
  changeDriverStatus: (token: string, driverId: string, payload: ChangeDriverStatusPayload): Promise<ApiResponse<DriverWithUser>> =>
    api.patch(`/admin/drivers/${driverId}/status`, payload, token),

  getMyPlanning: (
    token: string,
    period: PlanningPeriod,
    date?: string,
  ): Promise<ApiResponse<DriverPlanningResult>> => {
    const params = new URLSearchParams({ period });
    if (date) params.set('date', date);
    return api.get(`/drivers/me/planning?${params.toString()}`, token);
  },

  getMyRevenues: (
    token: string,
    period: RevenuesPeriod,
    filters?: { status?: 'completed' | 'cancelled'; page?: number; limit?: number },
  ): Promise<ApiResponse<DriverRevenuesResult>> => {
    const params = new URLSearchParams({ period });
    if (filters?.status) params.set('status', filters.status);
    if (filters?.page) params.set('page', String(filters.page));
    if (filters?.limit) params.set('limit', String(filters.limit));
    return api.get(`/drivers/me/revenues?${params.toString()}`, token);
  },

  /** GET /drivers/me/schedule — Récupère le planning hebdomadaire du chauffeur connecté */
  getMySchedule: (token: string): Promise<ApiResponse<WeeklyScheduleResult>> =>
    api.get('/drivers/me/schedule', token),

  /** PUT /drivers/me/schedule — Met à jour le planning hebdomadaire du chauffeur connecté */
  setMySchedule: (token: string, payload: SetScheduleDto): Promise<ApiResponse<WeeklyScheduleResult>> =>
    api.put('/drivers/me/schedule', payload, token),

  /** GET /admin/drivers/:id/monthly-stats — Stats mensuelles d'un chauffeur */
  getMonthlyStats: (token: string, driverId: string, date?: string): Promise<ApiResponse<any>> => {
    const params = new URLSearchParams();
    if (date) params.set('date', date);
    const qs = params.toString();
    return api.get(`/admin/drivers/${driverId}/monthly-stats${qs ? `?${qs}` : ''}`, token);
  },

  /** GET /admin/drivers/:id/trips-history — Historique des courses d'un chauffeur */
  getTripsHistory: (token: string, driverId: string, status?: string, page: number = 1, limit: number = 20): Promise<ApiResponse<any>> => {
    const params = new URLSearchParams();
    if (status && status !== 'all') params.set('status', status);
    params.set('page', String(page));
    params.set('limit', String(limit));
    return api.get(`/admin/drivers/${driverId}/trips-history?${params.toString()}`, token);
  },
};