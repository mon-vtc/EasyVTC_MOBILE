import type { DocumentDefinition } from '../types/document.types';

export const DOCUMENT_DEFINITIONS: DocumentDefinition[] = [
  {
    type:      'license',
    label:     'Permis de conduire',
    icon:      'card-outline',
    required:  true,
    acceptPdf: false,
  },
  {
    type:      'vtc_card',
    label:     'Carte professionnelle VTC',
    icon:      'id-card-outline',
    required:  true,
    acceptPdf: false,
  },
  {
    type:      'insurance',
    label:     'Assurance véhicule / RC Pro',
    icon:      'shield-checkmark-outline',
    required:  true,
    acceptPdf: true,
  },
  {
    type:      'company_doc',
    label:     "Document d'entreprise",
    icon:      'business-outline',
    required:  true,
    acceptPdf: true,
  },
  {
    type:      'kbis',
    label:     'Extrait KBIS',
    icon:      'ribbon-outline',
    required:  false,
    acceptPdf: true,
  },
];

// Lookup rapide par type
export const DOCUMENT_MAP = Object.fromEntries(
  DOCUMENT_DEFINITIONS.map(d => [d.type, d]),
) as Record<string, DocumentDefinition>;