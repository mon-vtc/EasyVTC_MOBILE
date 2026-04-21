// __TEST__/stores/pricing.store.test.ts
import { act } from '@testing-library/react-native';
import { usePricingStore } from '../../store/pricing.store';
import { pricingApi } from '../../services/api/pricing.api';
import { PricingCountry, PricingFlatRate, PricingGrid, SavePricingConfigDto, UpdatePricingGridDto } from '../../types/pricing.types';

jest.mock('../../services/api/pricing.api');
const mockPricingApi = pricingApi as jest.Mocked<typeof pricingApi>;

const TOKEN = 'test-token';

const mockGrid = {
  id: 'grid-1',
  country: 'france' as PricingCountry,
  currency: 'EUR',
  base_price: 5.0,
  price_per_km: 1.8,
  price_per_min: 0.3,
  minimum_price: 10.0,
  created_by: 'admin-1',  
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
} as const satisfies PricingGrid;

const mockFlatRate = {
  id: 'flat-1',
  label: 'Paris → CDG',
  origin_label: 'Paris',
  destination_label: 'CDG',
  price: 65.0,
  country: 'france' as PricingCountry,
  is_active: true,
  created_by : 'admin',
  currency: 'EUR',
  updated_at: '2024-01-01T00:00:00Z',
  created_at: '2024-01-01T00:00:00Z',
} as const satisfies PricingFlatRate;

const mockFlatRateListResult = {
  flat_rates: [mockFlatRate],
  total: 1,
  page: 1,
  limit: 20,
  total_pages: 1,
};

const resetStore = () =>
  usePricingStore.setState({
    config: null,
    activeCountry: 'france',
    isLoading: false,
    isSaving: false,
    error: null,
    flatRates: [],
    flatRatesTotal: 0,
  });

// ══════════════════════════════════════════════════════════════════════════
// setCountry
// ══════════════════════════════════════════════════════════════════════════
describe('usePricingStore › setCountry', () => {
  it('change activeCountry et réinitialise config', () => {
    usePricingStore.setState({ activeCountry: 'france', config: { country: 'france', grid: mockGrid } });
    usePricingStore.getState().setCountry('senegal');
    const state = usePricingStore.getState();
    expect(state.activeCountry).toBe('senegal');
    expect(state.config).toBeNull();
  });
});

// ══════════════════════════════════════════════════════════════════════════
// fetchConfig
// ══════════════════════════════════════════════════════════════════════════
describe('usePricingStore › fetchConfig', () => {
  beforeEach(() => { resetStore(); jest.clearAllMocks(); });

  it('charge la grille tarifaire active', async () => {
    mockPricingApi.getActiveGrid.mockResolvedValue({ ok: true, data: mockGrid, message: 'OK' });

    await act(async () => { await usePricingStore.getState().fetchConfig(TOKEN, 'france'); });

    const state = usePricingStore.getState();
    expect(state.config).not.toBeNull();
    expect(state.config?.grid.id).toBe('grid-1');
    expect(state.config?.country).toBe('france');
    expect(state.isLoading).toBe(false);
  });

  it('retourne config: null (sans erreur) si aucune grille existe (404)', async () => {
    mockPricingApi.getActiveGrid.mockResolvedValue({ ok: false, message: 'Not found' });

    await act(async () => { await usePricingStore.getState().fetchConfig(TOKEN, 'france'); });

    expect(usePricingStore.getState().config).toBeNull();
    expect(usePricingStore.getState().error).toBeNull();
  });

  it('stocke l\'erreur si la grille existe mais échoue à charger', async () => {
    mockPricingApi.getActiveGrid.mockResolvedValue({ ok: true, data: undefined, message: 'Grille introuvable' });

    await expect(
      act(async () => { await usePricingStore.getState().fetchConfig(TOKEN, 'france'); })
    ).rejects.toThrow('Grille introuvable');
  });
});

// ══════════════════════════════════════════════════════════════════════════
// saveConfig — création (première fois)
// ══════════════════════════════════════════════════════════════════════════
describe('usePricingStore › saveConfig (création)', () => {
  beforeEach(() => { resetStore(); jest.clearAllMocks(); });

  it('crée la grille via POST si config est null', async () => {
    mockPricingApi.createGrid.mockResolvedValue({ ok: true, data: mockGrid, message: 'Created' });

    await act(async () => {
      await usePricingStore.getState().saveConfig(TOKEN, 'france' as PricingCountry, {
        grid: { 
          base_price: 5, 
          price_per_km: 1.8, 
          price_per_min: 0.3, 
          minimum_price: 10 
        } as UpdatePricingGridDto,
      });
    });

    expect(mockPricingApi.createGrid).toHaveBeenCalledWith(TOKEN, expect.objectContaining({
      country: 'france',
      currency: 'EUR',
      base_price: 5,
    }));
    expect(usePricingStore.getState().config?.grid.id).toBe('grid-1');
    expect(usePricingStore.getState().isSaving).toBe(false);
  });

  it('utilise XOF pour le Sénégal', async () => {
    mockPricingApi.createGrid.mockResolvedValue({ ok: true, data: mockGrid, message: 'Created' });

    await act(async () => {
      await usePricingStore.getState().saveConfig(TOKEN, 'senegal', {
        grid: { base_price: 3000, price_per_km: 500, price_per_min: 50, minimum_price: 5000 },
      });
    });

    expect(mockPricingApi.createGrid).toHaveBeenCalledWith(TOKEN, expect.objectContaining({ currency: 'XOF' }));
  });
});

// ══════════════════════════════════════════════════════════════════════════
// saveConfig — mise à jour
// ══════════════════════════════════════════════════════════════════════════
describe('usePricingStore › saveConfig (mise à jour)', () => {
  beforeEach(() => {
    resetStore();
    jest.clearAllMocks();
    usePricingStore.setState({ config: { country: 'france', grid: mockGrid } });
  });

  it('met à jour la grille via PATCH si config existe', async () => {
    const updatedGrid = { ...mockGrid, base_price: 6.0 };
    mockPricingApi.updateGrid.mockResolvedValue({ ok: true, data: updatedGrid, message: 'OK' });

    await act(async () => {
      await usePricingStore.getState().saveConfig(TOKEN, 'france', {
        grid: { base_price: 6 },
      });
    });

    expect(mockPricingApi.updateGrid).toHaveBeenCalledWith(TOKEN, 'grid-1', { base_price: 6 });
    expect(usePricingStore.getState().config?.grid.base_price).toBe(6.0);
  });

  it('stocke l\'erreur si le PATCH échoue', async () => {
    mockPricingApi.updateGrid.mockResolvedValue({ ok: false, message: 'Erreur grille' });
    
    await expect(
      act(async () => {
        await usePricingStore.getState().saveConfig(
          TOKEN, 
          'france' as PricingCountry, 
          { grid: {} as UpdatePricingGridDto } as SavePricingConfigDto
        );
      })
    ).rejects.toThrow('Erreur grille');
  
    // Attendre que Zustand flushe les updates
    await act(async () => {});
  
    expect(usePricingStore.getState().isSaving).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// fetchFlatRates
// ══════════════════════════════════════════════════════════════════════════
describe('usePricingStore › fetchFlatRates', () => {
  beforeEach(() => { resetStore(); jest.clearAllMocks(); });

  it('charge la liste des forfaits', async () => {
    mockPricingApi.listFlatRates.mockResolvedValue({
      ok: true, data: mockFlatRateListResult, message: 'OK',
    });

    await act(async () => { await usePricingStore.getState().fetchFlatRates(TOKEN, 'france'); });

    expect(usePricingStore.getState().flatRates).toHaveLength(1);
    expect(usePricingStore.getState().flatRatesTotal).toBe(1);
  });

  it('stocke l\'erreur si l\'API échoue', async () => {
    mockPricingApi.listFlatRates.mockResolvedValue({ ok: false, message: 'Erreur de chargement' });
    await expect(
      act(async () => { await usePricingStore.getState().fetchFlatRates(TOKEN); })
    ).rejects.toThrow('Erreur de chargement');
  });
});

// ══════════════════════════════════════════════════════════════════════════
// createFlatRate
// ══════════════════════════════════════════════════════════════════════════
describe('usePricingStore › createFlatRate', () => {
  beforeEach(() => { resetStore(); jest.clearAllMocks(); });

  it('ajoute le forfait à la liste', async () => {
    mockPricingApi.createFlatRate.mockResolvedValue({ ok: true, data: mockFlatRate, message: 'OK' });

    await act(async () => {
      await usePricingStore.getState().createFlatRate(TOKEN, {
        label: 'Paris → CDG',
        origin_label: 'Paris',
        destination_label: 'CDG',
        price: 65.0,
        currency: 'EUR',     // ← ajouter
        country: 'france',
      });
    });

    expect(usePricingStore.getState().flatRates).toHaveLength(1);
    expect(usePricingStore.getState().isSaving).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// updateFlatRate
// ══════════════════════════════════════════════════════════════════════════
describe('usePricingStore › updateFlatRate', () => {
  beforeEach(() => {
    resetStore();
    jest.clearAllMocks();
    usePricingStore.setState({ flatRates: [mockFlatRate] });
  });

  it('met à jour le forfait dans la liste', async () => {
    const updated = { ...mockFlatRate, price: 70.0 };
    mockPricingApi.updateFlatRate.mockResolvedValue({ ok: true, data: updated, message: 'OK' });

    await act(async () => {
      await usePricingStore.getState().updateFlatRate(TOKEN, 'flat-1', { price: 70.0 });
    });

    expect(usePricingStore.getState().flatRates[0].price).toBe(70.0);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// deactivateFlatRate
// ══════════════════════════════════════════════════════════════════════════
describe('usePricingStore › deactivateFlatRate', () => {
  beforeEach(() => {
    resetStore();
    jest.clearAllMocks();
    usePricingStore.setState({ flatRates: [mockFlatRate] });
  });

  it('retire le forfait de la liste locale', async () => {
    mockPricingApi.deactivateFlatRate.mockResolvedValue({ ok: true, data: undefined, message: 'OK' });

    await act(async () => { await usePricingStore.getState().deactivateFlatRate(TOKEN, 'flat-1'); });

    expect(usePricingStore.getState().flatRates).toHaveLength(0);
  });

  it('stocke l\'erreur si la désactivation échoue', async () => {
    mockPricingApi.deactivateFlatRate.mockResolvedValue({ ok: false, message: 'Erreur' });
    await expect(
      act(async () => { await usePricingStore.getState().deactivateFlatRate(TOKEN, 'flat-1'); })
    ).rejects.toThrow('Erreur');
  });
});

// ══════════════════════════════════════════════════════════════════════════
// clearError
// ══════════════════════════════════════════════════════════════════════════
describe('usePricingStore › clearError', () => {
  it('vide l\'erreur', () => {
    usePricingStore.setState({ error: 'err' });
    usePricingStore.getState().clearError();
    expect(usePricingStore.getState().error).toBeNull();
  });
});