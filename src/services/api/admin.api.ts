// ══════════════════════════════════════════════════════════════════════════════
// API — Module Admin
// ══════════════════════════════════════════════════════════════════════════════
import type { AdminStatsFilters } from '../../types';
import { api } from '../../lib/api';
import type { ApiResponse, AdminStats } from '../../types';
class AdminApi {
  /**
   * Récupère les statistiques globales pour le tableau de bord de l'administrateur.
   * @param token - Le JWT de l'administrateur.
   * @param filters - Les filtres de période ou de date.
   */
  getStats(token: string, filters?: AdminStatsFilters): Promise<ApiResponse<AdminStats>> {
    const params = new URLSearchParams();
    if (filters?.period)    params.set('period', filters.period);
    if (filters?.date)      params.set('date', filters.date);
    if (filters?.date_from) params.set('date_from', filters.date_from);
    if (filters?.date_to)   params.set('date_to', filters.date_to);

    const queryString = params.toString();
    return api.get<AdminStats>(`/admin/stats${queryString ? `?${queryString}` : ''}`, token);
  }
}

export const adminApi = new AdminApi();