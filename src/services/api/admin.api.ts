// ══════════════════════════════════════════════════════════════════════════════
// API — Module Admin
// ══════════════════════════════════════════════════════════════════════════════
import type { AdminStatsFilters, AdminDashboardPeriod } from '../../types';
import { api } from '../../lib/api';
import type { ApiResponse, AdminStats, AdminDashboard } from '../../types';
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

  /**
   * Récupère les données du dashboard analytique avancé.
   * @param token - Le JWT de l'administrateur.
   * @param period - La période de temps ('week', 'month', 'year').
   * @param date - La date de référence (optionnelle, YYYY-MM-DD).
   */
  getDashboard(token: string, period: AdminDashboardPeriod, date?: string): Promise<ApiResponse<AdminDashboard>> {
    const params = new URLSearchParams();
    params.set('period', period);
    if (date) params.set('date', date);
    return api.get<AdminDashboard>(`/admin/dashboard?${params.toString()}`, token);
  }
}

export const adminApi = new AdminApi();