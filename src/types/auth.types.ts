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
  // Permissions RBAC — tableau vide pour tous les rôles sauf manager
  permissions?: import('./admin.types').ManagerPermission[];
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
  CreateReservationTab: undefined; // FAB tab button, redirige vers le stack racine
  Messages:            undefined;
  ClientProfile:       undefined;
  Notifications:        undefined;
  NotificationDetails:  { notification: Notification };
  MyOrders:             undefined;
  MyInvoices:           { reservationId?: string } | undefined;
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
  CreateReservation:    undefined;
  BookingConfirmation:  { reservationId: string };
  ReservationDetails:   { reservationId: string };
  OrderDetails:         { orderId: string };
  InvoiceDetails:       { invoiceId: string };
  MyOrders:             undefined; // Note: Peut-être à déplacer dans les onglets aussi
  MyInvoices:           { reservationId?: string } | undefined; // Note: Peut-être à déplacer dans les onglets aussi
  SupportList:          undefined;
  SupportChat:          { ticketId: string; subject: string };
  ChatScreen:           { reservationId?: string };
};

export type DriverReservationsStackParamList = {
  DriverReservationsList:  undefined;
  DriverReservationDetails: { reservationId: string };
  ChatScreen:    { reservationId?: string };
  DriverInvoiceDetails: { invoiceId: string };
  SupportList: undefined;
  SupportChat: { ticketId: string, subject: string };
};

export type DriverTripsStackParamList = {
  DriverTripsList:  undefined;
  DriverReservationDetails: { reservationId: string };
};

export type DriverNotificationsStackParamList = {
  NotificationsList: undefined; 
  NotificationDetails: { notification: Notification };
}

export type DriverOrdersStackParamList = {
  DriverOrdersList:   undefined;
  DriverOrderDetails: { orderId: string };
};

export type DriverInvoicesStackParamList = {
  DriverInvoicesList:   undefined;
  DriverInvoiceDetails: { invoiceId: string };
  ChatScreen:           { reservationId?: string };
  supportList: undefined;
  supportChat: { ticketId: string, subject: string };
};

export type DriverMessagesStackParamList = {
  DriverMessagesList:   undefined;
  ChatScreen:    { reservationId?: string };
}

export type SupportStackParamList = {
  SupportList: undefined,
  SupportChat: { ticketId: string, subject: string }
}

export type DriverDrawerParamList = {
  DriverHome:         undefined;
  DriverReservationDetails: { reservationId: string };
  DriverReservations: NavigatorScreenParams<DriverReservationsStackParamList>;
  DriverTrips:        undefined;
  DriverDocuments:    undefined;
  DriverAvailability: undefined;
  DriverProfile:      undefined;
  DriverNotifications: NavigatorScreenParams<DriverNotificationsStackParamList>;
  DriverSupport:      NavigatorScreenParams<SupportStackParamList>;
  DriverMessages:     NavigatorScreenParams<DriverMessagesStackParamList>;
  DriverOrders:       NavigatorScreenParams<DriverOrdersStackParamList>;
  DriverInvoices:     NavigatorScreenParams<DriverInvoicesStackParamList>;
  DriverReviews:      undefined;
  DriverRevenues:     undefined;
};


export type ManagerReservationsStackParamList = {
  ManagerReservationsList: undefined;
  ManagerReservationDetail: { reservationId: string; };
};

export type ManagerNotificationsStackParamList = {
  ManagerNotificationList: undefined;
  NotificationDetails: { notification: Notification };
}

export type ManagerDriversStackParamList = {
  DriversList: undefined;
  DriverDetail: { driverId: string };
};

export type ManagerClientsStackParamList = {
  ClientsList: undefined;
  ClientDetail: { clientId: string };
};

export type ManagerOrdersStackParamList = {
  ManagerOrdersList: undefined;
  OrderDetails: { orderId: string };
};

export type ManagerInvoicesStackParamList = {
  ManagerInvoicesList: undefined;
  InvoiceDetails: { invoiceId: string };
};

export type ManagerDrawerParamList = {
  ManagerHome:         undefined;  
  ManagerReservations: NavigatorScreenParams<ManagerReservationsStackParamList>;
  ManagerDrivers:      NavigatorScreenParams<ManagerDriversStackParamList>;
  ManagerClients:      NavigatorScreenParams<ManagerClientsStackParamList>;
  ManagerOrders:       NavigatorScreenParams<ManagerOrdersStackParamList>;
  ManagerInvoices:     NavigatorScreenParams<ManagerInvoicesStackParamList>;
  ManagerDocuments:    undefined;
  ManagerProfile:      undefined;
  // Tarification (sous-écrans accessibles via accordion drawer)
  BaseGrid:            undefined;
  FlatRates:           undefined;
  ManagerNotifications: NavigatorScreenParams<ManagerNotificationsStackParamList>;
};


// ── Stack interne Clients (dans le Drawer Admin) ─────────────────
export type ClientsStackParamList = {
  ClientsList:  undefined;
  ClientDetail: { clientId: string };
};

// ── Stack interne Chauffeurs (dans le Drawer Admin) ──────────────
export type DriversStackParamList = {
  DriversList:  undefined;
  DriverDetail: { driverId: string };
};

// ── Stack interne Gestionnaires (dans le Drawer Admin) ───────────
export type ManagersStackParamList = {
  ManagersList:        undefined;
  CreateManager:       undefined;
  ManagerDetail:       { managerId: string };
  EditManager:         { managerId: string };
  ManagerPermissions:  { managerId: string };
};

// ── Stack interne Réservations (dans le Drawer Admin) ────────────
export type ReservationsStackParamList = {
  ReservationsList:     undefined;
  AdminReservationDetail: { reservationId: string };
};

// ── Stack interne Discussions (dans le Drawer Admin) ───────────
export type DiscussionStackParamList = {
  AdminDiscussionList: undefined;
  AdminChatScreen:     { reservationId: string; conversation?: import('./chats.type').ActiveConversation };
};

export type AdminInvoicesStackParamList = {
    AdminInvoicesList:   undefined;
    InvoiceDetails:      { invoiceId: string };
}

export type AdminOrderStackParamList = {
    AdminOrdersList:     undefined;
    OrderDetails:        { orderId: string };
}

export type AdminNotificationsStackParamList = {
    AdminNotificationList: undefined;
    NotificationDetails: { notification: Notification };
}

// ── Drawer Admin ─────────────────────────────────────────────────
// AdminDrivers pointe vers le stack imbriqué DriversStackParamList
export type AdminDrawerParamList = {
  AdminHome:      undefined;
  AdminDrivers:   NavigatorScreenParams<DriversStackParamList>;
  AdminReservations: NavigatorScreenParams<ReservationsStackParamList>;
  AdminDocuments: undefined;
  AdminPromoCommunication: undefined;
  AdminManagers:  NavigatorScreenParams<ManagersStackParamList>;
  AdminProfile:   undefined;
  AdminClients:      NavigatorScreenParams<ClientsStackParamList>;
  AdminAvailability: undefined;
  AdminReviews:      undefined;
  BaseGrid:          undefined;
  FlatRates:         undefined;
  AdminCommissionSettings: undefined;
  AdminVehicleTypes: undefined;
  Notifications:     NavigatorScreenParams<AdminNotificationsStackParamList>;
  AdminDiscussions:  NavigatorScreenParams<DiscussionStackParamList>;
  // S4 — Documents financiers
  AdminOrders:       NavigatorScreenParams<AdminOrderStackParamList>;
  AdminInvoices:     NavigatorScreenParams<AdminInvoicesStackParamList>;
  AdminSupport:      NavigatorScreenParams<SupportStackParamList>;
};