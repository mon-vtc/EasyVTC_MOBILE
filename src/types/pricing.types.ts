// ══════════════════════════════════════════════════════════════════════════════
// TYPES — Module Tarification (Frontend)
// Sprint 3 — EasyVTC
// Aligné avec le backend pricing.types.ts
// ══════════════════════════════════════════════════════════════════════════════

// ── Géographie ───────────────────────────────────────────────────────────────
export type PricingCountry = 'france' | 'senegal';

// ── Type de tarif ─────────────────────────────────────────────────────────────
export type PricingType = 'formula' | 'flat_rate';

// ── Labels ───────────────────────────────────────────────────────────────────
export const PRICING_COUNTRY_LABELS: Record<PricingCountry, string> = {
  france:  'France',
  senegal: 'Sénégal',
};

export const PRICING_COUNTRY_CURRENCIES: Record<PricingCountry, string> = {
  france:  'EUR',
  senegal: 'XOF',
};

export const PRICING_CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: '€',
  XOF: 'F CFA',
};

// ══════════════════════════════════════════════════════════════════════════════
// ENTITÉS — miroir exact du backend
// ══════════════════════════════════════════════════════════════════════════════

// ── Grille tarifaire (formule de base) ────────────────────────────────────────
export interface PricingGrid {
  id:            string;
  country:       PricingCountry;
  base_price:    number;
  price_per_km:  number;
  price_per_min: number;
  minimum_price: number;
  currency:      string;
  is_active:     boolean;
  created_at:    string;
  updated_at:    string;
  created_by:    string;
}

// ── Forfait itinéraire ────────────────────────────────────────────────────────
// Backend : prix fixe, aucune surcharge passager (pricing_flat_rates)
export interface PricingFlatRate {
  id:                string;
  country:           PricingCountry;
  label:             string;
  origin_label:      string;
  destination_label: string;
  price:             number;
  currency:          string;
  is_active:         boolean;
  created_at:        string;
  updated_at:        string;
  created_by:        string;
}

// ── Config complète d'un pays ────────────────────────────────────────────────
export interface PricingConfig {
  country: PricingCountry;
  grid:    PricingGrid;
}

// ══════════════════════════════════════════════════════════════════════════════
// DTOs — Grilles tarifaires
// ══════════════════════════════════════════════════════════════════════════════

export interface CreatePricingGridDto {
  country:       PricingCountry;
  base_price:    number;
  price_per_km:  number;
  price_per_min: number;
  minimum_price: number;
  currency:      string;
}

export interface UpdatePricingGridDto {
  base_price?:    number;
  price_per_km?:  number;
  price_per_min?: number;
  minimum_price?: number;
  is_active?:     boolean;
}

// ── Payload sauvegarde config (un seul save côté admin) ──────────────────────
export interface SavePricingConfigDto {
  grid: UpdatePricingGridDto;
}

// ══════════════════════════════════════════════════════════════════════════════
// CALCUL DE PRIX — aligné avec pricing.validator.ts backend (priceEstimateSchema)
// ══════════════════════════════════════════════════════════════════════════════

export interface PriceEstimateDto {
  country:        PricingCountry;
  distance_km?:   number;
  duration_min?:  number;
  flat_rate_id?:  string;
  nb_passengers?: number;
  vehicle_type?:  string;
}

// ── Détail interne (stocké en BDD, JAMAIS affiché sur documents — CDC p.26) ──
export interface PriceBreakdown {
  base_price?: number;
  vehicle_type?: string;
  vehicle_base_price?: number;
  distance_km?: number;
  duration_min?: number;
  price_per_km?: number;
  price_per_min?: number;
  km_cost?: number;
  min_cost?: number;
  subtotal?: number;
  minimum_applied?: boolean;
  flat_rate_id?: string;
  flat_rate_label?: string;
  nb_passengers?: number;
  pickup_surcharge_per_person?: number;
  pickup_surcharge_total?: number;
  // Suppléments et TVA (mode formule)
  is_airport?: boolean;
  airport_supplement_amount?: number;
  is_night?: boolean;
  night_supplement_rate?: number;
  night_supplement_amount?: number;
  tva_rate?: number;
  tva_amount?: number;
  amount_ht?: number;
  amount_ttc?: number;
}

export interface PriceEstimateResult {
  pricing_type: PricingType;
  country:      PricingCountry;
  currency:     string;
  final_price:  number;
  breakdown:    PriceBreakdown;
}

// ── Filtres liste forfaits ────────────────────────────────────────────────────
export interface FlatRateListFilters {
  country?:   PricingCountry;
  is_active?: boolean;
  page?:      number;
  limit?:     number;
}

// ══════════════════════════════════════════════════════════════════════════════
// ÉTAT LOCAL — Formulaire de l'écran admin
// ══════════════════════════════════════════════════════════════════════════════

export interface PricingFormValues {
  base_price:    string;
  price_per_km:  string;
  price_per_min: string;
  minimum_price: string;
}

// Exemple de calcul affiché dynamiquement (frontend uniquement, sans appel API)
export interface PricingExample {
  distance_km:     number;
  duration_min:    number;
  km_cost:         number;
  min_cost:        number;
  subtotal_ht:     number;
  vat_20:          number;
  total_ttc:       number;
  commission_ht:   number;
  commission_vat:  number;
  commission_ttc:  number;
  net_driver:      number;
  currency_symbol: string;
}
