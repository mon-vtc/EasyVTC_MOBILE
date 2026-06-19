// ══════════════════════════════════════════════════════════════════════════════
// API SERVICE — RGPD
// ══════════════════════════════════════════════════════════════════════════════
import { api } from '../../lib/api';
import type { RgpdExport, ApiResponse } from '../../types';

/**
 * Résultat de l'anonymisation.
 */
interface AnonymizeResult {
  user_id: string;
  anonymized_at: string;
  message: string;
}

export const rgpdApi = {
  /**
   * Demande l'export des données personnelles de l'utilisateur.
   * @param token - Le token d'authentification.
   * @param userId - L'ID de l'utilisateur dont les données sont demandées.
   * @returns Les données personnelles au format JSON.
   */
  exportMyData: (token: string, userId: string): Promise<ApiResponse<RgpdExport>> =>
    api.get<RgpdExport>(`/users/${userId}/data-export`, token),

  /**
   * Demande l'anonymisation (suppression RGPD) du compte de l'utilisateur.
   * Cette action est irréversible.
   * @param token - Le token d'authentification.
   * @param userId - L'ID de l'utilisateur à anonymiser.
   * @returns Une confirmation de l'anonymisation.
   */
  anonymizeMyAccount: (token: string, userId: string, password: string): Promise<ApiResponse<AnonymizeResult>> =>
    // Le backend attend { confirm: true, password: '...' } dans le corps de la requête
    api.delete<AnonymizeResult>(`/users/${userId}/anonymize`, token, { confirm: true, password }),
};