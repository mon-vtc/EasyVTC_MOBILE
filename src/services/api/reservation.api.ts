// ══════════════════════════════════════════════════════════════════════════════
// API — Module Réservations
// Sprint 3 — EasyVTC
// ══════════════════════════════════════════════════════════════════════════════

import { api }              from '../../lib/api';
import type { ApiResponse } from '../../types';
import type {
  Reservation,
  ReservationListFilters,
  ReservationListResult,
  CreateReservationDto,
  VehicleTypeOption,
} from '../../types/reservation.types';

export const reservationApi = {

  // ══════════════════════════════════════════════════════════════════════════
  // CLIENT
  // ══════════════════════════════════════════════════════════════════════════

  /** POST /reservations — Créer une réservation */
  create: (
    token: string,
    dto:   CreateReservationDto,
  ): Promise<ApiResponse<Reservation>> =>
    api.post('/reservations', dto, token),

  /** GET /reservations/mine — Mes réservations */
  listMine: (
    token:   string,
    filters?: ReservationListFilters,
  ): Promise<ApiResponse<ReservationListResult>> => {
    const params = new URLSearchParams();
    if (filters?.status) params.set('status', filters.status);
    if (filters?.page)   params.set('page',   String(filters.page));
    if (filters?.limit)  params.set('limit',  String(filters.limit));
    if (filters?.from)   params.set('from',   filters.from);
    if (filters?.to)     params.set('to',     filters.to);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return api.get(`/reservations/mine${qs}`, token);
  },

  /** GET /reservations/:id — Détail */
  getById: (
    token: string,
    id:    string,
  ): Promise<ApiResponse<Reservation>> =>
    api.get(`/reservations/${id}`, token),

  /** PATCH /reservations/:id/cancel — Annuler */
  cancel: (
    token:  string,
    id:     string,
    reason?: string,
  ): Promise<ApiResponse<Reservation>> =>
    api.patch(`/reservations/${id}/cancel`, { reason }, token),

  // ══════════════════════════════════════════════════════════════════════════
  // CHAUFFEUR
  // ══════════════════════════════════════════════════════════════════════════

  /** GET /reservations/driver/active — Course active du chauffeur */
  getDriverActive: (
    token: string,
  ): Promise<ApiResponse<Reservation | null>> =>
    api.get('/reservations/driver/active', token),

  /** PATCH /reservations/:id/arrive — Signaler arrivée */
  arrive: (
    token: string,
    id:    string,
  ): Promise<ApiResponse<void>> =>
    api.patch(`/reservations/${id}/arrive`, {}, token),

  /** PATCH /reservations/:id/start — Démarrer la course */
  start: (
    token: string,
    id:    string,
  ): Promise<ApiResponse<Reservation>> =>
    api.patch(`/reservations/${id}/start`, {}, token),

  /** PATCH /reservations/:id/complete — Terminer la course */
  complete: (
    token:         string,
    id:            string,
    actual_distance_km?: number,
    actual_duration_min?: number,
  ): Promise<ApiResponse<Reservation>> =>
    api.patch(`/reservations/${id}/complete`, { actual_distance_km, actual_duration_min }, token),

  // ══════════════════════════════════════════════════════════════════════════
  // ADMIN
  // ══════════════════════════════════════════════════════════════════════════

  /** GET /reservations — Toutes les réservations (admin) */
  listAll: (
    token:   string,
    filters?: ReservationListFilters,
  ): Promise<ApiResponse<ReservationListResult>> => {
    const params = new URLSearchParams();
    if (filters?.status) params.set('status', filters.status);
    if (filters?.page)   params.set('page',   String(filters.page));
    if (filters?.limit)  params.set('limit',  String(filters.limit));
    if (filters?.from)   params.set('from',   filters.from);
    if (filters?.to)     params.set('to',     filters.to);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return api.get(`/reservations${qs}`, token);
  },

  /** POST /reservations/:id/assign — Assigner un chauffeur */
  assign: (
    token:     string,
    id:        string,
    driver_id: string,
  ): Promise<ApiResponse<Reservation>> =>
    api.post(`/reservations/${id}/assign`, { driver_id }, token),

  // ══════════════════════════════════════════════════════════════════════════
  // UTILITAIRES
  // ══════════════════════════════════════════════════════════════════════════

  /** GET /vehicle-types — Types de véhicule disponibles avec tarifs */
//   getVehicleTypes: (
//     token:    string,
//     country?: string,
//   ): Promise<ApiResponse<VehicleTypeOption[]>> => {
//     const qs = country ? `?country=${country}` : '';
//     return 
//     // api.get(`/vehicle-types${qs}`, token);
//   },


    getVehicleTypes: async (
    token: string,
    country?: string,
  ): Promise<ApiResponse<VehicleTypeOption[]>> => {
    // Simulation d'un délai réseau
    await new Promise(resolve => setTimeout(resolve, 500));

    const mockData: VehicleTypeOption[] = [
      {
        type: 'ECONOMY', // Assumé selon votre type VehicleType
        label: 'Économique',
        description: '1-3 passagers • Compacte',
        base_price: 12.50,
        icon: 'car-outline',
        capacity: 3
      },
      {
        type: 'COMFORT',
        label: 'Confort',
        description: '1-4 passagers • Berline',
        base_price: 18.00,
        icon: 'star-outline',
        capacity: 4
      },
      {
        type: 'VAN',
        label: 'Van',
        description: '1-7 passagers • Familial',
        base_price: 35.00,
        icon: 'bus-outline',
        capacity: 7
      }
    ];

    return {
      ok: true,
      data: mockData,
      message: "Success"
    };
  },

};