// src/store/documents.store.ts
// ─────────────────────────────────────────────────────────────
//  ⚠️  Corrections par rapport à la version précédente :
//    - uploadDocument : mise à jour locale par doc_type (pas id)
//      car un upload remplace le document du même type
//    - deleteDocument : la méthode HTTP est DELETE (cf. Postman)
//      → côté api.ts, s'assurer que api.delete existe
// ─────────────────────────────────────────────────────────────
import { create }       from 'zustand';
import { documentApi }  from '../services/api/document.api';
import type { DriverDocument } from '../types';

interface DocumentsState {
  documents:   DriverDocument[];
  selected:    DriverDocument | null;
  isLoading:   boolean;
  isUploading: boolean;
  error:       string | null;

  fetchDocuments: (token: string)                     => Promise<void>;
  fetchById:      (token: string, id: string)         => Promise<void>;
  uploadDocument: (token: string, form: FormData)     => Promise<DriverDocument | null>;
  deleteDocument: (token: string, id: string)         => Promise<void>;
  clearSelected:  () => void;
  clearError:     () => void;
}

export const useDocumentsStore = create<DocumentsState>((set) => ({
  documents:   [],
  selected:    null,
  isLoading:   false,
  isUploading: false,
  error:       null,

  // ── Liste ─────────────────────────────────────────────────────
  fetchDocuments: async (token) => {
    set({ isLoading: true, error: null });
    try {
      const res = await documentApi.listMyDocuments(token);
      if (!res.ok || !res.data) throw new Error(res.message ?? 'Erreur lors du chargement');
      
      // Sécurité : on filtre les éventuelles valeurs nulles de l'API
      const safeData = Array.isArray(res.data) ? res.data.filter(Boolean) : [];
      set({ documents: safeData, isLoading: false });
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Erreur inconnue', isLoading: false });
      throw err;
    }
  },

  // ── Détail par ID ─────────────────────────────────────────────
  fetchById: async (token, id) => {
    set({ isLoading: true, error: null });
    try {
      const res = await documentApi.getDocumentById(token, id);
      if (!res.ok || !res.data) throw new Error(res.message ?? 'Document introuvable');
      set({ selected: res.data, isLoading: false });
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Erreur inconnue', isLoading: false });
      throw err;
    }
  },

  // ── Upload ────────────────────────────────────────────────────
  uploadDocument: async (token, formData) => {
    set({ isUploading: true, error: null });
    try {
      const res = await documentApi.uploadDocument(token, formData);
      
      if (!res.ok || !res.data) {
        throw new Error(res.message ?? "Erreur lors de l'upload");
      }
  
      // On extrait explicitement l'objet DriverDocument de la réponse
      // Si votre API renvoie { document: { ... } }, on le prend.
      // Sinon, on considère que res.data est déjà le document (en utilisant un cast "as")
      const newDoc = ('document' in res.data) 
        ? (res.data.document as DriverDocument) 
        : (res.data as DriverDocument);
  
      // Vérification de sécurité pour TypeScript et le runtime
      if (!newDoc || !newDoc.doc_type) {
        throw new Error("Format de document invalide reçu de l'API");
      }
  
      set(state => {
        const currentDocs = Array.isArray(state.documents) ? state.documents : [];
      
        // Ici, TypeScript sait maintenant que newDoc est un DriverDocument
        const exists = currentDocs.some(d => d?.doc_type === newDoc.doc_type);
      
        const updatedDocs = exists
          ? currentDocs.map(d => (d?.doc_type === newDoc.doc_type ? newDoc : d))
          : [...currentDocs, newDoc];
      
        return {
          documents: updatedDocs.filter((d): d is DriverDocument => !!d),
          isUploading: false,
        };
      });
  
      return newDoc;
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Erreur inconnue', isUploading: false });
      throw err;
    }
  },

  // ── Suppression ───────────────────────────────────────────────
  // ✅ CORRIGÉ : méthode DELETE (pas PATCH)
  deleteDocument: async (token, id) => {
    set({ isLoading: true, error: null });
    try {
      const res = await documentApi.deleteDocument(token, id);
      if (!res.ok) throw new Error(res.message ?? 'Erreur lors de la suppression');
      set(state => ({
        documents: state.documents.filter(d => d.id !== id),
        isLoading: false,
      }));
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Erreur inconnue', isLoading: false });
      throw err;
    }
  },

  clearSelected: () => set({ selected: null }),
  clearError:    () => set({ error: null }),
}));