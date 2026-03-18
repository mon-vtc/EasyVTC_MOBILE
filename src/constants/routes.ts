// ── Auth Stack ────────────────────────────────────────────────────────────────
export const AUTH_ROUTES = {
  LOGIN:            'Login',
  REGISTER_CLIENT:  'RegisterClient',
  REGISTER_DRIVER:  'RegisterDriver',
  FORGOT_PASSWORD:  'ForgotPassword',
} as const;

// ── Client Drawer ─────────────────────────────────────────────────────────────
export const CLIENT_ROUTES = {
  HOME:                'ClientHome',
  MY_RESERVATIONS:     'MyReservations',
  CREATE_RESERVATION:  'CreateReservation',
  RESERVATION_DETAILS: 'ReservationDetails',
  PROFILE:             'ClientProfile',
} as const;

// ── Driver Drawer ─────────────────────────────────────────────────────────────
export const DRIVER_ROUTES = {
  HOME:         'DriverHome',
  TRIPS:        'DriverTrips',
  DOCUMENTS:    'DriverDocuments',
  AVAILABILITY: 'DriverAvailability',
  PROFILE:      'DriverProfile',
} as const;

// ── Shared ────────────────────────────────────────────────────────────────────
export const SHARED_ROUTES = {
  SPLASH:    'Splash',
  LOADING:   'Loading',
  NOT_FOUND: 'NotFound',
} as const;