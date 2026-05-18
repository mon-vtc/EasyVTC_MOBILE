// ══════════════════════════════════════════════════════════════════════════════
// API — Module Admin
// ══════════════════════════════════════════════════════════════════════════════

import { api } from '../../lib/api';
import type { ApiResponse, AdminStats } from '../../types';

class AdminApi {
  /**
   * Récupère les statistiques globales pour le tableau de bord de l'administrateur.
   * @param token - Le JWT de l'administrateur.
   */
  getStats(token: string): Promise<ApiResponse<AdminStats>> {
    return api.get<AdminStats>('/admin/stats', token);
  }
}

export const adminApi = new AdminApi();