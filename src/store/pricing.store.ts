// ══════════════════════════════════════════════════════════════════════════════
// STORE — Tarification (Zustand)
// Sprint 3 — EasyVTC
// fetchConfig : 3 appels parallèles (grille + commission + supplement)
// saveConfig  : 3 PATCH indépendants sur les IDs connus
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

  // ── Chargement : 3 appels parallèles, silencieux si aucune config ────────
  // Cas "première visite" : les 3 routes retournent 404 → config = null,
  // l'écran affiche un formulaire vierge prêt à la première saisie.
  fetchConfig: async (token, country) => {
    set({ isLoading: true, error: null });
    try {
      const [gridRes, commRes, suppRes] = await Promise.all([
        pricingApi.getActiveGrid(country),
        pricingApi.getActiveCommission(token, country),
        pricingApi.getActiveSupplement(token, country),
      ]);

      // Si aucune des 3 ressources n'existe encore → formulaire vierge, pas d'erreur
      const noneExist = !gridRes.ok && !commRes.ok && !suppRes.ok;
      if (noneExist) {
        set({ config: null, isLoading: false });
        return;
      }

      // Si certaines existent mais pas d'autres → erreur partielle réelle
      if (!gridRes.ok || !gridRes.data) throw new Error(gridRes.message ?? 'Grille introuvable');
      if (!commRes.ok || !commRes.data) throw new Error(commRes.message ?? 'Commission introuvable');
      if (!suppRes.ok || !suppRes.data) throw new Error(suppRes.message ?? 'Suppléments introuvables');

      set({
        config: {
          country,
          grid:       gridRes.data,
          commission: commRes.data,
          supplement: suppRes.data,
        },
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

      let gridRes, commRes, suppRes;

      if (!config) {
        // ── Première création : POST sur les 3 ressources ──────────────────
        [gridRes, commRes, suppRes] = await Promise.all([
          pricingApi.createGrid(token, {
            country,
            currency,
            base_price:    dto.grid.base_price    ?? 0,
            price_per_km:  dto.grid.price_per_km  ?? 0,
            price_per_min: dto.grid.price_per_min ?? 0,
            minimum_price: dto.grid.minimum_price ?? 0,
          }),
          pricingApi.createCommission(token, {
            country,
            currency,
            commission_rate:     dto.commission.commission_rate     ?? 0,
            commission_vat_rate: dto.commission.commission_vat_rate ?? 0,
          }),
          pricingApi.createSupplement(token, {
            country,
            currency,
            airport_fee: dto.supplement.airport_fee ?? 0,
            night_rate:  dto.supplement.night_rate  ?? 0,
          }),
        ]);
      } else {
        // ── Mise à jour : PATCH sur les IDs existants ──────────────────────
        [gridRes, commRes, suppRes] = await Promise.all([
          pricingApi.updateGrid(token, config.grid.id, dto.grid),
          pricingApi.updateCommission(token, config.commission.id, dto.commission),
          pricingApi.updateSupplement(token, config.supplement.id, dto.supplement),
        ]);
      }

      if (!gridRes.ok || !gridRes.data) throw new Error(gridRes.message ?? 'Erreur grille');
      if (!commRes.ok || !commRes.data) throw new Error(commRes.message ?? 'Erreur commission');
      if (!suppRes.ok || !suppRes.data) throw new Error(suppRes.message ?? 'Erreur suppléments');

      set({
        config: {
          country,
          grid:       gridRes.data,
          commission: commRes.data,
          supplement: suppRes.data,
        },
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