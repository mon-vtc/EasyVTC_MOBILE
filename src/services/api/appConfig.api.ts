// ══════════════════════════════════════════════════════════════════════════════
// API — Module App Config (coordonnées support)
// ══════════════════════════════════════════════════════════════════════════════

import { api } from '../../lib/api';
import type { ApiResponse, SupportConfig } from '../../types';

class AppConfigApi {
  getSupportConfig(token: string): Promise<ApiResponse<SupportConfig>> {
    return api.get<SupportConfig>('/admin/app-config', token);
  }

  updateConfig(token: string, key: string, value: string): Promise<ApiResponse<unknown>> {
    return api.put<unknown>(`/admin/app-config/${key}`, { value }, token);
  }
}

export const appConfigApi = new AppConfigApi();
