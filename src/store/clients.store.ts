import { create } from 'zustand';
import { clientsApi } from '../services/api/clients.api';
import type {
  ClientWithStats, ClientListFilters, ClientGlobalStats,
  ClientTripItem, UpdateUserStatusPayload,
} from '../types';

interface ClientsState {
  clients:     ClientWithStats[];
  total:       number;
  page:        number;
  totalPages:  number;
  globalStats: ClientGlobalStats | null;
  isLoading:              boolean;
  isFetchingNextPage:     boolean;
  error:                  string | null;

  fetchClients:       (token: string, params?: ClientListFilters) => Promise<void>;
  fetchClientById:    (token: string, clientId: string)           => Promise<ClientWithStats | null>;
  fetchClientTrips:   (token: string, clientId: string, params?: { page?: number; limit?: number }) => Promise<{ trips: ClientTripItem[]; total: number; totalPages: number } | null>;
  changeClientStatus: (token: string, clientId: string, payload: UpdateUserStatusPayload) => Promise<void>;
  clearError:         () => void;
}

export const useClientsStore = create<ClientsState>((set) => ({
  clients:             [],
  total:               0,
  page:                1,
  totalPages:          1,
  globalStats:         null,
  isLoading:           false,
  isFetchingNextPage:  false,
  error:               null,

  fetchClients: async (token, params) => {
    const append = (params?.page ?? 1) > 1;
    append ? set({ isFetchingNextPage: true }) : set({ isLoading: true, error: null });
    try {
      const res = await clientsApi.listClients(token, params);
      if (!res.ok || !res.data) throw new Error(res.message ?? 'Erreur lors du chargement');
      set(state => ({
        clients:     append ? [...state.clients, ...res.data!.clients] : res.data!.clients,
        total:       res.data!.total,
        page:        res.data!.page,
        totalPages:  res.data!.total_pages,
        globalStats: res.data!.global_stats,
        isLoading:           false,
        isFetchingNextPage:  false,
      }));
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Erreur inconnue', isLoading: false, isFetchingNextPage: false });
      throw err;
    }
  },

  fetchClientById: async (token, clientId) => {
    set({ isLoading: true, error: null });
    try {
      const res = await clientsApi.getClientById(token, clientId);
      if (!res.ok || !res.data) throw new Error(res.message ?? 'Client introuvable');
      set({ isLoading: false });
      return res.data;
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Erreur inconnue', isLoading: false });
      return null;
    }
  },

  fetchClientTrips: async (token, clientId, params) => {
    set({ isLoading: true, error: null });
    try {
      const res = await clientsApi.getClientTrips(token, clientId, params);
      if (!res.ok || !res.data) throw new Error(res.message ?? 'Erreur lors du chargement');
      set({ isLoading: false });
      return { trips: res.data.trips, total: res.data.total, totalPages: res.data.total_pages };
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Erreur inconnue', isLoading: false });
      return null;
    }
  },

  changeClientStatus: async (token, clientId, payload) => {
    set({ isLoading: true, error: null });
    try {
      const res = await clientsApi.changeClientStatus(token, clientId, payload);
      if (!res.ok) throw new Error(res.message ?? 'Erreur lors de la mise à jour');
      // Mise à jour locale du statut dans la liste
      set(state => ({
        clients: state.clients.map(c =>
          c.id === clientId ? { ...c, status: payload.status } : c,
        ),
        isLoading: false,
      }));
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Erreur inconnue', isLoading: false });
      throw err;
    }
  },

  clearError: () => set({ error: null }),
}));
