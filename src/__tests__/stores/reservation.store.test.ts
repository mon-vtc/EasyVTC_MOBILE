// __TEST__/store/reservation.store.test.ts
import { act } from '@testing-library/react-native';
import { useReservationStore } from '../../store/reservation.store';
import { reservationApi } from '../../services/api/reservation.api';
import { vehicleApi } from '../../services/api/vehicle.api';
import { VehicleType, ReservationStatus, Reservation } from '../../types/reservations.types';
import { PricingCountry } from '../../types/pricing.types';

// ── Mocks ──────────────────────────────────────────────────────────────────
jest.mock('../../services/api/reservation.api');
jest.mock('../../services/api/vehicle.api');

const mockReservationApi = reservationApi as jest.Mocked<typeof reservationApi>;
const mockVehicleApi = vehicleApi as jest.Mocked<typeof vehicleApi>;

// ── Fixtures ───────────────────────────────────────────────────────────────
const TOKEN = 'test-token';

const mockReservation = {
  id: 'resa-1',
  client_id: 'client-1',
  driver_id: null,
  assigned_by: null,
  status: 'pending' as ReservationStatus,
  pickup_address: '10 rue de la Paix, Paris',
  pickup_lat: 48.87,
  pickup_lng: 2.33,
  dest_address: 'Aéroport CDG',
  dest_lat: 49.0,
  dest_lng: 2.55,
  vehicle_type: 'berline' as VehicleType,
  country: 'france' as PricingCountry,
  pricing_type: null,
  flat_rate_id: null,
  price_estimated: 45.0,
  price_final: null,
  price_adjusted: null,
  price_breakdown: {},
  distance_km: null,
  duration_min: null,
  scheduled_at: '2024-06-01T10:00:00Z',
  driver_arrived_at: null,
  nb_passengers: 2,
  comment: null,
  promo_code_id: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const mockListResult = {
  reservations: [mockReservation],
  total: 1,
  limit: 10,
  page: 1,
  total_pages: 1,
};

const resetStore = () =>
  useReservationStore.setState({
    reservations: [],
    myReservations: [],
    currentReservation: null,
    total: 0,
    page: 1,
    totalPages: 1,
    selected: null,
    activeRide: null,
    vehicleTypes: [],
    isLoading: false,
    isSubmitting: false,
    isFetchingPrice: false,
    error: null,
  });

// ══════════════════════════════════════════════════════════════════════════
// fetchMine
// ══════════════════════════════════════════════════════════════════════════
describe('useReservationStore › fetchMine', () => {
  beforeEach(() => { resetStore(); jest.clearAllMocks(); });

  it('charge les réservations du client', async () => {
    mockReservationApi.listMine.mockResolvedValue({ ok: true, data: mockListResult, message: 'OK' });

    await act(async () => { await useReservationStore.getState().fetchMine(TOKEN); });

    const state = useReservationStore.getState();
    expect(state.reservations).toHaveLength(1);
    expect(state.myReservations).toHaveLength(1);
    expect(state.total).toBe(1);
    expect(state.isLoading).toBe(false);
  });

  it('applique les filtres de statut et date', async () => {
    mockReservationApi.listMine.mockResolvedValue({ ok: true, data: mockListResult, message: 'OK' });

    await act(async () => {
      await useReservationStore.getState().fetchMine(TOKEN, {
        status: 'completed',
        date_from: '2024-01-01',
        date_to: '2024-12-31',
        page: 2,
        limit: 10,
      });
    });

    expect(mockReservationApi.listMine).toHaveBeenCalledWith(TOKEN, expect.objectContaining({
      status: 'completed',
      date_from: '2024-01-01',
    }));
  });

  it('stocke l\'erreur si l\'API échoue', async () => {
    mockReservationApi.listMine.mockResolvedValue({ ok: false, message: 'Erreur serveur' });

    await expect(
      act(async () => { await useReservationStore.getState().fetchMine(TOKEN); })
    ).rejects.toThrow('Erreur serveur');

    expect(useReservationStore.getState().error).toBe('Erreur serveur');
    expect(useReservationStore.getState().isLoading).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// fetchDriverReservations
// ══════════════════════════════════════════════════════════════════════════
describe('useReservationStore › fetchDriverReservations', () => {
  beforeEach(() => { resetStore(); jest.clearAllMocks(); });

  it('charge les réservations du chauffeur', async () => {
    mockReservationApi.getDriverReservations.mockResolvedValue({
      ok: true, data: mockListResult, message: 'OK',
    });

    await act(async () => {
      await useReservationStore.getState().fetchDriverReservations(TOKEN);
    });

    expect(useReservationStore.getState().reservations).toHaveLength(1);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// fetchAll (admin)
// ══════════════════════════════════════════════════════════════════════════
describe('useReservationStore › fetchAll', () => {
  beforeEach(() => { resetStore(); jest.clearAllMocks(); });

  it('charge toutes les réservations (admin)', async () => {
    const adminList = { ...mockListResult, total: 50, total_pages: 5 };
    mockReservationApi.listAll.mockResolvedValue({ ok: true, data: adminList, message: 'OK' });

    await act(async () => { await useReservationStore.getState().fetchAll(TOKEN); });

    expect(useReservationStore.getState().total).toBe(50);
    expect(useReservationStore.getState().totalPages).toBe(5);
  });

  it('transmet les filtres admin (driver_id, client_id, country)', async () => {
    mockReservationApi.listAll.mockResolvedValue({ ok: true, data: mockListResult, message: 'OK' });

    await act(async () => {
      await useReservationStore.getState().fetchAll(TOKEN, {
        driver_id: 'driver-1',
        client_id: 'client-1',
        country: 'senegal',
      });
    });

    expect(mockReservationApi.listAll).toHaveBeenCalledWith(TOKEN, expect.objectContaining({
      driver_id: 'driver-1',
      client_id: 'client-1',
      country: 'senegal',
    }));
  });
});

// ══════════════════════════════════════════════════════════════════════════
// fetchById
// ══════════════════════════════════════════════════════════════════════════
describe('useReservationStore › fetchById', () => {
  beforeEach(() => { resetStore(); jest.clearAllMocks(); });

  it('charge la réservation et la place dans selected et currentReservation', async () => {
    mockReservationApi.getById.mockResolvedValue({
      ok: true, data: mockReservation, message: 'OK',
    });

    await act(async () => { await useReservationStore.getState().fetchById(TOKEN, 'resa-1'); });

    const state = useReservationStore.getState();
    expect(state.selected?.id).toBe('resa-1');
    expect(state.currentReservation?.id).toBe('resa-1');
  });

  it('lève une erreur si non trouvé', async () => {
    mockReservationApi.getById.mockResolvedValue({ ok: false, message: 'Réservation introuvable' });

    await expect(
      act(async () => { await useReservationStore.getState().fetchById(TOKEN, 'bad-id'); })
    ).rejects.toThrow('Réservation introuvable');
  });
});

// ══════════════════════════════════════════════════════════════════════════
// fetchDriverActive
// ══════════════════════════════════════════════════════════════════════════
describe('useReservationStore › fetchDriverActive', () => {
  beforeEach(() => { resetStore(); jest.clearAllMocks(); });

  it('stocke la course active', async () => {
    const activeRide = { ...mockReservation, status: 'assigned' as  ReservationStatus };
    mockReservationApi.getDriverActive.mockResolvedValue({
      ok: true, data: activeRide, message: 'OK',
    });

    await act(async () => { await useReservationStore.getState().fetchDriverActive(TOKEN); });

    expect(useReservationStore.getState().activeRide?.id).toBe('resa-1');
  });

  it('retourne null si aucune course active', async () => {
    mockReservationApi.getDriverActive.mockResolvedValue({ ok: true, data: null, message: 'OK' });

    await act(async () => { await useReservationStore.getState().fetchDriverActive(TOKEN); });

    expect(useReservationStore.getState().activeRide).toBeNull();
  });
});

// ══════════════════════════════════════════════════════════════════════════
// cancel
// ══════════════════════════════════════════════════════════════════════════
describe('useReservationStore › cancel', () => {
  beforeEach(() => { resetStore(); jest.clearAllMocks(); });

  it('met à jour le statut de la réservation annulée dans la liste', async () => {
    const cancelled = { ...mockReservation, status: 'cancelled' as  ReservationStatus };
    useReservationStore.setState({ reservations: [mockReservation], selected: mockReservation });
    mockReservationApi.cancel.mockResolvedValue({ ok: true, data: cancelled, message: 'OK' });

    await act(async () => { await useReservationStore.getState().cancel(TOKEN, 'resa-1', 'Changement de plan'); });

    expect(useReservationStore.getState().reservations[0].status).toBe('cancelled');
    expect(useReservationStore.getState().selected?.status).toBe('cancelled');
  });
});

// ══════════════════════════════════════════════════════════════════════════
// Actions chauffeur : arrive / start / complete
// ══════════════════════════════════════════════════════════════════════════
describe('useReservationStore › arrive', () => {
  beforeEach(() => { resetStore(); jest.clearAllMocks(); });

  it('appelle reservationApi.arrive', async () => {
    mockReservationApi.arrive.mockResolvedValue({ ok: true, data: undefined, message: 'OK' });
    await act(async () => { await useReservationStore.getState().arrive(TOKEN, 'resa-1'); });
    expect(mockReservationApi.arrive).toHaveBeenCalledWith(TOKEN, 'resa-1');
  });

  it('propage l\'erreur réseau', async () => {
    mockReservationApi.arrive.mockRejectedValue(new Error('Network'));
    await expect(
      act(async () => { await useReservationStore.getState().arrive(TOKEN, 'resa-1'); })
    ).rejects.toThrow('Network');
  });
});

describe('useReservationStore › start', () => {
  beforeEach(() => { resetStore(); jest.clearAllMocks(); });

  it('met à jour activeRide après démarrage', async () => {
    const inProgress = { ...mockReservation, status: 'in_progress' as  ReservationStatus };
    mockReservationApi.start.mockResolvedValue({ ok: true, data: inProgress, message: 'OK' });

    await act(async () => { await useReservationStore.getState().start(TOKEN, 'resa-1'); });

    expect(useReservationStore.getState().activeRide?.status).toBe('in_progress');
  });
});

describe('useReservationStore › complete', () => {
  beforeEach(() => { resetStore(); jest.clearAllMocks(); });

  it('réinitialise activeRide après complétion', async () => {
    const completed = { ...mockReservation, status: 'completed' as  ReservationStatus };
    useReservationStore.setState({ activeRide: mockReservation });
    mockReservationApi.complete.mockResolvedValue({ ok: true, data: completed, message: 'OK' });

    await act(async () => {
      await useReservationStore.getState().complete(TOKEN, 'resa-1', 12.5, 25, 'RAS', 42.0);
    });

    expect(useReservationStore.getState().activeRide).toBeNull();
    expect(mockReservationApi.complete).toHaveBeenCalledWith(
      TOKEN, 'resa-1', 12.5, 25, 'RAS', 42.0,
    );
  });
});

// ══════════════════════════════════════════════════════════════════════════
// assign (admin)
// ══════════════════════════════════════════════════════════════════════════
describe('useReservationStore › assign', () => {
  beforeEach(() => { resetStore(); jest.clearAllMocks(); });

  it('met à jour la réservation avec le chauffeur assigné', async () => {
    const assigned = { ...mockReservation, status: 'assigned' as  ReservationStatus, driver_id: 'driver-1' };
    useReservationStore.setState({ reservations: [mockReservation] });
    mockReservationApi.assign.mockResolvedValue({ ok: true, data: assigned, message: 'OK' });

    await act(async () => {
      await useReservationStore.getState().assign(TOKEN, 'resa-1', 'driver-1');
    });

    expect(useReservationStore.getState().reservations[0].status).toBe('assigned');
    expect(mockReservationApi.assign).toHaveBeenCalledWith(TOKEN, 'resa-1', 'driver-1');
  });
});

// ══════════════════════════════════════════════════════════════════════════
// Setters du formulaire booking
// ══════════════════════════════════════════════════════════════════════════
describe('useReservationStore › booking setters', () => {
  beforeEach(() => { resetStore(); jest.clearAllMocks(); });

  const origin = { address: '10 rue de la Paix', latitude: 48.87, longitude: 2.33 };
  const destination = { address: 'CDG', latitude: 49.00, longitude: 2.55 };

  it('setOrigin met à jour booking.origin', () => {
    useReservationStore.getState().setOrigin(origin);
    expect(useReservationStore.getState().booking.origin).toEqual(origin);
  });

  it('setDestination met à jour booking.destination', () => {
    useReservationStore.getState().setDestination(destination);
    expect(useReservationStore.getState().booking.destination).toEqual(destination);
  });

  it('setVehicleType met à jour booking.vehicle_type', () => {
    useReservationStore.getState().setVehicleType('van');
    expect(useReservationStore.getState().booking.vehicle_type).toBe('van');
  });

  it('setDate et setTime mettent à jour les champs correspondants', () => {
    useReservationStore.getState().setDate('2024-12-25');
    useReservationStore.getState().setTime('14:30');
    const { booking } = useReservationStore.getState();
    expect(booking.date).toBe('2024-12-25');
    expect(booking.time).toBe('14:30');
  });

  it('setPassengers met à jour nb_passengers', () => {
    useReservationStore.getState().setPassengers(3);
    expect(useReservationStore.getState().booking.nb_passengers).toBe(3);
  });

  it('setEstimate met à jour estimated_price, distance_km et duration_min', () => {
    useReservationStore.getState().setEstimate(55.5, 18.3, 30);
    const { booking } = useReservationStore.getState();
    expect(booking.estimated_price).toBe(55.5);
    expect(booking.distance_km).toBe(18.3);
    expect(booking.duration_min).toBe(30);
  });

  it('setFlatRateId met à jour flat_rate_id', () => {
    useReservationStore.getState().setFlatRateId('flat-1');
    expect(useReservationStore.getState().booking.flat_rate_id).toBe('flat-1');
  });

  it('resetBooking restaure l\'état initial', () => {
    useReservationStore.getState().setOrigin(origin);
    useReservationStore.getState().setPassengers(5);
    useReservationStore.getState().resetBooking();
    const { booking } = useReservationStore.getState();
    expect(booking.origin).toBeNull();
    expect(booking.nb_passengers).toBe(1); // valeur initiale
  });
});

// ══════════════════════════════════════════════════════════════════════════
// submitBooking
// ══════════════════════════════════════════════════════════════════════════
describe('useReservationStore › submitBooking', () => {
  const origin = { address: '10 rue de la Paix', latitude: 48.87, longitude: 2.33 };
  const destination = { address: 'CDG', latitude: 49.00, longitude: 2.55 };

  beforeEach(() => {
    resetStore();
    jest.clearAllMocks();
    // Préparer un booking complet
    useReservationStore.getState().setOrigin(origin);
    useReservationStore.getState().setDestination(destination);
    useReservationStore.getState().setVehicleType('berline');
    useReservationStore.getState().setDate('2024-12-25');
    useReservationStore.getState().setTime('14:30');
  });

  it('crée la réservation et l\'ajoute à la liste', async () => {
    mockReservationApi.create.mockResolvedValue({
      ok: true, data: mockReservation, message: 'Created',
    });

    let result: Reservation | null = null;
    await act(async () => {
      result = await useReservationStore.getState().submitBooking(TOKEN, 'france' as PricingCountry );
    });

    expect(result!.id).toBe('resa-1');
    expect(useReservationStore.getState().reservations).toHaveLength(1);
    expect(useReservationStore.getState().isSubmitting).toBe(false);
  });

  it('lève une erreur si le formulaire est incomplet', async () => {
    useReservationStore.getState().setOrigin(null);

    await expect(
      act(async () => { await useReservationStore.getState().submitBooking(TOKEN, 'france' as PricingCountry ); })
    ).rejects.toThrow('Formulaire incomplet');
  });

  it('construit le DTO avec les bons noms de champs backend', async () => {
    useReservationStore.getState().setEstimate(45.0, 12.5, 25);
    useReservationStore.getState().setFlatRateId('flat-1');
    useReservationStore.getState().setComment('Urgent');
    mockReservationApi.create.mockResolvedValue({
      ok: true, data: mockReservation, message: 'Created',
    });

    await act(async () => {
      await useReservationStore.getState().submitBooking(TOKEN, 'france' as PricingCountry );
    });

    expect(mockReservationApi.create).toHaveBeenCalledWith(TOKEN, expect.objectContaining({
      pickup_address: '10 rue de la Paix',
      dest_address: 'CDG',
      vehicle_type: 'berline',
      country: 'france' as PricingCountry ,
      distance_km: 12.5,
      duration_min: 25,
      flat_rate_id: 'flat-1',
      comment: 'Urgent',
    }));
  });
});

// ══════════════════════════════════════════════════════════════════════════
// fetchVehicleTypes
// ══════════════════════════════════════════════════════════════════════════
describe('useReservationStore › fetchVehicleTypes', () => {
  beforeEach(() => { resetStore(); jest.clearAllMocks(); });

  it('charge les types de véhicule', async () => {
    const types = [
      {
        type: 'berline' as VehicleType,
        label: 'BMW Série 3',
        description: 'Voiture de luxe',
        base_price: 25.0,
        icon: 'car',
        capacity: 4,
      },
    ];
    mockVehicleApi.getVehicleTypes.mockResolvedValue({ ok: true, data: types, message: 'OK' });

    await act(async () => {
      await useReservationStore.getState().fetchVehicleTypes(TOKEN, 'france' as PricingCountry  as PricingCountry );
    });

    expect(useReservationStore.getState().vehicleTypes).toHaveLength(1);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// clearError / clearSelected
// ══════════════════════════════════════════════════════════════════════════
describe('useReservationStore › clearError & clearSelected', () => {
  it('clearError vide l\'erreur', () => {
    useReservationStore.setState({ error: 'Une erreur' });
    useReservationStore.getState().clearError();
    expect(useReservationStore.getState().error).toBeNull();
  });

  it('clearSelected vide selected', () => {
    useReservationStore.setState({ selected: mockReservation });
    useReservationStore.getState().clearSelected();
    expect(useReservationStore.getState().selected).toBeNull();
  });
});