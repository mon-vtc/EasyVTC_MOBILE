// ══════════════════════════════════════════════════════════════════════════════
// TYPES — Module Réservations (Frontend)
// Sprint 3 — EasyVTC
// Aligné avec le backend (reservations.types.ts serveur)
// ══════════════════════════════════════════════════════════════════════════════

import type { PricingCountry } from './pricing.types';

// ── Statuts ───────────────────────────────────────────────────────────────────
// Aligné avec le backend : 'driver_arrived' est géré côté front uniquement
// (le backend ne stocke pas ce statut, il déclenche une notification)
export type ReservationStatus =
  | 'pending'        // En attente d'assignation
  | 'assigned'       // Chauffeur assigné
  | 'driver_arrived' // Chauffeur arrivé (statut UI enrichi, non persisté en base)
  | 'in_progress'    // Course en cours
  | 'completed'      // Terminée
  | 'cancelled';     // Annulée

export const RESERVATION_STATUS_LABELS: Record<ReservationStatus, string> = {
  pending:        'En attente',
  assigned:       'Attribuée',
  driver_arrived: 'Chauffeur arrivé',
  in_progress:    'En cours',
  completed:      'Terminée',
  cancelled:      'Annulée',
};

export const RESERVATION_STATUS_COLORS: Record<ReservationStatus, string> = {
  pending:        '#F59E0B',
  assigned:       '#3B82F6',
  driver_arrived: '#8B5CF6',
  in_progress:    '#10B981',
  completed:      '#6B7280',
  cancelled:      '#EF4444',
};

// ── Types de véhicule — alignés avec le backend ───────────────────────────────
// Backend : 'standard' | 'berline' | 'van'
export type VehicleType = 'standard' | 'berline' | 'van';

export interface VehicleTypeOption {
  type:        VehicleType;
  label:       string;
  description: string;   // ex: "1-3 passagers"
  base_price:  number;
  icon:        string;   // nom Ionicons
  capacity:    number;
}

// ── Coordonnées géographiques ─────────────────────────────────────────────────
export interface GeoPoint {
  latitude:  number;
  longitude: number;
  address:   string; // Adresse lisible (geocodée)
}

// ── Entité Réservation — miroir de ReservationWithRelations backend ───────────
export interface Reservation {
  id:          string;
  client_id:   string;
  driver_id:   string | null;
  assigned_by: string | null;
  status:      ReservationStatus;

  // Localisation — noms de champs identiques au backend
  pickup_address: string;
  pickup_lat:     number | null;
  pickup_lng:     number | null;
  dest_address:   string;
  dest_lat:       number | null;
  dest_lng:       number | null;

  // Véhicule & pays
  vehicle_type: VehicleType;
  country:      PricingCountry;

  // Tarification
  pricing_type:    'flat_rate' | 'formula' | null;
  flat_rate_id:    string | null;
  price_estimated: number;
  price_final:     number | null;
  price_adjusted:  number | null;
  price_breakdown: Record<string, unknown>;

  // Métriques
  distance_km:  number | null;
  duration_min: number | null;

  // Planification
  scheduled_at:      string; // ISO 8601
  driver_arrived_at: string | null;
  nb_passengers:     number;
  comment:           string | null;

  promo_code_id: string | null;
  created_at:    string;
  updated_at:    string;

  // Relations hydratées (optionnelles selon l'endpoint)
  client?: {
    id:               string;
    first_name:       string;
    last_name:        string;
    phone:            string | null;
    profile_photo_url:string | null;
  };
  driver?: AvailableDriverDto | null ;
  // {
  //   id:           string;
  //   vehicle_type: VehicleType | null;
  //   user: {
  //     first_name:        string;
  //     last_name:         string;
  //     phone:             string | null;
  //     profile_photo_url: string | null;
  //   };
  // } | null;
}

// ── DTO création — aligné champ par champ avec le backend ─────────────────────
// Backend (CreateReservationDto) :
//   pickup_address, pickup_lat?, pickup_lng?
//   dest_address,   dest_lat?,   dest_lng?
//   vehicle_type, country, scheduled_at
//   nb_passengers?, comment?
//   distance_km?, duration_min?, flat_rate_id?
export interface CreateReservationDto {
  // Trajet
  pickup_address: string;
  pickup_lat?:    number;
  pickup_lng?:    number;
  dest_address:   string;
  dest_lat?:      number;
  dest_lng?:      number;

  // Véhicule & pays
  vehicle_type: VehicleType;
  country:      PricingCountry;

  // Horaire
  scheduled_at: string; // ISO 8601

  // Passagers (pas de champ luggage côté backend)
  nb_passengers?: number;
  comment?:       string;

  // Métriques estimées — transmises pour le calcul de prix côté serveur
  distance_km?:  number;
  duration_min?: number;
  flat_rate_id?: string;
}

// ── Filtres liste ─────────────────────────────────────────────────────────────
export interface ReservationListFilters {
  status?:    ReservationStatus;
  country?:   PricingCountry;
  driver_id?: string;
  client_id?: string;
  date_from?: string; // ISO
  date_to?:   string; // ISO
  page?:      number;
  limit?:     number;
}

export interface ReservationListResult {
  reservations: Reservation[];
  total:        number;
  page:         number;
  limit:        number;
  total_pages:  number;
}

// ── État du formulaire de réservation (3 étapes) ──────────────────────────────
export type BookingStep = 1 | 2 | 3;

export interface BookingFormState {
  // Étape 1
  origin:       GeoPoint | null;
  destination:  GeoPoint | null;
  vehicle_type: VehicleType | null;

  // Étape 2
  date:         string | null; // YYYY-MM-DD
  time:         string | null; // HH:mm
  nb_passengers:   number;
  luggage:      number;        // conservé en local pour l'UX, non transmis au backend

  // Étape 3 (calculé)
  estimated_price: number | null;
  distance_km:     number | null;
  duration_min:    number | null;
  comment:         string;
  flat_rate_id:    string | null;

  // Navigation
  step: BookingStep;
}

export const BOOKING_INITIAL_STATE: BookingFormState = {
  origin:          null,
  destination:     null,
  vehicle_type:    null,
  date:            null,
  time:            null,
  nb_passengers:      1,
  luggage:         0,
  estimated_price: null,
  distance_km:     null,
  duration_min:    null,
  comment:         '',
  flat_rate_id:    null,
  step:            1,
};

// types/reservations.types.ts  (ou un fichier dédié)

import type { Vehicle } from './user.types';

export interface AvailableDriverDto {
  id:           string;          // drivers.id — passé à assign()
  rating:       number | null;
  is_online:    boolean;
  status:       string;
  vehicle_type: string | null;
  zone:         string | null;
  user: {
    id:                string;
    first_name:        string;
    last_name:         string;
    phone:             string | null;
    email:             string;
    profile_photo_url: string | null;
  };
  vehicle: Pick<Vehicle, 'id' | 'model' | 'plate_number' | 'brand' | 'color' | 'type' | 'photo_url'> | null;
}