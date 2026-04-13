// ══════════════════════════════════════════════════════════════════════════════
// API — Module Factures (Invoices)
// Sprint 4 — EazyVTC
// ══════════════════════════════════════════════════════════════════════════════

import { api }              from '../../lib/api';
import type { ApiResponse } from '../../types';
import type {
  Invoice,
  InvoiceListFilters,
  InvoiceListResult,
  AdjustInvoicePriceDto,
} from '../../types/invoices.types';

const buildQs = (filters?: InvoiceListFilters): string => {
  const params = new URLSearchParams();
  if (filters?.page)  params.set('page',  String(filters.page));
  if (filters?.limit) params.set('limit', String(filters.limit));
  const qs = params.toString();
  return qs ? `?${qs}` : '';
};

export const invoicesApi = {

  // ── Client / Chauffeur / Admin (filtrés côté service) ────────────────────────

  /** GET /invoices — Liste (filtrée selon le rôle) */
  list: (
    token:    string,
    filters?: InvoiceListFilters,
  ): Promise<ApiResponse<InvoiceListResult>> =>
    api.get(`/invoices${buildQs(filters)}`, token),

  /** GET /invoices/:id — Détail */
  getById: (
    token: string,
    id:    string,
  ): Promise<ApiResponse<Invoice>> =>
    api.get(`/invoices/${id}`, token),

  // ── Admin ─────────────────────────────────────────────────────────────────────

  /** PUT /invoices/:id/price — Ajuster le prix (admin) */
  adjustPrice: (
    token: string,
    id:    string,
    dto:   AdjustInvoicePriceDto,
  ): Promise<ApiResponse<Invoice>> =>
    api.put(`/invoices/${id}/price`, dto, token),

  /**
   * URL du PDF signé (1h) — ouvrir via Linking.openURL avec le token
   * Le backend redirige vers Supabase Storage (302).
   */
  getPdfUrl: (token: string, id: string): string => {
    const base = process.env.EXPO_PUBLIC_API_URL ?? '';
    return `${base}/invoices/${id}/pdf`;
  },
};
