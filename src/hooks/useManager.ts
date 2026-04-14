import { useAuth }       from './useAuth';
import { useAuthStore, useUsersStore, useDriversStore }  from '../store';
import type { ManagerUser, ListUsersParams, ListDriversParams } from '../types';

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

  // ── Store Chauffeurs (endpoint /admin/drivers) ────────────────
  const drivers        = useDriversStore(s => s.drivers);
  const driversTotal   = useDriversStore(s => s.total);
  const isDriversLoading = useDriversStore(s => s.isLoading);
  const driversError   = useDriversStore(s => s.error);
  const _fetchDrivers  = useDriversStore(s => s.fetchDrivers);
  const _fetchDriverById = useDriversStore(s => s.fetchDriverById);
  const clearDriversError = useDriversStore(s => s.clearError);

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

    // Consultation chauffeurs (endpoint /admin/drivers)
    drivers,
    driversTotal,
    isDriversLoading,
    driversError,
    clearDriversError,

    fetchUsers: (params?: ListUsersParams) =>
      _fetchUsers(accessToken!, params),

    fetchDrivers: (params?: ListDriversParams) =>
      _fetchDrivers(accessToken!, params),

    fetchDriverById: (driverId: string) =>
      _fetchDriverById(accessToken!, driverId),

    fetchUserById: (userId: string) =>
      _fetchById(accessToken!, userId),

    // Actions sur son propre compte
    updateProfile: auth.updateProfile,
    resetPassword: auth.changePassword,
    logout:        auth.logout,
  };
}