// ══════════════════════════════════════════════════════════════════════════════
// STORE — Tarification (Zustand)
// Sprint 3 — EasyVTC
// fetchConfig : GET /pricing/grids/active/:country
// saveConfig  : POST (création) ou PATCH /pricing/grids/:id (mise à jour)
// ══════════════════════════════════════════════════════════════════════════════

import { create }      from 'zustand';
import { pricingApi }  from '../services/api/pricing.api';
import type {
  PricingConfig,
  PricingCountry,
  PricingFlatRate,
  SavePricingConfigDto,
} from '../types/pricing.types';

interface PricingState {
  config:         PricingConfig | null;
  activeCountry:  PricingCountry;
  isLoading:      boolean;
  isSaving:       boolean;
  error:          string | null;
  flatRates:      PricingFlatRate[];
  flatRatesTotal: number;

  setCountry:         (country: PricingCountry)                                                                                    => void;
  fetchConfig:        (token: string, country: PricingCountry)                                                                     => Promise<void>;
  saveConfig:         (token: string, country: PricingCountry, dto: SavePricingConfigDto)                                          => Promise<void>;
  fetchFlatRates:     (token: string, country?: PricingCountry)                                                                    => Promise<void>;
  createFlatRate:     (token: string, dto: Omit<PricingFlatRate, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'is_active'>) => Promise<void>;
  updateFlatRate:     (token: string, id: string, dto: Partial<PricingFlatRate>)                                                   => Promise<void>;
  deactivateFlatRate: (token: string, id: string)                                                                                  => Promise<void>;
  clearError:         ()                                                                                                           => void;
}

export const usePricingStore = create<PricingState>((set, get) => ({
  config:         null,
  activeCountry:  'france',
  isLoading:      false,
  isSaving:       false,
  error:          null,
  flatRates:      [],
  flatRatesTotal: 0,

  setCountry: (country) => set({ activeCountry: country, config: null }),

  // ── Chargement — silencieux si aucune config (première visite → formulaire vierge) ──
  fetchConfig: async (token, country) => {
    set({ isLoading: true, error: null });
    try {
      const gridRes = await pricingApi.getActiveGrid(country);

      if (!gridRes.ok) {
        set({ config: null, isLoading: false });
        return;
      }

      if (!gridRes.data) throw new Error(gridRes.message ?? 'Grille introuvable');

      set({
        config: { country, grid: gridRes.data },
        isLoading: false,
      });
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Erreur inconnue', isLoading: false });
      throw err;
    }
  },

  // ── Sauvegarde : POST si première config, PATCH si mise à jour ────────────
  saveConfig: async (token, country, dto) => {
    set({ isSaving: true, error: null });
    try {
      const { config } = get();
      const currency = country === 'france' ? 'EUR' : 'XOF';

      let gridRes;

      if (!config) {
        gridRes = await pricingApi.createGrid(token, {
          country,
          currency,
          base_price:    dto.grid.base_price    ?? 0,
          price_per_km:  dto.grid.price_per_km  ?? 0,
          price_per_min: dto.grid.price_per_min ?? 0,
          minimum_price: dto.grid.minimum_price ?? 0,
        });
      } else {
        gridRes = await pricingApi.updateGrid(token, config.grid.id, dto.grid);
      }

      if (!gridRes.ok || !gridRes.data) throw new Error(gridRes.message ?? 'Erreur grille');

      set({
        config: { country, grid: gridRes.data },
        isSaving: false,
      });
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Erreur inconnue', isSaving: false });
      throw err;
    }
  },

  // ── Forfaits ──────────────────────────────────────────────────────────────
  fetchFlatRates: async (token, country) => {
    set({ isLoading: true, error: null });
    try {
      const res = await pricingApi.listFlatRates(token, country);
      if (!res.ok || !res.data) throw new Error(res.message ?? 'Erreur de chargement');
      set({ flatRates: res.data.flat_rates ?? [], flatRatesTotal: res.data.total ?? 0, isLoading: false });
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Erreur inconnue', isLoading: false });
      throw err;
    }
  },

  createFlatRate: async (token, dto) => {
    set({ isSaving: true, error: null });
    try {
      const res = await pricingApi.createFlatRate(token, dto);
      if (!res.ok || !res.data) throw new Error(res.message ?? 'Erreur de création');
      set(state => ({ flatRates: [...state.flatRates, res.data!], isSaving: false }));
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Erreur inconnue', isSaving: false });
      throw err;
    }
  },

  updateFlatRate: async (token, id, dto) => {
    set({ isSaving: true, error: null });
    try {
      const res = await pricingApi.updateFlatRate(token, id, dto);
      if (!res.ok || !res.data) throw new Error(res.message ?? 'Erreur de mise à jour');
      set(state => ({ flatRates: state.flatRates.map(f => f.id === id ? res.data! : f), isSaving: false }));
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Erreur inconnue', isSaving: false });
      throw err;
    }
  },

  deactivateFlatRate: async (token, id) => {
    set({ isSaving: true, error: null });
    try {
      const res = await pricingApi.deactivateFlatRate(token, id);
      if (!res.ok) throw new Error(res.message ?? 'Erreur de désactivation');
      set(state => ({ flatRates: state.flatRates.filter(f => f.id !== id), isSaving: false }));
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Erreur inconnue', isSaving: false });
      throw err;
    }
  },

  clearError: () => set({ error: null }),
}));