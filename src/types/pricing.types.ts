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
  base_price:    number;   // Prix de prise en charge
  price_per_km:  number;   // Prix par kilomètre
  price_per_min: number;   // Prix par minute
  minimum_price: number;   // Prix minimum garanti
  currency:      string;   // 'EUR' ou 'XOF'
  is_active:     boolean;
  created_at:    string;
  updated_at:    string;
  created_by:    string;
}

// ── Commissions EasyVTC ───────────────────────────────────────────────────────
// Base de calcul : sur le montant HT de la course
export interface PricingCommission {
  id:                  string;
  country:             PricingCountry;
  commission_rate:     number;   // % prélevé sur le HT (ex: 15)
  commission_vat_rate: number;   // TVA sur la commission (ex: 20)
  currency:            string;
  is_active:           boolean;
  created_at:          string;
  updated_at:          string;
  created_by:          string;
}

// ── Suppléments ───────────────────────────────────────────────────────────────
export interface PricingSupplement {
  id:             string;
  country:        PricingCountry;
  airport_fee:    number;   // Supplément aéroport (montant fixe)
  night_rate:     number;   // Supplément nocturne 19h–7h (%)
  currency:       string;
  is_active:      boolean;
  created_at:     string;
  updated_at:     string;
  created_by:     string;
}

// ── Forfait itinéraire ────────────────────────────────────────────────────────
export interface PricingFlatRate {
  id:                  string;
  country:             PricingCountry;
  label:               string;
  origin_label:        string;
  destination_label:   string;
  price:               number;
  currency:            string;
  is_active:           boolean;
  created_at:          string;
  updated_at:          string;
  created_by:          string;
}

// ── Config complète d'un pays (agrégat renvoyé par GET /pricing/config/:country) ──
export interface PricingConfig {
  country:     PricingCountry;
  grid:        PricingGrid;
  // commission:  PricingCommission;
  // supplement:  PricingSupplement;
}

// ══════════════════════════════════════════════════════════════════════════════
// DTOs — Mise à jour (PATCH)
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

export interface CreatePricingCommissionDto {
  country:             PricingCountry;
  currency:            string;
  // commission_rate:     number;
  // commission_vat_rate: number;
}

export interface UpdatePricingCommissionDto {
  // commission_rate?:     number;
  // commission_vat_rate?: number;
  is_active?:           boolean;
}

export interface CreatePricingSupplementDto {
  country:      PricingCountry;
  currency:     string;
  airport_fee:  number;
  night_rate:   number;
}

export interface UpdatePricingSupplementDto {
  airport_fee?: number;
  night_rate?:  number;
  is_active?:   boolean;
}

// ── Payload global pour l'écran admin (un seul save) ─────────────────────────
export interface SavePricingConfigDto {
  grid:        UpdatePricingGridDto;
  // commission:  UpdatePricingCommissionDto;
  // supplement:  UpdatePricingSupplementDto;
}

// ══════════════════════════════════════════════════════════════════════════════
// CALCUL DE PRIX
// ══════════════════════════════════════════════════════════════════════════════

export interface PriceEstimateDto {
  country:       PricingCountry;
  distance_km?:  number;
  duration_min?: number;
  flat_rate_id?: string;
  is_airport?:   boolean;
  is_night?:     boolean;
}

export interface PriceBreakdown {
  base_price?:         number;
  distance_km?:        number;
  duration_min?:       number;
  price_per_km?:       number;
  price_per_min?:      number;
  km_cost?:            number;
  min_cost?:           number;
  subtotal?:           number;
  minimum_applied?:    boolean;
  airport_fee?:        number;
  night_supplement?:   number;
  flat_rate_id?:       string;
  flat_rate_label?:    string;
}

export interface PriceEstimateResult {
  pricing_type:  PricingType;
  country:       PricingCountry;
  currency:      string;
  final_price:   number;
  breakdown:     PriceBreakdown;
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

// Formulaire éditable (valeurs string pour les inputs React Native)
export interface PricingFormValues {
  base_price:          string;
  price_per_km:        string;
  price_per_min:       string;
  minimum_price:       string;
  // commission_rate:     string;
  // commission_vat_rate: string;
  // airport_fee:         string;
  // night_rate:          string;
}

// Exemple de calcul affiché dynamiquement
export interface PricingExample {
  distance_km:          number;   // 15 km (fixe)
  duration_min:         number;   // 25 min (fixe)
  km_cost:              number;
  min_cost:             number;
  subtotal_ht:          number;
  vat_20:               number;   // TVA 20% sur le HT
  total_ttc:            number;
  commission_ht:        number;   // 15% du HT
  commission_vat:       number;   // TVA 20% sur la commission
  commission_ttc:       number;
  net_driver:           number;   // TTC – commission TTC
  currency_symbol:      string;
}