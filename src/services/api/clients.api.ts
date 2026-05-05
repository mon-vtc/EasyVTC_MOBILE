import { api } from '../../lib/api';
import type {
  ApiResponse,
  ClientListFilters, ClientListResult,
  ClientWithStats, ClientTripsResult,
  UpdateUserStatusPayload,
  AuthUser,
} from '../../types';

export const clientsApi = {

  // GET /admin/clients — liste paginée avec stats
  listClients: (token: string, params?: ClientListFilters) => {
    const q = new URLSearchParams();
    if (params?.page)   q.set('page',   String(params.page));
    if (params?.limit)  q.set('limit',  String(params.limit));
    if (params?.status) q.set('status', params.status);
    if (params?.search) q.set('search', params.search);
    const qs = q.toString();
    return api.get<ClientListResult>(`/admin/clients${qs ? `?${qs}` : ''}`, token);
  },

  // GET /admin/clients/:id
  getClientById: (token: string, clientId: string) =>
    api.get<ClientWithStats>(`/admin/clients/${clientId}`, token),

  // GET /admin/clients/:id/trips
  getClientTrips: (token: string, clientId: string, params?: { page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.page)  q.set('page',  String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    const qs = q.toString();
    return api.get<ClientTripsResult>(`/admin/clients/${clientId}/trips${qs ? `?${qs}` : ''}`, token);
  },

  // PUT /admin/users/:id/status — réutilise l'endpoint existant
  changeClientStatus: (token: string, clientId: string, payload: UpdateUserStatusPayload) =>
    api.patch<AuthUser>(`/admin/users/${clientId}/status`, payload, token),
};
