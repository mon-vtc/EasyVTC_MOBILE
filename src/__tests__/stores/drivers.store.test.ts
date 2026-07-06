// __TEST__/stores/drivers.store.test.ts
import { act } from '@testing-library/react-native';
import { useDriversStore } from '../../store/drivers.store';
import { driverApi } from '../../services/api/drivers.api';
import { AuthUser, DriverWithUser, PaginatedDrivers, ListDriversParams, ChangeDriverStatusPayload } from '../../types';
import { DriverStatus, VehicleType,  } from '../../types/user.types';
import { PricingCountry } from '../../types/pricing.types';

jest.mock('../../services/api/drivers.api');
const mockDriverApi = driverApi as jest.Mocked<typeof driverApi>;

const TOKEN = 'test-token';

const mockDriverWithUser = {
  id: 'driver-record-1',
  user_id: 'user-1',
  status: 'active' as DriverStatus,
  vehicle_type: 'berline' as VehicleType,
  siret: '12345678901234',
  zone: 'france' as PricingCountry,
  tva_rate: 20,
  is_online: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  trips_count: 0,
  average_rating: null,
  user: {
    id: 'user-1',
    email: 'driver@example.com',
    first_name: 'Marc',
    last_name: 'Martin',
    phone: '+33600000001',
    profile_photo_url: null,
    status: 'active' as DriverStatus,
    created_at: '2024-01-01T00:00:00Z',
  },
} as const satisfies DriverWithUser;

const mockPaginatedDrivers = {
  drivers: [mockDriverWithUser],
  total: 1,
  page: 1,
  total_pages: 1,
};

const resetStore = () =>
  useDriversStore.setState({
    drivers: [], total: 0, page: 1, totalPages: 1, isLoading: false, error: null,
  });

// ══════════════════════════════════════════════════════════════════════════
// fetchDrivers
// ══════════════════════════════════════════════════════════════════════════
describe('useDriversStore › fetchDrivers', () => {
  beforeEach(() => { resetStore(); jest.clearAllMocks(); });

  it('charge et mappe les chauffeurs vers AuthUser', async () => {
    mockDriverApi.listDrivers.mockResolvedValue({
      ok: true, data: mockPaginatedDrivers as PaginatedDrivers, message: 'OK',
    });

    await act(async () => { await useDriversStore.getState().fetchDrivers(TOKEN); });

    const state = useDriversStore.getState();
    expect(state.drivers).toHaveLength(1);
    expect(state.drivers[0].id).toBe('user-1');
    expect(state.drivers[0].email).toBe('driver@example.com');
    expect(state.drivers[0].role).toBe('driver');
    expect((state.drivers[0] as AuthUser).driver?.status).toBe('active');
    expect(state.total).toBe(1);
    expect(state.isLoading).toBe(false);
  });

  it('transmet les paramètres de filtre à l\'API', async () => {
    mockDriverApi.listDrivers.mockResolvedValue({
      ok: true, data: mockPaginatedDrivers as PaginatedDrivers, message: 'OK',
    });

    await act(async () => {
      await useDriversStore.getState().fetchDrivers(TOKEN, {
        status: 'active' as ListDriversParams['status'],
        zone: 'france' as PricingCountry,
        is_online: true,
        page: 2,
        limit: 10,
      });
    });

    expect(mockDriverApi.listDrivers).toHaveBeenCalledWith(TOKEN, expect.objectContaining({
      status: 'active' as DriverStatus,
      zone: 'france' as PricingCountry,
      is_online: true,
    }));
  });

  it('stocke l\'erreur et la lève si l\'API échoue', async () => {
    mockDriverApi.listDrivers.mockResolvedValue({ ok: false, message: 'Non autorisé' });

    await expect(
      act(async () => { await useDriversStore.getState().fetchDrivers(TOKEN); })
    ).rejects.toThrow('Non autorisé');

    expect(useDriversStore.getState().error).toBe('Non autorisé');
    expect(useDriversStore.getState().isLoading).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// fetchDriverById
// ══════════════════════════════════════════════════════════════════════════
describe('useDriversStore › fetchDriverById', () => {
  beforeEach(() => { resetStore(); jest.clearAllMocks(); });

  it('retourne un AuthUser mappé depuis DriverWithUser', async () => {
    mockDriverApi.getDriverById.mockResolvedValue({
      ok: true, data: mockDriverWithUser as DriverWithUser, message: 'OK',
    });

    let result: AuthUser | null = null;
    await act(async () => {
      result = await useDriversStore.getState().fetchDriverById(TOKEN, 'driver-record-1');
    });

    expect(result).not.toBeNull();
    expect(result!.id).toBe('user-1');
    expect(result!.role).toBe('driver');
    expect(result!.driver!.id).toBe('driver-record-1');
  });

  it('retourne null si l\'API échoue', async () => {
    mockDriverApi.getDriverById.mockResolvedValue({ ok: false, message: 'Not found' });

    let result: AuthUser | null = null;
    await act(async () => {
      result = await useDriversStore.getState().fetchDriverById(TOKEN, 'bad-id');
    });

    expect(result).toBeNull();
    expect(useDriversStore.getState().error).toBe('Not found');
  });
});

// ══════════════════════════════════════════════════════════════════════════
// changeDriverStatus
// ══════════════════════════════════════════════════════════════════════════
describe('useDriversStore › changeDriverStatus', () => {
  beforeEach(() => { resetStore(); jest.clearAllMocks(); });

  it('retourne le chauffeur mis à jour', async () => {
    const updated = { ...mockDriverWithUser, status: 'suspended' as DriverStatus };
    mockDriverApi.changeDriverStatus.mockResolvedValue({
      ok: true, data: updated as DriverWithUser, message: 'OK',
    });

    let result: AuthUser | null = null;
    await act(async () => {
      result = await useDriversStore.getState().changeDriverStatus(
        TOKEN, 'driver-record-1', { status: 'suspended' as ChangeDriverStatusPayload['status'], reason: 'Infraction' },
      );
    });

    expect(result).not.toBeNull();
    expect(result!.driver!.status).toBe('suspended');
  });

  it('retourne null si l\'API échoue', async () => {
    mockDriverApi.changeDriverStatus.mockResolvedValue({ ok: false, message: 'Erreur' });

    let result: AuthUser | null = null;
    await act(async () => {
      result = await useDriversStore.getState().changeDriverStatus(TOKEN, 'id', { status: 'active', reason: '' });
    });

    expect(result).toBeNull();
  });
});

// ══════════════════════════════════════════════════════════════════════════
// clearError
// ══════════════════════════════════════════════════════════════════════════
describe('useDriversStore › clearError', () => {
  it('vide l\'erreur', () => {
    useDriversStore.setState({ error: 'Une erreur' });
    useDriversStore.getState().clearError();
    expect(useDriversStore.getState().error).toBeNull();
  });
});