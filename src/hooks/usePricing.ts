// ══════════════════════════════════════════════════════════════════════════════
// HOOK — usePricing
// Sprint 3 — EasyVTC
// Réservé à l'admin
// ══════════════════════════════════════════════════════════════════════════════

import { useCallback, useEffect } from 'react';
import { useAuthStore }           from '../store/auth.store';
import { usePricingStore }        from '../store/pricing.store';
import { useAuth }                from './useAuth';
import type {
  PricingFormValues,
  PricingExample,
  SavePricingConfigDto,
  PricingFlatRate,
} from '../types/pricing.types';
import { PRICING_CURRENCY_SYMBOLS } from '../types/pricing.types';

// ── Exemple de calcul avec distances fixes ────────────────────────────────────
const EXAMPLE_KM  = 15;
const EXAMPLE_MIN = 25;

// ── Conversion string → number sûre ─────────────────────────────────────────
function toNum(val: string): number {
  const n = parseFloat(val.replace(',', '.'));
  return isNaN(n) ? 0 : n;
}

// ── Arrondi monétaire ─────────────────────────────────────────────────────────
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function usePricing() {
  const { isAdmin, isManager } = useAuth();
  const isAdminOrManager = isAdmin || isManager;
  const accessToken = useAuthStore(s => s.accessToken);

  if (!isAdminOrManager) {
    throw new Error('usePricing() ne peut être utilisé que par un administrateur ou un manager.');
  }


  const config        = usePricingStore(s => s.config);
  const isLoading     = usePricingStore(s => s.isLoading);
  const isSaving      = usePricingStore(s => s.isSaving);
  const error         = usePricingStore(s => s.error);
  const flatRates     = usePricingStore(s => s.flatRates);
  const _fetchConfig  = usePricingStore(s => s.fetchConfig);
  const _saveConfig   = usePricingStore(s => s.saveConfig);
  const _fetchRates   = usePricingStore(s => s.fetchFlatRates);
  const _createRate   = usePricingStore(s => s.createFlatRate);
  const _updateRate   = usePricingStore(s => s.updateFlatRate);
  const _deactivate   = usePricingStore(s => s.deactivateFlatRate);
  const clearError    = usePricingStore(s => s.clearError);

  // ── Chargement initial ────────────────────────────────────────────────────
  useEffect(() => {
    if (accessToken) {
      _fetchConfig(accessToken);
      _fetchRates(accessToken);
    }
  }, [accessToken]);

  // ── Valeurs initiales du formulaire depuis la config chargée ─────────────
  const getInitialFormValues = useCallback((): PricingFormValues => ({
    base_price:            String(config?.grid.base_price             ?? ''),
    price_per_km:          String(config?.grid.price_per_km           ?? ''),
    price_per_min:         String(config?.grid.price_per_min          ?? ''),
    minimum_price:         String(config?.grid.minimum_price          ?? ''),
    tva_rate:              config?.grid.tva_rate != null
                             ? String(Math.round(config.grid.tva_rate * 100))
                             : '',
    airport_supplement:    String(config?.grid.airport_supplement     ?? ''),
    night_supplement_rate: config?.grid.night_supplement_rate != null
                             ? String(Math.round(config.grid.night_supplement_rate * 100))
                             : '',
    night_start:           config?.grid.night_start?.slice(0, 5)     ?? '',
    night_end:             config?.grid.night_end?.slice(0, 5)       ?? '',
  }), [config]);

  // ── Calcul dynamique de l'exemple ────────────────────────────────────────
  // `commissionRate` reflète le paramétrage actif dans "Règles de Commission"
  // ("Toutes catégories") — null si aucune règle active n'est configurée.
  const computeExample = useCallback((
    values: PricingFormValues,
    commissionRate?: { type: 'percentage' | 'flat'; value: number } | null,
  ): PricingExample => {
    const basePx      = toNum(values.base_price);
    const pxKm        = toNum(values.price_per_km);
    const pxMin       = toNum(values.price_per_min);

    const km_cost     = round2(pxKm  * EXAMPLE_KM);
    const min_cost    = round2(pxMin * EXAMPLE_MIN);
    const subtotal_ht = round2(basePx + km_cost + min_cost);

    const vat_20      = 0;
    const total_ttc   = round2(subtotal_ht + vat_20);

    // Commission EasyVTC : calculée sur le HT selon le paramétrage actif
    const commission_ht  = !commissionRate ? 0
      : commissionRate.type === 'percentage' ? round2(subtotal_ht * (commissionRate.value / 100))
      : round2(commissionRate.value);
    const commission_vat = 0;
    const commission_ttc = round2(commission_ht + commission_vat);

    const net_driver = round2(total_ttc - commission_ttc);

    return {
      distance_km:     EXAMPLE_KM,
      duration_min:    EXAMPLE_MIN,
      km_cost,
      min_cost,
      subtotal_ht,
      vat_20,
      total_ttc,
      commission_ht,
      commission_vat,
      commission_ttc,
      net_driver,
      currency_symbol: PRICING_CURRENCY_SYMBOLS.EUR ?? '€',
    };
  }, []);

  // ── Sauvegarde ────────────────────────────────────────────────────────────
  const saveConfig = useCallback(async (values: PricingFormValues) => {
    const dto: SavePricingConfigDto = {
      grid: {
        base_price:            toNum(values.base_price),
        price_per_km:          toNum(values.price_per_km),
        price_per_min:         toNum(values.price_per_min),
        minimum_price:         toNum(values.minimum_price),
        tva_rate:              round2(toNum(values.tva_rate) / 100),
        airport_supplement:    toNum(values.airport_supplement),
        night_supplement_rate: round2(toNum(values.night_supplement_rate) / 100),
        night_start:           values.night_start || undefined,
        night_end:             values.night_end   || undefined,
      },
    };
    await _saveConfig(accessToken!, dto);
  }, [accessToken, _saveConfig]);

  return {
    // État
    config,
    isLoading,
    isSaving,
    error,
    clearError,
    currencySymbol: PRICING_CURRENCY_SYMBOLS.EUR ?? '€',

    // Forfaits
    flatRates,

    // Actions
    saveConfig,
    getInitialFormValues,
    computeExample,

    fetchFlatRates:    ()                                               => _fetchRates(accessToken!),
    createFlatRate:    (dto: Omit<PricingFlatRate, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'is_active'>) =>
                         _createRate(accessToken!, dto),
    updateFlatRate:    (id: string, dto: Partial<PricingFlatRate>)     => _updateRate(accessToken!, id, dto),
    deactivateFlatRate:(id: string)                                     => _deactivate(accessToken!, id),
  };
}
