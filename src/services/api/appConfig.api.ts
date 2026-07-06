// ══════════════════════════════════════════════════════════════════════════════
// API — Module App Config (coordonnées support)
// ══════════════════════════════════════════════════════════════════════════════

import { api } from '../../lib/api';
import type { ApiResponse } from '../../types';
import type { SupportConfig, SupportConfigKey, AppConfigEntry } from '../../types/admin.types';

export const appConfigApi = {

  /** GET /admin/app-config — Lire les coordonnées du support */
  getSupportConfig: (token: string): Promise<ApiResponse<SupportConfig>> =>
    api.get('/admin/app-config', token),

  /** PUT /admin/app-config/:key — Mettre à jour une valeur de configuration */
  upsert: (token: string, key: SupportConfigKey, value: string): Promise<ApiResponse<AppConfigEntry>> =>
    api.put(`/admin/app-config/${key}`, { value }, token),
};
