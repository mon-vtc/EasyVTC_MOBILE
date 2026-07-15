import { searchAddress } from '../../services/geo/addressAutocomplete';

describe('searchAddress (Photon)', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('retourne un tableau vide si la requête fait moins de 3 caractères', async () => {
    const fetchMock = jest.fn();
    global.fetch = fetchMock as any;

    const results = await searchAddress('ab');

    expect(results).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('formate le label à partir des propriétés Photon et extrait lat/lon', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        features: [
          {
            geometry: { coordinates: [2.3522, 48.8566] },
            properties: {
              housenumber: '12',
              street: 'Rue de Rivoli',
              city: 'Paris',
              country: 'France',
            },
          },
        ],
      }),
    }) as any;

    const results = await searchAddress('12 rue de Rivoli');

    expect(results).toEqual([
      { label: '12 Rue de Rivoli, Paris, France', latitude: 48.8566, longitude: 2.3522 },
    ]);
  });

  it('retourne un tableau vide si la réponse HTTP est en erreur', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false }) as any;

    const results = await searchAddress('Dakar Sénégal');

    expect(results).toEqual([]);
  });

  it('retourne un tableau vide si fetch lève une exception (réseau, requête annulée)', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('network error')) as any;

    const results = await searchAddress('Dakar Sénégal');

    expect(results).toEqual([]);
  });

  it('filtre les features sans coordonnées ou sans label exploitable', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        features: [
          { geometry: { coordinates: [] }, properties: { city: 'Dakar' } },
          {
            geometry: { coordinates: [-17.4677, 14.7167] },
            properties: { name: 'Plateau', city: 'Dakar', country: 'Sénégal' },
          },
        ],
      }),
    }) as any;

    const results = await searchAddress('Plateau Dakar');

    expect(results).toEqual([
      { label: 'Plateau, Dakar, Sénégal', latitude: 14.7167, longitude: -17.4677 },
    ]);
  });
});
