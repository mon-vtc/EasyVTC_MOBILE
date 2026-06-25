// ══════════════════════════════════════════════════════════════════════════════
// STORE — Gestionnaires (Admin)
// ══════════════════════════════════════════════════════════════════════════════

import { create } from 'zustand';
import { managersApi } from '../services/api/managers.api';
import type {
  UserProfile,
  CreateManagerDto,
  UpdateManagerDto,
  ChangeManagerStatusDto,
  ManagerListFilters,
} from '../types/admin.types';


interface ManagersState {
  managers:           UserProfile[];
  total:              number;
  page:               number;
  totalPages:         number;
  isLoading:          boolean;
  isFetchingNextPage: boolean;
  isSaving:           boolean;
  error:              string | null;

  fetchManagers: (token: string, filters?: ManagerListFilters) => Promise<void>;
  createManager: (token: string, dto: CreateManagerDto) => Promise<UserProfile | null>;
  updateManager: (token: string, id: string, dto: UpdateManagerDto) => Promise<UserProfile | null>;
  fetchManagerById: (token: string, id: string) => Promise<UserProfile | null>;
  changeStatus:  (token: string, id: string, dto: ChangeManagerStatusDto) => Promise<UserProfile | null>;
  deleteManager: (token: string, id: string) => Promise<void>;
  clearError:    () => void;
}

export const useManagersStore = create<ManagersState>((set, get) => ({
  managers:           [],
  total:              0,
  page:               1,
  totalPages:         1,
  isLoading:          false,
  isFetchingNextPage: false,
  isSaving:           false,
  error:              null,

  fetchManagers: async (token, filters) => {
    const page = filters?.page ?? 1;
    if (page > 1) set({ isFetchingNextPage: true });
    else set({ isLoading: true, error: null });
    try {
      const res = await managersApi.list(token, filters);
      if (!res.ok || !res.data) throw new Error(res.message ?? 'Erreur de chargement');
      set(state => ({
        managers:           page > 1 ? [...state.managers, ...res.data!.managers] : res.data!.managers,
        total:              res.data!.total,
        page:               res.data!.page,
        totalPages:         res.data!.total_pages,
        isLoading:          false,
        isFetchingNextPage: false,
      }));
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Erreur inconnue', isLoading: false, isFetchingNextPage: false });
      throw err;
    }
  },

  createManager: async (token, dto) => {
    set({ isSaving: true, error: null });
    try {
      const res = await managersApi.create(token, dto);
      if (!res.ok || !res.data) throw new Error(res.message ?? 'Erreur de création');
      set(state => ({ managers: [res.data!, ...state.managers], total: state.total + 1 }));
      return res.data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      set({ error: message });
      throw new Error(message);
    } finally {
      set({ isSaving: false });
    }
  },
  fetchManagerById: async (token, id) => {
    set({ isLoading: true, error: null });
    try {
      const res = await managersApi.getById(token, id);
      if (!res.ok || !res.data) throw new Error(res.message ?? 'Erreur de chargement');
      return res.data;
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Erreur inconnue' });
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  updateManager: async (token, id, dto) => {
    set({ isSaving: true, error: null });
    try {
      const res = await managersApi.update(token, id, dto);
      if (!res.ok || !res.data) throw new Error(res.message ?? 'Erreur de mise à jour');
      set(state => ({ managers: state.managers.map(m => m.id === id ? res.data! : m) }));
      return res.data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      set({ error: message });
      throw new Error(message);
    } finally {
      set({ isSaving: false });
    }
  },

  changeStatus: async (token, id, dto) => {
    set({ isSaving: true, error: null });
    try {
      const res = await managersApi.changeStatus(token, id, dto);
      if (!res.ok || !res.data) throw new Error(res.message ?? 'Erreur de mise à jour');
      set(state => ({ managers: state.managers.map(m => m.id === id ? res.data! : m) }));
      return res.data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      set({ error: message });
      throw new Error(message);
    } finally {
      set({ isSaving: false });
    }
  },

  deleteManager: async (token, id) => {
    try {
      await managersApi.delete(token, id);
      set(state => ({
        managers: state.managers.filter(m => m.id !== id),
        total: state.total - 1,
      }));
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Erreur inconnue' });
    }
  },

  clearError: () => set({ error: null }),
}));