// ══════════════════════════════════════════════════════════════════════════════
// API — Module Tarification
// Sprint 3 — EasyVTC
// ══════════════════════════════════════════════════════════════════════════════

import { api }              from '../../lib/api';
import type { ApiResponse } from '../../types';
import type {
  PricingConfig,
  PricingGrid,
  PricingFlatRate,
  SavePricingConfigDto,
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
  // CONFIG COMPLÈTE (grille + commission + supplement)
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * GET /pricing/config/:country
   * Récupère la config tarifaire complète d'un pays (admin).
   * Agrège grille active + commission active + supplement actif.
   */
  getConfig: (
    token:   string,
    country: PricingCountry,
  ): Promise<ApiResponse<PricingConfig>> =>
    api.get(`/pricing/config/${country}`, token),

  /**
   * PATCH /pricing/config/:country
   * Sauvegarde en une requête : grille + commission + supplement.
   * Crée une nouvelle grille si nécessaire (désactive l'ancienne).
   */
  saveConfig: (
    token:   string,
    country: PricingCountry,
    dto:     SavePricingConfigDto,
  ): Promise<ApiResponse<PricingConfig>> =>
    api.patch(`/pricing/config/${country}`, dto, token),

  // ══════════════════════════════════════════════════════════════════════════
  // GRILLES TARIFAIRES
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * GET /pricing/grids/active/:country
   * Grille active d'un pays — accessible sans auth (affichage public).
   */
  getActiveGrid: (
    country: PricingCountry,
  ): Promise<ApiResponse<PricingGrid>> =>
    api.get(`/pricing/grids/active/${country}`),

  /**
   * GET /pricing/grids?country=france
   * Toutes les grilles avec historique (admin).
   */
  getAllGrids: (
    token:    string,
    country?: PricingCountry,
  ): Promise<ApiResponse<PricingGrid[]>> => {
    const qs = country ? `?country=${country}` : '';
    return api.get(`/pricing/grids${qs}`, token);
  },

  // ══════════════════════════════════════════════════════════════════════════
  // FORFAITS ITINÉRAIRES
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * GET /pricing/flat-rates?country=france&is_active=true&page=1&limit=20
   * Liste des forfaits — token optionnel (lecture publique sans auth).
   */
  listFlatRates: (
    token?:   string,
    country?: PricingCountry,
    filters?: Omit<FlatRateListFilters, 'country'>,
  ): Promise<ApiResponse<FlatRateListResult>> => {
    const params = new URLSearchParams();
    if (country)                         params.set('country',   country);
    if (filters?.is_active !== undefined) params.set('is_active', String(filters.is_active));
    if (filters?.page)                   params.set('page',       String(filters.page));
    if (filters?.limit)                  params.set('limit',      String(filters.limit));
    const qs = params.toString() ? `?${params.toString()}` : '';
    return api.get(`/pricing/flat-rates${qs}`, token);
  },

  /**
   * GET /pricing/flat-rates/:id
   * Token optionnel (lecture publique).
   */
  getFlatRate: (
    id:     string,
    token?: string,
  ): Promise<ApiResponse<PricingFlatRate>> =>
    api.get(`/pricing/flat-rates/${id}`, token),

  /**
   * POST /pricing/flat-rates  (admin)
   */
  createFlatRate: (
    token: string,
    dto:   Omit<PricingFlatRate, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'is_active'>,
  ): Promise<ApiResponse<PricingFlatRate>> =>
    api.post('/pricing/flat-rates', dto, token),

  /**
   * PATCH /pricing/flat-rates/:id  (admin)
   */
  updateFlatRate: (
    token: string,
    id:    string,
    dto:   Partial<Pick<PricingFlatRate, 'label' | 'origin_label' | 'destination_label' | 'price' | 'is_active'>>,
  ): Promise<ApiResponse<PricingFlatRate>> =>
    api.patch(`/pricing/flat-rates/${id}`, dto, token),

  /**
   * DELETE /pricing/flat-rates/:id  (admin)
   * Suppression logique côté backend (is_active = false).
   */
  deactivateFlatRate: (
    token: string,
    id:    string,
  ): Promise<ApiResponse<void>> =>
    api.delete(`/pricing/flat-rates/${id}`, token),

  // ══════════════════════════════════════════════════════════════════════════
  // CALCUL DE PRIX
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * POST /pricing/estimate  (authentifié)
   * Calcule le prix d'une course — formule ou forfait.
   * breakdown retourné en BDD uniquement, jamais affiché sur PDFs (CDC p.26).
   */
  estimate: (
    token: string,
    dto:   PriceEstimateDto,
  ): Promise<ApiResponse<PriceEstimateResult>> =>
    api.post('/pricing/estimate', dto, token),
};