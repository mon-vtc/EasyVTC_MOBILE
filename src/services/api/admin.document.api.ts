// src/services/api/admin.document.api.ts
// ─────────────────────────────────────────────────────────────
//  Endpoints admin — module Documents (Postman Sprint 2)
//
//  GET    /admin/documents                    → liste paginée + filtres
//  GET    /admin/documents/stats              → compteurs dashboard
//  GET    /admin/documents/:id                → détail avec infos chauffeur
//  PATCH  /admin/documents/:id/validate       → valider un document pending
//  PATCH  /admin/documents/:id/reject         → rejeter avec motif obligatoire
// ─────────────────────────────────────────────────────────────
import { api } from '../../lib/api';
import type { DriverDocument } from '../../types';

// ── Filtres disponibles sur GET /admin/documents ─────────────
export interface AdminDocumentFilter {
  status?:        'pending' | 'validated' | 'rejected' | 'expired';
  doc_type?:      'license' | 'insurance' | 'vtc_card' | 'kbis' | 'company_doc';
  driver_id?:     string;
  expiring_soon?: boolean;   // documents expirant dans 30 jours
  page?:          number;
  limit?:         number;
}

// ── Réponse paginée ──────────────────────────────────────────
export interface AdminDocumentsResponse {
  documents:   AdminDocument[];
  total:       number;
  page:        number;
  total_pages: number;
}

// ── Document enrichi avec infos chauffeur ────────────────────
export interface AdminDocument extends DriverDocument {
  status:         'pending' | 'validated' | 'rejected' | 'expired';
  validated_at?:  string | null;
  rejection_reason?: string | null;
  driver?: {
    user: {
      id:                string;
      first_name:        string;
      last_name:         string;
      email:             string;
      phone:             string;
      profile_photo_url: string | null;
    };
  };
}

// ── Stats dashboard ──────────────────────────────────────────
export interface AdminDocumentStats {
  total:        number;
  pending:      number;
  validated:    number;
  rejected:     number;
  expiring_30d: number;
}

// ── Payload rejet ────────────────────────────────────────────
export interface RejectDocumentPayload {
  reason: string; // min 10 caractères
}

export const adminDocumentApi = {

  // GET /admin/documents?page=1&limit=20&status=pending…
  listDocuments: (token: string, filters?: AdminDocumentFilter) => {
    const params = new URLSearchParams();
    if (filters?.status)        params.append('status',        filters.status);
    if (filters?.doc_type)      params.append('doc_type',      filters.doc_type);
    if (filters?.driver_id)     params.append('driver_id',     filters.driver_id);
    if (filters?.expiring_soon) params.append('expiring_soon', 'true');
    if (filters?.page)          params.append('page',          String(filters.page));
    if (filters?.limit)         params.append('limit',         String(filters.limit ?? 20));
    const query = params.toString();
    return api.get<AdminDocumentsResponse>(
      `/admin/documents${query ? `?${query}` : ''}`,
      token,
    );
  },

  // GET /admin/documents/stats
  getStats: (token: string) =>
    api.get<AdminDocumentStats>('/admin/documents/stats', token),

  // GET /admin/documents/:id  → inclut driver.user
  getDocumentById: (token: string, documentId: string) =>
    api.get<AdminDocument>(`/admin/documents/${documentId}`, token),

  // PATCH /admin/documents/:id/validate  (pas de body)
  validateDocument: (token: string, documentId: string) =>
    api.patch<AdminDocument>(`/admin/documents/${documentId}/validate`, {}, token),

  // PATCH /admin/documents/:id/reject  { reason }
  rejectDocument: (token: string, documentId: string, payload: RejectDocumentPayload) =>
    api.patch<AdminDocument>(`/admin/documents/${documentId}/reject`, payload, token),
};