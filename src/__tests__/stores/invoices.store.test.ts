// __TEST__/stores/invoices.store.test.ts
import { act } from '@testing-library/react-native';
import { useInvoicesStore } from '../../store/invoices.store';
import { invoicesApi } from '../../services/api/invoices.api';
import { AdjustInvoicePriceDto, Invoice, InvoiceListResult } from '../../types/invoices.types';

jest.mock('../../services/api/invoices.api');
const mockInvoicesApi = invoicesApi as jest.Mocked<typeof invoicesApi>;

const TOKEN = 'test-token';
const mockInvoice = {
  id: 'inv-1',
  trip_id: 'trip-1',
  invoice_number: 'INV-001',
  pdf_url: null,
  driver_billing: { first_name: 'Marc', last_name: 'M', phone: null, email: null, siret: null, tva_rate: 20, zone: 'france' },
  client_snapshot: { first_name: 'Jean', last_name: 'D', phone: null, email: null },
  trip_snapshot: {
    pickup_address: '10 rue de la Paix', dest_address: 'CDG', vehicle_type: 'berline',
    country: 'france', scheduled_at: '2024-06-01T10:00:00Z',
    started_at: null, ended_at: null, actual_distance_km: null, actual_duration_min: null,
  },
  amount_ht: 45.0,
  tva_rate: 20,
  amount_ttc: 54.0,
  discount_amount: null,
  adjustments: [],
  issued_at: '2024-01-01T00:00:00Z',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00 IZ',
} as const satisfies Invoice;

const mockListResult = { invoices: [mockInvoice], total: 1, page: 1, total_pages: 1,  limit:   5 } as const satisfies InvoiceListResult;

const resetStore = () =>
  useInvoicesStore.setState({
    invoices: [], total: 0, page: 1, totalPages: 1,
    selected: null, isLoading: false, isAdjusting: false, error: null,
  });

describe('useInvoicesStore › fetch', () => {
  beforeEach(() => { resetStore(); jest.clearAllMocks(); });

  it('charge la liste des factures', async () => {
    mockInvoicesApi.list.mockResolvedValue({ ok: true, data: mockListResult , message: 'OK' });
    await act(async () => { await useInvoicesStore.getState().fetch(TOKEN); });
    expect(useInvoicesStore.getState().invoices).toHaveLength(1);
    expect(useInvoicesStore.getState().total).toBe(1);
  });

  it('applique les filtres de pagination', async () => {
    mockInvoicesApi.list.mockResolvedValue({ ok: true, data: mockListResult , message: 'OK' });
    await act(async () => { await useInvoicesStore.getState().fetch(TOKEN, { page: 2, limit: 5 }); });
    expect(mockInvoicesApi.list).toHaveBeenCalledWith(TOKEN, { page: 2, limit: 5 });
  });

  it('stocke l\'erreur si l\'API échoue', async () => {
    mockInvoicesApi.list.mockResolvedValue({ ok: false, message: 'Erreur' });
    await expect(act(async () => { await useInvoicesStore.getState().fetch(TOKEN); })).rejects.toThrow('Erreur');
    expect(useInvoicesStore.getState().error).toBe('Erreur');
  });
});

describe('useInvoicesStore › fetchById', () => {
  beforeEach(() => { resetStore(); jest.clearAllMocks(); });

  it('charge une facture dans selected', async () => {
    mockInvoicesApi.getById.mockResolvedValue({ ok: true, data: mockInvoice , message: 'OK' });
    await act(async () => { await useInvoicesStore.getState().fetchById(TOKEN, 'inv-1'); });
    expect(useInvoicesStore.getState().selected?.id).toBe('inv-1');
  });

  it('lève une erreur si introuvable', async () => {
    mockInvoicesApi.getById.mockResolvedValue({ ok: false, message: 'Facture introuvable' });
    await expect(
      act(async () => { await useInvoicesStore.getState().fetchById(TOKEN, 'bad-id'); })
    ).rejects.toThrow('Facture introuvable');
  });
});

describe('useInvoicesStore › adjustPrice', () => {
  beforeEach(() => { resetStore(); jest.clearAllMocks(); });

  it('met à jour la facture dans la liste et dans selected', async () => {
    const adjusted = { ...mockInvoice, amount_ttc: 60.0 };
    useInvoicesStore.setState({ invoices: [mockInvoice ], selected: mockInvoice  });
    mockInvoicesApi.adjustPrice.mockResolvedValue({ ok: true, data: adjusted, message: 'OK' });

    await act(async () => {
      await useInvoicesStore.getState().adjustPrice(TOKEN, 'inv-1', { new_amount_ttc: 60.0, reason: 'Correction' } as const satisfies AdjustInvoicePriceDto);
    });

    expect(useInvoicesStore.getState().invoices[0].amount_ttc).toBe(60.0);
    expect(useInvoicesStore.getState().selected?.amount_ttc).toBe(60.0);
    expect(useInvoicesStore.getState().isAdjusting).toBe(false);
  });

  it('stocke l\'erreur si l\'ajustement échoue', async () => {
    mockInvoicesApi.adjustPrice.mockResolvedValue({ ok: false, message: 'Non autorisé' });
    await expect(
      act(async () => { await useInvoicesStore.getState().adjustPrice(TOKEN, 'inv-1', { new_amount_ttc: 0, reason: '' }); })
    ).rejects.toThrow('Non autorisé');
    expect(useInvoicesStore.getState().isAdjusting).toBe(false);
  });
});

describe('useInvoicesStore › clearError & clearSelected', () => {
  it('clearError vide l\'erreur', () => {
    useInvoicesStore.setState({ error: 'err' });
    useInvoicesStore.getState().clearError();
    expect(useInvoicesStore.getState().error).toBeNull();
  });
  it('clearSelected vide selected', () => {
    useInvoicesStore.setState({ selected: mockInvoice  });
    useInvoicesStore.getState().clearSelected();
    expect(useInvoicesStore.getState().selected).toBeNull();
  });
});