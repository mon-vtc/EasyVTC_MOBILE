// __TEST__/stores/document.store.test.ts
import { act } from '@testing-library/react-native';
import { useDocumentsStore } from '../../store/document.store';
import { documentApi } from '../../services/api/document.api';
import { AuthUser, DocumentType, DocumentUploadResponse, DriverDocument } from '../../types';

jest.mock('../../services/api/document.api');
const mockDocApi = documentApi as jest.Mocked<typeof documentApi>;

const TOKEN = 'test-token';

const mockDoc = {
  id: 'doc-1',
  driver_id: 'driver-1',
  doc_type: 'license' as DocumentType,
  file_url: 'https://cdn.example.com/doc1.pdf',
  status: 'pending',
  expiry_date: '2026-01-01',
  signed_url_expires_at : '2024-01-01T00:00:00Z',
  signed_url: 'https://cdn.example.com/doc1-signed.pdf',
  rejection_reason: null,
  validated_at: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
} as const satisfies DriverDocument;

const resetStore = () =>
  useDocumentsStore.setState({
    documents: [],
    selected: null,
    isLoading: false,
    isUploading: false,
    error: null,
  });

// ══════════════════════════════════════════════════════════════════════════
// fetchDocuments
// ══════════════════════════════════════════════════════════════════════════
describe('useDocumentsStore › fetchDocuments', () => {
  beforeEach(() => { resetStore(); jest.clearAllMocks(); });

  it('charge la liste des documents', async () => {
    mockDocApi.listMyDocuments.mockResolvedValue({ ok: true, data: [mockDoc] as DriverDocument[], message: 'OK' });

    await act(async () => { await useDocumentsStore.getState().fetchDocuments(TOKEN); });

    expect(useDocumentsStore.getState().documents).toHaveLength(1);
    expect(useDocumentsStore.getState().isLoading).toBe(false);
  });

  it('filtre les valeurs nulles retournées par l\'API', async () => {
    mockDocApi.listMyDocuments.mockResolvedValue({
      ok: true, data: [mockDoc, null, undefined] as DriverDocument[], message: 'OK',
    });

    await act(async () => { await useDocumentsStore.getState().fetchDocuments(TOKEN); });

    expect(useDocumentsStore.getState().documents).toHaveLength(1);
  });

  it('stocke l\'erreur et la lève si l\'API échoue', async () => {
    mockDocApi.listMyDocuments.mockResolvedValue({ ok: false, message: 'Erreur chargement' });

    await expect(
      act(async () => { await useDocumentsStore.getState().fetchDocuments(TOKEN); })
    ).rejects.toThrow('Erreur chargement');

    expect(useDocumentsStore.getState().error).toBe('Erreur chargement');
  });
});

// ══════════════════════════════════════════════════════════════════════════
// fetchById
// ══════════════════════════════════════════════════════════════════════════
describe('useDocumentsStore › fetchById', () => {
  beforeEach(() => { resetStore(); jest.clearAllMocks(); });

  it('charge un document et le place dans selected', async () => {
    mockDocApi.getDocumentById.mockResolvedValue({ ok: true, data: mockDoc, message: 'OK' });

    await act(async () => { await useDocumentsStore.getState().fetchById(TOKEN, 'doc-1'); });

    expect(useDocumentsStore.getState().selected?.id).toBe('doc-1');
  });

  it('lève une erreur si introuvable', async () => {
    mockDocApi.getDocumentById.mockResolvedValue({ ok: false, message: 'Document introuvable' });

    await expect(
      act(async () => { await useDocumentsStore.getState().fetchById(TOKEN, 'bad-id'); })
    ).rejects.toThrow('Document introuvable');
  });
});

// ══════════════════════════════════════════════════════════════════════════
// uploadDocument
// ══════════════════════════════════════════════════════════════════════════
describe('useDocumentsStore › uploadDocument', () => {
  beforeEach(() => { resetStore(); jest.clearAllMocks(); });

  it('ajoute un nouveau document à la liste', async () => {
    mockDocApi.uploadDocument.mockResolvedValue({ ok: true, data: { document : mockDoc } as DocumentUploadResponse, message: 'OK' });

    let result: AuthUser | null = null;
    await act(async () => {
      result = await useDocumentsStore.getState().uploadDocument(TOKEN, new FormData()) as AuthUser | null;
    });

    expect(result!.id).toBe('doc-1');
    expect(useDocumentsStore.getState().documents).toHaveLength(1);
    expect(useDocumentsStore.getState().isUploading).toBe(false);
  });

  it('remplace un document existant du même doc_type', async () => {
    const existingDoc = { ...mockDoc, id: 'doc-old', url: 'old-url' };
    useDocumentsStore.setState({ documents: [existingDoc as DriverDocument] });

    const newDoc = { ...mockDoc, id: 'doc-new', file_url: 'new-url' };
    mockDocApi.uploadDocument.mockResolvedValue({ ok: true, data: { document : newDoc } as DocumentUploadResponse, message: 'OK' });

    await act(async () => {
      await useDocumentsStore.getState().uploadDocument(TOKEN, new FormData());
    });

    const docs = useDocumentsStore.getState().documents;
    expect(docs).toHaveLength(1);
    expect(docs[0].id).toBe('doc-new');
  });

  it('supporte la réponse imbriquée { document: { ... } }', async () => {
    mockDocApi.uploadDocument.mockResolvedValue({
      ok: true,
      data: { document: mockDoc } as DocumentUploadResponse,
      message: 'OK',
    });

    let result: AuthUser | null = null;
    await act(async () => {
      result = await useDocumentsStore.getState().uploadDocument(TOKEN, new FormData()) as AuthUser | null;
    });

    expect(result!.id).toBe('doc-1');
  });

  it('lève une erreur si le format de réponse est invalide', async () => {
    mockDocApi.uploadDocument.mockResolvedValue({
      ok: true, data: { invalid: 'data' } as unknown as DocumentUploadResponse, message: 'OK',
    });

    await expect(
      act(async () => { await useDocumentsStore.getState().uploadDocument(TOKEN, new FormData()); })
    ).rejects.toThrow('Format de document invalide');
  });

  it('stocke l\'erreur si l\'upload échoue', async () => {
    mockDocApi.uploadDocument.mockResolvedValue({ ok: false, message: 'Fichier trop lourd' });

    await expect(
      act(async () => { await useDocumentsStore.getState().uploadDocument(TOKEN, new FormData()); })
    ).rejects.toThrow('Fichier trop lourd');

    expect(useDocumentsStore.getState().isUploading).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// deleteDocument
// ══════════════════════════════════════════════════════════════════════════
describe('useDocumentsStore › deleteDocument', () => {
  beforeEach(() => { resetStore(); jest.clearAllMocks(); });

  it('supprime le document de la liste locale', async () => {
    useDocumentsStore.setState({ documents: [mockDoc as DriverDocument] });
    mockDocApi.deleteDocument.mockResolvedValue({ ok: true, data: null, message: 'OK' });

    await act(async () => { await useDocumentsStore.getState().deleteDocument(TOKEN, 'doc-1'); });

    expect(useDocumentsStore.getState().documents).toHaveLength(0);
    expect(useDocumentsStore.getState().isLoading).toBe(false);
  });

  it('utilise bien la méthode DELETE (pas PATCH)', async () => {
    useDocumentsStore.setState({ documents: [mockDoc as DriverDocument] });
    mockDocApi.deleteDocument.mockResolvedValue({ ok: true, data: null, message: 'OK' });

    await act(async () => { await useDocumentsStore.getState().deleteDocument(TOKEN, 'doc-1'); });

    expect(mockDocApi.deleteDocument).toHaveBeenCalledWith(TOKEN, 'doc-1');
  });

  it('stocke l\'erreur si la suppression échoue', async () => {
    mockDocApi.deleteDocument.mockResolvedValue({ ok: false, message: 'Non autorisé' });

    await expect(
      act(async () => { await useDocumentsStore.getState().deleteDocument(TOKEN, 'doc-1'); })
    ).rejects.toThrow('Non autorisé');
  });
});

// ══════════════════════════════════════════════════════════════════════════
// clearSelected / clearError
// ══════════════════════════════════════════════════════════════════════════
describe('useDocumentsStore › clearSelected & clearError', () => {
  it('clearSelected vide selected', () => {
    useDocumentsStore.setState({ selected: mockDoc as DriverDocument });
    useDocumentsStore.getState().clearSelected();
    expect(useDocumentsStore.getState().selected).toBeNull();
  });

  it('clearError vide l\'erreur', () => {
    useDocumentsStore.setState({ error: 'Une erreur' });
    useDocumentsStore.getState().clearError();
    expect(useDocumentsStore.getState().error).toBeNull();
  });
});