import { useDocumentsStore, useAuthStore } from '../store';
import { useAuth }              from './useAuth';
import type { DocumentType, DocumentView } from '../types/document.types';
import { DOCUMENT_DEFINITIONS } from '../constants/documentDefinitions';

export function useDocuments() {
  const { isDriver }  = useAuth();
  const accessToken   = useAuthStore(s => s.accessToken);

  const documents     = useDocumentsStore(s => s.documents);
  const selected      = useDocumentsStore(s => s.selected);
  const isLoading     = useDocumentsStore(s => s.isLoading);
  const isUploading   = useDocumentsStore(s => s.isUploading);
  const error         = useDocumentsStore(s => s.error);
  const _fetch        = useDocumentsStore(s => s.fetchDocuments);
  const _fetchById    = useDocumentsStore(s => s.fetchById);
  const _upload       = useDocumentsStore(s => s.uploadDocument);
  const _delete       = useDocumentsStore(s => s.deleteDocument);
  const clearSelected = useDocumentsStore(s => s.clearSelected);
  const clearError    = useDocumentsStore(s => s.clearError);

  if (!isDriver) {
    throw new Error('useDocuments() ne peut être utilisé que par un chauffeur.');
  }

  // ── Vue fusionnée : définition fixe ↔ données backend ───────
  const getDocumentViews = (): DocumentView[] =>
    DOCUMENT_DEFINITIONS.map(def => {
      const doc = documents.find(
        d => d?.doc_type === def.type && d?.file_url !== null,
      ) ?? null;
      if (doc) return { ...def, uploaded: true,  document: doc  } as DocumentView;
      return        { ...def, uploaded: false, document: null } as DocumentView;
    });

  // ── Helper FormData ──────────────────────────────────────────
  // expiryDate ajouté : transmis comme champ "expiry_date" à l'API
  const buildFormData = (
    uri:        string,
    type:       DocumentType,
    mimeType:   string,
    expiryDate: string,          // format AAAA-MM-JJ
  ): FormData => {
    const formData = new FormData();
    const filename = uri.split('/').pop() || 'document.pdf';
    formData.append('file',        { uri, name: filename, type: mimeType } as any);
    formData.append('doc_type',    type);
    formData.append('expiry_date', expiryDate);   // ← nouveau champ requis
    return formData;
  };

  // ── Upload depuis la galerie (image) ─────────────────────────
  // Signature mise à jour : (docType, fileUri?, expiryDate)
  //    - fileUri    : déjà sélectionné dans le modal (obligatoire)
  //    - expiryDate : saisi dans le modal (obligatoire)
  const uploadFromGallery = async (
    docType:    DocumentType,
    fileUri:    string,
    expiryDate: string,
  ) => {
    const ext      = fileUri.split('.').pop() ?? 'jpeg';
    const mimeType = `image/${ext === 'jpg' ? 'jpeg' : ext}`;
    return _upload(accessToken!, buildFormData(fileUri, docType, mimeType, expiryDate));
  };

  // ── Upload depuis les fichiers (PDF / image) ─────────────────
  // Signature mise à jour : (docType, fileUri, expiryDate)
  const uploadFromFiles = async (
    docType:    DocumentType,
    fileUri:    string,
    expiryDate: string,
  ) => {
    const ext      = fileUri.split('.').pop()?.toLowerCase() ?? 'pdf';
    const mimeType = ext === 'pdf' ? 'application/pdf' : `image/${ext === 'jpg' ? 'jpeg' : ext}`;
    return _upload(accessToken!, buildFormData(fileUri, docType, mimeType, expiryDate));
  };

  const views = getDocumentViews();

  console.log(documents);

  return {
    // État
    documents,
    selected,
    isLoading,
    isUploading,
    error,
    clearError,
    clearSelected,

    // Vues fusionnées
    documentViews: views,

    // Actions
    fetchDocuments:  ()           => _fetch(accessToken!),
    fetchById:       (id: string) => _fetchById(accessToken!, id),
    deleteDocument:  (id: string) => _delete(accessToken!, id),
    uploadFromGallery,
    uploadFromFiles,

    // Helpers
    getByType: (type: DocumentType) =>
      documents.find(d => d.doc_type === type && d.file_url !== null) ?? null,

    isApproved: (type: DocumentType) =>
      documents.find(d => d.doc_type === type)?.status === 'validated',

    // Compteurs
    uploadedCount:   views.filter(v => v.uploaded).length,
    missingCount:    views.filter(v => !v.uploaded).length,
    requiredMissing: views.filter(v => v.required && !v.uploaded).length,
    pendingCount:    documents.filter(d => d.status === 'pending').length,
    rejectedCount:   documents.filter(d => d.status === 'rejected').length,
  };
}