// __TEST__/stores/clients.store.test.ts
import { useClientsStore } from '../../store/clients.store';
import { clientsApi } from '../../services/api/clients.api';

jest.mock('../../services/api/clients.api');
const mockClientsApi = clientsApi as jest.Mocked<typeof clientsApi>;

const TOKEN = 'test-token';

const mockClient = {
  id: 'client-1',
  email: 'client@example.com',
  first_name: 'Jean',
  last_name: 'Dupond',
  phone: '+33600000002',
  status: 'active',
  total_trips: 3,
};

// ══════════════════════════════════════════════════════════════════════════
// updateClient — correction du nom / prénom par l'admin
// ══════════════════════════════════════════════════════════════════════════
describe('useClientsStore › updateClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useClientsStore.setState({ clients: [mockClient] as any, error: null });
  });

  it('envoie la correction et met à jour le nom dans la liste', async () => {
    const updated = { ...mockClient, last_name: 'Dupont' };
    mockClientsApi.updateClient.mockResolvedValue({ ok: true, data: updated } as any);

    const result = await useClientsStore.getState().updateClient(TOKEN, 'client-1', { last_name: 'Dupont' });

    expect(mockClientsApi.updateClient).toHaveBeenCalledWith(TOKEN, 'client-1', { last_name: 'Dupont' });
    expect(result).toEqual(updated);
    expect(useClientsStore.getState().clients[0].last_name).toBe('Dupont');
    // Les statistiques déjà chargées dans la liste sont conservées
    expect((useClientsStore.getState().clients[0] as any).total_trips).toBe(3);
  });

  it('propage le message d\'erreur du serveur sans toucher à la liste', async () => {
    mockClientsApi.updateClient.mockResolvedValue({ ok: false, message: 'Client introuvable' } as any);

    await expect(useClientsStore.getState().updateClient(TOKEN, 'client-1', { last_name: 'Dupont' }))
      .rejects.toThrow('Client introuvable');
    expect(useClientsStore.getState().clients[0].last_name).toBe('Dupond');
  });
});
