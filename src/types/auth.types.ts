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
  phone:             string;
  profile_photo_url: string | null;
  status:            UserStatus;
  status_reason:     string | null;
  status_changed_at: string | null;
  status_changed_by: string | null;
  rgpd_consent:      boolean;
  rgpd_consent_at:   string | null;
  deleted_at:        string | null;
  created_at:        string;
  updated_at:        string;
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
};

export type ClientTabParamList = {
  ClientHome:        undefined;
  MyReservations:    undefined;
  CreateReservation: undefined;
  Messages:          undefined;
  ClientProfile:     undefined;
};

/**
 * Stack racine du client — enveloppe les tabs et expose les écrans
 * qui ne font pas partie de la barre de navigation :
 *   - Booking         : formulaire 3 étapes (BookingScreen)
 *   - BookingConfirmation : page de succès après submitBooking()
 *   - ReservationDetail   : détail / bon de commande d'une réservation
 *
 * ClientTabs est le point d'entrée (onglets) ; tous les push/replace
 * depuis les sous-écrans atterrissent dans ce stack.
 */
export type ClientStackParamList = {
  ClientTabs:           NavigatorScreenParams<ClientTabParamList>;
  CreateReservation:              undefined;
  ReservationDetails:  { reservationId: string };
};

export type DriverReservationsStackParamList = {
  DriverReservationsList:  undefined;
  DriverReservationDetail: { reservationId: string };
};

export type DriverDrawerParamList = {
  DriverHome:         undefined;
  DriverReservations: NavigatorScreenParams<DriverReservationsStackParamList>;
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

// ── Stack interne Réservations (dans le Drawer Admin) ────────────
export type ReservationsStackParamList = {
  ReservationsList:     undefined;
  AdminReservationDetail: { reservationId: string };
};

// ── Drawer Admin ─────────────────────────────────────────────────
// AdminDrivers pointe vers le stack imbriqué DriversStackParamList
export type AdminDrawerParamList = {
  AdminHome:      undefined;
  AdminDrivers:   NavigatorScreenParams<DriversStackParamList>;
  AdminReservations: NavigatorScreenParams<ReservationsStackParamList>;
  AdminDocuments: undefined;
  AdminProfile:   undefined;
  AdminUsers:        undefined;
  AdminAvailability: undefined;
  AdminReviews:      undefined;
  BaseGrid:          undefined;
  FlatRates:         undefined;
};