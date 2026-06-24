// ══════════════════════════════════════════════════════════════════════════════
// STORE — Bons de commande (Zustand)
// Sprint 4 — EazyVTC
// ══════════════════════════════════════════════════════════════════════════════

import { create } from 'zustand';
import { ordersApi } from '../services/api/orders.api';
import type { Order, OrderListFilters, OrderListResult } from '../types/orders.types';

interface OrdersState {
  orders:             Order[];
  total:              number;
  page:               number;
  totalPages:         number;
  selected:           Order | null;
  isLoading:          boolean;
  isFetchingNextPage: boolean;
  error:              string | null;

  fetchMine:       (token: string, filters?: OrderListFilters) => Promise<void>;
  fetchDriverMine: (token: string, filters?: OrderListFilters) => Promise<void>;
  fetchAll:        (token: string, filters?: OrderListFilters) => Promise<void>;
  fetchById:       (token: string, id: string)                 => Promise<void>;
  fetchByReservation: (token: string, reservationId: string)  => Promise<Order | null>;

  clearError:    () => void;
  clearSelected: () => void;
}

export const useOrdersStore = create<OrdersState>((set) => ({
  orders:             [],
  total:              0,
  page:               1,
  totalPages:         1,
  selected:           null,
  isLoading:          false,
  isFetchingNextPage: false,
  error:              null,

  fetchMine: async (token, filters) => {
    const page = filters?.page ?? 1;
    if (page > 1) set({ isFetchingNextPage: true });
    else set({ isLoading: true, error: null });
    try {
      const res = await ordersApi.listMine(token, filters);
      if (!res.ok || !res.data) throw new Error(res.message ?? 'Erreur de chargement');
      const result = res.data;
      set(state => ({
        orders:             page > 1 ? [...state.orders, ...result.orders] : result.orders,
        total:              result.total,
        page:               result.page,
        totalPages:         result.total_pages,
        isLoading:          false,
        isFetchingNextPage: false,
      }));
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Erreur inconnue', isLoading: false, isFetchingNextPage: false });
      throw err;
    }
  },

  fetchDriverMine: async (token, filters) => {
    const page = filters?.page ?? 1;
    if (page > 1) set({ isFetchingNextPage: true });
    else set({ isLoading: true, error: null });
    try {
      const res = await ordersApi.listDriverMine(token, filters);
      if (!res.ok || !res.data) throw new Error(res.message ?? 'Erreur de chargement');
      const result = res.data;
      set(state => ({
        orders:             page > 1 ? [...state.orders, ...result.orders] : result.orders,
        total:              result.total,
        page:               result.page,
        totalPages:         result.total_pages,
        isLoading:          false,
        isFetchingNextPage: false,
      }));
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Erreur inconnue', isLoading: false, isFetchingNextPage: false });
      throw err;
    }
  },

  fetchAll: async (token, filters) => {
    const page = filters?.page ?? 1;
    if (page > 1) set({ isFetchingNextPage: true });
    else set({ isLoading: true, error: null });
    try {
      const res = await ordersApi.listAll(token, filters);
      if (!res.ok || !res.data) throw new Error(res.message ?? 'Erreur de chargement');
      const result = res.data;
      set(state => ({
        orders:             page > 1 ? [...state.orders, ...result.orders] : result.orders,
        total:              result.total,
        page:               result.page,
        totalPages:         result.total_pages,
        isLoading:          false,
        isFetchingNextPage: false,
      }));
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Erreur inconnue', isLoading: false, isFetchingNextPage: false });
      throw err;
    }
  },

  fetchById: async (token, id) => {
    set({ isLoading: true, error: null });
    try {
      const res = await ordersApi.getById(token, id);
      if (!res.ok || !res.data) throw new Error(res.message ?? 'Bon de commande introuvable');
      set({ selected: res.data, isLoading: false });
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Erreur inconnue', isLoading: false });
      throw err;
    }
  },

  fetchByReservation: async (token, reservationId) => {
    set({ isLoading: true, error: null });
    try {
      const res = await ordersApi.getByReservation(token, reservationId);
      if (!res.ok || !res.data) {
        set({ isLoading: false });
        return null;
      }
      set({ selected: res.data, isLoading: false });
      return res.data;
    } catch {
      set({ isLoading: false });
      return null;
    }
  },

  clearError:    () => set({ error: null }),
  clearSelected: () => set({ selected: null }),
}));
