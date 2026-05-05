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

  /** GET /invoices/by-reservation/:reservationId — Facture d'une réservation */
  fetchByReservationId: (
    token:         string,
    reservationId: string,
  ): Promise<ApiResponse<Invoice>> =>
    api.get(`/invoices/by-reservation/${reservationId}`, token),

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

  /** GET /invoices/:id/pdf — URL signée du PDF (1h). Ouvrir via Linking.openURL(res.data.url). */
  fetchPdfUrl: (token: string, id: string): Promise<ApiResponse<{ url: string }>> =>
    api.get(`/invoices/${id}/pdf`, token),
};
