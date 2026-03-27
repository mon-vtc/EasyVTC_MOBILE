// src/services/api/document.api.ts
// ─────────────────────────────────────────────────────────────
//  Routes alignées avec Postman Sprint 2 :
//    GET    /drivers/documents          → liste
//    GET    /drivers/documents/:id      → détail
//    POST   /drivers/documents          → upload (FormData, champ "doc_type")
//    DELETE /drivers/documents/:id      → suppression
//
//  ⚠️  Corrections par rapport à la version précédente :
//    - Route corrigée : /drivers/me/documents → /drivers/documents
//    - deleteDocument : api.patch → api.delete (méthode HTTP DELETE)
//    - Le champ FormData doit être "doc_type" (pas "type")
// ─────────────────────────────────────────────────────────────
import { api } from '../../lib/api';
import type {
  ApiResponse,
  DriverDocument,
  DocumentUploadResponse,
} from '../../types';

export const documentApi = {

  // GET /drivers/documents
  listMyDocuments: (token: string) =>
    api.get<DriverDocument[]>('/drivers/documents', token),

  // GET /drivers/documents/:id
  getDocumentById: (token: string, documentId: string) =>
    api.get<DriverDocument>(`/drivers/documents/${documentId}`, token),

  // POST /drivers/documents — multipart/form-data
  //   Champs requis  : file (binary), doc_type (string)
  //   Champ optionnel: expiry_date (YYYY-MM-DD)
  uploadDocument: (token: string, formData: FormData) =>
    api.post<DocumentUploadResponse>('/drivers/documents', formData, token),

  // DELETE /drivers/documents/:id
  //   ⚠️ Seuls les documents pending ou rejected peuvent être supprimés
  deleteDocument: (token: string, documentId: string) =>
    api.delete<null>(`/drivers/documents/${documentId}`, token),
};