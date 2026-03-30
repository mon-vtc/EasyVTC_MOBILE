import { useAuth }       from './useAuth';
import { useAuthStore, useUsersStore }  from '../store';
import type { ManagerUser, ListUsersParams } from '../types';

// ✅ Réservé aux managers — lecture seule sur les users, pas de changement de statut
export function useManager() {
  const auth        = useAuth();
  const accessToken = useAuthStore(s => s.accessToken);

  if (!auth.isManager) {
    throw new Error('useManager() ne peut être utilisé que par un manager.');
  }

  const users          = useUsersStore(s => s.users);
  const total          = useUsersStore(s => s.total);
  const isUsersLoading = useUsersStore(s => s.isLoading);
  const usersError     = useUsersStore(s => s.error);
  const _fetchUsers    = useUsersStore(s => s.fetchUsers);
  const _fetchById     = useUsersStore(s => s.fetchUserById);
  const clearError     = useUsersStore(s => s.clearError);

  return {
    // Profil manager
    user:       auth.user as ManagerUser,
    isLoading:  auth.isLoading,
    error:      auth.error,
    clearError: auth.clearError,

    // Consultation utilisateurs (lecture seule — pas d'updateUserStatus)
    users,
    total,
    isUsersLoading,
    usersError,
    clearUsersError: clearError,

    fetchUsers: (params?: ListUsersParams) =>
      _fetchUsers(accessToken!, params),

    fetchDrivers: (params?: Omit<ListUsersParams, 'role'>) =>
      _fetchUsers(accessToken!, { ...params, role: 'driver' }),

    fetchUserById: (userId: string) =>
      _fetchById(accessToken!, userId),

    // Actions sur son propre compte
    updateProfile: auth.updateProfile,
    resetPassword: auth.changePassword,
    logout:        auth.logout,
  };
}