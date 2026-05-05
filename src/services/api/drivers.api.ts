// services/api/drivers.api.ts
import { api } from '../../lib/api';
import type { ApiResponse, PaginatedDrivers, ListDriversParams } from '../../types';
import type { DriverUser, DriverWithUser }         from '../../types/user.types';
import type { UpdateDriverMePayload, ChangeDriverStatusPayload } from '../../types/payload.types';

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
};