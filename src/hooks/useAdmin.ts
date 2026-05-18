import { useAuth } from './useAuth';
import { useAuthStore, useUsersStore, useDriversStore, useManagersStore, useClientsStore } from '../store';
import { managersApi }  from '../services/api/managers.api';
import { adminApi } from '../services/api/admin.api';
import type {
  AdminUser, ListUsersParams, ListDriversParams,
  UpdateUserStatusPayload, ChangeDriverStatusPayload, UserRole,
  CreateManagerDto, UpdateManagerDto, ChangeManagerStatusDto, ManagerListFilters, AdminStats,
  ClientListFilters, SetManagerPermissionsDto, ManagerPermissionsResult,
} from '../types';
import { useCallback, useEffect, useRef } from 'react';

//  Réservé aux admins
export function useAdmin() {
  const auth         = useAuth();
  const accessToken  = useAuthStore(s => s.accessToken);
  const isAdminOrManager = auth.isAdmin || auth.isManager;

  if (!isAdminOrManager) {
    throw new Error('useAdmin() ne peut être utilisé que par un administrateur ou un manager.');
  }

  // ── Ref stable pour accessToken (évite les boucles dans useCallback) ──────
  const accessTokenRef = useRef(accessToken);
  useEffect(() => {
    accessTokenRef.current = accessToken;
  }, [accessToken]);

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

  // ── Store Clients (endpoint /admin/clients) ──────────────────
  const clients           = useClientsStore(s => s.clients);
  const clientsTotal      = useClientsStore(s => s.total);
  const clientsGlobalStats= useClientsStore(s => s.globalStats);
  const isClientsLoading  = useClientsStore(s => s.isLoading);
  const clientsError      = useClientsStore(s => s.error);
  const _fetchClients     = useClientsStore(s => s.fetchClients);
  const _fetchClientById  = useClientsStore(s => s.fetchClientById);
  const _fetchClientTrips = useClientsStore(s => s.fetchClientTrips);
  const _changeClientStatus = useClientsStore(s => s.changeClientStatus);
  const clearClientsError = useClientsStore(s => s.clearError);

  // ── Store Gestionnaires (endpoint /admin/managers) ────────────
  const managers          = useManagersStore(s => s.managers);
  const managersTotal     = useManagersStore(s => s.total);
  const managersPage      = useManagersStore(s => s.page);
  const managersPageTotal = useManagersStore(s => s.totalPages);
  const isManagersLoading = useManagersStore(s => s.isLoading);
  const managersError     = useManagersStore(s => s.error);
  const _fetchManagers    = useManagersStore(s => s.fetchManagers);
  const _createManager    = useManagersStore(s => s.createManager);
  const _updateManager    = useManagersStore(s => s.updateManager);
  const _fetchManagerById   = useManagersStore(s => s.fetchManagerById);
  const _changeManagerStatus = useManagersStore(s => s.changeStatus);
  const clearManagersError  = useManagersStore(s => s.clearError);

  // ── Refs stables pour les actions store (évite les re-renders en cascade) ─
  const _fetchUsersRef          = useRef(_fetchUsers);
  const _fetchUserByIdRef       = useRef(_fetchUserById);
  const _updateStatusRef        = useRef(_updateStatus);
  const _fetchDriversRef        = useRef(_fetchDrivers);
  const _fetchDriverByIdRef     = useRef(_fetchDriverById);
  const _changeDriverStatusRef  = useRef(_changeDriverStatus);
  const _fetchClientsRef        = useRef(_fetchClients);
  const _fetchClientByIdRef     = useRef(_fetchClientById);
  const _fetchClientTripsRef    = useRef(_fetchClientTrips);
  const _changeClientStatusRef  = useRef(_changeClientStatus);
  const _fetchManagersRef       = useRef(_fetchManagers);
  const _createManagerRef       = useRef(_createManager);
  const _updateManagerRef       = useRef(_updateManager);
  const _fetchManagerByIdRef    = useRef(_fetchManagerById);
  const _changeManagerStatusRef = useRef(_changeManagerStatus);

  useEffect(() => { _fetchUsersRef.current         = _fetchUsers; },         [_fetchUsers]);
  useEffect(() => { _fetchUserByIdRef.current       = _fetchUserById; },      [_fetchUserById]);
  useEffect(() => { _updateStatusRef.current        = _updateStatus; },       [_updateStatus]);
  useEffect(() => { _fetchDriversRef.current        = _fetchDrivers; },       [_fetchDrivers]);
  useEffect(() => { _fetchDriverByIdRef.current     = _fetchDriverById; },    [_fetchDriverById]);
  useEffect(() => { _changeDriverStatusRef.current  = _changeDriverStatus; }, [_changeDriverStatus]);
  useEffect(() => { _fetchClientsRef.current        = _fetchClients; },       [_fetchClients]);
  useEffect(() => { _fetchClientByIdRef.current     = _fetchClientById; },    [_fetchClientById]);
  useEffect(() => { _fetchClientTripsRef.current    = _fetchClientTrips; },   [_fetchClientTrips]);
  useEffect(() => { _changeClientStatusRef.current  = _changeClientStatus; }, [_changeClientStatus]);
  useEffect(() => { _fetchManagersRef.current       = _fetchManagers; },      [_fetchManagers]);
  useEffect(() => { _createManagerRef.current       = _createManager; },      [_createManager]);
  useEffect(() => { _updateManagerRef.current       = _updateManager; },      [_updateManager]);
  useEffect(() => { _fetchManagerByIdRef.current    = _fetchManagerById; },   [_fetchManagerById]);
  useEffect(() => { _changeManagerStatusRef.current = _changeManagerStatus; },[_changeManagerStatus]);

  // ── Actions stables (useCallback avec [] — lisent les valeurs via ref) ────

  const fetchUsers = useCallback((params?: ListUsersParams) =>
    _fetchUsersRef.current(accessTokenRef.current!, params), []);

  const fetchClients = useCallback((params?: Omit<ListUsersParams, 'role'>) =>
    _fetchUsersRef.current(accessTokenRef.current!, { ...params, role: 'client' }), []);

  const fetchUsersByRole = useCallback((role: UserRole, params?: Omit<ListUsersParams, 'role'>) =>
    _fetchUsersRef.current(accessTokenRef.current!, { ...params, role }), []);

  const fetchUserById = useCallback((userId: string) =>
    _fetchUserByIdRef.current(accessTokenRef.current!, userId), []);

  const activateUser = useCallback((userId: string, reason: string) =>
    _updateStatusRef.current(accessTokenRef.current!, userId, { status: 'active', reason }), []);

  const deactivateUser = useCallback((userId: string, reason: string) =>
    _updateStatusRef.current(accessTokenRef.current!, userId, { status: 'inactive', reason }), []);

  const lockUser = useCallback((userId: string, reason: string) =>
    _updateStatusRef.current(accessTokenRef.current!, userId, { status: 'locked', reason }), []);

  const fetchDrivers = useCallback((params?: ListDriversParams) =>
    _fetchDriversRef.current(accessTokenRef.current!, params), []);

  const fetchDriverById = useCallback((driverId: string) =>
    _fetchDriverByIdRef.current(accessTokenRef.current!, driverId), []);

  const changeDriverStatus = useCallback((driverId: string, payload: ChangeDriverStatusPayload) =>
    _changeDriverStatusRef.current(accessTokenRef.current!, driverId, payload), []);

  const fetchManagers = useCallback((params?: ManagerListFilters) =>
    _fetchManagersRef.current(accessTokenRef.current!, params), []);

  const createManager = useCallback((dto: CreateManagerDto) =>
    _createManagerRef.current(accessTokenRef.current!, dto), []);

  const updateManager = useCallback((managerId: string, dto: UpdateManagerDto) =>
    _updateManagerRef.current(accessTokenRef.current!, managerId, dto), []);

  const fetchManagerById = useCallback((managerId: string) =>
    _fetchManagerByIdRef.current(accessTokenRef.current!, managerId), []);

  const changeManagerStatus = useCallback((managerId: string, payload: ChangeManagerStatusDto) =>
    _changeManagerStatusRef.current(accessTokenRef.current!, managerId, payload), []);

  const getManagerPermissions = useCallback(async (managerId: string): Promise<ManagerPermissionsResult> => {
    const res = await managersApi.getPermissions(accessTokenRef.current!, managerId);
    if (!res.ok || !res.data) throw new Error(res.message ?? 'Erreur lors de la récupération des permissions');
    return res.data;
  }, []);

  const setManagerPermissions = useCallback(async (managerId: string, dto: SetManagerPermissionsDto): Promise<ManagerPermissionsResult> => {
    const res = await managersApi.setPermissions(accessTokenRef.current!, managerId, dto);
    if (!res.ok || !res.data) throw new Error(res.message ?? 'Erreur lors de la mise à jour des permissions');
    return res.data;
  }, []);

  const fetchAdminClients = useCallback((params?: ClientListFilters) =>
    _fetchClientsRef.current(accessTokenRef.current!, params), []);

  const fetchAdminClientById = useCallback((clientId: string) =>
    _fetchClientByIdRef.current(accessTokenRef.current!, clientId), []);

  const fetchAdminClientTrips = useCallback((clientId: string, params?: { page?: number; limit?: number }) =>
    _fetchClientTripsRef.current(accessTokenRef.current!, clientId, params), []);

  const changeClientStatus = useCallback((clientId: string, payload: UpdateUserStatusPayload) =>
    _changeClientStatusRef.current(accessTokenRef.current!, clientId, payload), []);

  const fetchDashboardStats = useCallback(async (): Promise<AdminStats> => {
    const res = await adminApi.getStats(accessTokenRef.current!);
    if (!res.ok || !res.data) throw new Error(res.message ?? 'Erreur lors de la récupération des statistiques');
    return res.data;
  }, []);

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

    // Actions admin — gestion users
    fetchUsers,
    fetchClients,
    fetchUsersByRole,
    fetchUserById,
    activateUser,
    deactivateUser,
    lockUser,

    // Actions admin — gestion chauffeurs
    fetchDrivers,
    fetchDriverById,
    changeDriverStatus,

    // Actions admin — gestion managers
    fetchManagers,
    createManager,
    updateManager,
    fetchManagerById,
    changeManagerStatus,
    getManagerPermissions,
    setManagerPermissions,

    // Gestion des clients (endpoint /admin/clients)
    clients,
    clientsTotal,
    clientsGlobalStats,
    isClientsLoading,
    clientsError,
    clearClientsError,
    fetchAdminClients,
    fetchAdminClientById,
    fetchAdminClientTrips,
    changeClientStatus,

    // Stats dashboard
    fetchDashboardStats,

    // Actions sur son propre compte
    updateProfile: auth.updateProfile,
    resetPassword: auth.changePassword,
    logout:        auth.logout,
  };
}