// ══════════════════════════════════════════════════════════════════════════════
// HOOK — useReservation
// Sprint 3 — EasyVTC
// Pays : France (€)
// Recalcul d'estimation déclenché à chaque modification d'origine,
// destination, type de véhicule ou nombre de passagers,
// sans stale closure grâce aux refs.
// ══════════════════════════════════════════════════════════════════════════════

import { useCallback, useEffect, useRef } from 'react';
import * as Location                      from 'expo-location';
import { useAuthStore }                   from '../store/auth.store';
import { useReservationStore }            from '../store/reservation.store';
import { pricingApi }                     from '../services/api/pricing.api';
import { useAuth }                        from './useAuth';
import type {
  GeoPoint,
  VehicleType,
  BookingStep,
  Reservation,
  ReservationListFilters,
} from '../types/reservations.types';
import type { PricingCountry } from '../types/pricing.types';

const COUNTRY: PricingCountry = 'france';

export function useReservation() {
  const accessToken = useAuthStore(s => s.accessToken);

  if (!accessToken) {
    throw new Error('useReservation() ne peut être utilisé que par un utilisateur authentifié.');
  }

  // ── Sélecteurs store ───────────────────────────────────────────────────────
  const booking          = useReservationStore(s => s.booking);
  const vehicleTypes     = useReservationStore(s => s.vehicleTypes);
  const reservations     = useReservationStore(s => s.reservations);
  const selected         = useReservationStore(s => s.selected);
  const isLoading        = useReservationStore(s => s.isLoading);
  const isSubmitting     = useReservationStore(s => s.isSubmitting);
  const isFetchingPrice  = useReservationStore(s => s.isFetchingPrice);
  const error            = useReservationStore(s => s.error);

  const _fetchVehicleTypes = useReservationStore(s => s.fetchVehicleTypes);
  const _fetchMine         = useReservationStore(s => s.fetchMine);
  const _fetchDriverReservations = useReservationStore(s => s.fetchDriverReservations);
  const _fetchAll          = useReservationStore(s => s.fetchAll);
  const _fetchById         = useReservationStore(s => s.fetchById);
  const _fetchDriverActive = useReservationStore(s => s.fetchDriverActive);
  const _fetchAvailableDrivers = useReservationStore(s => s.fetchAvailableDrivers);
  const _cancel            = useReservationStore(s => s.cancel);
  const _arrive            = useReservationStore(s => s.arrive);
  const _start             = useReservationStore(s => s.start);
  const _complete          = useReservationStore(s => s.complete);
  const _assign            = useReservationStore(s => s.assign);
  const _submitBooking     = useReservationStore(s => s.submitBooking);
  const _resetBooking      = useReservationStore(s => s.resetBooking);
  const _setStep           = useReservationStore(s => s.setBookingStep);
  const _setOrigin         = useReservationStore(s => s.setOrigin);
  const _setDestination    = useReservationStore(s => s.setDestination);
  const _setVehicleType    = useReservationStore(s => s.setVehicleType);
  const _setDate           = useReservationStore(s => s.setDate);
  const _setTime           = useReservationStore(s => s.setTime);
  const _setPassengers     = useReservationStore(s => s.setPassengers);
  const _setLuggage        = useReservationStore(s => s.setLuggage);
  const _setComment        = useReservationStore(s => s.setComment);
  const _setEstimate       = useReservationStore(s => s.setEstimate);
  const clearError         = useReservationStore(s => s.clearError);

  // ── Refs pour éviter les stale closures ────────────────────────────────────
  // Reflètent toujours les valeurs courantes sans recréer les callbacks.
  const bookingRef       = useRef(booking);
  const accessTokenRef   = useRef(accessToken);
  const priceDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { bookingRef.current = booking; },         [booking]);
  useEffect(() => { accessTokenRef.current = accessToken; }, [accessToken]);

  // ── Chargement initial des types de véhicule ──────────────────────────────
  useEffect(() => {
    if (accessToken && vehicleTypes.length === 0) {
      _fetchVehicleTypes(accessToken, COUNTRY);
    }
  }, [accessToken]);

  // ── Géolocalisation ────────────────────────────────────────────────────────
  const getCurrentLocation = useCallback(async (): Promise<GeoPoint | null> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return null;

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const [place] = await Location.reverseGeocodeAsync({
        latitude:  location.coords.latitude,
        longitude: location.coords.longitude,
      });

      const address = [
        place.name,
        place.street,
        place.city,
        place.postalCode,
        place.country,
      ].filter(Boolean).join(', ');

      return {
        latitude:  location.coords.latitude,
        longitude: location.coords.longitude,
        address,
      };
    } catch {
      return null;
    }
  }, []);

  // ── Géocodage ──────────────────────────────────────────────────────────────
  const geocodeAddress = useCallback(async (address: string): Promise<GeoPoint | null> => {
    try {
      const results = await Location.geocodeAsync(address);
      if (!results.length) return null;
      return { latitude: results[0].latitude, longitude: results[0].longitude, address };
    } catch {
      return null;
    }
  }, []);

  // ── Calcul du prix estimé (debounced 500ms) ───────────────────────────────
  /**
   * Reçoit les paramètres explicitement (pas de lecture depuis booking)
   * pour éviter tout stale closure. Peut être appelé autant de fois que
   * nécessaire — le debounce absorbe les appels rapides.
   *
   * Formule Haversine pour la distance, puis POST vers pricingApi.estimate()
   * avec country='france'. Le résultat est stocké dans le store via setEstimate().
   */
  const fetchEstimate = useCallback((
    origin:        GeoPoint,
    destination:   GeoPoint,
    _vehicleType:  VehicleType,
    _nbPassengers: number,
  ) => {
    const token = accessTokenRef.current;
    if (!token) return;

    if (priceDebounceRef.current) clearTimeout(priceDebounceRef.current);

    priceDebounceRef.current = setTimeout(async () => {
      useReservationStore.setState({ isFetchingPrice: true });
      try {
        const R    = 6371;
        const dLat = ((destination.latitude  - origin.latitude)  * Math.PI) / 180;
        const dLon = ((destination.longitude - origin.longitude) * Math.PI) / 180;
        const a    =
          Math.sin(dLat / 2) ** 2 +
          Math.cos(origin.latitude      * Math.PI / 180) *
          Math.cos(destination.latitude * Math.PI / 180) *
          Math.sin(dLon / 2) ** 2;
        const distance_km  = Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
        const duration_min = Math.round(distance_km * 1.8); // ~1.8 min/km en milieu urbain

        const res = await pricingApi.estimate(token, {
          country:       COUNTRY,
          distance_km,
          duration_min,
          nb_passengers: _nbPassengers,
        });
        // vehicle_type:  _vehicleType,

        if (res.ok && res.data) {
          // Écriture atomique directe dans le store — contourne tout
          // problème de merge partiel dans _setEstimate et garantit
          // que estimated_price est bien la valeur de cette réponse précise.
          useReservationStore.setState(state => ({
            booking: {
              ...state.booking,
              estimated_price: res.data!.final_price,
              distance_km,
              duration_min,
            },
          }));
        }
      } finally {
        useReservationStore.setState({ isFetchingPrice: false });
      }
    }, 500);
  }, []); // stable — lit les valeurs fraîches via accessTokenRef et écrit directement dans le store

  // ── Setters enrichis ───────────────────────────────────────────────────────
  /**
   * Chaque setter lit bookingRef.current pour obtenir les autres champs à jour,
   * évitant ainsi que fetchEstimate soit appelé avec des valeurs périmées.
   * La valeur fraîche du champ modifié est toujours passée directement en
   * paramètre (pas depuis bookingRef) car setState est asynchrone — le ref
   * n'est pas encore mis à jour au moment de l'appel.
   *
   * Le recalcul se déclenche systématiquement si les 3 critères géographiques
   * sont présents, même en cas de re-saisie d'un champ déjà rempli.
   */

  const setOrigin = useCallback((point: GeoPoint | null) => {
    _setOrigin(point);
    const { destination, vehicle_type, nb_passengers } = bookingRef.current;
    if (point && destination && vehicle_type) {
      fetchEstimate(point, destination, vehicle_type, nb_passengers);
    }
  }, [_setOrigin, fetchEstimate]);

  const setDestination = useCallback((point: GeoPoint | null) => {
    _setDestination(point);
    const { origin, vehicle_type, nb_passengers } = bookingRef.current;
    if (point && origin && vehicle_type) {
      fetchEstimate(origin, point, vehicle_type, nb_passengers);
    }
  }, [_setDestination, fetchEstimate]);

  const setVehicleType = useCallback((type: VehicleType) => {
    _setVehicleType(type);
    const { origin, destination, nb_passengers } = bookingRef.current;
    if (origin && destination) {
      fetchEstimate(origin, destination, type, nb_passengers);
    }
  }, [_setVehicleType, fetchEstimate]);

  /**
   * Déclenche un recalcul si origine + destination + véhicule sont présents.
   * `count` est passé directement à fetchEstimate (valeur fraîche) car
   * bookingRef.current.nb_passengers n'est pas encore mis à jour au moment
   * où setState (_setPassengers) est traité de manière asynchrone.
   */
  const setPassengers = useCallback((count: number) => {
    _setPassengers(count);
    const { origin, destination, vehicle_type } = bookingRef.current;
    if (origin && destination && vehicle_type) {
      fetchEstimate(origin, destination, vehicle_type, count);
    }
  }, [_setPassengers, fetchEstimate]);

  // ── Navigation étapes ──────────────────────────────────────────────────────
  const goToStep = useCallback((step: BookingStep) => _setStep(step), [_setStep]);

  const nextStep = useCallback(() => {
    const next = Math.min(bookingRef.current.step + 1, 3) as BookingStep;
    _setStep(next);
  }, [_setStep]);

  const prevStep = useCallback(() => {
    const prev = Math.max(bookingRef.current.step - 1, 1) as BookingStep;
    _setStep(prev);
  }, [_setStep]);

  // ── Validation ─────────────────────────────────────────────────────────────
  const isStep1Valid = !!(booking.origin && booking.destination && booking.vehicle_type);
  const isStep2Valid = !!(booking.date && booking.time && booking.nb_passengers >= 1);
  const isStep3Valid = isStep1Valid && isStep2Valid;

  // ── Soumission ─────────────────────────────────────────────────────────────
  const submitBooking = useCallback(async (): Promise<Reservation> => {
    return _submitBooking(accessTokenRef.current!, COUNTRY);
  }, [_submitBooking]);

  return {
    // État formulaire
    booking,
    vehicleTypes,
    isLoading,
    isSubmitting,
    isFetchingPrice,
    error,
    clearError,

    // Validations
    isStep1Valid,
    isStep2Valid,
    isStep3Valid,

    // Navigation
    goToStep,
    nextStep,
    prevStep,

    // Recalcul manuel (ex : transition étape 2 → 3 sans modification des champs)
    fetchEstimate,  // exposé pour forcer le recalcul à la transition étape 2→3

    // Setters étape 1 (enrichis — déclenchent fetchEstimate)
    setOrigin,
    setDestination,
    setVehicleType,

    // Setters étape 2
    setDate:       _setDate,
    setTime:       _setTime,
    setPassengers,          // enrichi — déclenche fetchEstimate
    setLuggage:    _setLuggage,

    // Setters étape 3
    setComment: _setComment,

    // Géolocalisation
    getCurrentLocation,
    geocodeAddress,

    // Soumission
    submitBooking,
    resetBooking: _resetBooking,

    // Mes réservations
    reservations,
    selected,
    fetchMine:             useCallback((filters?: ReservationListFilters) => _fetchMine(accessTokenRef.current!, filters), []),
    fetchDriverReservations: useCallback((filters?: ReservationListFilters) => _fetchDriverReservations(accessTokenRef.current!, filters), []),
    fetchAll:              useCallback((filters?: ReservationListFilters) => _fetchAll(accessTokenRef.current!, filters), []),
    fetchById:             useCallback((id: string)                       => _fetchById(accessTokenRef.current!, id), []),
    fetchDriverActive:     useCallback(()                               => _fetchDriverActive(accessTokenRef.current!), []),
    fetchDriverUserActive: useCallback(() => _fetchAvailableDrivers(accessTokenRef.current!), []),

    // Actions fournisseurs
    cancel:   useCallback((id: string, reason?: string)                                                             => _cancel(accessTokenRef.current!, id, reason), []),
    arrive:   useCallback((id: string)                                                                               => _arrive(accessTokenRef.current!, id), []),
    start:    useCallback((id: string)                                                                               => _start(accessTokenRef.current!, id), []),
    complete: useCallback((id: string, actual_distance_km?: number, actual_duration_min?: number, driver_notes?: string, price_adjusted?: number) =>
      _complete(accessTokenRef.current!, id, actual_distance_km, actual_duration_min, driver_notes, price_adjusted), []),
    assign:   useCallback((id: string, driverId: string)                                                            => _assign(accessTokenRef.current!, id, driverId), []),

  };
}