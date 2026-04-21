// __TEST__/stores/users.store.test.ts
import { act } from '@testing-library/react-native';
import { useUsersStore } from '../../store/users.store';
import { userApi } from '../../services/api/user.api';
import { UserRole, UserStatus } from '../../types';
// import { AuthUser } from '@supabase/supabase-js';
import { AuthUser } from '../../types';

jest.mock('../../services/api/user.api');
const mockUserApi = userApi as jest.Mocked<typeof userApi>;

const TOKEN = 'test-token';

const mockUser = {
  id: 'user-1',
  email: 'client@example.com',
  role: 'client' as UserRole,
  first_name: 'Alice',
  last_name: 'Martin',
  phone: '+33600000002',
  profile_photo_url: null,
  device_token: '2024-01-01T00:00:00Z', 
  status: 'active' as UserStatus,
  status_reason: '', 
  status_changed_by: 'admin',
  status_changed_at: '2024-01-01T00:00:00Z', 
  rgpd_consent: true, 
  rgpd_consent_at: '2024-01-01T00:00:00Z',
  deleted_at:'', 
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  driver: null,
  vehicle: null,
} as const satisfies AuthUser;

const mockPaginatedUsers = {
  users: [mockUser],
  total: 1,
  page: 1,
  limit: 5,
  total_pages: 1,
};

const resetStore = () =>
  useUsersStore.setState({
    users: [], total: 0, page: 1,  totalPages: 1, isLoading: false, error: null,
  });

// ══════════════════════════════════════════════════════════════════════════
// fetchUsers
// ══════════════════════════════════════════════════════════════════════════
describe('useUsersStore › fetchUsers', () => {
  beforeEach(() => { resetStore(); jest.clearAllMocks(); });

  it('charge la liste paginée des utilisateurs', async () => {
    mockUserApi.listUsers.mockResolvedValue({ ok: true, data: mockPaginatedUsers , message: 'OK' });

    await act(async () => { await useUsersStore.getState().fetchUsers(TOKEN); });

    const state = useUsersStore.getState();
    expect(state.users).toHaveLength(1);
    expect(state.users[0].email).toBe('client@example.com');
    expect(state.total).toBe(1);
    expect(state.isLoading).toBe(false);
  });

  it('transmet les filtres (role, status, search, page, limit)', async () => {
    mockUserApi.listUsers.mockResolvedValue({ ok: true, data: mockPaginatedUsers , message: 'OK' });

    await act(async () => {
      await useUsersStore.getState().fetchUsers(TOKEN, {
        role: 'driver',
        status: 'active' as UserStatus,
        search: 'alice',
        page: 1,
        limit: 20,
      });
    });

    expect(mockUserApi.listUsers).toHaveBeenCalledWith(TOKEN, expect.objectContaining({
      role: 'driver',
      status: 'active' as UserStatus,
      search: 'alice',
    }));
  });

  it('stocke l\'erreur si l\'API échoue', async () => {
    mockUserApi.listUsers.mockResolvedValue({ ok: false, message: 'Accès refusé' });

    await expect(
      act(async () => { await useUsersStore.getState().fetchUsers(TOKEN); })
    ).rejects.toThrow('Accès refusé');

    expect(useUsersStore.getState().error).toBe('Accès refusé');
  });
});

// ══════════════════════════════════════════════════════════════════════════
// fetchUserById
// ══════════════════════════════════════════════════════════════════════════
describe('useUsersStore › fetchUserById', () => {
  beforeEach(() => { resetStore(); jest.clearAllMocks(); });

  it('retourne l\'utilisateur trouvé', async () => {
    mockUserApi.getUserById.mockResolvedValue({ ok: true, data: mockUser , message: 'OK' });

    let result: AuthUser | null = null;
    await act(async () => {
      result = await useUsersStore.getState().fetchUserById(TOKEN, 'user-1');
    });

    expect(result!.id).toBe('user-1');
  });

  it('retourne null si l\'utilisateur est introuvable', async () => {
    mockUserApi.getUserById.mockResolvedValue({ ok: false, message: 'Introuvable' });

    let result: AuthUser | null = null;
    await act(async () => {
      result = await useUsersStore.getState().fetchUserById(TOKEN, 'bad-id');
    });

    expect(result).toBeNull();
    expect(useUsersStore.getState().error).toBe('Introuvable');
  });
});

// ══════════════════════════════════════════════════════════════════════════
// updateUserStatus
// ══════════════════════════════════════════════════════════════════════════
describe('useUsersStore › updateUserStatus', () => {
  beforeEach(() => { resetStore(); jest.clearAllMocks(); });

  it('met à jour le statut de l\'utilisateur dans la liste locale', async () => {
    const updatedUser = { ...mockUser, status: 'locked' as UserStatus };
    useUsersStore.setState({ users: [mockUser ] });
    mockUserApi.updateUserStatus.mockResolvedValue({ ok: true, data: updatedUser , message: 'OK' });

    await act(async () => {
      await useUsersStore.getState().updateUserStatus(TOKEN, 'user-1', { status: 'locked' as UserStatus, reason: 'Infraction' });
    });

    expect(useUsersStore.getState().users[0].status).toBe('locked');
    expect(useUsersStore.getState().isLoading).toBe(false);
  });

  it('stocke l\'erreur si la mise à jour échoue', async () => {
    mockUserApi.updateUserStatus.mockResolvedValue({ ok: false, message: 'Erreur de mise à jour' });

    await expect(
      act(async () => {
        await useUsersStore.getState().updateUserStatus(TOKEN, 'user-1', { status: 'active', reason: '' });
      })
    ).rejects.toThrow('Erreur de mise à jour');
  });
});

// ══════════════════════════════════════════════════════════════════════════
// clearError
// ══════════════════════════════════════════════════════════════════════════
describe('useUsersStore › clearError', () => {
  it('vide l\'erreur', () => {
    useUsersStore.setState({ error: 'Une erreur' });
    useUsersStore.getState().clearError();
    expect(useUsersStore.getState().error).toBeNull();
  });
});