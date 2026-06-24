
import { useCallback } from 'react';
import { api } from '../lib/api';
import { useAuthStore } from '../store';

export type DocumentType =
  | 'license'
  | 'vtc_card'
  | 'medical_visit'
  | 'rc_pro'
  | 'kbis'
  | 'vtc_register'
  | 'rir'
  | 'id_card'
  | 'vehicle_insurance'
  | 'grey_card';

export type DocumentStatus = 'pending' | 'validated' | 'rejected' | 'expired';

export interface DriverDocument {
  id: string;
  driver_id: string;
  doc_type: DocumentType;
  status: DocumentStatus;
  file_url: string;
  expiry_date: string | null;
  alert_30d_sent: boolean;
  alert_7d_sent: boolean;
  rejection_reason: string | null;
  validated_at: string | null;
  created_at: string;
  updated_at: string;
}

const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  license: 'Permis de conduire',
  vtc_card: 'Carte professionnelle VTC',
  medical_visit: 'Visite médicale',
  rc_pro: 'Assurance RC Pro',
  kbis: 'Extrait KBIS',
  vtc_register: 'Certificat d\'inscription au registre VTC',
  rir: 'Relevé d\'information RIR',
  id_card: 'Pièce d\'identité',
  vehicle_insurance: 'Attestation d\'assurance véhicule',
  grey_card: 'Carte grise',
};

const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  pending: 'En attente de validation',
  validated: 'Validé',
  rejected: 'Rejeté',
  expired: 'Expiré',
};

const DOCUMENT_STATUS_COLORS: Record<DocumentStatus, { bg: string; text: string }> = {
  pending: { bg: '#FFF3E0', text: '#E65100' },
  validated: { bg: '#E8F5E9', text: '#2E7D32' },
  rejected: { bg: '#FCE4EC', text: '#C62828' },
  expired: { bg: '#F3E5F5', text: '#6A1B9A' },
};

export function useDriverDocuments() {
  const fetchDriverDocuments = useCallback(
    async (driverId: string): Promise<DriverDocument[]> => {
      try {
        const token = useAuthStore.getState().accessToken ?? undefined;
        const response = await api.get(`/admin/documents/driver/${driverId}`, token);
        if (response.ok && response.data && Array.isArray(response.data)) {
          return response.data as DriverDocument[];
        }
        return [];
      } catch (error) {
        console.error('Erreur lors de la récupération des documents:', error);
        return [];
      }
    },
    []
  );

  return {
    fetchDriverDocuments,
    DOCUMENT_TYPE_LABELS,
    DOCUMENT_STATUS_LABELS,
    DOCUMENT_STATUS_COLORS,
  };
}