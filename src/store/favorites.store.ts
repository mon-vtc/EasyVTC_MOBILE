// ══════════════════════════════════════════════════════════════════════════════
// STORE — FAVORITES
// ══════════════════════════════════════════════════════════════════════════════
import { create } from 'zustand';
import { favoritesApi } from '../services/api/favorites.api';
import type { CreateFavoriteDto, UpdateFavoriteDto } from '../services/api/favorites.api';
import type { FavoriteAddress } from '../types/favorites.types';

interface FavoritesState {
  favorites: FavoriteAddress[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;

  fetchFavorites: (token: string, userId: string) => Promise<void>;
  addFavorite: (token: string, userId: string, dto: CreateFavoriteDto) => Promise<{ res: FavoriteAddress | null; err: Error | null }>;
  updateFavorite: (token: string, userId: string, favoriteId: string, dto: UpdateFavoriteDto) => Promise<{ res: FavoriteAddress | null; err: Error | null }>;
  deleteFavorite: (token: string, userId: string, favoriteId: string) => Promise<void>;
  clearError: () => void;
}

export const useFavoritesStore = create<FavoritesState>((set) => ({
  favorites: [],
  isLoading: false,
  isSaving: false,
  error: null,

  fetchFavorites: async (token, userId) => {
    set({ isLoading: true, error: null });
    try {
      const res = await favoritesApi.list(token, userId);
      if (!res.ok || !res.data) throw new Error(res.message ?? 'Erreur de chargement');
      set({ favorites: res.data, isLoading: false });
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Erreur inconnue', isLoading: false });
    }
  },

  addFavorite: async (token, userId, dto) => {
    set({ isSaving: true, error: null });
    try {
      const res = await favoritesApi.create(token, userId, dto);
      if (!res.ok || !res.data) throw new Error(res.message ?? 'Erreur de création');
      set(state => ({ favorites: [...state.favorites, res.data! as FavoriteAddress], isSaving: false }));
      return { res: res.data, err: null };
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('Erreur inconnue');
      set({ error: error.message, isSaving: false });
      return { res: null, err: error };
    } finally {
      set({ isSaving: false });
    }
  },

  updateFavorite: async (token, userId, favoriteId, dto) => {
    set({ isSaving: true });
    try {
      const res = await favoritesApi.update(token, userId, favoriteId, dto);
      if (!res.ok || !res.data) throw new Error(res.message ?? 'Erreur de mise à jour');
      set(state => ({ favorites: state.favorites.map(f => f.id === favoriteId ? (res.data! as FavoriteAddress) : f), isSaving: false }));
      return { res: res.data, err: null };
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('Erreur inconnue');
      set({ error: error.message, isSaving: false });
      return { res: null, err: error };
    } finally {
      set({ isSaving: false });
    }
  },

  deleteFavorite: async (token, userId, favoriteId) => {
    set({ isSaving: true, error: null });
    try {
      const res = await favoritesApi.delete(token, userId, favoriteId);
      if (!res.ok) throw new Error(res.message ?? 'Erreur de suppression');
      set(state => ({ favorites: state.favorites.filter(f => f.id !== favoriteId) }));
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Erreur inconnue' });
    } finally {
      set({ isSaving: false });
    }
  },

  clearError: () => set({ error: null }),
}));