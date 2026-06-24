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
  isFetchingNextPage: boolean;
  error:           string | null;
  homeReservations: Reservation[];
  adminHomeReservations: Reservation[];
  driverHomeReservations: Reservation[];


  // ── Actions liste ──────────────────────────────────────────────────────────
  fetchMine:             (token: string, filters?: ReservationListFilters) => Promise<void>;
  fetchDriverReservations:(token: string, filters?: ReservationListFilters) => Promise<void>;
  fetchAll:              (token: string, filters?: ReservationListFilters) => Promise<void>;
  fetchById:             (token: string, id: string)                       => Promise<void>;
  fetchDriverActive:     (token: string)                                   => Promise<void>;
  fetchAvailableDrivers: (token: string, vehicleType?: string, scheduledAt?: string, durationMin?: number | null) => Promise<AvailableDriverDto[]>;
  fetchAdminHomeReservations: (token: string) => Promise<void>;
  fetchDriverHomeReservations: (token: string) => Promise<void>;
  fetchHomeReservations: (token: string) => Promise<void>;
  cancel:            (token: string, id: string, reason?: string)      => Promise<void>;
  // Dans ReservationState interface
  fetchAllPages: (token: string, filters?: ReservationListFilters) => Promise<void>;
  fetchAllDriverPages: (token: string, filters?: ReservationListFilters) => Promise<void>;
  fetchAllAdminPages: (token: string, filters?: ReservationListFilters) => Promise<void>;


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
  setPromoCode:      (code: string | null)              => void;

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
  adminHomeReservations: [],
  driverHomeReservations: [],
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
  isFetchingNextPage: false,
  error:           null,

  // ── Liste client ───────────────────────────────────────────────────────────
  // ── Liste client ───────────────────────────────────────────────────────────
  fetchMine: async (token, filters) => {
    set({ isLoading: true, error: null });
    try {
      const page = filters?.page ?? 1;
      if (page > 1) set({ isFetchingNextPage: true });
      else set({ isLoading: true, reservations: [], myReservations: [] });

      const res = await reservationApi.listMine(token, { ...filters, page });
      
      // 500 sur date vide = aucune réservation, pas une vraie erreur
      if (!res.ok) {
        set({ reservations: [], myReservations: [], total: 0, totalPages: 1, isLoading: false, isFetchingNextPage: false });
        return;
      }
    
      set(state => ({
        reservations:   page > 1 ? [...state.reservations, ...(res.data?.reservations ?? [])] : (res.data?.reservations ?? []),
        myReservations: page > 1 ? [...state.myReservations, ...(res.data?.reservations ?? [])] : (res.data?.reservations ?? []),
        total:          res.data?.total      ?? 0,
        page:           res.data?.page       ?? 1,
        totalPages:     res.data?.total_pages ?? 1,
        isLoading:      false,
        isFetchingNextPage: false,
      }));
    } catch (err: unknown) {
      // Swallow silencieusement — l'UI affichera juste "aucune réservation"
      set({ reservations: [], myReservations: [], total: 0, isLoading: false, isFetchingNextPage: false });
    }
  },
  
  fetchDriverReservations: async (token, filters) => {
    set({ isLoading: true, error: null });
    try {
      const page = filters?.page ?? 1;
      if (page > 1) set({ isFetchingNextPage: true });
      else set({ isLoading: true, reservations: [], myReservations: [] });

      const res = await reservationApi.getDriverReservations(token, { ...filters, page });
      set(state => ({
        reservations:   res.ok ? (page > 1 ? [...state.reservations, ...(res.data?.reservations ?? [])] : (res.data?.reservations ?? [])) : [],
        myReservations: res.ok ? (page > 1 ? [...state.myReservations, ...(res.data?.reservations ?? [])] : (res.data?.reservations ?? [])) : [],
        total:          res.data?.total      ?? 0,
        page:           res.data?.page       ?? 1,
        totalPages:     res.data?.total_pages ?? 1,
        isLoading:      false,
        isFetchingNextPage: false,
      }));
    } catch {
      set({ reservations: [], myReservations: [], total: 0, isLoading: false, isFetchingNextPage: false });
    }
  },
  // ── Liste admin ────────────────────────────────────────────────────────────
  fetchAll: async (token, filters) => {
    const page = filters?.page ?? 1;
    if (page > 1) set({ isFetchingNextPage: true });
    else set({ isLoading: true, reservations: [] });

    try {
      const res = await reservationApi.listAll(token, { ...filters, page });
      if (!res.ok || !res.data) throw new Error(res.message ?? 'Erreur de chargement');
      const { reservations, total, total_pages } = res.data;
      set(state => ({
        reservations: page > 1
               ? [...state.reservations, ...reservations]
          : reservations,
        total:        total,
        page:         page,
        totalPages:   total_pages,
        isLoading:    false,
        isFetchingNextPage: false,
      }));
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
  cancel: async (token, id, reason) => {
    set({ isLoading: true, error: null });
    try {
      if (!token) throw new Error('Non authentifié');
      const res = await reservationApi.cancel(token, id,  reason );
      if (!res.ok || !res.data) throw new Error(res.message ?? 'Erreur annulation');
      set(state => ({
        reservations: state.reservations.map(r => r.id === id ? res.data! : r),
        selected:     state.selected?.id === id ? res.data! : state.selected,
        isLoading:    false,
      }));
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Erreur inconnue', isLoading: false, isFetchingNextPage: false });
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
    try {
      const res = await reservationApi.complete(
        token, id,
        payload?.actual_distance_km,
        payload?.actual_duration_min,
        payload?.driver_notes,
        payload?.price_adjusted,
      );
      if (!res.ok || !res.data) throw new Error(res.message ?? 'Erreur complétion');
      set({ activeRide: null, isLoading: false });
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Erreur inconnue', isLoading: false });
      throw err;
    }
  },
 
  // ── Assignation admin ──────────────────────────────────────────────────────
  fetchAvailableDrivers: async (token, vehicleType, scheduledAt, durationMin) => {
    const res = await reservationApi.getAvailableDrivers(token, vehicleType, scheduledAt, durationMin);
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
      if (!res.ok || !res.data) throw new Error(res.message ?? 'Erreur chargement véhicules');
      set({ vehicleTypes: res.data, isLoading: false });
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Erreur inconnue', isLoading: false });
    }
  },

  fetchAdminHomeReservations: async (token) => {
    set({ isLoading: true, error: null });
    try {
      const res = await reservationApi.listAll(token, { status: 'pending', limit: 5, page: 1 });
      if (!res.ok || !res.data) throw new Error(res.message ?? 'Erreur de chargement');
      set({
        adminHomeReservations: res.data.reservations,
        isLoading: false,
      });
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Erreur inconnue', isLoading: false });
      throw err;
    }
  },

  fetchDriverHomeReservations: async (token) => {
    set({ isLoading: true, error: null });
    try {
      // Pour le chauffeur, on veut les courses qui lui sont assignées et qui sont à venir
      const res = await reservationApi.getDriverReservations(token, { status: 'assigned', limit: 5 });
      if (!res.ok || !res.data) throw new Error(res.message ?? 'Erreur de chargement');
      set({
        driverHomeReservations: res.data.reservations,
        isLoading: false,
      });
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Erreur inconnue', isLoading: false });
      throw err;
    }
  },


    // Nouvelle action (charge uniquement pending + assigned, sans filtre statut partagé) :
  fetchHomeReservations: async (token) => {
    set({ isLoading: true, error: null });
    try {
      const res = await reservationApi.listMine(token, { limit: 10 });
      set({
        homeReservations: res.ok ? (res.data?.reservations ?? []) : [],
        isLoading: false,
      });
    } catch {
      set({ homeReservations: [], isLoading: false });
    }
  },

  // Dans le store
fetchAllPages: async (token, filters) => {
  set({ isLoading: true, error: null, reservations: [], myReservations: [] });
  try {
    const limit = filters?.limit ?? 20;
    
    // Première page pour connaître le total
    const first = await reservationApi.listMine(token, { ...filters, page: 1, limit });
    if (!first.ok) {
      set({ reservations: [], myReservations: [], total: 0, totalPages: 1, isLoading: false });
      return;
    }

    const totalPages = first.data?.total_pages ?? 1;
    let all = first.data?.reservations ?? [];

    // Charger les pages suivantes en parallèle
    if (totalPages > 1) {
      const pages = await Promise.all(
        Array.from({ length: totalPages - 1 }, (_, i) =>
          reservationApi.listMine(token, { ...filters, page: i + 2, limit })
        )
      );
      for (const res of pages) {
        if (res.ok) all = [...all, ...(res.data?.reservations ?? [])];
      }
    }

    set({
      reservations:   all,
      myReservations: all,
      total:          first.data?.total ?? 0,
      page:           totalPages, // on est "à la fin" — pas de loadMore
      totalPages,
      isLoading:      false,
    });
  } catch {
    set({ reservations: [], myReservations: [], total: 0, isLoading: false });
  }
},

fetchAllAdminPages: async (token, filters) => {
    set({ isLoading: true, error: null, reservations: [], myReservations: [] });
  try {
    const limit = filters?.limit ?? 20;
    
    // Première page pour connaître le total
    const first = await reservationApi.listAll(token, { ...filters, page: 1, limit });
    if (!first.ok) {
      set({ reservations: [], myReservations: [], total: 0, totalPages: 1, isLoading: false });
      return;
    }

    const totalPages = first.data?.total_pages ?? 1;
    let all = first.data?.reservations ?? [];

    // Charger les pages suivantes en parallèle
    if (totalPages > 1) {
      const pages = await Promise.all(
        Array.from({ length: totalPages - 1 }, (_, i) =>
          reservationApi.listAll(token, { ...filters, page: i + 2, limit })
        )
      );
      for (const res of pages) {
        if (res.ok) all = [...all, ...(res.data?.reservations ?? [])];
      }
    }

    set({
      reservations:   all,
      myReservations: all,
      total:          first.data?.total ?? 0,
      page:           totalPages, // on est "à la fin" — pas de loadMore
      totalPages,
      isLoading:      false,
    });
  } catch {
    set({ reservations: [], myReservations: [], total: 0, isLoading: false });
  }
},

fetchAllDriverPages: async (token, filters) => {
  set({ isLoading: true, error: null, reservations: [], myReservations: [] });
  try {
    const limit = filters?.limit ?? 20;
    const first = await reservationApi.getDriverReservations(token, { ...filters, page: 1, limit });
    if (!first.ok) {
      set({ reservations: [], myReservations: [], total: 0, totalPages: 1, isLoading: false });
      return;
    }
    const totalPages = first.data?.total_pages ?? 1;
    let all = first.data?.reservations ?? [];

    if (totalPages > 1) {
      const pages = await Promise.all(
        Array.from({ length: totalPages - 1 }, (_, i) =>
          reservationApi.getDriverReservations(token, { ...filters, page: i + 2, limit })
        )
      );
      for (const res of pages) {
        if (res.ok) all = [...all, ...(res.data?.reservations ?? [])];
      }
    }

    set({
      reservations: all, myReservations: all,
      total: first.data?.total ?? 0,
      page: totalPages, totalPages,
      isLoading: false,
    });
  } catch {
    set({ reservations: [], myReservations: [], total: 0, isLoading: false });
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
  setPromoCode:    (promo_code)    => set(s => ({ booking: { ...s.booking, promo_code } })),
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

        // Code promo optionnel
        ...(booking.promo_code?.trim() && { promo_code: booking.promo_code.trim() }),
      };
      console.log('DTO envoyé au backend :', dto);
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