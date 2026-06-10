// ══════════════════════════════════════════════════════════════════════════════
// API — FAVORITES
// ══════════════════════════════════════════════════════════════════════════════
import { api } from '../../lib/api';
import type { ApiResponse } from '../../types/api.types';
import type { FavoriteAddress } from '../../types/favorites.types';

export interface CreateFavoriteDto {
  label: string;
  address: string;
  lat?: number;
  lng?: number;
}

export type UpdateFavoriteDto = Partial<CreateFavoriteDto>;

class FavoritesApi {
  /**
   * Récupère la liste des adresses favorites de l'utilisateur connecté.
   */
  async list(token: string, userId: string): Promise<ApiResponse<FavoriteAddress[]>> {
    return api.get(`/users/${userId}/favorites`, token);
  }

  /**
   * Crée une nouvelle adresse favorite.
   */
  async create(token: string, userId: string, dto: CreateFavoriteDto): Promise<ApiResponse<FavoriteAddress>> {
    return api.post(`/users/${userId}/favorites`, dto, token);
  }

  /**
   * Met à jour une adresse favorite existante.
   */
  async update(token: string, userId: string, favoriteId: string, dto: UpdateFavoriteDto): Promise<ApiResponse<FavoriteAddress>> {
    return api.patch(`/users/${userId}/favorites/${favoriteId}`, dto, token);
  }

  /**
   * Supprime une adresse favorite.
   */
  async delete(token: string, userId: string, favoriteId: string): Promise<ApiResponse> {
    return api.delete(`/users/${userId}/favorites/${favoriteId}`, token);
  }
}

export const favoritesApi = new FavoritesApi();