import { create }  from 'zustand';
import { userApi } from '../services/api/user.api';
import type {
  AuthUser, ListUsersParams, UpdateUserStatusPayload,
} from '../types';

interface UsersState {
  users:      AuthUser[];
  total:      number;
  page:       number;
  totalPages: number;
  isLoading:  boolean;
  error:      string | null;

  fetchUsers:       (token: string, params?: ListUsersParams) => Promise<void>;
  fetchUserById:    (token: string, userId: string)           => Promise<AuthUser | null>;
  updateUserStatus: (token: string, userId: string, payload: UpdateUserStatusPayload) => Promise<void>;
  clearError:       () => void;
}

export const useUsersStore = create<UsersState>((set, get) => ({
  users:      [],
  total:      0,
  page:       1,
  totalPages: 1,
  isLoading:  false,
  error:      null,

  // ── Liste paginée ─────────────────────────────────────────────
  fetchUsers: async (token, params) => {
    set({ isLoading: true, error: null });
    try {
      const res = await userApi.listUsers(token, params);
      if (!res.ok || !res.data) throw new Error(res.message ?? 'Erreur lors du chargement');
      set({
        users:      res.data.users,
        total:      res.data.total,
        page:       res.data.page,
        totalPages: res.data.total_pages,
        isLoading:  false,
      });
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Erreur inconnue', isLoading: false });
      throw err;
    }
  },

  // ── Détail par ID ─────────────────────────────────────────────
  fetchUserById: async (token, userId) => {
    set({ isLoading: true, error: null });
    try {
      const res = await userApi.getUserById(token, userId);
      if (!res.ok || !res.data) throw new Error(res.message ?? 'Utilisateur introuvable');
      set({ isLoading: false });
      return res.data;
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Erreur inconnue', isLoading: false });
      return null;
    }
  },

  // ── Changer le statut (admin) ─────────────────────────────────
  updateUserStatus: async (token, userId, payload) => {
    set({ isLoading: true, error: null });
    try {
      const res = await userApi.updateUserStatus(token, userId, payload);
      if (!res.ok || !res.data) throw new Error(res.message ?? 'Erreur lors de la mise à jour');
      // Mise à jour locale dans la liste
      const updatedUser = res.data;
      set(state => ({
        users:     state.users.map(u => u.id === userId ? updatedUser : u),
        isLoading: false,
      }));
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Erreur inconnue', isLoading: false });
      throw err;
    }
  },

  clearError: () => set({ error: null }),
}));