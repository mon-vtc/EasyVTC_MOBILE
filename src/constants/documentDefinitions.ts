// ══════════════════════════════════════════════════════════════════════════════
// CONSTANTES — Catalogue des documents chauffeur
// Aligné avec DocumentType (backend Sprint 2)
// ══════════════════════════════════════════════════════════════════════════════

import type { DocumentDefinition, DocumentType } from '../types/document.types';

/**
 * Liste ordonnée des documents affichés dans l'UI.
 * L'ordre détermine l'affichage dans l'écran Documents du chauffeur.
 *
 * Règle : chaque `type` doit correspondre exactement à un DocumentType du backend.
 */
export const DOCUMENT_DEFINITIONS: DocumentDefinition[] = [
  // ── Documents d'identité ─────────────────────────────────────────────────
  {
    type:        'id_card',
    label:       "Pièce d'identité",
    icon:        'person-outline',
    required:    true,
    acceptPdf:   false,
    hasExpiry:   true,
    description: "CNI ou passeport en cours de validité",
  },
  {
    type:        'license',
    label:       'Permis de conduire',
    icon:        'car-outline',
    required:    true,
    acceptPdf:   false,
    hasExpiry:   true,
  },

  // ── Documents professionnels VTC ──────────────────────────────────────────
  {
    type:        'vtc_card',
    label:       'Carte professionnelle VTC',
    icon:        'id-card-outline',
    required:    true,
    acceptPdf:   false,
    hasExpiry:   true,
  },
  {
    type:        'vtc_register',
    label:       "Certificat d'inscription au registre VTC",
    icon:        'ribbon-outline',
    required:    true,
    acceptPdf:   true,
    hasExpiry:   true,
  },
  {
    type:        'medical_visit',
    label:       'Visite médicale',
    icon:        'medkit-outline',
    required:    true,
    acceptPdf:   true,
    hasExpiry:   true,
    description: 'Attestation de visite médicale en cours de validité',
  },

  // ── Documents assurance & véhicule ────────────────────────────────────────
  {
    type:        'vehicle_insurance',
    label:       "Attestation d'assurance véhicule",
    icon:        'shield-checkmark-outline',
    required:    true,
    acceptPdf:   true,
    hasExpiry:   true,
  },
  {
    type:        'rc_pro',
    label:       'Assurance RC Pro',
    icon:        'shield-outline',
    required:    true,
    acceptPdf:   true,
    hasExpiry:   true,
  },
  {
    type:        'grey_card',
    label:       'Carte grise',
    icon:        'document-text-outline',
    required:    true,
    acceptPdf:   false,
    hasExpiry:   false,
  },

  // ── Documents entreprise ──────────────────────────────────────────────────
  {
    type:        'kbis',
    label:       'Extrait KBIS',
    icon:        'business-outline',
    required:    false,
    acceptPdf:   true,
    hasExpiry:   false,
    description: 'Requis uniquement pour les personnes morales',
  },
  {
    type:        'rir',
    label:       "Relevé d'information RIR",
    icon:        'document-outline',
    required:    false,
    acceptPdf:   true,
    hasExpiry:   false,
  },
];

// ─── Lookup rapide par type ───────────────────────────────────────────────────
export const DOCUMENT_MAP = Object.fromEntries(
  DOCUMENT_DEFINITIONS.map(d => [d.type, d]),
) as Record<DocumentType, DocumentDefinition>;

// ─── Labels (miroir du backend pour affichage cohérent) ──────────────────────
export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = Object.fromEntries(
  DOCUMENT_DEFINITIONS.map(d => [d.type, d.label]),
) as Record<DocumentType, string>;

export const DOCUMENT_STATUS_LABELS: Record<string, string> = {
  pending:   'En attente de validation',
  validated: 'Validé',
  rejected:  'Rejeté',
  expired:   'Expiré',
};

export const DOCUMENT_STATUS_COLORS: Record<string, string> = {
  pending:   '#F59E0B',  // amber
  validated: '#10B981',  // green
  rejected:  '#EF4444',  // red
  expired:   '#6B7280',  // gray
};