// ══════════════════════════════════════════════════════════════════════════════
// API — Module Évaluations (Ratings)
// Sprint 6 — EazyVTC
// Aligné avec ratings.routes.ts backend
// ══════════════════════════════════════════════════════════════════════════════

import { api }  from '../../lib/api';
import type { ApiResponse } from '../../types';
import type {
  Rating,
  DriverRatingsResult,
  AdminRatingsResult,
} from '../../types/ratings.types';

function buildQs(page?: number, limit?: number): string {
  const params = new URLSearchParams();
  if (page)  params.set('page',  String(page));
  if (limit) params.set('limit', String(limit));
  const s = params.toString();
  return s ? `?${s}` : '';
}

export const ratingsApi = {

  // ── POST /reservations/:id/rating ─────────────────────────────────────────
  submit: (
    token:         string,
    reservationId: string,
    note:          number,
    comment?:      string | null,
  ): Promise<ApiResponse<Rating>> =>
    api.post(`/reservations/${reservationId}/rating`, { note, comment: comment ?? null }, token),

  // ── GET /drivers/me/ratings ───────────────────────────────────────────────
  getMyRatings: (
    token: string,
    page?:  number,
    limit?: number,
  ): Promise<ApiResponse<DriverRatingsResult>> =>
    api.get(`/drivers/me/ratings${buildQs(page, limit)}`, token),

  // ── GET /admin/drivers/:id/ratings ────────────────────────────────────────
  getDriverRatings: (
    token:    string,
    driverId: string,
    page?:    number,
    limit?:   number,
  ): Promise<ApiResponse<DriverRatingsResult>> =>
    api.get(`/admin/drivers/${driverId}/ratings${buildQs(page, limit)}`, token),

  // ── GET /admin/ratings ────────────────────────────────────────────────────
  listAll: (
    token:  string,
    page?:  number,
    limit?: number,
  ): Promise<ApiResponse<AdminRatingsResult>> =>
    api.get(`/admin/ratings${buildQs(page, limit)}`, token),

  // ── DELETE /admin/ratings/:id ─────────────────────────────────────────────
  delete: (
    token:    string,
    ratingId: string,
  ): Promise<ApiResponse<void>> =>
    api.delete(`/admin/ratings/${ratingId}`, token),

};
