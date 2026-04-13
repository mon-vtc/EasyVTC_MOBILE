// ══════════════════════════════════════════════════════════════════════════════
// HOOK — useReservation
// Sprint 3 — EasyVTC
// Réservé aux clients pour le flow de réservation
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
} from '../types/reservation.types';
import type { PricingCountry }            from '../types/pricing.types';

// ── Pays par défaut (à adapter depuis le profil utilisateur si disponible) ────
const DEFAULT_COUNTRY: PricingCountry = 'france';

export function useReservation() {
  const { isClient, user } = useAuth();
  const accessToken        = useAuthStore(s => s.accessToken);

  if (!isClient) {
    throw new Error('useReservation() ne peut être utilisé que par un client.');
  }

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
  const _fetchById         = useReservationStore(s => s.fetchById);
  const _cancel            = useReservationStore(s => s.cancel);
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

  const priceDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Chargement initial des types de véhicule ──────────────────────────────
  useEffect(() => {
    if (accessToken && vehicleTypes.length === 0) {
      _fetchVehicleTypes(accessToken, DEFAULT_COUNTRY);
    }
  }, [accessToken]);

  // ── Géolocalisation : obtenir la position actuelle ────────────────────────
  const getCurrentLocation = useCallback(async (): Promise<GeoPoint | null> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return null;

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      // Géocodage inverse pour obtenir l'adresse lisible
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

  // ── Géocodage d'une adresse saisie → GeoPoint (Nominatim / OpenStreetMap) ──
  // N'utilise pas Location.geocodeAsync (natif Android, défaillant sur émulateur
  // sans Google Play Services configuré). Nominatim fonctionne partout sans clé.
  const geocodeAddress = useCallback(async (address: string): Promise<GeoPoint | null> => {
    try {
      const query = encodeURIComponent(address);
      const res   = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&addressdetails=0`,
        { headers: { 'User-Agent': 'EazyVTC/1.0 (contact@infinitiax.com)' } },
      );
      if (!res.ok) return null;
      const data: { lat: string; lon: string }[] = await res.json();
      if (!data.length) return null;
      return {
        latitude:  parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon),
        address,
      };
    } catch {
      return null;
    }
  }, []);

  // ── Calcul du prix estimé (debounced 500ms) ───────────────────────────────
  // Appelé automatiquement quand origin + destination + vehicle_type sont définis
  const fetchEstimate = useCallback(async (
    origin:       GeoPoint,
    destination:  GeoPoint,
    vehicleType:  VehicleType,
  ) => {
    if (!accessToken) return;

    if (priceDebounceRef.current) clearTimeout(priceDebounceRef.current);

    priceDebounceRef.current = setTimeout(async () => {
      useReservationStore.setState({ isFetchingPrice: true });
      try {
        // Distance approximative (Haversine) pour l'estimation
        const R        = 6371;
        const dLat     = ((destination.latitude  - origin.latitude)  * Math.PI) / 180;
        const dLon     = ((destination.longitude - origin.longitude) * Math.PI) / 180;
        const a        = Math.sin(dLat / 2) ** 2
          + Math.cos(origin.latitude * Math.PI / 180)
          * Math.cos(destination.latitude * Math.PI / 180)
          * Math.sin(dLon / 2) ** 2;
        const distance_km  = Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
        const duration_min = Math.round(distance_km * 1.8); // estimation 1.8 min/km en ville

        const res = await pricingApi.estimate(accessToken, {
          country:      DEFAULT_COUNTRY,
          distance_km,
          duration_min,
        });

        if (res.ok && res.data) {
          _setEstimate(res.data.final_price, distance_km, duration_min);
        }
      } finally {
        useReservationStore.setState({ isFetchingPrice: false });
      }
    }, 500);
  }, [accessToken, _setEstimate]);

  // ── Setters enrichis ──────────────────────────────────────────────────────
  const setOrigin = useCallback((point: GeoPoint | null) => {
    _setOrigin(point);
    if (point && booking.destination && booking.vehicle_type) {
      fetchEstimate(point, booking.destination, booking.vehicle_type);
    }
  }, [_setOrigin, booking.destination, booking.vehicle_type, fetchEstimate]);

  const setDestination = useCallback((point: GeoPoint | null) => {
    _setDestination(point);
    if (point && booking.origin && booking.vehicle_type) {
      fetchEstimate(booking.origin, point, booking.vehicle_type);
    }
  }, [_setDestination, booking.origin, booking.vehicle_type, fetchEstimate]);

  const setVehicleType = useCallback((type: VehicleType) => {
    _setVehicleType(type);
    if (booking.origin && booking.destination) {
      fetchEstimate(booking.origin, booking.destination, type);
    }
  }, [_setVehicleType, booking.origin, booking.destination, fetchEstimate]);

  // ── Navigation entre étapes avec validation ───────────────────────────────
  const goToStep = useCallback((step: BookingStep) => {
    _setStep(step);
  }, [_setStep]);

  const nextStep = useCallback(() => {
    const next = Math.min(booking.step + 1, 3) as BookingStep;
    _setStep(next);
  }, [booking.step, _setStep]);

  const prevStep = useCallback(() => {
    const prev = Math.max(booking.step - 1, 1) as BookingStep;
    _setStep(prev);
  }, [booking.step, _setStep]);

  // ── Validation par étape ──────────────────────────────────────────────────
  const isStep1Valid = !!(booking.origin && booking.destination && booking.vehicle_type);
  const isStep2Valid = !!(booking.date && booking.time && booking.passengers >= 1);
  const isStep3Valid = isStep1Valid && isStep2Valid;

  // ── Soumission finale ──────────────────────────────────────────────────────
  const submitBooking = useCallback(async (): Promise<Reservation> => {
    return _submitBooking(accessToken!, DEFAULT_COUNTRY);
  }, [accessToken, _submitBooking]);

  return {
    // ── État formulaire ────────────────────────────────────────────────────
    booking,
    vehicleTypes,
    isLoading,
    isSubmitting,
    isFetchingPrice,
    error,
    clearError,

    // ── Validations ────────────────────────────────────────────────────────
    isStep1Valid,
    isStep2Valid,
    isStep3Valid,

    // ── Navigation étapes ──────────────────────────────────────────────────
    goToStep,
    nextStep,
    prevStep,

    // ── Setters étape 1 ────────────────────────────────────────────────────
    setOrigin,
    setDestination,
    setVehicleType,

    // ── Setters étape 2 ────────────────────────────────────────────────────
    setDate:       _setDate,
    setTime:       _setTime,
    setPassengers: _setPassengers,
    setLuggage:    _setLuggage,

    // ── Setters étape 3 ────────────────────────────────────────────────────
    setComment: _setComment,

    // ── Géolocalisation ────────────────────────────────────────────────────
    getCurrentLocation,
    geocodeAddress,

    // ── Soumission ─────────────────────────────────────────────────────────
    submitBooking,
    resetBooking: _resetBooking,

    // ── Mes réservations ───────────────────────────────────────────────────
    reservations,
    selected,
    fetchMine:  (filters?: any) => _fetchMine(accessToken!, filters),
    fetchById:  (id: string)    => _fetchById(accessToken!, id),
    cancel:     (id: string, reason?: string) => _cancel(accessToken!, id, reason),
  };
}