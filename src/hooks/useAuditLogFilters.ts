import type { AuditLogListFilters } from '../types';

export interface AuditLogFilters {
  dateMode: 'none' | 'specific' | 'period';
  dateExact: string | null;
  dateFrom: string | null;
  dateTo: string | null;
  sortField: 'created_at' | 'action';
  sortOrder: 'asc' | 'desc';
}

export const DEFAULT_AUDIT_LOG_FILTERS: AuditLogFilters = {
  dateMode: 'none',
  dateExact: null,
  dateFrom: null,
  dateTo: null,
  sortField: 'created_at',
  sortOrder: 'desc',
};

export function auditLogFiltersToApiParams(
  f: AuditLogFilters,
): Pick<AuditLogListFilters, 'date_from' | 'date_to' | 'sort_by' | 'order'> {
  const params: Partial<AuditLogListFilters> = {
    sort_by: f.sortField,
    order: f.sortOrder,
  };

  if (f.dateMode === 'specific' && f.dateExact) {
    params.date_from = `${f.dateExact}T00:00:00.000Z`;
    params.date_to = `${f.dateExact}T23:59:59.999Z`;
  } else if (f.dateMode === 'period') {
    if (f.dateFrom) params.date_from = `${f.dateFrom}T00:00:00.000Z`;
    if (f.dateTo) params.date_to = `${f.dateTo}T23:59:59.999Z`;
  }

  return params as ReturnType<typeof auditLogFiltersToApiParams>;
}

export function isAuditLogFiltersActive(f: AuditLogFilters): boolean {
  return (
    f.dateMode !== 'none' ||
    f.sortField !== 'created_at' ||
    f.sortOrder !== 'desc'
  );
}