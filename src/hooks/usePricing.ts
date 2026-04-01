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
  PricingCountry,
  PricingFormValues,
  PricingExample,
  SavePricingConfigDto,
  PricingFlatRate,
} from '../types/pricing.types';
import { PRICING_CURRENCY_SYMBOLS, PRICING_COUNTRY_CURRENCIES } from '../types/pricing.types';

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
  const { isAdmin } = useAuth();
  const accessToken = useAuthStore(s => s.accessToken);

  if (!isAdmin) {
    throw new Error('usePricing() ne peut être utilisé que par un administrateur.');
  }

  const config        = usePricingStore(s => s.config);
  const activeCountry = usePricingStore(s => s.activeCountry);
  const isLoading     = usePricingStore(s => s.isLoading);
  const isSaving      = usePricingStore(s => s.isSaving);
  const error         = usePricingStore(s => s.error);
  const flatRates     = usePricingStore(s => s.flatRates);
  const _setCountry   = usePricingStore(s => s.setCountry);
  const _fetchConfig  = usePricingStore(s => s.fetchConfig);
  const _saveConfig   = usePricingStore(s => s.saveConfig);
  const _fetchRates   = usePricingStore(s => s.fetchFlatRates);
  const _createRate   = usePricingStore(s => s.createFlatRate);
  const _updateRate   = usePricingStore(s => s.updateFlatRate);
  const _deactivate   = usePricingStore(s => s.deactivateFlatRate);
  const clearError    = usePricingStore(s => s.clearError);

  // ── Auto-fetch à chaque changement de pays ────────────────────────────────
  useEffect(() => {
    if (accessToken) {
      _fetchConfig(accessToken, activeCountry);
      _fetchRates(accessToken, activeCountry);
    }
  }, [activeCountry, accessToken]);

  // ── Sélection pays ────────────────────────────────────────────────────────
  const setCountry = useCallback((country: PricingCountry) => {
    _setCountry(country);
  }, [_setCountry]);

  // // ── Valeurs initiales du formulaire depuis la config chargée ─────────────
  const getInitialFormValues = useCallback((): PricingFormValues => ({
    base_price:          String(config?.grid.base_price          ?? ''),
    price_per_km:        String(config?.grid.price_per_km        ?? ''),
    price_per_min:       String(config?.grid.price_per_min       ?? ''),
    minimum_price:       String(config?.grid.minimum_price       ?? ''),
    // commission_rate:     String(config?.commission.commission_rate     ?? ''),
    // commission_vat_rate: String(config?.commission.commission_vat_rate ?? ''),
    // airport_fee:         String(config?.supplement.airport_fee   ?? ''),
    // night_rate:          String(config?.supplement.night_rate    ?? ''),
  }), [config]);

  // ── Calcul dynamique de l'exemple ────────────────────────────────────────
  const computeExample = useCallback((values: PricingFormValues): PricingExample => {
    const basePx      = toNum(values.base_price);
    const pxKm        = toNum(values.price_per_km);
    const pxMin       = toNum(values.price_per_min);
    // const commRate    = toNum(values.commission_rate);
    // const commVat     = toNum(values.commission_vat_rate);

    const currency    = PRICING_COUNTRY_CURRENCIES[activeCountry];
    const symbol      = PRICING_CURRENCY_SYMBOLS[currency] ?? currency;

    const km_cost     = round2(pxKm  * EXAMPLE_KM);
    const min_cost    = round2(pxMin * EXAMPLE_MIN);
    const subtotal_ht = round2(basePx + km_cost + min_cost);

    // TVA 20% sur le HT course (France uniquement, Sénégal pas de TVA)
    // const vatRate     = activeCountry === 'france' ? 0.20 : 0;
    const vatRate     =  0;
    const vat_20      = round2(subtotal_ht * vatRate);
    const total_ttc   = round2(subtotal_ht + vat_20);

    // Commission : calculée sur le HT
    // const commission_ht  = round2(subtotal_ht * (commRate  / 100));
    // const commission_vat = round2(commission_ht * (commVat / 100));

    const commission_ht  = round2(subtotal_ht * (0  / 100));
    const commission_vat = round2(commission_ht * (0 / 100));
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
      currency_symbol: symbol,
    };
  }, [activeCountry]);

  // ── Sauvegarde ────────────────────────────────────────────────────────────
  const saveConfig = useCallback(async (values: PricingFormValues) => {
    const dto: SavePricingConfigDto = {
      grid: {
        base_price:    toNum(values.base_price),
        price_per_km:  toNum(values.price_per_km),
        price_per_min: toNum(values.price_per_min),
        minimum_price: toNum(values.minimum_price),
      },
      // commission: {
      //   commission_rate:     toNum(values.commission_rate),
      //   commission_vat_rate: toNum(values.commission_vat_rate),
      // },
      // supplement: {
      //   airport_fee: toNum(values.airport_fee),
      //   night_rate:  toNum(values.night_rate),
      // },
    };
    await _saveConfig(accessToken!, activeCountry, dto);
  }, [accessToken, activeCountry, _saveConfig]);

  // ── Symbole monnaie actif ─────────────────────────────────────────────────
  const currencySymbol = PRICING_CURRENCY_SYMBOLS[
    PRICING_COUNTRY_CURRENCIES[activeCountry]
  ] ?? '€';

  return {
    // État
    config,
    activeCountry,
    isLoading,
    isSaving,
    error,
    clearError,
    currencySymbol,

    // Forfaits
    flatRates,

    // Actions
    setCountry,
    saveConfig,
    getInitialFormValues,
    computeExample,

    fetchFlatRates:    ()                                               => _fetchRates(accessToken!, activeCountry),
    createFlatRate:    (dto: Omit<PricingFlatRate, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'is_active'>) =>
                         _createRate(accessToken!, dto),
    updateFlatRate:    (id: string, dto: Partial<PricingFlatRate>)     => _updateRate(accessToken!, id, dto),
    deactivateFlatRate:(id: string)                                     => _deactivate(accessToken!, id),
  };
}