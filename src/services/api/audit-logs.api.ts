// ══════════════════════════════════════════════════════════════════════════════
// API — Module Audit Logs
// ══════════════════════════════════════════════════════════════════════════════

import { api } from '../../lib/api';
import type { ApiResponse, AuditLogListResult, AuditLogListFilters, AuditLog } from '../../types';

class AuditLogsApi {
  list(
    token: string,
    filters?: AuditLogListFilters,
  ): Promise<ApiResponse<AuditLogListResult>> {
    const params = new URLSearchParams();
    if (filters?.page) params.set('page', String(filters.page));
    if (filters?.limit) params.set('limit', String(filters.limit));
    if (filters?.search) params.set('search', filters.search);
    if (filters?.sort_by) params.set('sort_by', filters.sort_by);
    if (filters?.order) params.set('order', filters.order);
    if (filters?.user_id) params.set('user_id', filters.user_id);
    if (filters?.entity_id) params.set('entity_id', filters.entity_id);
    const qs = params.toString();
    return api.get(`/admin/audit-logs${qs ? `?${qs}` : ''}`, token);
  }

  getById(
    token: string,
    id: string,
  ): Promise<ApiResponse<AuditLog>> {
    return api.get(`/admin/audit-logs/${id}`, token);
  }
}

export const auditLogsApi = new AuditLogsApi();