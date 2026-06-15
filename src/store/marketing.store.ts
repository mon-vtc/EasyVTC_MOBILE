// ══════════════════════════════════════════════════════════════════════════════
// STORE — Marketing (Zustand)
// ══════════════════════════════════════════════════════════════════════════════

import { create } from 'zustand';
import { marketingApi } from '../services/api/marketing.api';
import type {
  ClientSummary,
  ClientBaseStats,
  ClientBaseFilters,
  MarketingCampaign,
  CreateCampaignDto,
  UpdateMarketingConsentsDto,
  UpdateCampaignDto,
  MyMarketingProfile,
} from '../types/marketing.types';

interface MarketingState {
  clients: ClientSummary[];
  stats: ClientBaseStats | null;
  total: number;
  page: number;
  clientTotalPages: number;
  totalPages: number;
  campaigns: MarketingCampaign[];
  myProfile: MyMarketingProfile | null;
  isLoading: boolean;
  isFetchingNextPage: boolean;
  isSaving: boolean;
  error: string | null;

  fetchClients: (token: string, filters?: ClientBaseFilters) => Promise<void>;
  fetchCampaigns: (token: string, page?: number, limit?: number) => Promise<void>;
  createCampaign: (token: string, dto: CreateCampaignDto) => Promise<MarketingCampaign | null>;
  updateCampaign: (token: string, id: string, dto: UpdateCampaignDto) => Promise<MarketingCampaign | null>;
  deleteCampaign: (token: string, id: string) => Promise<void>;
  sendCampaign: (token: string, id: string) => Promise<{ sent_count: number } | null>;
  updateMyMarketingConsents: (token: string, dto: UpdateMarketingConsentsDto) => Promise<void>;
  fetchMyMarketingProfile: (token: string) => Promise<void>;
  clearError: () => void;
}

export const useMarketingStore = create<MarketingState>((set, get) => ({
  clients: [],
  stats: null,
  total: 0,
  page: 1,
  clientTotalPages: 1,
  totalPages: 1,
  campaigns: [],
  myProfile: null,
  isLoading: false,
  isFetchingNextPage: false,
  isSaving: false,
  error: null,

  fetchClients: async (token, filters) => {
    const isNextPage = filters?.page !== undefined && filters.page > 1;
    if (isNextPage) set({ isFetchingNextPage: true, error: null });
    else set({ isLoading: true, error: null, clients: [] }); // ← reset si page 1

    try {
      const res = await marketingApi.listClients(token, filters);
      if (!res.ok || !res.data) throw new Error(res.message ?? 'Erreur chargement clients');
      set(state => ({
        clients: isNextPage
          ? [...state.clients, ...res.data!.clients]  // ← concat page 2+
          : res.data!.clients,                         // ← replace page 1
        stats: res.data!.stats,
        total: res.data!.total,
        page: res.data!.page,
        clientTotalPages: res.data!.total_pages,
        isLoading: false,
        isFetchingNextPage: false,
      }));
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Erreur inconnue', isLoading: false, isFetchingNextPage: false });
      throw err;
    }
  },

  fetchCampaigns: async (token, page = 1, limit = 20) => {
    if (page > 1) set({ isFetchingNextPage: true });
    else set({ isLoading: true });
    set({ error: null });

    try {
      const res = await marketingApi.listCampaigns(token, page, limit);
      if (!res.ok || !res.data) throw new Error(res.message ?? 'Erreur chargement campagnes');
      set(state => ({
        campaigns: page > 1
          ? [...state.campaigns, ...res.data!.campaigns]
          : res.data!.campaigns,
        total: res.data!.total,
        page: res.data!.page,
        totalPages: res.data!.total_pages,
        isLoading: false,
        isFetchingNextPage: false,
      }));
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Erreur inconnue', isLoading: false, isFetchingNextPage: false });
    }
  },

  createCampaign: async (token, dto) => {
    set({ isSaving: true, error: null });
    try {
      const res = await marketingApi.createCampaign(token, dto);
      if (!res.ok || !res.data) throw new Error(res.message ?? 'Erreur création campagne');
      set(state => ({
        campaigns: [res.data!, ...state.campaigns],
      }));
      return res.data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      set({ error: message });
      throw new Error(message);
    } finally {
      set({ isSaving: false });
    }
  },

  updateCampaign: async (token, id, dto) => {
    set({ isSaving: true, error: null });
    try {
      const res = await marketingApi.updateCampaign(token, id, dto);
      if (!res.ok || !res.data) throw new Error(res.message ?? 'Erreur lors de la mise à jour de la campagne');
      set(state => ({
        campaigns: state.campaigns.map(c => (c.id === id ? res.data! : c)),
      }));
      return res.data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      set({ error: message });
      throw new Error(message);
    } finally {
      set({ isSaving: false });
    }
  },

  deleteCampaign: async (token, id) => {
    set({ isSaving: true, error: null });
    try {
      const res = await marketingApi.deleteCampaign(token, id);
      if (!res.ok) throw new Error(res.message ?? 'Erreur lors de la suppression de la campagne');
      set(state => ({ campaigns: state.campaigns.filter(c => c.id !== id) }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      set({ error: message });
      throw new Error(message);
    } finally {
      set({ isSaving: false });
    }
  },

  sendCampaign: async (token, id) => {
    set({ isSaving: true, error: null });
    try {
      const res = await marketingApi.sendCampaign(token, id);
      if (!res.ok || !res.data) throw new Error(res.message ?? 'Erreur lors de l\'envoi de la campagne');
      get().fetchCampaigns(token, 1, 20); // Re-fetch pour mettre à jour le statut
      return res.data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      set({ error: message });
      throw new Error(message);
    } finally {
      set({ isSaving: false });
    }
  },

  updateMyMarketingConsents: async (token, dto) => {
    set({ isSaving: true, error: null });
    try {
      const res = await marketingApi.updateMyConsents(token, dto);
      if (!res.ok) throw new Error(res.message ?? 'Erreur lors de la mise à jour des préférences');
      // Re-fetch profile to get updated values
      get().fetchMyMarketingProfile(token);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      set({ error: message });
      throw new Error(message);
    } finally {
      set({ isSaving: false });
    }
  },

  fetchMyMarketingProfile: async (token) => {
    set({ isLoading: true, error: null });
    try {
      const res = await marketingApi.getMyMarketingProfile(token);
      if (!res.ok || !res.data) throw new Error(res.message ?? 'Erreur lors du chargement du profil marketing');
      set({ myProfile: res.data });
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Erreur inconnue' });
    } finally {
      set({ isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));