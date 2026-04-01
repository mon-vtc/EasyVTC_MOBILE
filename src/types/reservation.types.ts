// ══════════════════════════════════════════════════════════════════════════════
// TYPES — Module Réservations (Frontend)
// Sprint 3 — EasyVTC
// ══════════════════════════════════════════════════════════════════════════════

import type { PricingCountry } from './pricing.types';

// ── Statuts ───────────────────────────────────────────────────────────────────
export type ReservationStatus =
  | 'pending'       // En attente d'assignation
  | 'assigned'      // Chauffeur assigné
  | 'driver_arrived'// Chauffeur arrivé
  | 'in_progress'   // Course en cours
  | 'completed'     // Terminée
  | 'cancelled';    // Annulée

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

// ── Types de véhicule (dynamiques depuis l'API) ───────────────────────────────
export type VehicleType = 'berline' | 'van' | 'premium' | string;

export interface VehicleTypeOption {
  type:         VehicleType;
  label:        string;
  description:  string;       // ex: "1-3 passagers"
  base_price:   number;
  icon:         string;       // nom Ionicons
  capacity:     number;
}

// ── Coordonnées géographiques ─────────────────────────────────────────────────
export interface GeoPoint {
  latitude:  number;
  longitude: number;
  address:   string;          // Adresse lisible (geocodée)
}

// ── Entité Réservation ────────────────────────────────────────────────────────
export interface Reservation {
  id:               string;
  ref_number:       string;   // ex: BC-2025-00145
  status:           ReservationStatus;
  country:          PricingCountry;

  // Trajet
  origin_address:   string;
  origin_lat:       number;
  origin_lng:       number;
  destination_address: string;
  destination_lat:  number;
  destination_lng:  number;
  distance_km:      number;
  duration_min:     number;

  // Horaire
  scheduled_at:     string;   // ISO 8601

  // Passagers & bagages
  passengers:       number;
  luggage:          number;

  // Véhicule
  vehicle_type:     VehicleType;

  // Prix
  estimated_price:  number;
  final_price:      number | null;
  currency:         string;
  flat_rate_id:     string | null;

  // Commentaire client
  comment:          string | null;

  // Relations
  client_id:        string;
  driver_id:        string | null;
  assigned_by:      string | null;

  // Timestamps
  created_at:       string;
  updated_at:       string;
  completed_at:     string | null;
  cancelled_at:     string | null;
  cancellation_reason: string | null;

  // Relations hydratées (optionnelles selon l'endpoint)
  client?: {
    id:         string;
    first_name: string;
    last_name:  string;
    email:      string;
    phone:      string | null;
    avatar_url: string | null;
  };
  driver?: {
    id:           string;
    first_name:   string;
    last_name:    string;
    phone:        string | null;
    avatar_url:   string | null;
    vehicle_type: VehicleType;
    vehicle?: {
      brand: string;
      model: string;
      color: string;
      plate: string;
    };
  } | null;
}

// ── DTO création ──────────────────────────────────────────────────────────────
export interface CreateReservationDto {
  country:             PricingCountry;

  origin_address:      string;
  origin_lat:          number;
  origin_lng:          number;
  destination_address: string;
  destination_lat:     number;
  destination_lng:     number;

  scheduled_at:        string;   // ISO 8601
  passengers:          number;
  luggage:             number;
  vehicle_type:        VehicleType;
  flat_rate_id?:       string;
  comment?:            string;
}

// ── Filtres liste ─────────────────────────────────────────────────────────────
export interface ReservationListFilters {
  status?:    ReservationStatus;
  page?:      number;
  limit?:     number;
  from?:      string;          // date ISO
  to?:        string;
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
  date:         string | null;   // YYYY-MM-DD
  time:         string | null;   // HH:mm
  passengers:   number;
  luggage:      number;

  // Étape 3 (calculé)
  estimated_price: number | null;
  distance_km:     number | null;
  duration_min:    number | null;
  comment:         string;

  // Navigation
  step: BookingStep;
}

export const BOOKING_INITIAL_STATE: BookingFormState = {
  origin:          null,
  destination:     null,
  vehicle_type:    null,
  date:            null,
  time:            null,
  passengers:      1,
  luggage:         0,
  estimated_price: null,
  distance_km:     null,
  duration_min:    null,
  comment:         '',
  step:            1,
};