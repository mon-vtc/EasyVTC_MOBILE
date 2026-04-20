/**
 * Tests unitaires + régression — useAuthStore (src/store/auth.store.ts)
 *
 * Couvre : login, register, logout, hydrate, forgotPassword,
 *          changePassword, resetPassword, loginWithGoogle, uploadAvatar.
 *
 * Mocks : authApi, userApi, secureStorage (expo-secure-store)
 */

import { act } from '@testing-library/react-native';

// ── Mocks ────────────────────────────────────────────────────────
jest.mock('../services/api/auth.api', () => ({
  authApi: {
    login:          jest.fn(),
    register:       jest.fn(),
    logout:         jest.fn(),
    me:             jest.fn(),
    refresh:        jest.fn(),
    google:         jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword:  jest.fn(),
    changePassword: jest.fn(),
    uploadAvatar:   jest.fn(),
  },
}));

jest.mock('../services/api/user.api', () => ({
  userApi: {
    updateMe: jest.fn(),
  },
}));

jest.mock('../services/auth/auth-storage', () => ({
  authStorage: {
    getAccessToken:  jest.fn(),
    getRefreshToken: jest.fn(),
    setTokens:       jest.fn(),
    clearTokens:     jest.fn(),
  },
}));

import { authApi }     from '../services/api/auth.api';
import { authStorage } from '../services/auth/auth-storage';

// Import du store APRÈS les mocks
import { useAuthStore } from '../store/auth.store';

// ── Helpers ──────────────────────────────────────────────────────
const mockApi = authApi as jest.Mocked<typeof authApi>;
const mockStorage = authStorage as jest.Mocked<typeof authStorage>;

const mockUser = {
  id:                'uuid-123',
  email:             'test@easyvtc.com',
  role:              'client' as const,
  first_name:        'Jean',
  last_name:         'Dupont',
  phone:             '+33612345678',
  profile_photo_url: null,
  device_token:      null,
  status:            'active' as const,
  status_reason:     null,
  status_changed_at: null,
  status_changed_by: null,
  rgpd_consent:      true,
  rgpd_consent_at:   null,
  deleted_at:        null,
  created_at:        '2026-03-16T10:00:00Z',
  updated_at:        '2026-03-16T10:00:00Z',
};

const mockTokens = {
  access_token:  'access-tok',
  refresh_token: 'refresh-tok',
};

function getStore() {
  return useAuthStore.getState();
}

function resetStore() {
  useAuthStore.setState({
    user: null, accessToken: null, refreshToken: null,
    isLoading: false, isHydrated: false, error: null, localAvatarUri: null,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  resetStore();
});

// ══════════════════════════════════════════════════════════════════
// login
// ══════════════════════════════════════════════════════════════════
describe('login()', () => {
  it(' met à jour user + tokens dans le store', async () => {
    mockApi.login.mockResolvedValueOnce({
      ok: true,
      data: { user: mockUser, ...mockTokens },
    });

    await act(async () => {
      await getStore().login({ email: 'test@easyvtc.com', password: 'Pass1234' });
    });

    const state = getStore();
    expect(state.user?.id).toBe('uuid-123');
    expect(state.accessToken).toBe('access-tok');
    expect(state.isLoading).toBe(false);
    expect(mockStorage.setTokens).toHaveBeenCalledWith('access-tok', 'refresh-tok');
  });

  it(' remplit error si API retourne ok:false', async () => {
    mockApi.login.mockResolvedValueOnce({ ok: false, message: 'Email ou mot de passe incorrect' });

    await expect(
      act(async () => getStore().login({ email: 'x@x.com', password: 'wrong' }))
    ).rejects.toThrow();

    expect(getStore().error).toContain('Email ou mot de passe incorrect');
  });

  it(' isLoading revient à false après erreur', async () => {
    mockApi.login.mockRejectedValueOnce(new Error('Réseau indisponible'));

    await expect(
      act(async () => getStore().login({ email: 'x@x.com', password: 'p' }))
    ).rejects.toThrow();

    expect(getStore().isLoading).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════
// register
// ══════════════════════════════════════════════════════════════════
describe('register()', () => {
  it(' crée le compte et met le user dans le store', async () => {
    mockApi.register.mockResolvedValueOnce({
      ok: true,
      data: { user: mockUser, ...mockTokens },
    });

    await act(async () => {
      await getStore().register({
        email: 'new@test.com', password: 'Test1234', first_name: 'Jean',
        last_name: 'Dupont', phone: '+33612345678', role: 'client', accept_terms: true,
      });
    });

    expect(getStore().user?.email).toBe('test@easyvtc.com');
    expect(mockStorage.setTokens).toHaveBeenCalled();
  });

  it(' gère email déjà existant', async () => {
    mockApi.register.mockResolvedValueOnce({ ok: false, message: 'Un compte existe déjà avec cet email' });

    await expect(
      act(async () => getStore().register({
        email: 'dup@test.com', password: 'Test1234', first_name: 'A',
        last_name: 'B', phone: '+33611111111', role: 'client', accept_terms: true,
      }))
    ).rejects.toThrow();

    expect(getStore().error).toContain('compte existe déjà');
  });
});

// ══════════════════════════════════════════════════════════════════
// logout
// ══════════════════════════════════════════════════════════════════
describe('logout()', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: mockUser, accessToken: 'tok', refreshToken: 'ref' });
  });

  it(' vide le store et efface les tokens', async () => {
    mockApi.logout.mockResolvedValueOnce({ ok: true, data: null });

    await act(async () => { await getStore().logout(); });

    const state = getStore();
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(mockStorage.clearTokens).toHaveBeenCalled();
  });

  it(' vide le store même si API logout échoue', async () => {
    mockApi.logout.mockRejectedValueOnce(new Error('Network error'));

    await act(async () => { await getStore().logout(); });

    expect(getStore().user).toBeNull();
    expect(mockStorage.clearTokens).toHaveBeenCalled();
  });
});

// ══════════════════════════════════════════════════════════════════
// hydrate
// ══════════════════════════════════════════════════════════════════
describe('hydrate()', () => {
  it(' restaure la session depuis le token stocké', async () => {
    mockStorage.getAccessToken.mockResolvedValueOnce('stored-tok');
    mockStorage.getRefreshToken.mockResolvedValueOnce('stored-ref');
    mockApi.me.mockResolvedValueOnce({ ok: true, data: mockUser });

    await act(async () => { await getStore().hydrate(); });

    const state = getStore();
    expect(state.user?.id).toBe('uuid-123');
    expect(state.isHydrated).toBe(true);
  });

  it(' tente le refresh si /me échoue', async () => {
    mockStorage.getAccessToken.mockResolvedValueOnce('expired-tok');
    mockStorage.getRefreshToken.mockResolvedValueOnce('valid-ref');
    mockApi.me
      .mockResolvedValueOnce({ ok: false, message: 'Token expiré' })  // premier /me
      .mockResolvedValueOnce({ ok: true, data: mockUser });           // deuxième après refresh
    mockApi.refresh.mockResolvedValueOnce({
      ok: true,
      data: { access_token: 'new-tok', refresh_token: 'new-ref' },
    });

    await act(async () => { await getStore().hydrate(); });

    expect(mockApi.refresh).toHaveBeenCalled();
    expect(getStore().user?.id).toBe('uuid-123');
  });

  it(' déconnecte si pas de token stocké', async () => {
    mockStorage.getAccessToken.mockResolvedValueOnce(null);
    mockStorage.getRefreshToken.mockResolvedValueOnce(null);

    await act(async () => { await getStore().hydrate(); });

    const state = getStore();
    expect(state.user).toBeNull();
    expect(state.isHydrated).toBe(true);
    expect(mockStorage.clearTokens).toHaveBeenCalled();
  });
});

// ══════════════════════════════════════════════════════════════════
// forgotPassword
// ══════════════════════════════════════════════════════════════════
describe('forgotPassword()', () => {
  it(' appelle API sans erreur', async () => {
    mockApi.forgotPassword.mockResolvedValueOnce({ ok: true, data: null });

    await act(async () => { await getStore().forgotPassword('test@easyvtc.com'); });

    expect(mockApi.forgotPassword).toHaveBeenCalledWith('test@easyvtc.com');
    expect(getStore().isLoading).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════
// resetPassword — nouveau
// ══════════════════════════════════════════════════════════════════
describe('resetPassword()', () => {
  it(' appelle API avec token + new_password', async () => {
    mockApi.resetPassword.mockResolvedValueOnce({ ok: true, data: null });

    await act(async () => {
      await getStore().resetPassword('eyJhbGci...', 'NewPass123');
    });

    expect(mockApi.resetPassword).toHaveBeenCalledWith('eyJhbGci...', 'NewPass123');
    expect(getStore().isLoading).toBe(false);
    expect(getStore().error).toBeNull();
  });

  it(' remplit error si token invalide', async () => {
    mockApi.resetPassword.mockResolvedValueOnce({ ok: false, message: 'Token invalide ou expiré' });

    await expect(
      act(async () => getStore().resetPassword('bad', 'NewPass123'))
    ).rejects.toThrow();

    expect(getStore().error).toContain('Token invalide');
  });
});

// ══════════════════════════════════════════════════════════════════
// changePassword
// ══════════════════════════════════════════════════════════════════
describe('changePassword()', () => {
  beforeEach(() => {
    useAuthStore.setState({ accessToken: 'my-token' });
  });

  it(' appelle API avec les 3 paramètres', async () => {
    mockApi.changePassword.mockResolvedValueOnce({ ok: true, data: null });

    await act(async () => {
      await getStore().changePassword('Old1234', 'New5678A', 'New5678A');
    });

    expect(mockApi.changePassword).toHaveBeenCalledWith('Old1234', 'New5678A', 'New5678A', 'my-token');
  });

  it(' 401 si ancien mot de passe incorrect', async () => {
    mockApi.changePassword.mockResolvedValueOnce({ ok: false, message: 'Mot de passe actuel incorrect' });

    await expect(
      act(async () => getStore().changePassword('wrong', 'New5678A', 'New5678A'))
    ).rejects.toThrow();

    expect(getStore().error).toContain('Mot de passe actuel incorrect');
  });

  it(' lève une erreur si non authentifié', async () => {
    useAuthStore.setState({ accessToken: null });

    await expect(
      act(async () => getStore().changePassword('Old1234', 'New5678A', 'New5678A'))
    ).rejects.toThrow('Utilisateur non authentifié');
  });
});

// ══════════════════════════════════════════════════════════════════
// loginWithGoogle — REGRESSION bug mapApiUser + endpoint
// ══════════════════════════════════════════════════════════════════
describe('loginWithGoogle() — REGRESSION', () => {
  it(' applique mapApiUser sur le user reçu', async () => {
    const driverUser = {
      ...mockUser,
      role: 'driver' as const,
      driver: {
        id: 'd1', status: 'active' as const, vehicle_type: 'berline' as const,
        siret: null, tva_rate: 0, is_online: false, zone: 'france' as const,
        created_at: '2026-01-01', updated_at: '2026-01-01',
      },
      vehicle: null,
    };

    mockApi.google.mockResolvedValueOnce({
      ok: true,
      data: { user: driverUser, ...mockTokens },
    });

    await act(async () => {
      await getStore().loginWithGoogle('google-token');
    });

    const user = getStore().user as any;
    // mapApiUser aplatit driver.vehicle_type → vehicle_type à la racine
    expect(user?.vehicle_type).toBe('berline');
    expect(user?.is_online).toBe(false);
  });

  it(' appelle authApi.google (pas /auth/google GET)', async () => {
    mockApi.google.mockResolvedValueOnce({
      ok: true,
      data: { user: mockUser, ...mockTokens },
    });

    await act(async () => {
      await getStore().loginWithGoogle('g-access', 'g-refresh');
    });

    expect(mockApi.google).toHaveBeenCalledWith('g-access', 'g-refresh');
  });
});

// ══════════════════════════════════════════════════════════════════
// uploadAvatar — REGRESSION bug profile_photo_url non mis à jour
// ══════════════════════════════════════════════════════════════════
describe('uploadAvatar() — REGRESSION', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: { ...mockUser, profile_photo_url: null },
      accessToken: 'my-token',
    });
  });

  it(' met à jour profile_photo_url dans le store', async () => {
    mockApi.uploadAvatar.mockResolvedValueOnce({
      ok: true,
      data: { profile_photo_url: 'https://cdn.example.com/avatar.jpg' },
    });

    await act(async () => {
      await getStore().uploadAvatar(new FormData());
    });

    expect(getStore().user?.profile_photo_url).toBe('https://cdn.example.com/avatar.jpg');
  });

  it(' met localAvatarUri si URI fourni', async () => {
    mockApi.uploadAvatar.mockResolvedValueOnce({
      ok: true,
      data: { profile_photo_url: 'https://cdn.example.com/avatar.jpg' },
    });

    await act(async () => {
      await getStore().uploadAvatar(new FormData(), 'file:///local/photo.jpg');
    });

    expect(getStore().localAvatarUri).toBe('file:///local/photo.jpg');
    expect(getStore().user?.profile_photo_url).toBe('https://cdn.example.com/avatar.jpg');
  });

  it(' remplit error si upload échoue', async () => {
    mockApi.uploadAvatar.mockResolvedValueOnce({ ok: false, message: 'Fichier trop volumineux' });

    await expect(
      act(async () => getStore().uploadAvatar(new FormData()))
    ).rejects.toThrow();

    expect(getStore().error).toContain('Fichier trop volumineux');
  });
});

// ══════════════════════════════════════════════════════════════════
// clearError
// ══════════════════════════════════════════════════════════════════
describe('clearError()', () => {
  it(' remet error à null', () => {
    useAuthStore.setState({ error: 'une erreur' });
    getStore().clearError();
    expect(getStore().error).toBeNull();
  });
});
