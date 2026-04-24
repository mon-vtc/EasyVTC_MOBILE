// ══════════════════════════════════════════════════════════════════════════════
// API — Module Tarification
// Sprint 3 — EasyVTC
// Routes réelles (pricing.routes.ts) — pas de route /config inexistante
// ══════════════════════════════════════════════════════════════════════════════

import { api }              from '../../lib/api';
import type { ApiResponse } from '../../types';
import type {
  PricingGrid,
  PricingFlatRate,
  CreatePricingGridDto,
  UpdatePricingGridDto,
  PriceEstimateDto,
  PriceEstimateResult,
  PricingCountry,
  FlatRateListFilters,
} from '../../types/pricing.types';

// ── Résultat paginé des forfaits ──────────────────────────────────────────────
interface FlatRateListResult {
  flat_rates:  PricingFlatRate[];
  total:       number;
  page:        number;
  limit:       number;
  total_pages: number;
}

export const pricingApi = {

  // ══════════════════════════════════════════════════════════════════════════
  // GRILLES TARIFAIRES
  // ══════════════════════════════════════════════════════════════════════════

  /** GET /pricing/grids/active/:country — public */
  getActiveGrid: (
    country: PricingCountry,
  ): Promise<ApiResponse<PricingGrid>> =>
    api.get(`/pricing/grids/active/${country}`),

  /** GET /pricing/grids?country=france — admin */
  getAllGrids: (
    token:    string,
    country?: PricingCountry,
  ): Promise<ApiResponse<PricingGrid[]>> => {
    const qs = country ? `?country=${country}` : '';
    return api.get(`/pricing/grids${qs}`, token);
  },

  /** POST /pricing/grids — admin (désactive l'ancienne côté backend) */
  createGrid: (
    token: string,
    dto:   CreatePricingGridDto,
  ): Promise<ApiResponse<PricingGrid>> =>
    api.post('/pricing/grids', dto, token),

  /** PATCH /pricing/grids/:id — admin */
  updateGrid: (
    token: string,
    id:    string,
    dto:   UpdatePricingGridDto,
  ): Promise<ApiResponse<PricingGrid>> =>
    api.patch(`/pricing/grids/${id}`, dto, token),

  // ══════════════════════════════════════════════════════════════════════════
  // FORFAITS ITINÉRAIRES
  // ══════════════════════════════════════════════════════════════════════════

  /** GET /pricing/flat-rates — public */
  listFlatRates: (
    token?:   string,
    country?: PricingCountry,
    filters?: Omit<FlatRateListFilters, 'country'>,
  ): Promise<ApiResponse<FlatRateListResult>> => {
    const params = new URLSearchParams();
    if (country)                          params.set('country',   country);
    if (filters?.is_active !== undefined) params.set('is_active', String(filters.is_active));
    if (filters?.page)                    params.set('page',      String(filters.page));
    if (filters?.limit)                   params.set('limit',     String(filters.limit));
    const qs = params.toString() ? `?${params.toString()}` : '';
    return api.get(`/pricing/flat-rates${qs}`, token);
  },

  /** GET /pricing/flat-rates/:id — public */
  getFlatRate: (
    id:     string,
    token?: string,
  ): Promise<ApiResponse<PricingFlatRate>> =>
    api.get(`/pricing/flat-rates/${id}`, token),

  /** POST /pricing/flat-rates — admin */
  createFlatRate: (
    token: string,
    dto:   Omit<PricingFlatRate, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'is_active'>,
  ): Promise<ApiResponse<PricingFlatRate>> =>
    api.post('/pricing/flat-rates', dto, token),

  /** PATCH /pricing/flat-rates/:id — admin */
  updateFlatRate: (
    token: string,
    id:    string,
    dto:   Partial<Pick<PricingFlatRate, 'label' | 'origin_label' | 'destination_label' | 'price' | 'is_active'>>,
  ): Promise<ApiResponse<PricingFlatRate>> =>
    api.patch(`/pricing/flat-rates/${id}`, dto, token),

  /** DELETE /pricing/flat-rates/:id — admin (suppression logique) */
  deactivateFlatRate: (
    token: string,
    id:    string,
  ): Promise<ApiResponse<void>> =>
    api.delete(`/pricing/flat-rates/${id}`, token),

  // ══════════════════════════════════════════════════════════════════════════
  // CALCUL DE PRIX
  // ══════════════════════════════════════════════════════════════════════════

  /** POST /pricing/estimate — authentifié */
  estimate: (
    token: string,
    dto:   PriceEstimateDto,
  ): Promise<ApiResponse<PriceEstimateResult>> =>
    api.post('/pricing/estimate', dto, token),
};