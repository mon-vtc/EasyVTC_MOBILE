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
} from '../types/marketing.types';

interface MarketingState {
  clients: ClientSummary[];
  stats: ClientBaseStats | null;
  total: number;
  page: number;
  totalPages: number;
  campaigns: MarketingCampaign[];
  isLoading: boolean;
  isFetchingNextPage: boolean;
  isSaving: boolean;
  error: string | null;

  fetchClients: (token: string, filters?: ClientBaseFilters) => Promise<void>;
  fetchCampaigns: (token: string, page?: number, limit?: number) => Promise<void>;
  createCampaign: (token: string, dto: CreateCampaignDto) => Promise<MarketingCampaign | null>;
  clearError: () => void;
}

export const useMarketingStore = create<MarketingState>((set) => ({
  clients: [],
  stats: null,
  total: 0,
  page: 1,
  totalPages: 1,
  campaigns: [],
  isLoading: false,
  isFetchingNextPage: false,
  isSaving: false,
  error: null,

  fetchClients: async (token, filters) => {
    set({ isLoading: true, error: null });
    try {
      const res = await marketingApi.listClients(token, filters);
      if (!res.ok || !res.data) throw new Error(res.message ?? 'Erreur chargement clients');
      set({
        clients: res.data.clients,
        stats: res.data.stats,
        total: res.data.total,
        page: res.data.page,
        isLoading: false,
      });
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Erreur inconnue', isLoading: false });
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

  clearError: () => set({ error: null }),
}));