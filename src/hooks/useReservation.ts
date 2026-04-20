// ══════════════════════════════════════════════════════════════════════════════
// HOOK — useReservation
// Sprint 3 — EasyVTC
// Pays : France (€)
// Recalcul d'estimation déclenché à chaque modification d'origine,
// destination, type de véhicule ou nombre de passagers,
// sans stale closure grâce aux refs.
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useCallback, useEffect, useRef } from 'react';
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
import type { PricingCountry, PricingFlatRate } from '../types/pricing.types';

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
  const _setFlatRateId     = useReservationStore(s => s.setFlatRateId);
  const clearError         = useReservationStore(s => s.clearError);

  // ── Refs pour éviter les stale closures ────────────────────────────────────
  // Reflètent toujours les valeurs courantes sans recréer les callbacks.
  const bookingRef       = useRef(booking);
  const accessTokenRef   = useRef(accessToken);
  const priceDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { bookingRef.current = booking; },         [booking]);
  useEffect(() => { accessTokenRef.current = accessToken; }, [accessToken]);

  // ── Forfaits disponibles ───────────────────────────────────────────────────
  const [flatRates, setFlatRates]               = useState<PricingFlatRate[]>([]);
  const [suggestedFlatRate, setSuggestedFlatRate] = useState<PricingFlatRate | null>(null);
  const flatRatesRef = useRef<PricingFlatRate[]>([]);

  // Chargement initial des types de véhicule et des forfaits
  useEffect(() => {
    if (accessToken && vehicleTypes.length === 0) {
      _fetchVehicleTypes(accessToken, COUNTRY);
    }
  }, [accessToken]);

  useEffect(() => {
    pricingApi.listFlatRates(undefined, COUNTRY, { is_active: true, limit: 100 })
      .then(res => {
        if (res.ok && res.data) {
          setFlatRates(res.data.flat_rates);
          flatRatesRef.current = res.data.flat_rates;
        }
      })
      .catch(() => { /* silencieux — endpoint public toujours disponible */ });
  }, []);

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

  // ── Détection automatique de forfait par correspondance d'adresse ──────────
  /**
   * Compare les adresses saisies avec les labels des forfaits (case-insensitive
   * substring match). Si une correspondance est trouvée, elle est proposée
   * via suggestedFlatRate — sans rien appliquer automatiquement.
   */
  const detectSuggestedFlatRate = useCallback((origin: GeoPoint, destination: GeoPoint) => {
    const o = origin.address.toLowerCase();
    const d = destination.address.toLowerCase();
    const match = flatRatesRef.current.find(fr =>
      o.includes(fr.origin_label.toLowerCase()) &&
      d.includes(fr.destination_label.toLowerCase())
    ) ?? null;
    setSuggestedFlatRate(match);
  }, []);

  // ── Calcul du prix estimé (debounced 500ms) — mode formule ───────────────
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

  // ── Calcul du prix estimé — mode forfait ──────────────────────────────────
  /**
   * Appelle l'API d'estimation avec un flat_rate_id au lieu de la formule
   * distance/durée. Utilisé à chaque sélection de forfait ou changement
   * du nombre de passagers quand un forfait est actif (surcharge par passager).
   */
  const fetchFlatRateEstimate = useCallback((flatRateId: string, nbPassengers: number) => {
    const token = accessTokenRef.current;
    if (!token) return;
    useReservationStore.setState({ isFetchingPrice: true });
    pricingApi.estimate(token, {
      country:       COUNTRY,
      flat_rate_id:  flatRateId,
      nb_passengers: nbPassengers,
    }).then(res => {
      if (res.ok && res.data) {
        useReservationStore.setState(state => ({
          booking: {
            ...state.booking,
            estimated_price: res.data!.final_price,
            // Efface distance/durée — non pertinents en mode forfait
            distance_km:  null,
            duration_min: null,
          },
        }));
      }
    }).finally(() => {
      useReservationStore.setState({ isFetchingPrice: false });
    });
  }, []);

  // ── Setters enrichis ───────────────────────────────────────────────────────
  /**
   * Chaque setter lit bookingRef.current pour obtenir les autres champs à jour,
   * évitant ainsi que fetchEstimate soit appelé avec des valeurs périmées.
   * La valeur fraîche du champ modifié est toujours passée directement en
   * paramètre (pas depuis bookingRef) car setState est asynchrone — le ref
   * n'est pas encore mis à jour au moment de l'appel.
   */

  const setOrigin = useCallback((point: GeoPoint | null) => {
    _setOrigin(point);
    _setFlatRateId(null); // tout changement d'adresse annule le forfait sélectionné
    setSuggestedFlatRate(null);
    const { destination, vehicle_type, nb_passengers } = bookingRef.current;
    if (point && destination) {
      detectSuggestedFlatRate(point, destination);
      if (vehicle_type) fetchEstimate(point, destination, vehicle_type, nb_passengers);
    }
  }, [_setOrigin, _setFlatRateId, fetchEstimate, detectSuggestedFlatRate]);

  const setDestination = useCallback((point: GeoPoint | null) => {
    _setDestination(point);
    _setFlatRateId(null); // tout changement d'adresse annule le forfait sélectionné
    setSuggestedFlatRate(null);
    const { origin, vehicle_type, nb_passengers } = bookingRef.current;
    if (point && origin) {
      detectSuggestedFlatRate(origin, point);
      if (vehicle_type) fetchEstimate(origin, point, vehicle_type, nb_passengers);
    }
  }, [_setDestination, _setFlatRateId, fetchEstimate, detectSuggestedFlatRate]);

  const setVehicleType = useCallback((type: VehicleType) => {
    _setVehicleType(type);
    const { origin, destination, nb_passengers, flat_rate_id } = bookingRef.current;
    if (!origin || !destination) return;
    if (flat_rate_id) {
      fetchFlatRateEstimate(flat_rate_id, nb_passengers);
    } else {
      fetchEstimate(origin, destination, type, nb_passengers);
    }
  }, [_setVehicleType, fetchEstimate, fetchFlatRateEstimate]);

  /**
   * Si un forfait est actif, recalcule avec flat_rate_id (surcharge passager).
   * Sinon, utilise la formule distance. `count` passé directement (fresh value).
   */
  const setPassengers = useCallback((count: number) => {
    _setPassengers(count);
    const { origin, destination, vehicle_type, flat_rate_id } = bookingRef.current;
    if (flat_rate_id) {
      fetchFlatRateEstimate(flat_rate_id, count);
    } else if (origin && destination && vehicle_type) {
      fetchEstimate(origin, destination, vehicle_type, count);
    }
  }, [_setPassengers, fetchEstimate, fetchFlatRateEstimate]);

  /**
   * Sélectionne ou désélectionne un forfait.
   * - Sélection  : stocke flat_rate_id + estime le prix via l'API forfait.
   * - Désélection: efface flat_rate_id + re-estime par formule si adresses présentes.
   */
  const setFlatRateId = useCallback((id: string | null) => {
    _setFlatRateId(id);
    setSuggestedFlatRate(null);
    if (id) {
      fetchFlatRateEstimate(id, bookingRef.current.nb_passengers);
    } else {
      const { origin, destination, vehicle_type, nb_passengers } = bookingRef.current;
      if (origin && destination && vehicle_type) {
        fetchEstimate(origin, destination, vehicle_type, nb_passengers);
      }
    }
  }, [_setFlatRateId, fetchEstimate, fetchFlatRateEstimate]);

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
    fetchEstimate,

    // Forfaits
    flatRates,
    suggestedFlatRate,
    setFlatRateId,

    // Setters étape 1 (enrichis — déclenchent fetchEstimate ou fetchFlatRateEstimate)
    setOrigin,
    setDestination,
    setVehicleType,

    // Setters étape 2
    setDate:       _setDate,
    setTime:       _setTime,
    setPassengers,
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
