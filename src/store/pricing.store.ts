// ══════════════════════════════════════════════════════════════════════════════
// STORE — Tarification (Zustand)
// Sprint 3 — EasyVTC
// ══════════════════════════════════════════════════════════════════════════════

import { create } from 'zustand';
import { pricingApi } from '../services/api/pricing.api';
import type {
  PricingConfig,
  PricingCountry,
  SavePricingConfigDto,
  PricingFlatRate,
} from '../types/pricing.types';

interface PricingState {
  // ── Config tarifaire par pays ──────────────────────────────────────────────
  config:         PricingConfig | null;
  activeCountry:  PricingCountry;
  isLoading:      boolean;
  isSaving:       boolean;
  error:          string | null;

  // ── Forfaits ───────────────────────────────────────────────────────────────
  flatRates:      PricingFlatRate[];
  flatRatesTotal: number;

  // ── Actions ────────────────────────────────────────────────────────────────
  setCountry:      (country: PricingCountry)                               => void;
  fetchConfig:     (token: string, country: PricingCountry)                => Promise<void>;
  saveConfig:      (token: string, country: PricingCountry, dto: SavePricingConfigDto) => Promise<void>;
  fetchFlatRates:  (token: string, country?: PricingCountry)               => Promise<void>;
  createFlatRate:  (token: string, dto: Omit<PricingFlatRate, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'is_active'>) => Promise<void>;
  updateFlatRate:  (token: string, id: string, dto: Partial<PricingFlatRate>) => Promise<void>;
  deactivateFlatRate: (token: string, id: string)                          => Promise<void>;
  clearError:      ()                                                       => void;
}

export const usePricingStore = create<PricingState>((set, get) => ({
  config:         null,
  activeCountry:  'france',
  isLoading:      false,
  isSaving:       false,
  error:          null,
  flatRates:      [],
  flatRatesTotal: 0,

  // ── Sélection de pays ──────────────────────────────────────────────────────
  setCountry: (country) => set({ activeCountry: country, config: null }),

  // ── Chargement config complète (grille + commission + supplement) ─────────
  fetchConfig: async (token, country) => {
    set({ isLoading: true, error: null });
    try {
      const res = await pricingApi.getConfig(token, country);
      if (!res.ok || !res.data) throw new Error(res.message ?? 'Erreur de chargement');
      set({ config: res.data, isLoading: false });
    } catch (err: unknown) {
      set({
        error: err instanceof Error ? err.message : 'Erreur inconnue',
        isLoading: false,
      });
      throw err;
    }
  },

  // ── Sauvegarde config (grille + commission + supplement en une requête) ────
  saveConfig: async (token, country, dto) => {
    set({ isSaving: true, error: null });
    try {
      const res = await pricingApi.saveConfig(token, country, dto);
      if (!res.ok || !res.data) throw new Error(res.message ?? 'Erreur de sauvegarde');
      // Rafraîchir la config locale après save
      set({ config: res.data, isSaving: false });
    } catch (err: unknown) {
      set({
        error: err instanceof Error ? err.message : 'Erreur inconnue',
        isSaving: false,
      });
      throw err;
    }
  },

  // ── Forfaits ───────────────────────────────────────────────────────────────
  fetchFlatRates: async (token, country) => {
    set({ isLoading: true, error: null });
    try {
      const res = await pricingApi.listFlatRates(token, country);
      if (!res.ok || !res.data) throw new Error(res.message ?? 'Erreur de chargement');
      set({
        flatRates:      res.data.flat_rates ?? [],
        flatRatesTotal: res.data.total ?? 0,
        isLoading:      false,
      });
    } catch (err: unknown) {
      set({
        error: err instanceof Error ? err.message : 'Erreur inconnue',
        isLoading: false,
      });
      throw err;
    }
  },

  createFlatRate: async (token, dto) => {
    set({ isSaving: true, error: null });
    try {
      const res = await pricingApi.createFlatRate(token, dto);
      if (!res.ok || !res.data) throw new Error(res.message ?? 'Erreur de création');
      set(state => ({
        flatRates:  [...state.flatRates, res.data!],
        isSaving:   false,
      }));
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
      set(state => ({
        flatRates: state.flatRates.map(f => f.id === id ? res.data! : f),
        isSaving:  false,
      }));
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
      set(state => ({
        flatRates: state.flatRates.filter(f => f.id !== id),
        isSaving:  false,
      }));
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Erreur inconnue', isSaving: false });
      throw err;
    }
  },

  clearError: () => set({ error: null }),
}));