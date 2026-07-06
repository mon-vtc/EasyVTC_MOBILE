import { useAuth } from './useAuth';
import { useAuthStore, useUsersStore, useDriversStore, useManagersStore, useClientsStore, usePromoCodesStore, useMarketingStore, useAuditLogsStore } from '../store';
import { managersApi }  from '../services/api/managers.api';
import { adminApi } from '../services/api/admin.api';
import { appConfigApi } from '../services/api/appConfig.api';
import type {
  AdminUser, CreateCampaignDto, ListUsersParams, ListDriversParams,
  UpdateUserStatusPayload, ChangeDriverStatusPayload, UserRole,
  CreateManagerDto, UpdateManagerDto, ChangeManagerStatusDto, ManagerListFilters, AdminStats,
  ClientListFilters, SetManagerPermissionsDto, ManagerPermissionsResult, ClientBaseFilters, AuditLogListFilters, BulkAssignDto, AdminDashboard, AdminDashboardPeriod,
  PromoCodeListFilters, CreatePromoCodeDto, UpdatePromoCodeDto, PromoCode,
  SupportConfig, SupportConfigKey,
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
  const isFetchingNextPage = useDriversStore(s => s.isFetchingNextPage);
  const isDriversLoading = useDriversStore(s => s.isLoading);
  const driversError     = useDriversStore(s => s.error);
  const monthlyStats     = useDriversStore(s => s.monthlyStats);
  const isFetchingMonthlyStats = useDriversStore(s => s.isFetchingMonthlyStats);
  const monthlyStatsError = useDriversStore(s => s.monthlyStatsError);
  const tripsHistory     = useDriversStore(s => s.tripsHistory);
  const isFetchingTripsHistory = useDriversStore(s => s.isFetchingTripsHistory);
  const tripsHistoryError = useDriversStore(s => s.tripsHistoryError);
  const _fetchDrivers       = useDriversStore(s => s.fetchDrivers);
  const _fetchNextDriversPage = useDriversStore(s => s.fetchNextDriversPage);
  const _fetchDriverById    = useDriversStore(s => s.fetchDriverById);
  const _changeDriverStatus = useDriversStore(s => s.changeDriverStatus);
  const _fetchMonthlyStats  = useDriversStore(s => s.fetchMonthlyStats);
  const _fetchTripsHistory  = useDriversStore(s => s.fetchTripsHistory);
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

  // ── Store Codes Promo (endpoint /admin/promo-codes) ───────────
  const promoCodes             = usePromoCodesStore(s => s.promoCodes);
  const isPromoCodesLoading    = usePromoCodesStore(s => s.isLoading);
  const isPromoCodesSaving     = usePromoCodesStore(s => s.isSaving);
  const promoCodesError        = usePromoCodesStore(s => s.error);
  const _fetchPromoCodes       = usePromoCodesStore(s => s.fetchPromoCodes);
  const _createPromoCode       = usePromoCodesStore(s => s.createPromoCode);
  const _updatePromoCode       = usePromoCodesStore(s => s.updatePromoCode);
  const _deletePromoCode       = usePromoCodesStore(s => s.deletePromoCode);
  const _bulkAssignPromoCode   = usePromoCodesStore(s => s.bulkAssignPromoCode);
  const clearPromoCodesError   = usePromoCodesStore(s => s.clearError);

  // ── Store Marketing (endpoint /admin/marketing) ─────────────
  const marketingClients      = useMarketingStore(s => s.clients);
  const marketingStats        = useMarketingStore(s => s.stats);
  const marketingTotal        = useMarketingStore(s => s.total);
  const marketingClientPage   = useMarketingStore(s => s.page);
  const marketingClientTotalPages = useMarketingStore(s => s.clientTotalPages);
  const campaigns             = useMarketingStore(s => s.campaigns);
  const campaignsTotalPages   = useMarketingStore(s => s.totalPages);
  const campaignsPage         = useMarketingStore(s => s.page);
  const isMarketingLoading    = useMarketingStore(s => s.isLoading);
  const isFetchingNextMarketingPage = useMarketingStore(s => s.isFetchingNextPage);
  const marketingError        = useMarketingStore(s => s.error);
  const _fetchMarketingClients = useMarketingStore(s => s.fetchClients);
  const _createCampaign        = useMarketingStore(s => s.createCampaign);
  const _fetchCampaigns        = useMarketingStore(s => s.fetchCampaigns);
  const _updateCampaign        = useMarketingStore(s => s.updateCampaign);
  const _deleteCampaign        = useMarketingStore(s => s.deleteCampaign);
  const _sendCampaign          = useMarketingStore(s => s.sendCampaign);
  const clearMarketingError   = useMarketingStore(s => s.clearError);

  // ── Store Audit Logs (endpoint /admin/audit-logs) ───────────
  const auditLogs             = useAuditLogsStore(s => s.logs);
  const selectedAuditLog      = useAuditLogsStore(s => s.selectedLog);
  const auditLogsTotal        = useAuditLogsStore(s => s.total);
  const auditLogsPage         = useAuditLogsStore(s => s.page);
  const auditLogsTotalPages   = useAuditLogsStore(s => s.totalPages);
  const isAuditLogsLoading    = useAuditLogsStore(s => s.isLoading);
  const isFetchingNextAuditLogPage = useAuditLogsStore(s => s.isFetchingNextPage);
  const auditLogsError        = useAuditLogsStore(s => s.error);
  const _fetchAuditLogs       = useAuditLogsStore(s => s.fetchLogs);
  const _fetchLogById         = useAuditLogsStore(s => s.fetchLogById);
  const clearAuditLogsError   = useAuditLogsStore(s => s.clearError);

  // ── Store Gestionnaires (endpoint /admin/managers) ────────────
  const managers                    = useManagersStore(s => s.managers);
  const managersTotal               = useManagersStore(s => s.total);
  const managersPage                = useManagersStore(s => s.page);
  const managersPageTotal           = useManagersStore(s => s.totalPages);
  const isManagersLoading           = useManagersStore(s => s.isLoading);
  const isFetchingNextManagersPage  = useManagersStore(s => s.isFetchingNextPage);
  const managersError               = useManagersStore(s => s.error);
  const _fetchManagers              = useManagersStore(s => s.fetchManagers);
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
  const _fetchNextDriversPageRef = useRef(_fetchNextDriversPage);
  const _fetchDriverByIdRef     = useRef(_fetchDriverById);
  const _changeDriverStatusRef  = useRef(_changeDriverStatus);
  const _fetchMonthlyStatsRef   = useRef(_fetchMonthlyStats);
  const _fetchTripsHistoryRef   = useRef(_fetchTripsHistory);
  const _fetchClientsRef        = useRef(_fetchClients);
  const _fetchClientByIdRef     = useRef(_fetchClientById);
  const _fetchClientTripsRef    = useRef(_fetchClientTrips);
  const _changeClientStatusRef  = useRef(_changeClientStatus);
  const _fetchManagersRef       = useRef(_fetchManagers);
  const _createManagerRef       = useRef(_createManager);
  const _updateManagerRef       = useRef(_updateManager);
  const _fetchManagerByIdRef    = useRef(_fetchManagerById);
  const _changeManagerStatusRef = useRef(_changeManagerStatus);
  const _fetchPromoCodesRef = useRef(_fetchPromoCodes);
  const _createPromoCodeRef = useRef(_createPromoCode);
  const _updatePromoCodeRef = useRef(_updatePromoCode);
  const _deletePromoCodeRef = useRef(_deletePromoCode);
  const _bulkAssignPromoCodeRef = useRef(_bulkAssignPromoCode);
  const _fetchMarketingClientsRef = useRef(_fetchMarketingClients);
  const _createCampaignRef        = useRef(_createCampaign);
  const _fetchCampaignsRef        = useRef(_fetchCampaigns);
  const _updateCampaignRef        = useRef(_updateCampaign);
  const _deleteCampaignRef        = useRef(_deleteCampaign);
  const _sendCampaignRef          = useRef(_sendCampaign);
  const _fetchAuditLogsRef        = useRef(_fetchAuditLogs);
  const _fetchLogByIdRef          = useRef(_fetchLogById);

  useEffect(() => { _fetchUsersRef.current         = _fetchUsers; },         [_fetchUsers]);
  useEffect(() => { _fetchUserByIdRef.current       = _fetchUserById; },      [_fetchUserById]);
  useEffect(() => { _updateStatusRef.current        = _updateStatus; },       [_updateStatus]);
  useEffect(() => { _fetchDriversRef.current        = _fetchDrivers; },       [_fetchDrivers]);
  useEffect(() => { _fetchNextDriversPageRef.current = _fetchNextDriversPage; }, [_fetchNextDriversPage]);
  useEffect(() => { _fetchDriverByIdRef.current     = _fetchDriverById; },    [_fetchDriverById]);
  useEffect(() => { _changeDriverStatusRef.current  = _changeDriverStatus; }, [_changeDriverStatus]);
  useEffect(() => { _fetchMonthlyStatsRef.current   = _fetchMonthlyStats; },  [_fetchMonthlyStats]);
  useEffect(() => { _fetchTripsHistoryRef.current   = _fetchTripsHistory; },  [_fetchTripsHistory]);
  useEffect(() => { _fetchClientsRef.current        = _fetchClients; },       [_fetchClients]);
  useEffect(() => { _fetchClientByIdRef.current     = _fetchClientById; },    [_fetchClientById]);
  useEffect(() => { _fetchClientTripsRef.current    = _fetchClientTrips; },   [_fetchClientTrips]);
  useEffect(() => { _changeClientStatusRef.current  = _changeClientStatus; }, [_changeClientStatus]);
  useEffect(() => { _fetchManagersRef.current       = _fetchManagers; },      [_fetchManagers]);
  useEffect(() => { _createManagerRef.current       = _createManager; },      [_createManager]);
  useEffect(() => { _updateManagerRef.current       = _updateManager; },      [_updateManager]);
  useEffect(() => { _fetchManagerByIdRef.current    = _fetchManagerById; },   [_fetchManagerById]);
  useEffect(() => { _changeManagerStatusRef.current = _changeManagerStatus; },[_changeManagerStatus]);
  useEffect(() => { _fetchPromoCodesRef.current     = _fetchPromoCodes; },    [_fetchPromoCodes]);
  useEffect(() => { _createPromoCodeRef.current     = _createPromoCode; },    [_createPromoCode]);
  useEffect(() => { _updatePromoCodeRef.current     = _updatePromoCode; },    [_updatePromoCode]);
  useEffect(() => { _deletePromoCodeRef.current     = _deletePromoCode; },    [_deletePromoCode]);
  useEffect(() => { _bulkAssignPromoCodeRef.current = _bulkAssignPromoCode; },[_bulkAssignPromoCode]);
  useEffect(() => { _fetchMarketingClientsRef.current = _fetchMarketingClients; }, [_fetchMarketingClients]);
  useEffect(() => { _createCampaignRef.current        = _createCampaign; },        [_createCampaign]);
  useEffect(() => { _fetchCampaignsRef.current        = _fetchCampaigns; },        [_fetchCampaigns]);
  useEffect(() => { _updateCampaignRef.current      = _updateCampaign; },         [_updateCampaign]);
  useEffect(() => { _deleteCampaignRef.current      = _deleteCampaign; },         [_deleteCampaign]);
  useEffect(() => { _sendCampaignRef.current        = _sendCampaign; },           [_sendCampaign]);
  useEffect(() => { _fetchAuditLogsRef.current        = _fetchAuditLogs; },        [_fetchAuditLogs]);
  useEffect(() => { _fetchLogByIdRef.current          = _fetchLogById; },          [_fetchLogById]);

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

  const fetchNextDriversPage = useCallback((params?: ListDriversParams) =>
    _fetchNextDriversPageRef.current(accessTokenRef.current!, params), []);

  const fetchDriverById = useCallback((driverId: string) =>
    _fetchDriverByIdRef.current(accessTokenRef.current!, driverId), []);

  const changeDriverStatus = useCallback((driverId: string, payload: ChangeDriverStatusPayload) =>
    _changeDriverStatusRef.current(accessTokenRef.current!, driverId, payload), []);

  const fetchMonthlyStats = useCallback((driverId: string, date?: string) =>
    _fetchMonthlyStatsRef.current(accessTokenRef.current!, driverId, date), []);

  const fetchTripsHistory = useCallback((driverId: string, status?: string, page?: number, limit?: number) =>
    _fetchTripsHistoryRef.current(accessTokenRef.current!, driverId, status, page, limit), []);

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

  const fetchPromoCodes = useCallback((filters?: PromoCodeListFilters) =>
    _fetchPromoCodesRef.current(accessTokenRef.current!, filters), []);

  const createPromoCode = useCallback((dto: CreatePromoCodeDto) =>
    _createPromoCodeRef.current(accessTokenRef.current!, dto), []);

  const updatePromoCode = useCallback((id: string, dto: UpdatePromoCodeDto) =>
    _updatePromoCodeRef.current(accessTokenRef.current!, id, dto), []);

  const bulkAssignPromoCode = useCallback((templateId: string, dto: BulkAssignDto) =>
    _bulkAssignPromoCodeRef.current(accessTokenRef.current!, templateId, dto), []);

  const deletePromoCode = useCallback((id: string) =>
    _deletePromoCodeRef.current(accessTokenRef.current!, id), []);

  const fetchMarketingClients = useCallback((filters?: ClientBaseFilters) =>
    _fetchMarketingClientsRef.current(accessTokenRef.current!, filters), []);

  const createCampaign = useCallback((dto: CreateCampaignDto) =>
    _createCampaignRef.current(accessTokenRef.current!, dto), []);

  const fetchCampaigns = useCallback((page?: number, limit?: number) =>
    _fetchCampaignsRef.current(accessTokenRef.current!, page, limit), []);

   const updateCampaign = useCallback((id: string, dto: Partial<CreateCampaignDto>) =>
    _updateCampaignRef.current(accessTokenRef.current!, id, dto), []);

  const deleteCampaign = useCallback((id: string) =>
    _deleteCampaignRef.current(accessTokenRef.current!, id), []);

  const sendCampaign = useCallback((id: string) =>
    _sendCampaignRef.current(accessTokenRef.current!, id), []);

  const fetchAuditLogs = useCallback((filters?: AuditLogListFilters) =>
    _fetchAuditLogsRef.current(accessTokenRef.current!, filters), []);

  const fetchLogById = useCallback((id: string) =>
    _fetchLogByIdRef.current(accessTokenRef.current!, id), []);

  const fetchDashboardStats = useCallback(async (filters: { period: 'day' | 'week' | 'month' | 'all' } = { period: 'day' }): Promise<AdminStats> => {
    const res = await adminApi.getStats(accessTokenRef.current!, filters);
    if (!res.ok || !res.data) {
      console.error('Erreur fetchDashboardStats:', res.message, res.errors);
      throw new Error(res.message ?? 'Erreur lors de la récupération des statistiques');
    }
    return res.data;
  }, []);

  const fetchDashboard = useCallback(async (period: AdminDashboardPeriod = 'week', date?: string): Promise<AdminDashboard> => {
    const res = await adminApi.getDashboard(accessTokenRef.current!, period, date);
    if (!res.ok || !res.data) {
      console.error('Erreur fetchDashboard:', res.message, res.errors);
      throw new Error(res.message ?? 'Erreur lors de la récupération du dashboard');
    }
    return res.data;
  }, []);

  // ── Configuration app (coordonnées support) ─────────────────────────────────
  const fetchSupportConfig = useCallback(async (): Promise<SupportConfig> => {
    const res = await appConfigApi.getSupportConfig(accessTokenRef.current!);
    if (!res.ok || !res.data) {
      throw new Error(res.message ?? 'Erreur lors de la récupération de la configuration');
    }
    return res.data;
  }, []);

  const updateSupportConfig = useCallback(async (key: SupportConfigKey, value: string): Promise<void> => {
    const res = await appConfigApi.upsert(accessTokenRef.current!, key, value);
    if (!res.ok) {
      throw new Error(res.message ?? 'Erreur lors de la mise à jour de la configuration');
    }
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
    isFetchingNextPage,
    isDriversLoading,
    driversError,
    monthlyStats,
    isFetchingMonthlyStats,
    monthlyStatsError,
    tripsHistory,
    isFetchingTripsHistory,
    tripsHistoryError,
    clearDriversError,

    // Gestion des managers
    managers,
    managersTotal,
    managersPage,
    managersPageTotal,
    isManagersLoading,
    isFetchingNextManagersPage,
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
    fetchNextDriversPage,
    fetchDriverById,
    changeDriverStatus,
    fetchMonthlyStats,
    fetchTripsHistory,

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

    // Codes promo
    promoCodes,
    isPromoCodesLoading,
    isPromoCodesSaving,
    promoCodesError,
    clearPromoCodesError,
    fetchPromoCodes,
    createPromoCode,
    updatePromoCode,
    deletePromoCode,
    bulkAssignPromoCode,

    // Marketing
    marketingClients,
    marketingStats,
    marketingTotal,
    marketingClientPage,
    marketingClientTotalPages,
    campaigns,
    campaignsTotalPages,
    campaignsPage,
    isMarketingLoading,
    isFetchingNextMarketingPage,
    marketingError,
    clearMarketingError,
    fetchMarketingClients,
    createCampaign,
    fetchCampaigns,
    updateCampaign,
    deleteCampaign,
    sendCampaign,

    // Audit Logs
    auditLogs,
    selectedAuditLog,
    auditLogsTotal,
    auditLogsPage,
    auditLogsTotalPages,
    isAuditLogsLoading,
    isFetchingNextAuditLogPage,
    auditLogsError,
    fetchAuditLogs,
    fetchLogById,
    clearAuditLogsError,

    // Stats dashboard
    fetchDashboardStats,
    fetchDashboard,

    // Configuration app (coordonnées support)
    fetchSupportConfig,
    updateSupportConfig,

    // Actions sur son propre compte
    updateProfile: auth.updateProfile,
    resetPassword: auth.changePassword,
    logout:        auth.logout,
  };
}