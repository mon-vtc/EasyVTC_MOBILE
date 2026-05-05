// __TEST__/stores/auth.store.test.ts
import { act } from '@testing-library/react-native';
import { useAuthStore, mapApiUser } from '../../store/auth.store';
import { authApi } from '../../services/api/auth.api';
import { userApi } from '../../services/api/user.api';
import { authStorage as secureStorage } from '../../services/auth/auth-storage';
import { AuthUser, UserRole, UserStatus } from '../../types';
import { DriverStatus } from '../../types/auth.types';
import { PricingCountry } from '../../types/pricing.types';
import { DriverProfile, Vehicle, VehicleType } from '../../types/user.types';

// ── Mocks ──────────────────────────────────────────────────────────────────
jest.mock('../../services/api/auth.api');
jest.mock('../../services/api/user.api');
jest.mock('../../services/auth/auth-storage');

const mockAuthApi = authApi as jest.Mocked<typeof authApi>;
const mockUserApi = userApi as jest.Mocked<typeof userApi>;
const mockStorage = secureStorage as jest.Mocked<typeof secureStorage>;

// ── Fixtures ───────────────────────────────────────────────────────────────
const baseUser = {
  id: 'user-1',
  email: 'test@example.com',
  role: 'client' as UserRole,
  first_name: 'Jean',
  last_name: 'Dupont',
  phone: '+33600000000',
  profile_photo_url: null,
  device_token: null,
  status: 'active' as UserStatus,
  status_reason: null,
  status_changed_at: null,
  status_changed_by: null,
  rgpd_consent: false,
  rgpd_consent_at: null,
  deleted_at: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  // Dans mapApiUser, si role === 'driver' && !raw.driver :
  driver: null,
  // {
  //   id: 'driver-record-1',
  //   status: 'pending' as DriverStatus,
  //   vehicle_type: null,
  //   siret: null,
  //   zone: 'france' as PricingCountry,
  //   tva_rate: 0,
  //   is_online: false,
  //   created_at: '2024-01-01T00:00:00Z',
  //   updated_at: '2024-01-01T00:00:00Z',
  // },
  vehicle: null,
} as const satisfies AuthUser;

const driverRawUser = {
  ...baseUser,
  role: 'driver' as UserRole,
  driver: {
    id: 'driver-record-1',
    status: 'active'  as DriverStatus,
    vehicle_type: 'berline' as VehicleType,
    siret: '1234567890 1234',
    zone: 'france' as PricingCountry,
    iban: 'FR76...',
    vtc_license: 'VTC123',
    tva_rate: 20,
    is_online: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  } as DriverProfile,
  vehicle: {
    id: 'string',
    driver_id: 'string',
    plate_number: 'string',
    brand: 'string',
    model: 'string',
    year: 2021,
    color: 'string',
    type: 'standard' as VehicleType,
    photo_url: 'string',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
   } as const satisfies Vehicle,
} as const satisfies AuthUser;

const ACCESS_TOKEN = 'access-token-xyz';
const REFRESH_TOKEN = 'refresh-token-abc';

// ── Helpers ────────────────────────────────────────────────────────────────
const resetStore = () => useAuthStore.setState({
  user: null,
  localAvatarUri: null,
  accessToken: null,
  refreshToken: null,
  isLoading: false,
  isHydrated: false,
  error: null,
});

// ══════════════════════════════════════════════════════════════════════════
// mapApiUser
// ══════════════════════════════════════════════════════════════════════════
describe('mapApiUser', () => {
  it('retourne le user tel quel si role !== driver', () => {
    const clientUser = { ...baseUser, role: 'client' as UserRole };
    const result = mapApiUser(clientUser);
    expect(result).toEqual(clientUser);
  });

  // Remplace toutes les assertions du describe('mapApiUser')
  it('aplatit les champs driver depuis raw.driver', () => {
    const result = mapApiUser(driverRawUser);
    expect(result.driver?.status).toBe('active' as DriverStatus);
    expect(result.driver?.vehicle_type).toBe('berline' as VehicleType);
    expect(result.driver?.siret).toBe('1234567890 1234');
    expect(result.driver?.zone).toBe('france' as PricingCountry);  // ← voir note ci-dessous
    expect(result.driver?.tva_rate).toBe(20);
    expect(result.driver?.is_online).toBe(false);
    // expect(result.driver?.vehicle).toEqual({ id: 'v-1', brand: 'Tesla', model: '3' });
  });

  it('utilise des valeurs par défaut si driver est absent', () => {
    const result = mapApiUser({ ...baseUser, role: 'driver' as UserRole, driver: null });
    expect(result.driver?.status).toBe('pending' as DriverStatus);
    expect(result.driver?.vehicle_type).toBeNull();
    expect(result.driver?.is_online).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// login
// ══════════════════════════════════════════════════════════════════════════
describe('useAuthStore › login', () => {
  beforeEach(() => {
    resetStore();
    jest.clearAllMocks();
  });

  it('met à jour le store après un login réussi', async () => {
    mockAuthApi.login.mockResolvedValue({
      ok: true,
      data: { user: baseUser, access_token: ACCESS_TOKEN, refresh_token: REFRESH_TOKEN },
      message: 'OK',
    });
    mockStorage.setTokens.mockResolvedValue(undefined);

    await act(async () => {
      await useAuthStore.getState().login({ email: 'test@example.com', password: 'password' });
    });

    const state = useAuthStore.getState();
    expect(state.user).toMatchObject({ id: 'user-1' });
    expect(state.accessToken).toBe(ACCESS_TOKEN);
    expect(state.refreshToken).toBe(REFRESH_TOKEN);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
    expect(mockStorage.setTokens).toHaveBeenCalledWith(ACCESS_TOKEN, REFRESH_TOKEN);
  });

  it('stocke une erreur si l\'API retourne ok: false', async () => {
    mockAuthApi.login.mockResolvedValue({ ok: false, message: 'Identifiants incorrects' });

    await expect(
      act(async () => { await useAuthStore.getState().login({ email: 'x', password: 'y' }); })
    ).rejects.toThrow('Identifiants incorrects');

    const state = useAuthStore.getState();
    expect(state.error).toBe('Identifiants incorrects');
    expect(state.user).toBeNull();
    expect(state.isLoading).toBe(false);
  });

  it('passe isLoading à true pendant le login', async () => {
    let resolveLogin: any;
    mockAuthApi.login.mockReturnValue(new Promise(r => { resolveLogin = r; }));

    act(() => { useAuthStore.getState().login({ email: 'a', password: 'b' }).catch(() => {}); });
    expect(useAuthStore.getState().isLoading).toBe(true);

    await act(async () => {
      resolveLogin({ ok: false, message: 'err' });
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════
// loginWithGoogle
// ══════════════════════════════════════════════════════════════════════════
describe('useAuthStore › loginWithGoogle', () => {
  beforeEach(() => { resetStore(); jest.clearAllMocks(); });

  it('connecte via google avec access_token', async () => {
    mockAuthApi.google.mockResolvedValue({
      ok: true,
      data: { user: baseUser, access_token: ACCESS_TOKEN, refresh_token: null },
      message: 'OK',
    });
    mockStorage.setTokens.mockResolvedValue(undefined);

    await act(async () => {
      await useAuthStore.getState().loginWithGoogle('google-token');
    });

    expect(useAuthStore.getState().user?.id).toBe('user-1');
    expect(mockAuthApi.google).toHaveBeenCalledWith('google-token', undefined);
  });

  it('propage l\'erreur si google retourne ok: false', async () => {
    mockAuthApi.google.mockResolvedValue({ ok: false, message: 'Google error' });

    await expect(
      act(async () => { await useAuthStore.getState().loginWithGoogle('bad-token'); })
    ).rejects.toThrow('Google error');
  });
});

// ══════════════════════════════════════════════════════════════════════════
// register
// ══════════════════════════════════════════════════════════════════════════
describe('useAuthStore › register', () => {
  beforeEach(() => { resetStore(); jest.clearAllMocks(); });

  it('crée un compte et met à jour le store', async () => {
    mockAuthApi.register.mockResolvedValue({
      ok: true,
      data: { user: baseUser, access_token: ACCESS_TOKEN, refresh_token: REFRESH_TOKEN },
      message: 'Created',
    });
    mockStorage.setTokens.mockResolvedValue(undefined);

    await act(async () => {
      await useAuthStore.getState().register({
        email: 'test@example.com',
        password: 'pass',
        first_name: 'Jean',
        last_name: 'Dupont',
        phone: '+33600000000',
        role: 'client',
        accept_terms: true,   // ← ajouter
        rgpd_consent: true,
      });
    });

    expect(useAuthStore.getState().accessToken).toBe(ACCESS_TOKEN);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// hydrate
// ══════════════════════════════════════════════════════════════════════════
describe('useAuthStore › hydrate', () => {
  beforeEach(() => { resetStore(); jest.clearAllMocks(); });

  it('restaure la session si le token est valide', async () => {
    mockStorage.getAccessToken.mockResolvedValue(ACCESS_TOKEN);
    mockStorage.getRefreshToken.mockResolvedValue(REFRESH_TOKEN);
    mockAuthApi.me.mockResolvedValue({ ok: true, data: baseUser, message: 'OK' });

    await act(async () => { await useAuthStore.getState().hydrate(); });

    const state = useAuthStore.getState();
    expect(state.user?.id).toBe('user-1');
    expect(state.isHydrated).toBe(true);
  });

  it('rafraîchit le token si /auth/me échoue', async () => {
    mockStorage.getAccessToken.mockResolvedValue('expired-token');
    mockStorage.getRefreshToken.mockResolvedValue(REFRESH_TOKEN);
    mockAuthApi.me
      .mockResolvedValueOnce({ ok: false, message: 'Unauthorized' })
      .mockResolvedValueOnce({ ok: true, data: baseUser, message: 'OK' });
    mockAuthApi.refresh.mockResolvedValue({
      ok: true,
      data: { access_token: ACCESS_TOKEN, refresh_token: REFRESH_TOKEN },
      message: 'OK',
    });
    mockStorage.setTokens.mockResolvedValue(undefined);

    await act(async () => { await useAuthStore.getState().hydrate(); });

    expect(mockAuthApi.refresh).toHaveBeenCalledWith(REFRESH_TOKEN);
    expect(useAuthStore.getState().user?.id).toBe('user-1');
  });

  it('déconnecte si aucun token disponible', async () => {
    mockStorage.getAccessToken.mockResolvedValue(null);
    mockStorage.getRefreshToken.mockResolvedValue(null);
    mockStorage.clearTokens.mockResolvedValue(undefined);

    await act(async () => { await useAuthStore.getState().hydrate(); });

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isHydrated).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// logout
// ══════════════════════════════════════════════════════════════════════════
describe('useAuthStore › logout', () => {
  beforeEach(() => { resetStore(); jest.clearAllMocks(); });

  it('vide le store et appelle clearTokens', async () => {
    useAuthStore.setState({ user: baseUser, accessToken: ACCESS_TOKEN });
    mockAuthApi.logout.mockResolvedValue({ ok: true, data: null, message: 'OK' });
    mockStorage.clearTokens.mockResolvedValue(undefined);

    await act(async () => { await useAuthStore.getState().logout(); });

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(mockStorage.clearTokens).toHaveBeenCalled();
  });

  it('déconnecte même si l\'appel API échoue', async () => {
    useAuthStore.setState({ user: baseUser, accessToken: ACCESS_TOKEN });
    mockAuthApi.logout.mockRejectedValue(new Error('Network error'));
    mockStorage.clearTokens.mockResolvedValue(undefined);

    await act(async () => { await useAuthStore.getState().logout(); });

    expect(useAuthStore.getState().user).toBeNull();
  });
});

// ══════════════════════════════════════════════════════════════════════════
// changePassword
// ══════════════════════════════════════════════════════════════════════════
describe('useAuthStore › changePassword', () => {
  beforeEach(() => { resetStore(); jest.clearAllMocks(); });

  it('appelle authApi.changePassword avec les bons paramètres', async () => {
    useAuthStore.setState({ accessToken: ACCESS_TOKEN });
    mockAuthApi.changePassword.mockResolvedValue({ ok: true, data: null, message: 'OK' });

    await act(async () => {
      await useAuthStore.getState().changePassword('old', 'new', 'new');
    });

    expect(mockAuthApi.changePassword).toHaveBeenCalledWith('old', 'new', 'new', ACCESS_TOKEN);
    expect(useAuthStore.getState().isLoading).toBe(false);
  });

  it('lève une erreur si non authentifié', async () => {
    await expect(
      act(async () => { await useAuthStore.getState().changePassword('old', 'new', 'new'); })
    ).rejects.toThrow('Utilisateur non authentifié');
  });
});

// ══════════════════════════════════════════════════════════════════════════
// updateProfile
// ══════════════════════════════════════════════════════════════════════════
describe('useAuthStore › updateProfile', () => {
  beforeEach(() => { resetStore(); jest.clearAllMocks(); });

  it('met à jour le user dans le store', async () => {
    const updatedUser = { ...baseUser, first_name: 'Pierre' };
    useAuthStore.setState({ user: baseUser, accessToken: ACCESS_TOKEN });
    mockUserApi.updateMe.mockResolvedValue({ ok: true, data: updatedUser, message: 'OK' });

    await act(async () => {
      await useAuthStore.getState().updateProfile({ first_name: 'Pierre' });
    });

    expect(useAuthStore.getState().user?.first_name).toBe('Pierre');
  });
});

// ══════════════════════════════════════════════════════════════════════════
// uploadAvatar
// ══════════════════════════════════════════════════════════════════════════
describe('useAuthStore › uploadAvatar', () => {
  beforeEach(() => { resetStore(); jest.clearAllMocks(); });

  it('met à jour profile_photo_url après l\'upload', async () => {
    useAuthStore.setState({ user: baseUser, accessToken: ACCESS_TOKEN });
    mockAuthApi.uploadAvatar.mockResolvedValue({
      ok: true,
      data: { profile_photo_url: 'https://cdn.example.com/avatar.jpg' },
      message: 'OK',
    });

    await act(async () => {
      await useAuthStore.getState().uploadAvatar(new FormData());
    });

    expect(useAuthStore.getState().user?.profile_photo_url).toBe('https://cdn.example.com/avatar.jpg');
  });

  it('stocke localAvatarUri si fourni', async () => {
    useAuthStore.setState({ user: baseUser, accessToken: ACCESS_TOKEN });
    mockAuthApi.uploadAvatar.mockResolvedValue({
      ok: true,
      data: { profile_photo_url: 'https://cdn.example.com/avatar.jpg' },
      message: 'OK',
    });

    await act(async () => {
      await useAuthStore.getState().uploadAvatar(new FormData(), 'file:///local/photo.jpg');
    });

    expect(useAuthStore.getState().localAvatarUri).toBe('file:///local/photo.jpg');
  });
});

// ══════════════════════════════════════════════════════════════════════════
// clearError / forceLogout
// ══════════════════════════════════════════════════════════════════════════
describe('useAuthStore › clearError & forceLogout', () => {
  it('clearError vide l\'erreur', () => {
    useAuthStore.setState({ error: 'Une erreur' });
    useAuthStore.getState().clearError();
    expect(useAuthStore.getState().error).toBeNull();
  });

  it('forceLogout vide le store sans appel API', async () => {
    useAuthStore.setState({ user: baseUser, accessToken: ACCESS_TOKEN });
    mockStorage.clearTokens.mockResolvedValue(undefined);

    await act(async () => { await useAuthStore.getState().forceLogout(); });

    expect(useAuthStore.getState().user).toBeNull();
    expect(mockAuthApi.logout).not.toHaveBeenCalled();
  });
});