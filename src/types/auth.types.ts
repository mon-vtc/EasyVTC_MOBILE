export type UserRole = 'client' | 'driver' | 'admin' | 'manager';

export interface AuthUser {
  id:         string;
  email:      string;
  role:       UserRole;
  first_name: string;
  last_name:  string;
  phone:      string;
  deleted_at: string | null;
  created_at: string;
}

export interface AuthTokens {
  access_token:  string;
  refresh_token: string;
  token_type:    'Bearer';
}

export interface AuthResponse extends AuthTokens {
  user: AuthUser;
}

export interface RegisterClientPayload {
  email:        string;
  password:     string;
  first_name:   string;
  last_name:    string;
  phone:        string;
  role:         'client';
  accept_terms: boolean;
  rgpd_consent: boolean;
}

export interface RegisterDriverPayload {
  email:        string;
  password:     string;
  first_name:   string;
  last_name:    string;
  phone:        string;
  role:         'driver';
  accept_terms: boolean;
  rgpd_consent: boolean;
}

export type RegisterPayload = RegisterClientPayload | RegisterDriverPayload;

export interface LoginPayload {
  email:    string;
  password: string;
}

export interface ApiResponse<T = unknown> {
  ok:      boolean;
  message?: string;
  data?:   T;
  errors?: Record<string, string[]>;
}

// Navigation param lists
export type AuthStackParamList = {
  Login:           undefined;
  RegisterClient:  undefined;
  RegisterDriver:  undefined;
  ForgotPassword:  undefined;
};

// export type ClientDrawerParamList = {
//   ClientHome:          undefined;
//   MyReservations:      undefined;
//   CreateReservation:   undefined;
//   ReservationDetails:  { reservationId: string };
//   ClientProfile:       undefined;
// };

export type ClientTabParamList = {
  ClientHome:          undefined;
  MyReservations:      undefined;
  CreateReservation:   undefined;
  Messages:            undefined;
  ClientProfile:       undefined;
};

export type DriverDrawerParamList = {
  DriverHome:         undefined;
  DriverTrips:        undefined;
  DriverDocuments:    undefined;
  DriverAvailability: undefined;
  DriverProfile:      undefined;
};