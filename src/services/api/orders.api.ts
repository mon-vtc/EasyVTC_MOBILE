// ══════════════════════════════════════════════════════════════════════════════
// API — Module Bons de commande (Orders)
// Sprint 4 — EasyVTC
// ══════════════════════════════════════════════════════════════════════════════

import { api }              from '../../lib/api';
import type { ApiResponse } from '../../types';
import type {
  Order,
  OrderListFilters,
  OrderListResult,
} from '../../types/orders.types';

const buildQs = (filters?: OrderListFilters): string => {
  const params = new URLSearchParams();
  if (filters?.page)           params.set('page',           String(filters.page));
  if (filters?.limit)          params.set('limit',          String(filters.limit));
  if (filters?.reservation_id) params.set('reservation_id', filters.reservation_id);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
};

export const ordersApi = {

  // ── Client ──────────────────────────────────────────────────────────────────

  /** GET /orders/mine — Mes bons de commande */
  listMine: (
    token:    string,
    filters?: OrderListFilters,
  ): Promise<ApiResponse<OrderListResult>> =>
    api.get(`/orders/mine${buildQs(filters)}`, token),

  // ── Chauffeur ────────────────────────────────────────────────────────────────

  /** GET /orders/driver/mine — Mes bons (chauffeur) */
  listDriverMine: (
    token:    string,
    filters?: OrderListFilters,
  ): Promise<ApiResponse<OrderListResult>> =>
    api.get(`/orders/driver/mine${buildQs(filters)}`, token),

  // ── Admin / Manager ──────────────────────────────────────────────────────────

  /** GET /orders — Tous les bons (admin/manager) */
  listAll: (
    token:    string,
    filters?: OrderListFilters,
  ): Promise<ApiResponse<OrderListResult>> =>
    api.get(`/orders${buildQs(filters)}`, token),

  // ── Commun ───────────────────────────────────────────────────────────────────

  /** GET /orders/:id — Détail d'un bon */
  getById: (
    token: string,
    id:    string,
  ): Promise<ApiResponse<Order>> =>
    api.get(`/orders/${id}`, token),

  /** GET /orders/by-reservation/:reservationId — Bon d'une réservation */
  getByReservation: (
    token:         string,
    reservationId: string,
  ): Promise<ApiResponse<Order>> =>
    api.get(`/orders/by-reservation/${reservationId}`, token),

  /** GET /orders/:id/pdf — URL signée du PDF (1h). Ouvrir via Linking.openURL(res.data.url). */
  fetchPdfUrl: (token: string, id: string): Promise<ApiResponse<{ url: string }>> =>
    api.get(`/orders/${id}/pdf`, token),
};
