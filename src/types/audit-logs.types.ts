// ══════════════════════════════════════════════════════════════════════════════
// TYPES — Module Audit Logs
// ══════════════════════════════════════════════════════════════════════════════

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  old_value: Record<string, any> | null;
  new_value: Record<string, any> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  // Relation
  user: {
    first_name: string;
    last_name: string;
    email: string;
  } | null;
}

export interface AuditLogListFilters {
  page?: number;
  limit?: number;
  sort_by?: 'created_at' | 'action' | 'entity_type';
  order?: 'asc' | 'desc';
  search?: string;
  date_from?: string;
  date_to?: string;
  user_id?: string;
  entity_id?: string;
}

export interface AuditLogListResult {
  logs: AuditLog[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}