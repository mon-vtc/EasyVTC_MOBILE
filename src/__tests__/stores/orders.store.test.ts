// __TEST__/stores/orders.store.test.ts
import { act } from '@testing-library/react-native';
import { useOrdersStore } from '../../store/orders.store';
import { ordersApi } from '../../services/api/orders.api';
import { Order, OrderListResult, TripSnapshot } from '../../types/orders.types';
import { PricingCountry, PricingType } from '../../types/pricing.types';

jest.mock('../../services/api/orders.api');
const mockOrdersApi = ordersApi as jest.Mocked<typeof ordersApi>;

const TOKEN = 'test-token';
const mockOrder = {
  id: 'order-1',
  reservation_id: 'resa-1',
  order_number: 'ORD-001',
  pdf_url: null,
  driver_snapshot: { first_name: 'Marc', last_name: 'M', phone: null, siret: null },
  passenger_snapshot: { first_name: 'Jean', last_name: 'D', phone: null },
  trip_snapshot: {
    pickup_address: '10 rue de la Paix', dest_address: 'CDG',
    vehicle_type: 'berline', country: 'france' as PricingCountry, scheduled_at: '2024-06-01T10:00:00Z',
    comment: null, via: '', pricing_type: 'formula' as PricingType,
    final_price: 45.0, currency: 'EUR' as TripSnapshot['currency'],
  },
  issued_at: '2024-01-01T00:00:00Z',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}  as const satisfies Order;
const mockListResult = { orders: [mockOrder], total: 1, page: 1, total_pages: 1 };

const resetStore = () =>
  useOrdersStore.setState({
    orders: [], total: 0, page: 1, totalPages: 1,
    selected: null, isLoading: false, error: null,
  });

describe('useOrdersStore › fetchMine', () => {
  beforeEach(() => { resetStore(); jest.clearAllMocks(); });

  it('charge les bons de commande client', async () => {
    mockOrdersApi.listMine.mockResolvedValue({ ok: true, data: mockListResult as OrderListResult, message: 'OK' });
    await act(async () => { await useOrdersStore.getState().fetchMine(TOKEN); });
    expect(useOrdersStore.getState().orders).toHaveLength(1);
  });

  it('stocke l\'erreur si l\'API échoue', async () => {
    mockOrdersApi.listMine.mockResolvedValue({ ok: false, message: 'Erreur' });
    await expect(act(async () => { await useOrdersStore.getState().fetchMine(TOKEN); })).rejects.toThrow();
  });
});

describe('useOrdersStore › fetchDriverMine', () => {
  beforeEach(() => { resetStore(); jest.clearAllMocks(); });

  it('charge les bons du chauffeur', async () => {
    mockOrdersApi.listDriverMine.mockResolvedValue({ ok: true, data: mockListResult as OrderListResult, message: 'OK' });
    await act(async () => { await useOrdersStore.getState().fetchDriverMine(TOKEN); });
    expect(useOrdersStore.getState().orders).toHaveLength(1);
  });
});

describe('useOrdersStore › fetchAll', () => {
  beforeEach(() => { resetStore(); jest.clearAllMocks(); });

  it('charge tous les bons de commande (admin)', async () => {
    const bigList = { ...mockListResult, total: 100, total_pages: 10 };
    mockOrdersApi.listAll.mockResolvedValue({ ok: true, data: bigList as OrderListResult, message: 'OK' });
    await act(async () => { await useOrdersStore.getState().fetchAll(TOKEN); });
    expect(useOrdersStore.getState().total).toBe(100);
    expect(useOrdersStore.getState().totalPages).toBe(10);
  });

  it('applique le filtre reservation_id', async () => {
    mockOrdersApi.listAll.mockResolvedValue({ ok: true, data: mockListResult as OrderListResult, message: 'OK' });
    await act(async () => {
      await useOrdersStore.getState().fetchAll(TOKEN, { reservation_id: 'resa-1' });
    });
    expect(mockOrdersApi.listAll).toHaveBeenCalledWith(TOKEN, expect.objectContaining({ reservation_id: 'resa-1' }));
  });
});

describe('useOrdersStore › fetchById', () => {
  beforeEach(() => { resetStore(); jest.clearAllMocks(); });

  it('charge un bon de commande dans selected', async () => {
    mockOrdersApi.getById.mockResolvedValue({ ok: true, data: mockOrder as Order, message: 'OK' });
    await act(async () => { await useOrdersStore.getState().fetchById(TOKEN, 'order-1'); });
    expect(useOrdersStore.getState().selected?.id).toBe('order-1');
  });

  it('lève une erreur si introuvable', async () => {
    mockOrdersApi.getById.mockResolvedValue({ ok: false, message: 'Bon de commande introuvable' });
    await expect(
      act(async () => { await useOrdersStore.getState().fetchById(TOKEN, 'bad-id'); })
    ).rejects.toThrow('Bon de commande introuvable');
  });
});

describe('useOrdersStore › fetchByReservation', () => {
  beforeEach(() => { resetStore(); jest.clearAllMocks(); });

  it('retourne le bon de commande et le place dans selected', async () => {
    mockOrdersApi.getByReservation.mockResolvedValue({ ok: true, data: mockOrder as Order, message: 'OK' });

    let result: Order | null = null;
    await act(async () => {
      result = await useOrdersStore.getState().fetchByReservation(TOKEN, 'resa-1');
    });

    expect(result!.id).toBe('order-1');
    expect(useOrdersStore.getState().selected?.id).toBe('order-1');
  });

  it('retourne null si aucun bon de commande trouvé', async () => {
    mockOrdersApi.getByReservation.mockResolvedValue({ ok: false, message: 'Not found' });

    let result: Order | null = null;
    await act(async () => {
      result = await useOrdersStore.getState().fetchByReservation(TOKEN, 'resa-missing');
    });

    expect(result).toBeNull();
    expect(useOrdersStore.getState().isLoading).toBe(false);
  });
});

describe('useOrdersStore › clearError & clearSelected', () => {
  it('clearError vide l\'erreur', () => {
    useOrdersStore.setState({ error: 'err' });
    useOrdersStore.getState().clearError();
    expect(useOrdersStore.getState().error).toBeNull();
  });
  it('clearSelected vide selected', () => {
    useOrdersStore.setState({ selected: mockOrder as Order });
    useOrdersStore.getState().clearSelected();
    expect(useOrdersStore.getState().selected).toBeNull();
  });
});