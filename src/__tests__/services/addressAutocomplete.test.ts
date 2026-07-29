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
              countrycode: 'FR',
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

  it('exclut les résultats hors de la liste des pays autorisés (France + Europe)', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        features: [
          {
            geometry: { coordinates: [2.402391, 48.7431683] },
            properties: { name: 'Orly', county: 'Val-de-Marne', country: 'France', countrycode: 'FR' },
          },
          {
            geometry: { coordinates: [49.2052638, 46.5995748] },
            properties: { name: 'Орлы', country: 'Kazakhstan', countrycode: 'KZ' },
          },
          {
            geometry: { coordinates: [28.315994, 57.575191] },
            properties: { name: 'Орлы', country: 'Russie', countrycode: 'RU' },
          },
          {
            geometry: { coordinates: [-17.4677, 14.7167] },
            properties: { name: 'Plateau', city: 'Dakar', country: 'Sénégal', countrycode: 'SN' },
          },
        ],
      }),
    }) as any;

    const results = await searchAddress('Orly');

    expect(results).toEqual([
      { label: 'Orly, Val-de-Marne, France', latitude: 48.7431683, longitude: 2.402391 },
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
          { geometry: { coordinates: [] }, properties: { city: 'Lyon', countrycode: 'FR' } },
          {
            geometry: { coordinates: [4.8357, 45.7640] },
            properties: { name: 'Bellecour', city: 'Lyon', country: 'France', countrycode: 'FR' },
          },
        ],
      }),
    }) as any;

    const results = await searchAddress('Bellecour Lyon');

    expect(results).toEqual([
      { label: 'Bellecour, Lyon, France', latitude: 45.7640, longitude: 4.8357 },
    ]);
  });
});
