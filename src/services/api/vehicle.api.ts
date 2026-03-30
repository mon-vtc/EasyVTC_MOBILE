// services/api/vehicle.api.ts
import { api } from '../../lib/api';
import type { ApiResponse } from '../../types';
import type { Vehicle, VehicleType } from '../../types/user.types';

export interface CreateVehiclePayload {
  plate_number: string;
  brand:        string;
  model:        string;
  year?:        number;
  color?:       string;
  type:         VehicleType;
}

export interface UpdateVehiclePayload {
  plate_number?: string;
  brand?:        string;
  model?:        string;
  year?:         number;
  color?:        string;
  type?:         VehicleType;
  is_active?:    boolean;
}

export const vehicleApi = {
  getMyVehicles: (token: string): Promise<ApiResponse<Vehicle[]>> =>
    api.get('/drivers/vehicles', token),

  createVehicle: (token: string, payload: CreateVehiclePayload): Promise<ApiResponse<Vehicle>> =>
    api.post('/drivers/vehicles', payload, token),

  uploadVehiclePhoto: (token: string, vehicleId: string, formData: FormData): Promise<ApiResponse<Vehicle>> =>
    api.post(`/drivers/vehicles/${vehicleId}/photo`, formData, token),

  updateMyVehicle: (token: string, vehicleId: string, payload: UpdateVehiclePayload): Promise<ApiResponse<Vehicle>> =>
    api.patch(`/drivers/vehicles/${vehicleId}`, payload, token),

  deleteVehicle: (token: string, vehicleId: string): Promise<ApiResponse<null>> =>
    api.delete(`/drivers/vehicles/${vehicleId}`, token),
};