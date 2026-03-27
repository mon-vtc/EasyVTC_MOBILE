export type DocumentStatus = 'pending' | 'validated' | 'rejected' | 'expired';

export type DocType =
  | 'license'
  | 'insurance'
  | 'vtc_card'
  | 'kbis'
  | 'company_doc';

// Alias pour compatibilité avec les hooks (useDocuments utilise DocumentType)
export type DocumentType = DocType;

export interface DriverDocument {
  id:               string;
  driver_id:        string;
  doc_type:         DocType;        // ← champ backend : "doc_type" (pas "type")
  status:           DocumentStatus;
  file_url:         string;         // path Supabase Storage
  signed_url?:      string;         // URL temporaire (1h) pour visualisation
  expiry_date?:     string | null;  // YYYY-MM-DD
  rejection_reason?: string | null;
  created_at:       string;
  updated_at:       string;
}

// ─── Définition statique d'un document (catalogue fixe) ──────
export interface DocumentDefinition {
  type:      DocType;
  label:     string;
  icon:      string;        // keyof typeof Ionicons.glyphMap
  required:  boolean;
  acceptPdf: boolean;
}

// ─── Vue fusionnée (définition + données backend éventuelles) ─
export type DocumentView =
  | (DocumentDefinition & { uploaded: true;  document: DriverDocument })
  | (DocumentDefinition & { uploaded: false; document: null });


// ─── Payload upload ───────────────────────────────────────────
export interface UploadDocumentPayload {
  type: DocumentType;
}

export interface DocumentUploadResponse {
  document: DriverDocument;
}
  