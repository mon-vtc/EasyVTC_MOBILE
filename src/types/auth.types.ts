import type { NavigatorScreenParams } from '@react-navigation/native';

// ── Rôles & Statuts ─────────────────────────────────────────────
export type UserRole   = 'client' | 'driver' | 'admin' | 'manager';
export type UserStatus = 'active' | 'inactive' | 'locked' ;
export type DriverStatus = 'pending' | 'active' | 'rejected' | 'suspended' | 'on_trip';

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
  ClientHome:          undefined;
  MyReservations:      undefined;
  CreateReservation:   undefined;
  Messages:            undefined;
  ClientProfile:       undefined;
  // Écrans hors tab bar — navigables via navigation.navigate()
  BookingConfirmation: { reservationId: string };
  ReservationDetails:  { reservationId: string };
  // S4 — Documents financiers
  MyOrders:            undefined;
  MyInvoices:          { reservationId?: string } | undefined;
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
  BookingConfirmation: { reservationId: string };
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
  // S4 — Documents financiers
  DriverOrders:       undefined;
  DriverInvoices:     undefined;
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

// ── Stack interne Gestionnaires (dans le Drawer Admin) ───────────
export type ManagersStackParamList = {
  ManagersList:  undefined;
  CreateManager: undefined;
  ManagerDetail: { managerId: string };
  EditManager:   { managerId: string };
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
  AdminManagers:  NavigatorScreenParams<ManagersStackParamList>;
  AdminProfile:   undefined;
  AdminUsers:        undefined;
  AdminAvailability: undefined;
  AdminReviews:      undefined;
  BaseGrid:          undefined;
  FlatRates:         undefined;
  // S4 — Documents financiers
  AdminOrders:       undefined;
  AdminInvoices:     undefined;
};