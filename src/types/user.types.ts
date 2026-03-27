import type { AuthUser } from './auth.types';

// ── Client ──────────────────────────────────────────────────────
export interface ClientUser extends AuthUser {
  role: 'client';
}

// ── Véhicule ────────────────────────────────────────────────────
// export interface Vehicle {
//   brand:    string | null;
//   model:    string | null;
//   plate:    string | null;
//   color:    string | null;
//   category: 'Berline' | 'Van' | 'SUV' | 'Limousine' | string | null;
// }

// ── Driver ──────────────────────────────────────────────────────
export interface DriverUser extends AuthUser {
  role:        'driver';
  vtc_license: string | null;
  iban:        string | null;
  vehicle:     string | null;
}

// ── Admin ───────────────────────────────────────────────────────
export interface AdminUser extends AuthUser {
  role: 'admin';
}

// ── Manager ─────────────────────────────────────────────────────
export interface ManagerUser extends AuthUser {
  role: 'manager';
}

// ── Union discriminée ───────────────────────────────────────────
export type TypedUser =
  | ClientUser
  | DriverUser
  | AdminUser
  | ManagerUser;

// ── Type guards ─────────────────────────────────────────────────
export function isClient(user: AuthUser): user is ClientUser {
  return user.role === 'client';
}

export function isDriver(user: AuthUser): user is DriverUser {
  return user.role === 'driver';
}

export function isAdmin(user: AuthUser): user is AdminUser {
  return user.role === 'admin';
}

export function isManager(user: AuthUser): user is ManagerUser {
  return user.role === 'manager';
}