// ══════════════════════════════════════════════════════════════════════════════
// STORE — Audit Logs (Zustand)
// ══════════════════════════════════════════════════════════════════════════════

import { create } from 'zustand';
import { auditLogsApi } from '../services/api/audit-logs.api';
import type { AuditLog, AuditLogListFilters } from '../types';

interface AuditLogsState {
  logs: AuditLog[];
  selectedLog: AuditLog | null;
  total: number;
  page: number;
  totalPages: number;
  isLoading: boolean;
  isFetchingNextPage: boolean;
  error: string | null;

  fetchLogs: (token: string, filters?: AuditLogListFilters) => Promise<void>;
  fetchLogById: (token: string, id: string) => Promise<void>;
  clearError: () => void;
}

export const useAuditLogsStore = create<AuditLogsState>((set) => ({
  logs: [],
  selectedLog: null,
  total: 0,
  page: 1,
  totalPages: 1,
  isLoading: false,
  isFetchingNextPage: false,
  error: null,

  fetchLogs: async (token, filters) => {
    const page = filters?.page ?? 1;
    if (page > 1) set({ isFetchingNextPage: true });
    else set({ isLoading: true });
    set({ error: null });

    try {
      const res = await auditLogsApi.list(token, filters);
      if (!res.ok || !res.data) throw new Error(res.message ?? 'Erreur chargement des logs');
      set(state => ({
        logs: page > 1 ? [...state.logs, ...res.data!.logs] : res.data!.logs,
        total: res.data!.total,
        page: res.data!.page,
        totalPages: res.data!.total_pages,
        isLoading: false, isFetchingNextPage: false,
      }));
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Erreur inconnue', isLoading: false, isFetchingNextPage: false });
    }
  },

  fetchLogById: async (token, id) => {
    set({ isLoading: true, error: null, selectedLog: null });
    try {
      const res = await auditLogsApi.getById(token, id);
      if (!res.ok || !res.data) throw new Error(res.message ?? 'Log introuvable');
      set({ selectedLog: res.data, isLoading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  clearError: () => set({ error: null }),
}));