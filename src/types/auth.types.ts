import type { NavigatorScreenParams } from '@react-navigation/native';

// ── Rôles & Statuts ─────────────────────────────────────────────
export type UserRole   = 'client' | 'driver' | 'admin' | 'manager';
export type UserStatus = 'active' | 'inactive' | 'locked';
export type DriverStatus = 'pending' | 'active' | 'rejected' | 'suspended';

// ── Entité de base ───────────────────────────────────────────────
export interface AuthUser {
  id:                string;
  email:             string;
  role:              UserRole;
  first_name:        string;
  last_name:         string;
  phone:             string | null;
  profile_photo_url: string | null;
  device_token:      string | null;
  status:            UserStatus;
  status_reason:     string | null;
  status_changed_at: string | null;
  status_changed_by: string | null;
  rgpd_consent:      boolean;
  rgpd_consent_at:   string | null;
  deleted_at:        string | null;
  created_at:        string;
  updated_at:        string;
  // Profil chauffeur (présent dans la réponse API si role === 'driver')
  driver?:   import('./user.types').DriverProfile | null;
  vehicle?:  import('./user.types').Vehicle | null;
}

// ── Tokens ───────────────────────────────────────────────────────
export interface AuthTokens {
  access_token:  string;
  refresh_token: string;
  token_type:    'Bearer';
}

// ── Stacks de navigation ─────────────────────────────────────────
export type AuthStackParamList = {
  Login:          undefined;
  RegisterClient: undefined;
  RegisterDriver: undefined;
  ForgotPassword: undefined;
  ResetPassword:  { email?: string };
};

export type ClientTabParamList = {
  ClientHome:        undefined;
  MyReservations:    undefined;
  CreateReservation: undefined;
  Messages:          undefined;
  ClientProfile:     undefined;
};

export type DriverDrawerParamList = {
  DriverHome:         undefined;
  DriverTrips:        undefined;
  DriverDocuments:    undefined;
  DriverAvailability: undefined;
  DriverProfile:      undefined;
};

export type ManagerDrawerParamList = {
  ManagerHome:    undefined;
  ManagerReports: undefined;
  ManagerProfile: undefined;
};

// ── Stack interne Chauffeurs (dans le Drawer Admin) ──────────────
export type DriversStackParamList = {
  DriversList:  undefined;
  DriverDetail: { driverId: string };
};

// ── Drawer Admin ─────────────────────────────────────────────────
// AdminDrivers pointe vers le stack imbriqué DriversStackParamList
export type AdminDrawerParamList = {
  AdminHome:      undefined;
  AdminDrivers:   NavigatorScreenParams<DriversStackParamList>;
  AdminDocuments: undefined;
  AdminProfile:   undefined;
  AdminUsers:        undefined;
  AdminAvailability: undefined;
  AdminReviews:      undefined;
  BaseGrid:          undefined;
  FlatRates:         undefined;
};