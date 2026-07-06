// ══════════════════════════════════════════════════════════════════════════════
// TYPES — Module Destinations Favorites
// Sprint 6 — EasyVTC
// ══════════════════════════════════════════════════════════════════════════════

export type FavoriteAddressType = 'home' | 'office' | 'airport' | 'station' | 'custom';

export interface FavoriteAddress {
  id: string;
  user_id: string;
  label: string;
  address: string;
  lat?: number | null;
  lng?: number | null;
  created_at: string;
  updated_at: string;
}
