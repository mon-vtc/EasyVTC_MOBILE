import { useAuth }       from './useAuth';
import { useAuthStore, useUsersStore, useDriversStore, useManagersStore}  from '../store';
import type {
  AdminUser, ListUsersParams, ListDriversParams,
  UpdateUserStatusPayload, ChangeDriverStatusPayload, UserRole,
  CreateManagerDto, ChangeManagerStatusDto, ManagerListFilters,
} from '../types';

//  Réservé aux admins
export function useAdmin() {
  const auth         = useAuth();
  const accessToken  = useAuthStore(s => s.accessToken);

  if (!auth.isAdmin) {
    throw new Error('useAdmin() ne peut être utilisé que par un administrateur.');
  }

  // ── Store Utilisateurs (clients, autres admins, managers) ─────
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

  // ── Store Chauffeurs (endpoint /admin/drivers) ────────────────
  const drivers          = useDriversStore(s => s.drivers);
  const driversTotal     = useDriversStore(s => s.total);
  const driversPage      = useDriversStore(s => s.page);
  const driversPageTotal = useDriversStore(s => s.totalPages);
  const isDriversLoading = useDriversStore(s => s.isLoading);
  const driversError     = useDriversStore(s => s.error);
  const _fetchDrivers       = useDriversStore(s => s.fetchDrivers);
  const _fetchDriverById    = useDriversStore(s => s.fetchDriverById);
  const _changeDriverStatus = useDriversStore(s => s.changeDriverStatus);
  const clearDriversError   = useDriversStore(s => s.clearError);

  // ── Store Gestionnaires (endpoint /admin/managers) ────────────
  const managers          = useManagersStore(s => s.managers);
  const managersTotal     = useManagersStore(s => s.total);
  const managersPage      = useManagersStore(s => s.page);
  const managersPageTotal = useManagersStore(s => s.totalPages);
  const isManagersLoading = useManagersStore(s => s.isLoading);
  const managersError     = useManagersStore(s => s.error);
  const _fetchManagers    = useManagersStore(s => s.fetchManagers);
  const _createManager    = useManagersStore(s => s.createManager);
  const _fetchManagerById   = useManagersStore(s => s.fetchManagerById);
  const _changeManagerStatus = useManagersStore(s => s.changeStatus);
  const clearManagersError  = useManagersStore(s => s.clearError);

  return {
    // Profil admin
    user:       auth.user as AdminUser,
    isLoading:  auth.isLoading,
    error:      auth.error,
    clearError: auth.clearError,

    // Gestion utilisateurs (clients, admins, managers)
    users,
    total,
    page,
    totalPages,
    isUsersLoading,
    usersError,
    clearUsersError,

    // Gestion chauffeurs (endpoint /admin/drivers)
    drivers,
    driversTotal,
    driversPage,
    driversPageTotal,
    isDriversLoading,
    driversError,
    clearDriversError,

    // Gestion des managers
    managers,
    managersTotal,
    managersPage,
    managersPageTotal,
    isManagersLoading,
    managersError,
    clearManagersError,

    // Actions admin — gestion users (deprecated, utiliser les actions spécifiques par rôle)
    fetchUsers: (params?: ListUsersParams) =>
      _fetchUsers(accessToken!, params),

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

    // Actions admin — gestion chauffeurs (utiliser /admin/drivers)
    fetchDrivers: (params?: ListDriversParams) =>
      _fetchDrivers(accessToken!, params),

    fetchDriverById: (driverId: string) =>
      _fetchDriverById(accessToken!, driverId),

    changeDriverStatus: (driverId: string, payload: ChangeDriverStatusPayload) =>
      _changeDriverStatus(accessToken!, driverId, payload),

    // Actions admin — gestion managers
    fetchManagers: (params?: ManagerListFilters) =>
      _fetchManagers(accessToken!, params),
    createManager: (dto: CreateManagerDto) =>
      _createManager(accessToken!, dto),
    fetchManagerById: (managerId: string) =>
      _fetchManagerById(accessToken!, managerId),
    changeManagerStatus: (managerId: string, payload: ChangeManagerStatusDto) =>
      _changeManagerStatus(accessToken!, managerId, payload),


    // Actions sur son propre compte
    updateProfile: auth.updateProfile,
    resetPassword: auth.changePassword,
    logout:        auth.logout,
  };
}