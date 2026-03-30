// services/api/driver.api.ts
import { api } from '../../lib/api';
import type { ApiResponse }        from '../../types';
import type { DriverUser }         from '../../types/user.types';
import type { UpdateDriverMePayload } from '../../types/payload.types';

export const driverApi = {

  /** PATCH /drivers/me — siret, zone, vehicle_type */
  updateMe: (token: string, payload: UpdateDriverMePayload): Promise<ApiResponse<DriverUser>> =>
    api.patch('/drivers/me', payload, token),

  /** PATCH /drivers/me/online — passer en ligne / hors ligne */
  setOnlineStatus: (token: string, is_online: boolean): Promise<ApiResponse<DriverUser>> =>
    api.patch('/drivers/me/online', { is_online }, token),
};