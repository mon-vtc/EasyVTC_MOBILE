// ══════════════════════════════════════════════════════════════════════════════
// API — Module Types de véhicule
// Sprint 3 — EasyVTC
// ══════════════════════════════════════════════════════════════════════════════

import { api }              from '../../lib/api';
import type { ApiResponse } from '../../types';

// ── Types correspondant aux réponses backend ──────────────────────────────────

export interface VehicleTypePublic {
  code:        string;
  label:       string;
  description: string | null;
  capacity:    number;
  icon:        string | null;
  base_price:  number;
}

export interface VehicleTypeRecord {
  id:                 string;
  code:               string;
  label:              string;
  description:        string | null;
  capacity:           number;
  icon:               string | null;
  base_price_france:  number;
  base_price_senegal: number;
  is_active:          boolean;
  sort_order:         number;
  created_at:         string;
  updated_at:         string;
}

export interface CreateVehicleTypePayload {
  code:               string;
  label:              string;
  description?:       string | null;
  capacity:           number;
  icon?:              string | null;
  base_price_france:  number;
  base_price_senegal?: number;
  is_active?:         boolean;
  sort_order?:        number;
}

export interface UpdateVehicleTypePayload {
  label?:             string;
  description?:       string | null;
  capacity?:          number;
  icon?:              string | null;
  base_price_france?: number;
  base_price_senegal?:number;
  is_active?:         boolean;
  sort_order?:        number;
}

// ── Appels API ────────────────────────────────────────────────────────────────

export const vehicleTypesApi = {

  // Public — liste des types actifs avec prix selon pays
  getActiveTypes(country?: string): Promise<ApiResponse<VehicleTypePublic[]>> {
    const query = country ? `?country=${country}` : '';
    return api.get(`/vehicle-types${query}`);
  },

  // Admin — liste complète (actifs + inactifs)
  getAllTypes(token: string): Promise<ApiResponse<VehicleTypeRecord[]>> {
    return api.get('/admin/vehicle-types', token);
  },

  // Admin — créer
  createType(token: string, dto: CreateVehicleTypePayload): Promise<ApiResponse<VehicleTypeRecord>> {
    return api.post('/admin/vehicle-types', dto, token);
  },

  // Admin — modifier
  updateType(token: string, id: string, dto: UpdateVehicleTypePayload): Promise<ApiResponse<VehicleTypeRecord>> {
    return api.patch(`/admin/vehicle-types/${id}`, dto, token);
  },

  // Admin — supprimer
  deleteType(token: string, id: string): Promise<ApiResponse<void>> {
    return api.delete(`/admin/vehicle-types/${id}`, token);
  },
};
