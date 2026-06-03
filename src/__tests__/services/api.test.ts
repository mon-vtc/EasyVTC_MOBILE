// __TEST__/services.api.test.ts
// Tests unitaires des couches API (construction des URLs, paramètres de requête)

import { adminDocumentApi } from '../../services/api/admin.document.api';
import { reservationApi }   from '../../services/api/reservation.api';
import { invoicesApi }      from '../../services/api/invoices.api';
import { ordersApi }        from '../../services/api/orders.api';
import { pricingApi }       from '../../services/api/pricing.api';
import { commissionApi }    from '../../services/api/commission.api';
import { vehicleApi }       from '../../services/api/vehicle.api';
import { api }              from '../../lib/api';
import { PricingCountry, PriceEstimateDto } from '../../types/pricing.types';
import { AdjustInvoicePriceDto } from '../../types/invoices.types';
import { VehicleType } from '../../types/user.types';


// ── Mock de la lib HTTP de base ────────────────────────────────────────────
jest.mock('../../lib/api', () => ({
  api: {
    get:    jest.fn(),
    post:   jest.fn(),
    patch:  jest.fn(),
    put:    jest.fn(),
    delete: jest.fn(),
  },
}));

const mockApi = api as jest.Mocked<typeof api>;
const TOKEN   = 'test-token';


beforeEach(() => { jest.clearAllMocks(); });

// ══════════════════════════════════════════════════════════════════════════
// adminDocumentApi
// ══════════════════════════════════════════════════════════════════════════
describe('adminDocumentApi › listDocuments', () => {
  it('appelle /admin/documents sans paramètres si aucun filtre', () => {
    mockApi.get.mockResolvedValue({ ok: true, data: [], message: 'OK' });
    adminDocumentApi.listDocuments(TOKEN);
    expect(mockApi.get).toHaveBeenCalledWith('/admin/documents', TOKEN);
  });

  it('construit la querystring avec status et doc_type', () => {
    mockApi.get.mockResolvedValue({ ok: true, data: [], message: 'OK' });
    adminDocumentApi.listDocuments(TOKEN, { status: 'pending', doc_type: 'license' });
    const url = (mockApi.get as jest.Mock).mock.calls[0][0] as string;
    expect(url).toContain('status=pending');
    expect(url).toContain('doc_type=license');
  });

  it('ajoute expiring_soon=true si le flag est activé', () => {
    mockApi.get.mockResolvedValue({ ok: true, data: [], message: 'OK' });
    adminDocumentApi.listDocuments(TOKEN, { expiring_soon: true });
    const url = (mockApi.get as jest.Mock).mock.calls[0][0] as string;
    expect(url).toContain('expiring_soon=true');
  });

  it('ajoute driver_id si fourni', () => {
    mockApi.get.mockResolvedValue({ ok: true, data: [], message: 'OK' });
    adminDocumentApi.listDocuments(TOKEN, { driver_id: 'driver-abc' });
    const url = (mockApi.get as jest.Mock).mock.calls[0][0] as string;
    expect(url).toContain('driver_id=driver-abc');
  });

  it('combine plusieurs filtres dans la querystring', () => {
    mockApi.get.mockResolvedValue({ ok: true, data: [], message: 'OK' });
    adminDocumentApi.listDocuments(TOKEN, { status: 'rejected', page: 2, limit: 10 });
    const url = (mockApi.get as jest.Mock).mock.calls[0][0] as string;
    expect(url).toContain('status=rejected');
    expect(url).toContain('page=2');
    expect(url).toContain('limit=10');
  });
});

describe('adminDocumentApi › getStats', () => {
  it('appelle /admin/documents/stats', () => {
    mockApi.get.mockResolvedValue({ ok: true, data: {}, message: 'OK' });
    adminDocumentApi.getStats(TOKEN);
    expect(mockApi.get).toHaveBeenCalledWith('/admin/documents/stats', TOKEN);
  });
});

describe('adminDocumentApi › getDocumentById', () => {
  it('appelle /admin/documents/:id', () => {
    mockApi.get.mockResolvedValue({ ok: true, data: {}, message: 'OK' });
    adminDocumentApi.getDocumentById(TOKEN, 'doc-42');
    expect(mockApi.get).toHaveBeenCalledWith('/admin/documents/doc-42', TOKEN);
  });
});

describe('adminDocumentApi › validateDocument', () => {
  it('appelle PATCH /admin/documents/:id/validate sans body', () => {
    mockApi.patch.mockResolvedValue({ ok: true, data: {}, message: 'OK' });
    adminDocumentApi.validateDocument(TOKEN, 'doc-42');
    expect(mockApi.patch).toHaveBeenCalledWith('/admin/documents/doc-42/validate', {}, TOKEN);
  });
});

describe('adminDocumentApi › rejectDocument', () => {
  it('appelle PATCH /admin/documents/:id/reject avec la raison', () => {
    mockApi.patch.mockResolvedValue({ ok: true, data: {}, message: 'OK' });
    adminDocumentApi.rejectDocument(TOKEN, 'doc-42', { reason: 'Document illisible' });
    expect(mockApi.patch).toHaveBeenCalledWith(
      '/admin/documents/doc-42/reject',
      { reason: 'Document illisible' },
      TOKEN,
    );
  });
});

// ══════════════════════════════════════════════════════════════════════════
// reservationApi — construction des URLs
// ══════════════════════════════════════════════════════════════════════════
describe('reservationApi › listMine URL builder', () => {
  it('appelle /reservations/mine sans filtres', () => {
    mockApi.get.mockResolvedValue({ ok: true, data: {}, message: 'OK' });
    reservationApi.listMine(TOKEN);
    expect(mockApi.get).toHaveBeenCalledWith('/reservations/mine', TOKEN);
  });

  it('construit la querystring avec status et pagination', () => {
    mockApi.get.mockResolvedValue({ ok: true, data: {}, message: 'OK' });
    reservationApi.listMine(TOKEN, { status: 'completed', page: 3, limit: 5 });
    const url = (mockApi.get as jest.Mock).mock.calls[0][0] as string;
    expect(url).toContain('status=completed');
    expect(url).toContain('page=3');
    expect(url).toContain('limit=5');
  });
});

describe('reservationApi › listAll URL builder (admin)', () => {
  it('inclut country, driver_id et client_id dans la querystring', () => {
    mockApi.get.mockResolvedValue({ ok: true, data: {}, message: 'OK' });
    reservationApi.listAll(TOKEN, {
      country: 'senegal',
      driver_id: 'drv-1',
      client_id: 'cli-1',
    });
    const url = (mockApi.get as jest.Mock).mock.calls[0][0] as string;
    expect(url).toContain('country=senegal');
    expect(url).toContain('driver_id=drv-1');
    expect(url).toContain('client_id=cli-1');
  });
});

describe('reservationApi › assign', () => {
  it('appelle POST /reservations/:id/assign avec { driver_id }', () => {
    mockApi.post.mockResolvedValue({ ok: true, data: {}, message: 'OK' });
    reservationApi.assign(TOKEN, 'resa-1', 'driver-record-1');
    expect(mockApi.post).toHaveBeenCalledWith(
      '/reservations/resa-1/assign',
      { driver_id: 'driver-record-1' },
      TOKEN,
    );
  });
});

describe('reservationApi › complete', () => {
  it('transmet les métriques réelles au backend', () => {
    mockApi.patch.mockResolvedValue({ ok: true, data: {}, message: 'OK' });
    reservationApi.complete(TOKEN, 'resa-1', 15.2, 32, 'Bon trajet', 48.5);
    expect(mockApi.patch).toHaveBeenCalledWith(
      '/reservations/resa-1/complete',
      {
        actual_distance_km: 15.2,
        actual_duration_min: 32,
        driver_notes: 'Bon trajet',
        price_adjusted: 48.5,
      },
      TOKEN,
    );
  });
});

describe('vehicleApi › getVehicleTypes (mock)', () => {
  beforeEach(() => {
    jest.spyOn(vehicleApi, 'getVehicleTypes').mockResolvedValue({
      ok: true,
      message: 'OK',
      data: [
        {
          type:       'standard' ,
          label:       'Standard' ,
          description: '1-2 passagers',
          base_price:  18.0 ,
          icon:       'car-outline' ,
          capacity:    2,
        },
        {
          type: 'berline',
          label: 'Berline',  base_price: 6.5,
          icon: 'car-sport-outline',
          capacity: 4,
          description: '1-4 passagers',
        },
        {
          type: 'van',
          label: 'Van',
          base_price: 8,
          icon: 'car-side-outline',
          capacity: 6,
          description: '1-6 passagers',
        },
      ],
    });
  });

  it('retourne les 3 types de véhicule pour la france', async () => {
    const result = await vehicleApi.getVehicleTypes(TOKEN, 'france' as PricingCountry);
    expect(result.ok).toBe(true);
    expect(result.data).toHaveLength(3);
    const types = result.data!.map(v => v.type);
    expect(types).toContain('standard');
    expect(types).toContain('berline');
    expect(types).toContain('van');
  });

  it('retourne des prix en XOF pour le sénégal', async () => {
    jest.spyOn(vehicleApi, 'getVehicleTypes').mockResolvedValue({
      ok: true,
      message: 'OK',
      data: [
        { type: 'standard', label: 'Standard', base_price: 3000, icon: 'car-outline', capacity: 2, description: '1-2 passagers' },
        { type: 'berline',  label: 'Berline',  base_price: 3900, icon: 'car-outline', capacity: 4, description: '1-4 passagers' },
        { type: 'van',      label: 'Van',      base_price: 4800, icon: 'car-outline', capacity: 6, description: '1-6 passagers' },
      ],
    });
    const result = await vehicleApi.getVehicleTypes(TOKEN, 'senegal' as PricingCountry);
    const standard = result.data!.find(v => v.type === 'standard' as VehicleType);
    expect(standard?.base_price).toBe(3000);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// invoicesApi
// ══════════════════════════════════════════════════════════════════════════
describe('invoicesApi', () => {
  it('list appelle /invoices sans filtres', () => {
    mockApi.get.mockResolvedValue({ ok: true, data: {}, message: 'OK' });
    invoicesApi.list(TOKEN);
    expect(mockApi.get).toHaveBeenCalledWith('/invoices', TOKEN);
  });

  it('list construit la querystring avec page et limit', () => {
    mockApi.get.mockResolvedValue({ ok: true, data: {}, message: 'OK' });
    invoicesApi.list(TOKEN, { page: 2, limit: 10 });
    const url = (mockApi.get as jest.Mock).mock.calls[0][0] as string;
    expect(url).toContain('page=2');
    expect(url).toContain('limit=10');
  });

  it('getById appelle /invoices/:id', () => {
    mockApi.get.mockResolvedValue({ ok: true, data: {}, message: 'OK' });
    invoicesApi.getById(TOKEN, 'inv-42');
    expect(mockApi.get).toHaveBeenCalledWith('/invoices/inv-42', TOKEN);
  });

  it('adjustPrice appelle PUT /invoices/:id/price', () => {
    mockApi.put.mockResolvedValue({ ok: true, data: {}, message: 'OK' });
    const adjustDto: AdjustInvoicePriceDto = { new_amount_ttc: 75.0, reason: 'Surcharge' };
    invoicesApi.adjustPrice(TOKEN, 'inv-42', adjustDto);
    expect(mockApi.put).toHaveBeenCalledWith(
      '/invoices/inv-42/price',
      adjustDto,
      TOKEN,
    );
  });

  it('fetchPdfUrl appelle GET /invoices/:id/pdf avec le token', () => {
    mockApi.get.mockResolvedValue({ ok: true, data: { url: 'https://storage.supabase.co/signed' } });
    invoicesApi.fetchPdfUrl(TOKEN, 'inv-42');
    expect(mockApi.get).toHaveBeenCalledWith('/invoices/inv-42/pdf', TOKEN);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// ordersApi
// ══════════════════════════════════════════════════════════════════════════
describe('ordersApi', () => {
  it('listMine appelle /orders/mine', () => {
    mockApi.get.mockResolvedValue({ ok: true, data: {}, message: 'OK' });
    ordersApi.listMine(TOKEN);
    expect(mockApi.get).toHaveBeenCalledWith('/orders/mine', TOKEN);
  });

  it('listDriverMine appelle /orders/driver/mine', () => {
    mockApi.get.mockResolvedValue({ ok: true, data: {}, message: 'OK' });
    ordersApi.listDriverMine(TOKEN);
    expect(mockApi.get).toHaveBeenCalledWith('/orders/driver/mine', TOKEN);
  });

  it('listAll appelle /orders avec reservation_id', () => {
    mockApi.get.mockResolvedValue({ ok: true, data: {}, message: 'OK' });
    ordersApi.listAll(TOKEN, { reservation_id: 'resa-1' });
    const url = (mockApi.get as jest.Mock).mock.calls[0][0] as string;
    expect(url).toContain('/orders');
    expect(url).toContain('reservation_id=resa-1');
  });

  it('getByReservation appelle /orders/by-reservation/:id', () => {
    mockApi.get.mockResolvedValue({ ok: true, data: {}, message: 'OK' });
    ordersApi.getByReservation(TOKEN, 'resa-99');
    expect(mockApi.get).toHaveBeenCalledWith('/orders/by-reservation/resa-99', TOKEN);
  });

  it('fetchPdfUrl appelle GET /orders/:id/pdf avec le token', () => {
    mockApi.get.mockResolvedValue({ ok: true, data: { url: 'https://storage.supabase.co/signed' } });
    ordersApi.fetchPdfUrl(TOKEN, 'order-42');
    expect(mockApi.get).toHaveBeenCalledWith('/orders/order-42/pdf', TOKEN);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// pricingApi — routes publiques et admin
// ══════════════════════════════════════════════════════════════════════════
describe('pricingApi › grilles', () => {
  it('getActiveGrid appelle /pricing/grids/active/:country', () => {
    mockApi.get.mockResolvedValue({ ok: true, data: {}, message: 'OK' });
    pricingApi.getActiveGrid('france' as PricingCountry);
    expect(mockApi.get).toHaveBeenCalledWith('/pricing/grids/active/france');
  });

  it('getAllGrids appelle /pricing/grids avec country optionnel', () => {
    mockApi.get.mockResolvedValue({ ok: true, data: [], message: 'OK' });
    pricingApi.getAllGrids(TOKEN, 'senegal');
    expect(mockApi.get).toHaveBeenCalledWith('/pricing/grids?country=senegal', TOKEN);
  });

  it('getAllGrids sans country n\'ajoute pas de querystring', () => {
    mockApi.get.mockResolvedValue({ ok: true, data: [], message: 'OK' });
    pricingApi.getAllGrids(TOKEN);
    expect(mockApi.get).toHaveBeenCalledWith('/pricing/grids', TOKEN);
  });

  it('createGrid envoie le bon DTO', () => {
    mockApi.post.mockResolvedValue({ ok: true, data: {}, message: 'OK' });
    pricingApi.createGrid(TOKEN, {
      country: 'france', currency: 'EUR',
      base_price: 5, price_per_km: 1.8, price_per_min: 0.3, minimum_price: 10,
    });
    expect(mockApi.post).toHaveBeenCalledWith('/pricing/grids', expect.objectContaining({
      country: 'france', currency: 'EUR', base_price: 5,
    }), TOKEN);
  });

  it('updateGrid appelle PATCH /pricing/grids/:id', () => {
    mockApi.patch.mockResolvedValue({ ok: true, data: {}, message: 'OK' });
    pricingApi.updateGrid(TOKEN, 'grid-1', { base_price: 6 });
    expect(mockApi.patch).toHaveBeenCalledWith('/pricing/grids/grid-1', { base_price: 6 }, TOKEN);
  });
});

describe('pricingApi › forfaits', () => {
  it('listFlatRates appelle /pricing/flat-rates', () => {
    mockApi.get.mockResolvedValue({ ok: true, data: {}, message: 'OK' });
    pricingApi.listFlatRates(TOKEN, 'france');
    const url = (mockApi.get as jest.Mock).mock.calls[0][0] as string;
    expect(url).toContain('/pricing/flat-rates');
    expect(url).toContain('country=france');
  });

  it('createFlatRate appelle POST /pricing/flat-rates', () => {
    mockApi.post.mockResolvedValue({ ok: true, data: {}, message: 'OK' });
    pricingApi.createFlatRate(TOKEN, {
      label: 'Paris → CDG', origin_label: 'Paris', destination_label: 'CDG',
      price: 65, country: 'france', currency: 'EUR',
    });
    expect(mockApi.post).toHaveBeenCalledWith('/pricing/flat-rates', expect.any(Object), TOKEN);
  });

  it('deactivateFlatRate appelle DELETE /pricing/flat-rates/:id', () => {
    mockApi.delete.mockResolvedValue({ ok: true, data: undefined, message: 'OK' });
    pricingApi.deactivateFlatRate(TOKEN, 'flat-1');
    expect(mockApi.delete).toHaveBeenCalledWith('/pricing/flat-rates/flat-1', TOKEN);
  });
});

describe('pricingApi › estimate', () => {
  it('appelle POST /pricing/estimate avec le DTO', () => {
    const PriceEstimateDTO = {
      country:       'france' as PricingCountry,
      distance_km:  45,
      duration_min: 15,
      flat_rate_id: 'flat-1',
      nb_passengers: 2,
      is_airport:   false,
      is_night:     false,
    } as PriceEstimateDto;
    mockApi.post.mockResolvedValue({ ok: true, data: {}, message: 'OK' });
    pricingApi.estimate(TOKEN, PriceEstimateDTO);
    expect(mockApi.post).toHaveBeenCalledWith('/pricing/estimate', PriceEstimateDTO, TOKEN);
  });
});

describe('commissionApi › params commission', () => {
  it('listSettings appelle /admin/commission-settings sans filtres', () => {
    mockApi.get.mockResolvedValue({ ok: true, data: [], message: 'OK' });
    commissionApi.listSettings(TOKEN);
    expect(mockApi.get).toHaveBeenCalledWith('/admin/commission-settings', TOKEN);
  });

  it('listSettings construit la querystring avec zone et is_active', () => {
    mockApi.get.mockResolvedValue({ ok: true, data: [], message: 'OK' });
    commissionApi.listSettings(TOKEN, { zone: 'france', is_active: true });
    const url = (mockApi.get as jest.Mock).mock.calls[0][0] as string;
    expect(url).toContain('zone=france');
    expect(url).toContain('is_active=true');
  });

  it('getSettingById appelle /admin/commission-settings/:id', () => {
    mockApi.get.mockResolvedValue({ ok: true, data: {}, message: 'OK' });
    commissionApi.getSettingById(TOKEN, 'setting-1');
    expect(mockApi.get).toHaveBeenCalledWith('/admin/commission-settings/setting-1', TOKEN);
  });

  it('createSetting appelle POST /admin/commission-settings', () => {
    const dto = { label: 'Commission France', zone: 'france' as const, rate_type: 'percentage' as const, rate_value: 15 };
    mockApi.post.mockResolvedValue({ ok: true, data: {}, message: 'OK' });
    commissionApi.createSetting(TOKEN, dto);
    expect(mockApi.post).toHaveBeenCalledWith('/admin/commission-settings', dto, TOKEN);
  });

  it('updateSetting appelle PATCH /admin/commission-settings/:id', () => {
    mockApi.patch.mockResolvedValue({ ok: true, data: {}, message: 'OK' });
    commissionApi.updateSetting(TOKEN, 'setting-1', { rate_value: 12 });
    expect(mockApi.patch).toHaveBeenCalledWith('/admin/commission-settings/setting-1', { rate_value: 12 }, TOKEN);
  });

  it('deleteSetting appelle DELETE /admin/commission-settings/:id', () => {
    mockApi.delete.mockResolvedValue({ ok: true, data: undefined, message: 'OK' });
    commissionApi.deleteSetting(TOKEN, 'setting-1');
    expect(mockApi.delete).toHaveBeenCalledWith('/admin/commission-settings/setting-1', TOKEN);
  });

  it('getSummary appelle /admin/commissions/summary avec period et date', () => {
    mockApi.get.mockResolvedValue({ ok: true, data: {}, message: 'OK' });
    commissionApi.getSummary(TOKEN, 'month', '2026-06-01');
    expect(mockApi.get).toHaveBeenCalledWith('/admin/commissions/summary?period=month&date=2026-06-01', TOKEN);
  });

  it('listCommissions appelle /admin/commissions avec filtres', () => {
    mockApi.get.mockResolvedValue({ ok: true, data: {}, message: 'OK' });
    commissionApi.listCommissions(TOKEN, { period: 'all', zone: 'senegal', page: 2, limit: 10 });
    const url = (mockApi.get as jest.Mock).mock.calls[0][0] as string;
    expect(url).toContain('/admin/commissions');
    expect(url).toContain('period=all');
    expect(url).toContain('zone=senegal');
    expect(url).toContain('page=2');
    expect(url).toContain('limit=10');
  });
});