// ══════════════════════════════════════════════════════════════════════════════
// STORE — Factures (Zustand)
// Sprint 4 — EazyVTC
// ══════════════════════════════════════════════════════════════════════════════

import { create } from 'zustand';
import { invoicesApi } from '../services/api/invoices.api';
import type {
  Invoice,
  InvoiceListFilters,
  InvoiceListResult,
  AdjustInvoicePriceDto,
} from '../types/invoices.types';

interface InvoicesState {
  invoices:   Invoice[];
  total:      number;
  page:       number;
  totalPages: number;
  selected:   Invoice | null;
  isLoading:  boolean;
  isAdjusting: boolean;
  error:      string | null;

  fetch:       (token: string, filters?: InvoiceListFilters) => Promise<void>;
  fetchById:   (token: string, id: string)                   => Promise<void>;
  adjustPrice: (token: string, id: string, dto: AdjustInvoicePriceDto) => Promise<void>;

  clearError:    () => void;
  clearSelected: () => void;
}

const applyList = (set: any, result: InvoiceListResult) =>
  set({
    invoices:   result.invoices,
    total:      result.total,
    page:       result.page,
    totalPages: result.total_pages,
    isLoading:  false,
  });

export const useInvoicesStore = create<InvoicesState>((set) => ({
  invoices:    [],
  total:       0,
  page:        1,
  totalPages:  1,
  selected:    null,
  isLoading:   false,
  isAdjusting: false,
  error:       null,

  fetch: async (token, filters) => {
    set({ isLoading: true, error: null });
    try {
      const res = await invoicesApi.list(token, filters);
      if (!res.ok || !res.data) throw new Error(res.message ?? 'Erreur de chargement');
      applyList(set, res.data);
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Erreur inconnue', isLoading: false });
      throw err;
    }
  },

  fetchById: async (token, id) => {
    set({ isLoading: true, error: null });
    try {
      const res = await invoicesApi.getById(token, id);
      if (!res.ok || !res.data) throw new Error(res.message ?? 'Facture introuvable');
      set({ selected: res.data, isLoading: false });
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Erreur inconnue', isLoading: false });
      throw err;
    }
  },

  adjustPrice: async (token, id, dto) => {
    set({ isAdjusting: true, error: null });
    try {
      const res = await invoicesApi.adjustPrice(token, id, dto);
      if (!res.ok || !res.data) throw new Error(res.message ?? 'Erreur lors de l\'ajustement');
      set((state: InvoicesState) => ({
        invoices: state.invoices.map(inv => inv.id === id ? res.data! : inv),
        selected: state.selected?.id === id ? res.data! : state.selected,
        isAdjusting: false,
      }));
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Erreur inconnue', isAdjusting: false });
      throw err;
    }
  },

  clearError:    () => set({ error: null }),
  clearSelected: () => set({ selected: null }),
}));
