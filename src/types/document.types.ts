// ══════════════════════════════════════════════════════════════════════════════
// TYPES — Module Documents Chauffeur (Frontend)
// Aligné avec le backend EasyVTC Sprint 2
// ══════════════════════════════════════════════════════════════════════════════

export type DocumentStatus = 'pending' | 'validated' | 'rejected' | 'expired';

/**
 * Types de documents — miroir exact du backend (driver-documents.types.ts)
 */
export type DocumentType =
  | 'license'           // Permis de conduire
  | 'vtc_card'          // Carte professionnelle VTC
  | 'medical_visit'     // Visite médicale
  | 'rc_pro'            // Assurance RC Pro
  | 'kbis'              // Extrait KBIS
  | 'vtc_register'      // Certificat d'inscription au registre VTC
  | 'rir'               // Relevé d'information RIR
  | 'id_card'           // Pièce d'identité
  | 'vehicle_insurance' // Attestation d'assurance véhicule
  | 'grey_card';        // Carte grise

// Alias conservé pour rétrocompatibilité interne
export type DocType = DocumentType;

// ─── Entité document (réponse API) ───────────────────────────────────────────
export interface DriverDocument {
  id:                string;
  driver_id:         string;
  doc_type:          DocumentType;
  status:            DocumentStatus;
  file_url:          string;           // path Supabase Storage
  signed_url?:       string;           // URL temporaire 1h
  signed_url_expires_at?: string;
  expiry_date?:      string | null;    // YYYY-MM-DD
  rejection_reason?: string | null;
  validated_at?:     string | null;
  created_at:        string;
  updated_at:        string;
}

// ─── Définition statique d'un document (catalogue UI fixe) ───────────────────
export interface DocumentDefinition {
  type:        DocumentType;
  label:       string;
  icon:        string;         // keyof typeof Ionicons.glyphMap
  required:    boolean;
  acceptPdf:   boolean;
  hasExpiry:   boolean;        // true = champ date d'expiration affiché dans le modal
  description?: string;        // aide contextuelle optionnelle
}

// ─── Vue fusionnée (définition statique + données backend) ───────────────────
export type DocumentView =
  | (DocumentDefinition & { uploaded: true;  document: DriverDocument })
  | (DocumentDefinition & { uploaded: false; document: null });

// ─── Payloads ────────────────────────────────────────────────────────────────
export interface UploadDocumentPayload {
  doc_type:     DocumentType;
  expiry_date?: string;        // YYYY-MM-DD (obligatoire si hasExpiry = true)
}

export interface DocumentUploadResponse {
  document:              DriverDocument;
  signed_url:            string;
  signed_url_expires_at: string;
}