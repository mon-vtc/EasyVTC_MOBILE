// ══════════════════════════════════════════════════════════════════════════════
// API — Module Réservations
// Sprint 3 — EasyVTC
// Aligné avec reservations.routes.ts + reservations.controller.ts backend
// ══════════════════════════════════════════════════════════════════════════════

import { api }              from '../../lib/api';
import type { ApiResponse, DriverUser } from '../../types';
import type {
  Reservation,
  ReservationListFilters,
  ReservationListResult,
  CreateReservationDto,
  VehicleTypeOption,
  AvailableDriverDto,
} from '../../types/reservations.types';

export const reservationApi = {

  // ══════════════════════════════════════════════════════════════════════════
  // CLIENT
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * POST /reservations
   * Crée une réservation. Réservé au rôle 'client'.
   * Le backend calcule le prix via pricingService.computePrice().
   */
  create: (
    token: string,
    dto:   CreateReservationDto,
  ): Promise<ApiResponse<Reservation>> =>
    api.post('/reservations', dto, token),

  /**
   * GET /reservations/mine
   * Réservations du client connecté.
   * Filtres alignés avec reservationListFiltersSchema backend.
   */
  listMine: (
    token:    string,
    filters?: ReservationListFilters,
  ): Promise<ApiResponse<ReservationListResult>> => {
    const params = new URLSearchParams();
    if (filters?.status)    params.set('status',     filters.status);
    if (filters?.page)      params.set('page',        String(filters.page));
    if (filters?.limit)     params.set('limit',       String(filters.limit));
    if (filters?.date_from) params.set('date_from',   filters.date_from);
    if (filters?.date_to)   params.set('date_to',     filters.date_to);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return api.get(`/reservations/mine${qs}`, token);
  },

  /**
   * GET /reservations/:id
   * Détail d'une réservation — accès contrôlé par rôle côté service.
   */
  getById: (
    token: string,
    id:    string,
  ): Promise<ApiResponse<Reservation>> =>
    api.get(`/reservations/${id}`, token),

  getDriverReservations: (
    token: string,
    filters?: ReservationListFilters,
  ): Promise<ApiResponse<ReservationListResult>> => {
    const params = new URLSearchParams();
    if (filters?.status)    params.set('status',   filters.status);
    if (filters?.page)      params.set('page',     String(filters.page));
    if (filters?.limit)     params.set('limit',    String(filters.limit));
    if (filters?.date_from) params.set('date_from',filters.date_from);
    if (filters?.date_to)   params.set('date_to',  filters.date_to);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return api.get(`/reservations/driver${qs}`, token);
  },

  /**
   * PATCH /reservations/:id/cancel
   * Annulation par le client (ses propres courses) ou l'admin.
   * Body : { reason?: string }
   */
  cancel: (
    token:   string,
    id:      string,
    reason?: string,
  ): Promise<ApiResponse<Reservation>> =>
    api.patch(`/reservations/${id}/cancel`, { reason }, token),

  // ══════════════════════════════════════════════════════════════════════════
  // CHAUFFEUR
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * GET /reservations/driver/active
   * Course active du chauffeur connecté (statuts 'assigned' ou 'in_progress').
   */
  getDriverActive: (
    token: string,
  ): Promise<ApiResponse<Reservation | null>> =>
    api.get('/reservations/driver/active', token),

  /**
   * PATCH /reservations/:id/arrive
   * Le chauffeur signale son arrivée au point de pickup.
   * Ne change pas le statut en base — déclenche la notification 'driver_arrived'.
   */
  arrive: (
    token: string,
    id:    string,
  ): Promise<ApiResponse<void>> =>
    api.patch(`/reservations/${id}/arrive`, {}, token),

  /**
   * PATCH /reservations/:id/start
   * Le chauffeur démarre la course (client à bord) → statut 'in_progress'.
   * Crée l'enregistrement dans public.trips côté backend.
   */
  start: (
    token: string,
    id:    string,
  ): Promise<ApiResponse<Reservation>> =>
    api.patch(`/reservations/${id}/start`, {}, token),

  /**
   * PATCH /reservations/:id/complete
   * Le chauffeur termine la course → statut 'completed'.
   * Les métriques réelles permettent au backend de recalculer le prix final
   * (mode formule uniquement). Aligné avec CompleteReservationDto backend.
   */
  complete: (
    token:                string,
    id:                   string,
    actual_distance_km?:  number,
    actual_duration_min?: number,
    driver_notes?:        string,
    price_adjusted?:      number,
  ): Promise<ApiResponse<Reservation>> =>
    api.patch(`/reservations/${id}/complete`, {
      actual_distance_km,
      actual_duration_min,
      driver_notes,
      price_adjusted,
    }, token),

  // ══════════════════════════════════════════════════════════════════════════
  // ADMIN / MANAGER
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * GET /reservations
   * Toutes les réservations avec filtres (admin/manager uniquement).
   * Filtres alignés avec reservationListFiltersSchema backend.
   */
  listAll: (
    token:    string,
    filters?: ReservationListFilters,
  ): Promise<ApiResponse<ReservationListResult>> => {
    const params = new URLSearchParams();
    if (filters?.status)    params.set('status',    filters.status);
    if (filters?.country)   params.set('country',   filters.country);
    if (filters?.driver_id) params.set('driver_id', filters.driver_id);
    if (filters?.client_id) params.set('client_id', filters.client_id);
    if (filters?.date_from) params.set('date_from', filters.date_from);
    if (filters?.date_to)   params.set('date_to',   filters.date_to);
    if (filters?.page)      params.set('page',       String(filters.page));
    if (filters?.limit)     params.set('limit',      String(filters.limit));
    const qs = params.toString() ? `?${params.toString()}` : '';
    return api.get(`/reservations${qs}`, token);
  },

  /**
   * POST /reservations/:id/assign
   * Assigne un chauffeur à une réservation 'pending'.
   * Body : { driver_id: string } — ID du record public.drivers (pas users.id).
   */
  assign: (
    token:     string,
    id:        string,
    driver_id: string,
  ): Promise<ApiResponse<Reservation>> =>
    api.post(`/reservations/${id}/assign`, { driver_id }, token),

  // ══════════════════════════════════════════════════════════════════════════
  // UTILITAIRES
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * GET /vehicle-types?country=<country>
   * Types de véhicule disponibles avec tarifs de base.
   *
   * ⚠️  L'endpoint /vehicle-types n'est pas encore implémenté côté backend.
   *     Mock simulant la réponse avec les VehicleType backend ('standard' | 'berline' | 'van').
   *     Remplacer par l'appel réel dès que la route est disponible.
   */
  getVehicleTypes: async (
    _token:   string,
    country?: string,
  ): Promise<ApiResponse<VehicleTypeOption[]>> => {
    // TODO: remplacer par → api.get(`/vehicle-types${country ? `?country=${country}` : ''}`, _token)
    await new Promise(resolve => setTimeout(resolve, 400));

    const isSenegal = country === 'senegal';

    const mockData: VehicleTypeOption[] = [
      {
        type:        'standard',
        label:       'Économique',
        description: '1-3 passagers • Compacte',
        base_price:  isSenegal ? 3000 : 12.50,
        icon:        'car-outline',
        capacity:    3,
      },
      {
        type:        'berline',
        label:       'Confort',
        description: '1-4 passagers • Berline',
        base_price:  isSenegal ? 5000 : 18.00,
        icon:        'car-sport-outline',
        capacity:    4,
      },
      {
        type:        'van',
        label:       'Van',
        description: '1-7 passagers • Familial',
        base_price:  isSenegal ? 9000 : 35.00,
        icon:        'bus-outline',
        capacity:    7,
      },
    ];

    return { ok: true, data: mockData, message: 'Success' };
  },

  getAvailableDrivers: (
    token: string,
  ): Promise<ApiResponse<AvailableDriverDto[]>> =>
    api.get('/reservations/drivers/available', token),
  
};