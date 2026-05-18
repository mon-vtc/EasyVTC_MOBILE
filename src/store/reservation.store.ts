// ══════════════════════════════════════════════════════════════════════════════
// STORE — Réservations (Zustand)
// Sprint 3 — EasyVTC
// Aligné avec le backend (champs DTO, filtres, actions chauffeur)
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
  AvailableDriverDto,
} from '../types/reservations.types';
import { useAuthStore } from './auth.store';
import { BOOKING_INITIAL_STATE } from '../types/reservations.types';
import { vehicleApi } from '../services/api/vehicle.api';

interface ReservationState {
  // ── Liste ──────────────────────────────────────────────────────────────────
  reservations: Reservation[];
  total:        number;
  page:         number;
  totalPages:   number;

  // ── Détail / course active ─────────────────────────────────────────────────
  selected:   Reservation | null;  currentReservation: Reservation | null;
  myReservations: Reservation[];  activeRide: Reservation | null;

  // ── Types de véhicule ──────────────────────────────────────────────────────
  vehicleTypes: VehicleTypeOption[];

  // ── Formulaire de réservation (multi-étapes) ───────────────────────────────
  booking: BookingFormState;

  // ── UI ─────────────────────────────────────────────────────────────────────
  isLoading:       boolean;
  isSubmitting:    boolean;
  isFetchingPrice: boolean;
  error:           string | null;
  homeReservations: Reservation[];


  // ── Actions liste ──────────────────────────────────────────────────────────
  fetchMine:             (token: string, filters?: ReservationListFilters) => Promise<void>;
  fetchDriverReservations:(token: string, filters?: ReservationListFilters) => Promise<void>;
  fetchAll:              (token: string, filters?: ReservationListFilters) => Promise<void>;
  fetchById:             (token: string, id: string)                       => Promise<void>;
  fetchDriverActive:     (token: string)                                   => Promise<void>;
  fetchAvailableDrivers: (token: string, vehicleType?: string)             => Promise<AvailableDriverDto[]>;
  fetchHomeReservations: (token: string) => Promise<void>;
  cancel:            (token: string, id: string, reason?: string)      => Promise<void>;

  // ── Actions chauffeur ──────────────────────────────────────────────────────
  arrive: (token: string, id: string) => Promise<void>;
  start:  (token: string, id: string) => Promise<void>;
  complete: (token: string, id: string, payload?: {
    actual_distance_km?:  number;
    actual_duration_min?: number;
    driver_notes?:        string;
    price_adjusted?:      number;
  }) => Promise<void>;


  // ── Actions admin ──────────────────────────────────────────────────────────
  assign: (token: string, id: string, driverId: string) => Promise<void>;

  // ── Formulaire booking ─────────────────────────────────────────────────────
  fetchVehicleTypes: (token: string, country?: string) => Promise<void>;
  setBookingStep:    (step: BookingStep)                => void;
  setOrigin:         (point: GeoPoint | null)           => void;
  setDestination:    (point: GeoPoint | null)           => void;
  setVehicleType:    (type: VehicleType)                => void;
  setDate:           (date: string)                     => void;
  setTime:           (time: string)                     => void;
  setPassengers:     (n: number)                        => void;
  setLuggage:        (n: number)                        => void;
  setEstimate:       (price: number, distKm: number, durMin: number) => void;
  setComment:        (text: string)                     => void;
  setFlatRateId:     (id: string | null)                => void;

  /**
   * Soumet la réservation au backend.
   * Construit le DTO avec les noms de champs attendus par le serveur :
   *   pickup_address / dest_address / nb_passengers / distance_km / duration_min
   */
  submitBooking: (token: string, country: string) => Promise<Reservation>;
  resetBooking:  ()                               => void;

  clearError:    () => void;
  clearSelected: () => void;
}

export const useReservationStore = create<ReservationState>((set, get) => ({
  reservations:      [],
  homeReservations: [],
  myReservations:    [],
  currentReservation:null,
  total:             0,
  page:              1,
  totalPages:        1,
  selected:          null,
  activeRide:        null,
  vehicleTypes:      [],
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
        myReservations: res.data.reservations,
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

  fetchDriverReservations: async (token, filters) => {
    set({ isLoading: true, error: null });
    try {
      const res = await reservationApi.getDriverReservations(token, filters);
      if (!res.ok || !res.data) throw new Error(res.message ?? 'Erreur de chargement');
      set({
        reservations: res.data.reservations,
        myReservations: res.data.reservations,
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
      set({ selected: res.data, currentReservation: res.data, isLoading: false });
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
  cancel: async (id, reason) => {
    set({ isLoading: true, error: null });
    try {
      const token = useAuthStore.getState().accessToken;
      if (!token) throw new Error('Non authentifié');

      const res = await reservationApi.cancel(token, id,  reason );
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
    try {
      await reservationApi.arrive(token, id);
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Erreur inconnue' });
      throw err;
    }
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

  complete: async (token, id, payload) => {
    set({ isLoading: true, error: null });
    console.log('Completing ride with:', { id, ...payload });
    try {
      const res = await reservationApi.complete(
        token, id,
        payload?.actual_distance_km,
        payload?.actual_duration_min,
        payload?.driver_notes,
        payload?.price_adjusted,
      );
      if (!res.ok || !res.data) throw new Error(res.message ?? 'Erreur complétion');
      console.log('Ride completed, response:', res.data);
      set({ activeRide: null, isLoading: false });
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Erreur inconnue', isLoading: false });
      throw err;
    }
  },
 
  // ── Assignation admin ──────────────────────────────────────────────────────
  fetchAvailableDrivers: async (token, vehicleType) => {
    const res = await reservationApi.getAvailableDrivers(token, vehicleType);
    if (!res.ok || !res.data) throw new Error(res.message ?? 'Erreur chargement chauffeurs');
    return res.data;
  },

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

  // ── Types de véhicule ──────────────────────────────────────────────────────
  fetchVehicleTypes: async (token, country) => {
    set({ isLoading: true, error: null });
    try {
      const res = await vehicleApi.getVehicleTypes(token, country);
      console.log(res.data);
      
      if (!res.ok || !res.data) throw new Error(res.message ?? 'Erreur chargement véhicules');
      set({ vehicleTypes: res.data, isLoading: false });
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Erreur inconnue', isLoading: false });
    }
  },

    // Nouvelle action (charge uniquement pending + assigned, sans filtre statut partagé) :
  fetchHomeReservations: async (token) => {
    set({ isLoading: true, error: null });
    try {
      const res = await reservationApi.listMine(token, { limit: 10 });
      if (!res.ok || !res.data) throw new Error(res.message ?? 'Erreur de chargement');
      set({
        homeReservations: res.data.reservations,
        isLoading: false,
      });
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Erreur inconnue', isLoading: false });
      throw err;
    }
  },

  // ── Setters formulaire ─────────────────────────────────────────────────────
  setBookingStep:  (step)          => set(s => ({ booking: { ...s.booking, step } })),
  setOrigin:       (origin)        => set(s => ({ booking: { ...s.booking, origin } })),
  setDestination:  (destination)   => set(s => ({ booking: { ...s.booking, destination } })),
  setVehicleType:  (vehicle_type)  => set(s => ({ booking: { ...s.booking, vehicle_type } })),
  setDate:         (date)          => set(s => ({ booking: { ...s.booking, date } })),
  setTime:         (time)          => set(s => ({ booking: { ...s.booking, time } })),
  setPassengers:   (nb_passengers)    => set(s => ({ booking: { ...s.booking, nb_passengers } })),
  setLuggage:      (luggage)       => set(s => ({ booking: { ...s.booking, luggage } })),
  setComment:      (comment)       => set(s => ({ booking: { ...s.booking, comment } })),
  setFlatRateId:   (flat_rate_id)  => set(s => ({ booking: { ...s.booking, flat_rate_id } })),
  setEstimate: (estimated_price, distance_km, duration_min) =>
    set(s => ({ booking: { ...s.booking, estimated_price, distance_km, duration_min } })),

  // ── Soumission finale ──────────────────────────────────────────────────────
  /**
   * Construit le DTO avec les noms de champs du backend :
   *   - pickup_address  (≠ origin_address)
   *   - dest_address    (≠ destination_address)
   *   - nb_passengers   (≠ passengers)
   *   - distance_km / duration_min transmis pour le calcul de prix serveur
   *   - flat_rate_id si une tarification forfaitaire est sélectionnée
   *
   * Le champ 'luggage' est conservé en local uniquement (non supporté backend).
   */
  submitBooking: async (token, country) => {
    const { booking } = get();

    // Avec forfait : origin/destination non obligatoires (l'itinéraire est défini par le forfait).
    // Sans forfait : origin + destination requis.
    const hasRoute = !!(booking.origin && booking.destination);
    const hasForfait = !!booking.flat_rate_id;

    if (
      (!hasRoute && !hasForfait) ||
      !booking.vehicle_type ||
      !booking.date         ||
      !booking.time
    ) {
      throw new Error('Formulaire incomplet');
    }

    set({ isSubmitting: true, error: null });

    try {
      const scheduled_at = new Date(`${booking.date}T${booking.time}:00`).toISOString();

      // DTO aligné champ par champ avec CreateReservationDto backend
      const dto: CreateReservationDto = {
        // Trajet — noms backend (adresses saisies ou labels du forfait)
        pickup_address: booking.origin?.address ?? '',
        // lat/lng : omis si nuls ou 0 (placeholder forfait) — backend les accepte en optionnel
        ...(booking.origin?.latitude  ? { pickup_lat: booking.origin.latitude  } : {}),
        ...(booking.origin?.longitude ? { pickup_lng: booking.origin.longitude } : {}),
        dest_address:   booking.destination?.address ?? '',
        ...(booking.destination?.latitude  ? { dest_lat: booking.destination.latitude  } : {}),
        ...(booking.destination?.longitude ? { dest_lng: booking.destination.longitude } : {}),

        // Véhicule & pays
        vehicle_type: booking.vehicle_type!,
        country:      country as any,

        // Horaire
        scheduled_at,

        // Passagers — nom backend
        nb_passengers: booking.nb_passengers,

        // Métriques estimées (permettent au backend de calculer le prix)
        ...(booking.distance_km  != null && { distance_km:  booking.distance_km }),
        ...(booking.duration_min != null && { duration_min: booking.duration_min }),

        // Tarification forfaitaire
        ...(booking.flat_rate_id && { flat_rate_id: booking.flat_rate_id }),

        // Commentaire optionnel
        ...(booking.comment.trim() && { comment: booking.comment.trim() }),
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