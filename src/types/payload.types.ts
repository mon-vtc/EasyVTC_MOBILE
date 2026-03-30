// types/payload.types.ts
import type { VehicleType, ZoneType } from './user.types';

export interface LoginPayload {
  email:    string;
  password: string;
}

export interface RegisterClientPayload {
  email: string; password: string; first_name: string;
  last_name: string; phone: string; role: 'client';
  accept_terms: boolean; rgpd_consent: boolean;
}

export interface RegisterDriverPayload {
  email: string; password: string; first_name: string;
  last_name: string; phone: string; role: 'driver';
  accept_terms: boolean; rgpd_consent: boolean;
}

export type RegisterPayload = RegisterClientPayload | RegisterDriverPayload;

export interface ChangePasswordPayload {
  current_password: string;
  new_password:     string;
  confirm_password: string;
}

// ── Champs communs (PATCH /users/me) ───────────────────────────
interface BaseUpdateProfilePayload {
  first_name?:  string;
  last_name?:   string;
  phone?:       string;

}

// ── Client ──────────────────────────────────────────────────────
export interface UpdateClientProfilePayload extends BaseUpdateProfilePayload {}

// ── Driver : 2 appels séparés ───────────────────────────────────

/** Partie 1 — PATCH /users/me */
export interface UpdateUserMePayload extends BaseUpdateProfilePayload {}

/** Partie 2 — PATCH /drivers/me (aligné sur UpdateDriverDto backend) */
export interface UpdateDriverMePayload {
  iban?:        string;   // stocké côté user
  vtc_license?: string;   // stocké côté user
  siret?:        string;
  zone?:         ZoneType;
  vehicle_type?: VehicleType;
}

/** Union utilisée dans le store générique */
export type UpdateProfilePayload =
  | UpdateClientProfilePayload
  | UpdateUserMePayload
  | UpdateDriverMePayload;

export interface UpdateUserStatusPayload {
  status: 'active' | 'inactive' | 'locked';
  reason: string;
}