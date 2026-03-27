// ── Auth ────────────────────────────────────────────────────────
export interface LoginPayload {
  email:    string;
  password: string;
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

export interface ChangePasswordPayload {
  current_password: string;
  new_password:     string;
  confirm_password: string;
}

// ── Update Profile — champs communs ────────────────────────────
interface BaseUpdateProfilePayload {
  first_name?: string;
  last_name?:  string;
  phone?:      string;
}

// ── Update Profile — client ─────────────────────────────────────
export interface UpdateClientProfilePayload extends BaseUpdateProfilePayload {}

// ── Update Profile — driver (champs supplémentaires) ───────────
export interface UpdateDriverProfilePayload extends BaseUpdateProfilePayload {
  iban?:          string;
  vtc_license?: string;
  vehicle_type?: string;
  // vehicle_color?: string;
  // vehicle_brand?: string;
}

// ── Update Profile — admin/manager ─────────────────────────────
export interface UpdateAdminProfilePayload extends BaseUpdateProfilePayload {}
export interface UpdateManagerProfilePayload extends BaseUpdateProfilePayload {}

// Union pour le store générique
export type UpdateProfilePayload =
  | UpdateClientProfilePayload
  | UpdateDriverProfilePayload
  | UpdateAdminProfilePayload;

// ── Admin — gestion statut ──────────────────────────────────────
export interface UpdateUserStatusPayload {
  status: 'active' | 'inactive' | 'locked';
  reason: string; // min 10 caractères
}