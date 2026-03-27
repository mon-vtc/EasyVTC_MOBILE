import { useAuth }       from './useAuth';
import { useAuthStore , useUsersStore}  from '../store';
import type {
  AdminUser, ListUsersParams,
  UpdateUserStatusPayload, UserRole,
} from '../types';

// ✅ Réservé aux admins
export function useAdmin() {
  const auth        = useAuth();
  const accessToken = useAuthStore(s => s.accessToken);

  if (!auth.isAdmin) {
    throw new Error('useAdmin() ne peut être utilisé que par un administrateur.');
  }

  const users            = useUsersStore(s => s.users);
  const total            = useUsersStore(s => s.total);
  const page             = useUsersStore(s => s.page);
  const totalPages       = useUsersStore(s => s.totalPages);
  const isUsersLoading   = useUsersStore(s => s.isLoading);
  const usersError       = useUsersStore(s => s.error);
  const _fetchUsers      = useUsersStore(s => s.fetchUsers);
  const _fetchUserById   = useUsersStore(s => s.fetchUserById);
  const _updateStatus    = useUsersStore(s => s.updateUserStatus);
  const clearUsersError  = useUsersStore(s => s.clearError);

  return {
    // Profil admin
    user:       auth.user as AdminUser,
    isLoading:  auth.isLoading,
    error:      auth.error,
    clearError: auth.clearError,

    // Gestion utilisateurs
    users,
    total,
    page,
    totalPages,
    isUsersLoading,
    usersError,
    clearUsersError,

    // Actions admin — gestion users
    fetchUsers: (params?: ListUsersParams) =>
      _fetchUsers(accessToken!, params),

    fetchDrivers: (params?: Omit<ListUsersParams, 'role'>) =>
      _fetchUsers(accessToken!, { ...params, role: 'driver' }),

    fetchClients: (params?: Omit<ListUsersParams, 'role'>) =>
      _fetchUsers(accessToken!, { ...params, role: 'client' }),

    fetchUsersByRole: (role: UserRole, params?: Omit<ListUsersParams, 'role'>) =>
      _fetchUsers(accessToken!, { ...params, role }),

    fetchUserById: (userId: string) =>
      _fetchUserById(accessToken!, userId),

    activateUser: (userId: string, reason: string) =>
      _updateStatus(accessToken!, userId, { status: 'active', reason }),

    deactivateUser: (userId: string, reason: string) =>
      _updateStatus(accessToken!, userId, { status: 'inactive', reason }),

    lockUser: (userId: string, reason: string) =>
      _updateStatus(accessToken!, userId, { status: 'locked', reason }),

    // Actions sur son propre compte
    updateProfile: auth.updateProfile,
    resetPassword: auth.changePassword,
    logout:        auth.logout,
  };
}