// ══════════════════════════════════════════════════════════════════════════════
// HOOK — useFavorites
// ══════════════════════════════════════════════════════════════════════════════
import { useCallback } from 'react';
import { useAuthStore } from '../store/auth.store';
import { useFavoritesStore } from '../store/favorites.store';
import type { CreateFavoriteDto, UpdateFavoriteDto } from '../services/api/favorites.api';

export function useFavorites() {
  const accessToken = useAuthStore(s => s.accessToken);
  const userId = useAuthStore(s => s.user?.id);

  const {
    favorites,
    isLoading,
    isSaving,
    error,
    fetchFavorites: _fetch,
    addFavorite: _add,
    updateFavorite: _update,
    deleteFavorite: _delete,
    clearError,
  } = useFavoritesStore();

  const getToken = () => {
    if (!accessToken || !userId) throw new Error('Non authentifié');
    return { token: accessToken, userId };
  };

  const fetchFavorites = useCallback(() => { const { token, userId } = getToken(); return _fetch(token, userId); }, [_fetch, accessToken, userId]);
  const addFavorite = useCallback((dto: CreateFavoriteDto) => { const { token, userId } = getToken(); return _add(token, userId, dto); }, [_add, accessToken, userId]);
  const updateFavorite = useCallback((id: string, dto: UpdateFavoriteDto) => { const { token, userId } = getToken(); return _update(token, userId, id, dto); }, [_update, accessToken, userId]);
  const deleteFavorite = useCallback((id: string) => { const { token, userId } = getToken(); return _delete(token, userId, id); }, [_delete, accessToken, userId]);

  return {
    favorites,
    isLoading,
    isSaving,
    error,
    fetchFavorites,
    addFavorite,
    updateFavorite,
    deleteFavorite,
    clearError,
  };
}