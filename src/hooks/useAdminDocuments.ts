// src/hooks/useAdminDocuments.ts
import { useState, useCallback, useRef } from 'react';
import { useAuthStore } from '../store';
import { useAuth }      from './useAuth';
import { adminDocumentApi } from '../services/api/admin.document.api';
import type {
  AdminDocument,
  AdminDocumentFilter,
  AdminDocumentStats,
  RejectDocumentPayload,
} from '../services/api/admin.document.api';

export function useAdminDocuments() {
  const { isAdmin }   = useAuth();
  const accessToken   = useAuthStore(s => s.accessToken);
  const isAdminOrManager = useAuth().isAdmin || useAuth().isManager;
  if (!isAdminOrManager) {
    throw new Error('useAdminDocuments() ne peut être utilisé que par un administrateur ou un manager.');
  }

  const [documents,  setDocuments]  = useState<AdminDocument[]>([]);
  const [stats,      setStats]      = useState<AdminDocumentStats | null>(null);
  const [total,      setTotal]      = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading,  setIsLoading]  = useState(false);
  const [isActing,   setIsActing]   = useState(false);
  const [isFetching, setIsFetching] = useState(false); // fetch d'un doc unique
  const [error,      setError]      = useState<string | null>(null);

  const tokenRef = useRef(accessToken);
  tokenRef.current = accessToken;

  // ── Liste ────────────────────────────────────────────────────
  const fetchDocuments = useCallback(async (filters?: AdminDocumentFilter) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await adminDocumentApi.listDocuments(tokenRef.current!, filters);
      if (!res.ok || !res.data) throw new Error(res.message ?? 'Erreur chargement');
      setDocuments(res.data.documents ?? []);
      setTotal(res.data.total ?? 0);
      setTotalPages(res.data.total_pages ?? 1);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Stats ────────────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    try {
      const res = await adminDocumentApi.getStats(tokenRef.current!);
      if (res.ok && res.data) setStats(res.data);
    } catch (_) {}
  }, []);

  // ── Détail d'un document (avec signed_url) ───────────────────
  const fetchDocumentById = useCallback(async (
    documentId: string,
  ): Promise<AdminDocument | null> => {
    setIsFetching(true);
    try {
      const res = await adminDocumentApi.getDocumentById(tokenRef.current!, documentId);
      if (!res.ok || !res.data) throw new Error(res.message ?? 'Document introuvable');
      return res.data;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      return null;
    } finally {
      setIsFetching(false);
    }
  }, []);

  // ── Valider ──────────────────────────────────────────────────
  const validateDocument = useCallback(async (documentId: string): Promise<boolean> => {
    setIsActing(true);
    setError(null);
    try {
      const res = await adminDocumentApi.validateDocument(tokenRef.current!, documentId);
      if (!res.ok || !res.data) throw new Error(res.message ?? 'Erreur validation');
      setDocuments(prev => prev.map(d => d.id === documentId ? { ...d, ...res.data! } : d));
      return true;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      return false;
    } finally {
      setIsActing(false);
    }
  }, []);

  // ── Rejeter ──────────────────────────────────────────────────
  const rejectDocument = useCallback(async (
    documentId: string,
    payload: RejectDocumentPayload,
  ): Promise<boolean> => {
    setIsActing(true);
    setError(null);
    try {
      const res = await adminDocumentApi.rejectDocument(tokenRef.current!, documentId, payload);
      if (!res.ok || !res.data) throw new Error(res.message ?? 'Erreur rejet');
      setDocuments(prev => prev.map(d => d.id === documentId ? { ...d, ...res.data! } : d));
      return true;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      return false;
    } finally {
      setIsActing(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    documents, stats, total, totalPages,
    isLoading, isActing, isFetching, error, clearError,
    fetchDocuments, fetchStats, fetchDocumentById,
    validateDocument, rejectDocument,
  };
}