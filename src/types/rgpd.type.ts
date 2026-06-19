// ══════════════════════════════════════════════════════════════════════════════
// TYPES — Module RGPD (côté client)
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Structure de l'export des données personnelles d'un utilisateur.
 * Miroir de l'interface `RgpdExport` du backend.
 */
export interface RgpdExport {
  exported_at:    string;
  user_id:        string;
  legal_basis:    string;
  profile:        Record<string, unknown> | null;
  driver_profile: Record<string, unknown> | null;
  reservations:   unknown[];
  orders:         unknown[];
  favorites:      unknown[];
  ratings_given:  unknown[];
  notifications:  unknown[];
  chat_messages:  unknown[];
}