// ══════════════════════════════════════════════════════════════════════════════
// STORE — Réservations (Zustand)
// Sprint 3 — EasyVTC
// ══════════════════════════════════════════════════════════════════════════════

import { create } from 'zustand';
import { reservationApi } from '../services/api/reservation.api';
import type {
  Reservation,
  ReservationListFilters,
  ReservationListResult,
  CreateReservationDto,
  BookingFormState,
  BookingStep,
  GeoPoint,
  VehicleType,
  VehicleTypeOption,
} from '../types/reservation.types';
import { BOOKING_INITIAL_STATE, VEHICLE_TYPE_OPTIONS } from '../types/reservation.types';

interface ReservationState {
  // ── Liste ──────────────────────────────────────────────────────────────────
  reservations:  Reservation[];
  total:         number;
  page:          number;
  totalPages:    number;

  // ── Détail / course active ─────────────────────────────────────────────────
  selected:      Reservation | null;
  activeRide:    Reservation | null;

  // ── Types de véhicule ─────────────────────────────────────────────────────
  vehicleTypes:  VehicleTypeOption[];

  // ── Formulaire de réservation (multi-étapes) ───────────────────────────────
  booking:       BookingFormState;

  // ── UI ─────────────────────────────────────────────────────────────────────
  isLoading:     boolean;
  isSubmitting:  boolean;
  isFetchingPrice: boolean;
  error:         string | null;

  // ── Actions liste ──────────────────────────────────────────────────────────
  fetchMine:       (token: string, filters?: ReservationListFilters) => Promise<void>;
  fetchAll:        (token: string, filters?: ReservationListFilters) => Promise<void>;
  fetchById:       (token: string, id: string)                       => Promise<void>;
  fetchDriverActive:(token: string)                                  => Promise<void>;
  cancel:          (token: string, id: string, reason?: string)      => Promise<void>;

  // ── Actions chauffeur ──────────────────────────────────────────────────────
  arrive:   (token: string, id: string) => Promise<void>;
  start:    (token: string, id: string) => Promise<void>;
  complete: (token: string, id: string, distKm?: number, durMin?: number) => Promise<void>;

  // ── Actions admin ──────────────────────────────────────────────────────────
  assign: (token: string, id: string, driverId: string) => Promise<void>;

  // ── Formulaire booking ─────────────────────────────────────────────────────
  fetchVehicleTypes: (token: string, country?: string) => Promise<void>;
  setBookingStep:    (step: BookingStep)               => void;
  setOrigin:         (point: GeoPoint | null)          => void;
  setDestination:    (point: GeoPoint | null)          => void;
  setVehicleType:    (type: VehicleType)               => void;
  setDate:           (date: string)                    => void;
  setTime:           (time: string)                    => void;
  setPassengers:     (n: number)                       => void;
  setLuggage:        (n: number)                       => void;
  setEstimate:       (price: number, distKm: number, durMin: number) => void;
  setComment:        (text: string)                    => void;
  submitBooking:     (token: string, country: string)  => Promise<Reservation>;
  resetBooking:      ()                                => void;

  clearError:  () => void;
  clearSelected: () => void;
}

export const useReservationStore = create<ReservationState>((set, get) => ({
  reservations:    [],
  total:           0,
  page:            1,
  totalPages:      1,
  selected:        null,
  activeRide:      null,
  vehicleTypes:    VEHICLE_TYPE_OPTIONS,
  booking:         { ...BOOKING_INITIAL_STATE },
  isLoading:       false,
  isSubmitting:    false,
  isFetchingPrice: false,
  error:           null,

  // ── Liste client ───────────────────────────────────────────────────────────
  fetchMine: async (token, filters) => {
    set({ isLoading: true, error: null });
    try {
      const res = await reservationApi.listMine(token, filters);
      if (!res.ok || !res.data) throw new Error(res.message ?? 'Erreur de chargement');
      set({
        reservations: res.data.reservations,
        total:        res.data.total,
        page:         res.data.page,
        totalPages:   res.data.total_pages,
        isLoading:    false,
      });
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Erreur inconnue', isLoading: false });
      throw err;
    }
  },

  // ── Liste admin ────────────────────────────────────────────────────────────
  fetchAll: async (token, filters) => {
    set({ isLoading: true, error: null });
    try {
      const res = await reservationApi.listAll(token, filters);
      if (!res.ok || !res.data) throw new Error(res.message ?? 'Erreur de chargement');
      set({
        reservations: res.data.reservations,
        total:        res.data.total,
        page:         res.data.page,
        totalPages:   res.data.total_pages,
        isLoading:    false,
      });
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Erreur inconnue', isLoading: false });
      throw err;
    }
  },

  // ── Détail ─────────────────────────────────────────────────────────────────
  fetchById: async (token, id) => {
    set({ isLoading: true, error: null });
    try {
      const res = await reservationApi.getById(token, id);
      if (!res.ok || !res.data) throw new Error(res.message ?? 'Réservation introuvable');
      set({ selected: res.data, isLoading: false });
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Erreur inconnue', isLoading: false });
      throw err;
    }
  },

  // ── Course active chauffeur ────────────────────────────────────────────────
  fetchDriverActive: async (token) => {
    set({ isLoading: true, error: null });
    try {
      const res = await reservationApi.getDriverActive(token);
      if (!res.ok) throw new Error(res.message ?? 'Erreur');
      set({ activeRide: res.data ?? null, isLoading: false });
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Erreur inconnue', isLoading: false });
    }
  },

  // ── Annulation ─────────────────────────────────────────────────────────────
  cancel: async (token, id, reason) => {
    set({ isLoading: true, error: null });
    try {
      const res = await reservationApi.cancel(token, id, reason);
      if (!res.ok || !res.data) throw new Error(res.message ?? 'Erreur annulation');
      set(state => ({
        reservations: state.reservations.map(r => r.id === id ? res.data! : r),
        selected:     state.selected?.id === id ? res.data! : state.selected,
        isLoading:    false,
      }));
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Erreur inconnue', isLoading: false });
      throw err;
    }
  },

  // ── Actions chauffeur ──────────────────────────────────────────────────────
  arrive: async (token, id) => {
    await reservationApi.arrive(token, id);
  },

  start: async (token, id) => {
    set({ isLoading: true, error: null });
    try {
      const res = await reservationApi.start(token, id);
      if (!res.ok || !res.data) throw new Error(res.message ?? 'Erreur démarrage');
      set({ activeRide: res.data, isLoading: false });
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Erreur inconnue', isLoading: false });
      throw err;
    }
  },

  complete: async (token, id, distKm, durMin) => {
    set({ isLoading: true, error: null });
    try {
      const res = await reservationApi.complete(token, id, distKm, durMin);
      if (!res.ok || !res.data) throw new Error(res.message ?? 'Erreur completion');
      set({ activeRide: null, isLoading: false });
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Erreur inconnue', isLoading: false });
      throw err;
    }
  },

  // ── Assignation admin ──────────────────────────────────────────────────────
  assign: async (token, id, driverId) => {
    set({ isLoading: true, error: null });
    try {
      const res = await reservationApi.assign(token, id, driverId);
      if (!res.ok || !res.data) throw new Error(res.message ?? 'Erreur assignation');
      set(state => ({
        reservations: state.reservations.map(r => r.id === id ? res.data! : r),
        selected:     state.selected?.id === id ? res.data! : state.selected,
        isLoading:    false,
      }));
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Erreur inconnue', isLoading: false });
      throw err;
    }
  },

  // ── Types de véhicule (catalogue statique — pas d'endpoint backend) ──────────
  fetchVehicleTypes: async (_token, _country) => {
    // Les types sont pré-chargés depuis VEHICLE_TYPE_OPTIONS, aucun appel réseau
  },

  // ── Formulaire multi-étapes ────────────────────────────────────────────────
  setBookingStep:  (step)       => set(s => ({ booking: { ...s.booking, step } })),
  setOrigin:       (origin)     => set(s => ({ booking: { ...s.booking, origin } })),
  setDestination:  (destination)=> set(s => ({ booking: { ...s.booking, destination } })),
  setVehicleType:  (vehicle_type) => set(s => ({ booking: { ...s.booking, vehicle_type } })),
  setDate:         (date)       => set(s => ({ booking: { ...s.booking, date } })),
  setTime:         (time)       => set(s => ({ booking: { ...s.booking, time } })),
  setPassengers:   (passengers) => set(s => ({ booking: { ...s.booking, passengers } })),
  setLuggage:      (luggage)    => set(s => ({ booking: { ...s.booking, luggage } })),
  setComment:      (comment)    => set(s => ({ booking: { ...s.booking, comment } })),
  setEstimate:     (estimated_price, distance_km, duration_min) =>
    set(s => ({ booking: { ...s.booking, estimated_price, distance_km, duration_min } })),

  // ── Soumission finale ──────────────────────────────────────────────────────
  submitBooking: async (token, country) => {
    const { booking } = get();
    if (!booking.origin || !booking.destination || !booking.vehicle_type || !booking.date || !booking.time) {
      throw new Error('Formulaire incomplet');
    }

    set({ isSubmitting: true, error: null });
    try {
      const scheduledAt = new Date(`${booking.date}T${booking.time}:00`).toISOString();

      // distance_km / duration_min : utiliser les valeurs calculées par l'estimation,
      // ou recalculer à la volée via Haversine si l'estimation n'a pas été appelée.
      let distance_km  = booking.distance_km  ?? undefined;
      let duration_min = booking.duration_min ?? undefined;

      if (distance_km === undefined || duration_min === undefined) {
        const R    = 6371;
        const dLat = ((booking.destination.latitude  - booking.origin.latitude)  * Math.PI) / 180;
        const dLon = ((booking.destination.longitude - booking.origin.longitude) * Math.PI) / 180;
        const a    = Math.sin(dLat / 2) ** 2
          + Math.cos(booking.origin.latitude  * Math.PI / 180)
          * Math.cos(booking.destination.latitude * Math.PI / 180)
          * Math.sin(dLon / 2) ** 2;
        distance_km  = Math.max(0.1, Math.round(6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10);
        duration_min = Math.max(1, Math.round(distance_km * 1.8));
      }

      const dto: CreateReservationDto = {
        country:        country as any,
        pickup_address: booking.origin.address,
        pickup_lat:     booking.origin.latitude,
        pickup_lng:     booking.origin.longitude,
        dest_address:   booking.destination.address,
        dest_lat:       booking.destination.latitude,
        dest_lng:       booking.destination.longitude,
        vehicle_type:   booking.vehicle_type,
        scheduled_at:   scheduledAt,
        distance_km,
        duration_min,
        flat_rate_id:   booking.flat_rate_id ?? undefined,
        comment:        booking.comment || undefined,
      };

      const res = await reservationApi.create(token, dto);
      if (!res.ok || !res.data) throw new Error(res.message ?? 'Erreur lors de la réservation');

      set(state => ({
        reservations: [res.data!, ...state.reservations],
        isSubmitting: false,
      }));

      return res.data!;
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Erreur inconnue', isSubmitting: false });
      throw err;
    }
  },

  resetBooking:  () => set({ booking: { ...BOOKING_INITIAL_STATE } }),
  clearError:    () => set({ error: null }),
  clearSelected: () => set({ selected: null }),
}));