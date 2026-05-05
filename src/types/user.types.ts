// types/user.types.ts
import type { AuthUser } from './auth.types';

export type VehicleType  = 'standard' | 'berline' | 'van';
export type DriverStatus = 'pending' | 'active' | 'rejected' | 'suspended' | 'on_trip';
export type ZoneType     = 'senegal' | 'france'; 

// ── DriverProfile (réponse brute API avant mapApiUser) ──────────
export interface DriverProfile {
  id:           string;
  status:       DriverStatus;
  vehicle_type: VehicleType | null;
  siret:        string | null;
  tva_rate:     number;
  is_online:    boolean;
  zone:         ZoneType;
  created_at:   string;
  updated_at:   string;
}

// ── DriverWithUser (réponse backend /admin/drivers) ─────────────
export interface DriverWithUser {
  id: string;
  user_id: string;
  status: DriverStatus;
  vehicle_type: VehicleType | null;
  siret: string | null;
  tva_rate: number;
  is_online: boolean;
  zone: ZoneType;
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    phone: string | null;
    profile_photo_url: string | null;
    status: string;
    created_at: string;
  };
}

// ── Client ──────────────────────────────────────────────────────
export interface ClientUser extends AuthUser {
  role: 'client';
}

// ── Véhicule (aligné sur le backend Vehicle) ────────────────────
export interface Vehicle {
  id:          string;
  driver_id:   string;
  plate_number: string;
  brand:       string | null;
  model:       string | null;
  year:        number | null;
  color:       string | null;
  type:        VehicleType;
  photo_url:   string | null;
  is_active:   boolean;
  created_at:  string;
  updated_at:  string;
}


// ── Driver (aligné sur DriverWithUser backend) ──────────────────
export interface DriverUser extends AuthUser {
  role:         'driver';
  driverStatus:       DriverStatus;
  vtc_license:  string | null;
  iban:         string | null;
  siret:        string | null;
  tva_rate:     number;
  is_online:    boolean;
  zone:         ZoneType;
  vehicle_type: VehicleType | null;
  vehicle:      Vehicle | null; // véhicule actif, peut être null
}

// ── Admin / Manager ─────────────────────────────────────────────
export interface AdminUser extends AuthUser {
  role: 'admin';
}
export interface ManagerUser extends AuthUser {
  role: 'manager';
}

// ── Union discriminée ───────────────────────────────────────────
export type TypedUser = ClientUser | DriverUser | AdminUser | ManagerUser;

// ── Type guards ─────────────────────────────────────────────────
export const isClient  = (u: AuthUser): u is ClientUser  => u.role === 'client';
export const isDriver  = (u: AuthUser): u is DriverUser  => u.role === 'driver';
export const isAdmin   = (u: AuthUser): u is AdminUser   => u.role === 'admin';
export const isManager = (u: AuthUser): u is ManagerUser => u.role === 'manager';