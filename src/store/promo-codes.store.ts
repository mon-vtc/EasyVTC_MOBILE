// ══════════════════════════════════════════════════════════════════════════════
// STORE — Promo Codes (Zustand)
// Sprint 6 — EasyVTC
// ══════════════════════════════════════════════════════════════════════════════

import { create } from 'zustand';
import { promoCodesApi } from '../services/api/promo-codes.api';
import type { PromoCode, PromoCodeListFilters, CreatePromoCodeDto, UpdatePromoCodeDto, UserPromoCodeItem, UserPromoCodesResult, BulkAssignDto, BulkAssignResult } from '../types';

interface PromoCodesState {
  promoCodes: PromoCode[];
  total: number;
  page: number;
  totalPages: number;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  fetchPromoCodes: (token: string, filters?: PromoCodeListFilters) => Promise<void>;

  myActivePromoCodes: UserPromoCodeItem[];
  myExpiredPromoCodes: UserPromoCodeItem[];
  myTotalSavings: number;
  myActiveCount: number;
  isFetchingMyPromoCodes: boolean;
  myPromoCodesError: string | null;
  fetchMyPromoCodes: (token: string) => Promise<void>;
  createPromoCode: (token: string, dto: CreatePromoCodeDto) => Promise<PromoCode | null>;
  updatePromoCode: (token: string, id: string, dto: UpdatePromoCodeDto) => Promise<PromoCode | null>;
  deletePromoCode: (token: string, id: string) => Promise<void>;
  bulkAssignPromoCode: (token: string, templateId: string, dto: BulkAssignDto) => Promise<BulkAssignResult | null>;
  clearError: () => void;
  clearMyPromoCodesError: () => void;
}

export const usePromoCodesStore = create<PromoCodesState>((set) => ({
  promoCodes: [],
  total: 0,
  page: 1,
  totalPages: 1,
  isLoading: false,
  isSaving: false,
  myActivePromoCodes: [],
  myExpiredPromoCodes: [],
  myTotalSavings: 0,
  myActiveCount: 0,
  isFetchingMyPromoCodes: false,
  myPromoCodesError: null,
  error: null,

  fetchPromoCodes: async (token, filters) => {
    set({ isLoading: true, error: null });
    try {
      const res = await promoCodesApi.listPromoCodes(token, filters);
      if (!res.ok || !res.data) throw new Error(res.message ?? 'Erreur lors du chargement des codes promo');
      set({
        promoCodes: res.data.promo_codes,
        total: res.data.total,
        page: res.data.page,
        totalPages: res.data.total_pages,
        isLoading: false,
      });
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Erreur inconnue', isLoading: false });
      throw err;
    }
  },

  createPromoCode: async (token, dto) => {
    set({ isSaving: true, error: null });
    try {
      const res = await promoCodesApi.createPromoCode(token, dto);
      if (!res.ok || !res.data) throw new Error(res.message ?? 'Erreur lors de la création');
      set(state => ({ promoCodes: [res.data!, ...state.promoCodes] }));
      return res.data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      set({ error: message });
      throw new Error(message);
    } finally {
      set({ isSaving: false });
    }
  },

  updatePromoCode: async (token, id, dto) => {
    set({ isSaving: true, error: null });
    try {
      const res = await promoCodesApi.updatePromoCode(token, id, dto);
      if (!res.ok || !res.data) throw new Error(res.message ?? 'Erreur lors de la mise à jour');
      set(state => ({
        promoCodes: state.promoCodes.map((promo) => promo.id === id ? res.data! : promo),
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

  bulkAssignPromoCode: async (token, templateId, dto) => {
    set({ isSaving: true, error: null });
    try {
      const res = await promoCodesApi.bulkAssign(token, templateId, dto);
      if (!res.ok || !res.data) throw new Error(res.message ?? 'Erreur lors de l\'assignation en masse');
      // Note: On ne met pas à jour la liste locale car les codes générés sont spécifiques aux utilisateurs
      return res.data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      set({ error: message });
      throw new Error(message);
    } finally {
      set({ isSaving: false });
    }
  },

  deletePromoCode: async (token, id) => {
    set({ isSaving: true, error: null });
    try {
      const res = await promoCodesApi.deletePromoCode(token, id);
      if (!res.ok) throw new Error(res.message ?? 'Erreur lors de la suppression');
      set(state => ({ promoCodes: state.promoCodes.filter((promo) => promo.id !== id) }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      set({ error: message });
      throw new Error(message);
    } finally {
      set({ isSaving: false });
    }
  },

  clearError: () => set({ error: null }),

  clearMyPromoCodesError: () => set({ myPromoCodesError: null }),

  fetchMyPromoCodes: async (token: string) => {
    set({ isFetchingMyPromoCodes: true, myPromoCodesError: null });
    try {
      const res = await promoCodesApi.fetchMyPromoCodes(token);
      if (!res.ok || !res.data) throw new Error(res.message ?? 'Erreur lors du chargement de vos codes promo');
      set({
        myActivePromoCodes: res.data.active,
        myExpiredPromoCodes: res.data.expired,
        myTotalSavings: res.data.stats.total_savings,
        myActiveCount: res.data.stats.active_count,
        isFetchingMyPromoCodes: false,
      });
    } catch (err: unknown) {
      set({ myPromoCodesError: err instanceof Error ? err.message : 'Erreur inconnue', isFetchingMyPromoCodes: false });
    }
  },
}));
