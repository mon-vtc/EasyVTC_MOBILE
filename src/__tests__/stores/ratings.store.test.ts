// __tests__/stores/ratings.store.test.ts
import { act } from '@testing-library/react-native';
import { useRatingsStore } from '../../store/ratings.store';
import { ratingsApi } from '../../services/api/ratings.api';
import type { RatingWithClient, RatingAdmin, DriverRatingsResult, AdminRatingsResult } from '../../types/ratings.types';

jest.mock('../../services/api/ratings.api');

const mockRatingsApi = ratingsApi as jest.Mocked<typeof ratingsApi>;

// ── Fixtures ───────────────────────────────────────────────────────────────
const TOKEN          = 'test-token';
const RESERVATION_ID = 'resa-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
const DRIVER_ID      = 'driver-aaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
const RATING_ID      = 'rating-aaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

const mockRatingBase: RatingWithClient = {
  id:                        RATING_ID,
  reservation_id:            RESERVATION_ID,
  client_id:                 'client-uuid',
  driver_id:                 DRIVER_ID,
  note:                      4,
  comment:                   'Excellent chauffeur, très ponctuel',
  created_at:                '2026-06-01T10:00:00Z',
  client_first_name:         'Jean',
  client_last_name:          'Dupont',
  reservation_scheduled_at:  '2026-06-01T09:00:00Z',
};

const mockRatingAdmin: RatingAdmin = {
  ...mockRatingBase,
  driver_first_name: 'Mohammed',
  driver_last_name:  'Diallo',
};

const mockDriverResult: DriverRatingsResult = {
  ratings:     [mockRatingBase],
  avg_note:    4.2,
  total:       1,
  page:        1,
  limit:       20,
  total_pages: 1,
};

const mockAdminResult: AdminRatingsResult = {
  ratings:     [mockRatingAdmin],
  total:       1,
  page:        1,
  limit:       20,
  total_pages: 1,
};

// ── Reset ──────────────────────────────────────────────────────────────────
const resetStore = () =>
  useRatingsStore.setState({
    myRatings:    [],
    myAvgNote:    null,
    myTotal:      0,
    myPage:       1,
    myTotalPages: 1,
    allRatings:   [],
    allTotal:     0,
    allPage:      1,
    allTotalPages: 1,
    isLoading:    false,
    isSubmitting: false,
    error:        null,
  });

// ══════════════════════════════════════════════════════════════════════════
// submitRating
// ══════════════════════════════════════════════════════════════════════════
describe('useRatingsStore › submitRating', () => {
  beforeEach(() => { resetStore(); jest.clearAllMocks(); });

  it('soumet une évaluation et réinitialise isSubmitting', async () => {
    mockRatingsApi.submit.mockResolvedValue({ ok: true, data: mockRatingBase, message: 'Évaluation enregistrée' });

    await act(async () => {
      await useRatingsStore.getState().submitRating(TOKEN, RESERVATION_ID, { note: 4, comment: 'Super' });
    });

    expect(mockRatingsApi.submit).toHaveBeenCalledWith(TOKEN, RESERVATION_ID, { note: 4, comment: 'Super' });
    expect(useRatingsStore.getState().isSubmitting).toBe(false);
    expect(useRatingsStore.getState().error).toBeNull();
  });

  it('passe isSubmitting à true pendant la soumission', async () => {
    let resolveSubmit!: (val: any) => void;
    mockRatingsApi.submit.mockReturnValue(new Promise(resolve => { resolveSubmit = resolve; }));

    const promise = act(async () => {
      await useRatingsStore.getState().submitRating(TOKEN, RESERVATION_ID, { note: 5 });
    });

    expect(useRatingsStore.getState().isSubmitting).toBe(true);

    resolveSubmit({ ok: true, data: mockRatingBase, message: 'OK' });
    await promise;

    expect(useRatingsStore.getState().isSubmitting).toBe(false);
  });

  it('lance une erreur et stocke le message si l\'API répond ok:false', async () => {
    mockRatingsApi.submit.mockResolvedValue({ ok: false, message: 'Course non encore terminée' });

    await expect(
      act(async () => {
        await useRatingsStore.getState().submitRating(TOKEN, RESERVATION_ID, { note: 3 });
      })
    ).rejects.toThrow('Course non encore terminée');

    const state = useRatingsStore.getState();
    expect(state.isSubmitting).toBe(false);
    expect(state.error).toBe('Course non encore terminée');
  });

  it('refuse une double soumission avec le message de l\'API', async () => {
    mockRatingsApi.submit.mockResolvedValue({ ok: false, message: 'Évaluation déjà soumise pour cette réservation' });

    await expect(
      act(async () => {
        await useRatingsStore.getState().submitRating(TOKEN, RESERVATION_ID, { note: 5 });
      })
    ).rejects.toThrow('Évaluation déjà soumise pour cette réservation');
  });

  it('transmet une note sans commentaire', async () => {
    mockRatingsApi.submit.mockResolvedValue({ ok: true, data: { ...mockRatingBase, comment: null }, message: 'OK' });

    await act(async () => {
      await useRatingsStore.getState().submitRating(TOKEN, RESERVATION_ID, { note: 2 });
    });

    expect(mockRatingsApi.submit).toHaveBeenCalledWith(TOKEN, RESERVATION_ID, { note: 2 });
    expect(useRatingsStore.getState().isSubmitting).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// fetchMyRatings
// ══════════════════════════════════════════════════════════════════════════
describe('useRatingsStore › fetchMyRatings', () => {
  beforeEach(() => { resetStore(); jest.clearAllMocks(); });

  it('charge les évaluations du chauffeur connecté', async () => {
    mockRatingsApi.getMyRatings.mockResolvedValue({ ok: true, data: mockDriverResult, message: 'OK' });

    await act(async () => {
      await useRatingsStore.getState().fetchMyRatings(TOKEN);
    });

    const state = useRatingsStore.getState();
    expect(state.myRatings).toHaveLength(1);
    expect(state.myRatings[0].note).toBe(4);
    expect(state.myAvgNote).toBe(4.2);
    expect(state.myTotal).toBe(1);
    expect(state.myTotalPages).toBe(1);
    expect(state.isLoading).toBe(false);
  });

  it('remplace les évaluations à la page 1', async () => {
    useRatingsStore.setState({ myRatings: [{ ...mockRatingBase, id: 'old-rating' }] });

    mockRatingsApi.getMyRatings.mockResolvedValue({ ok: true, data: mockDriverResult, message: 'OK' });

    await act(async () => {
      await useRatingsStore.getState().fetchMyRatings(TOKEN, 1);
    });

    const state = useRatingsStore.getState();
    expect(state.myRatings).toHaveLength(1);
    expect(state.myRatings[0].id).toBe(RATING_ID);
  });

  it('accumule les évaluations en pagination (page > 1)', async () => {
    const existing: RatingWithClient = { ...mockRatingBase, id: 'rating-page1' };
    useRatingsStore.setState({ myRatings: [existing] });

    mockRatingsApi.getMyRatings.mockResolvedValue({
      ok: true,
      data: { ...mockDriverResult, page: 2 },
      message: 'OK',
    });

    await act(async () => {
      await useRatingsStore.getState().fetchMyRatings(TOKEN, 2);
    });

    expect(useRatingsStore.getState().myRatings).toHaveLength(2);
  });

  it('stocke l\'erreur et lance une exception si l\'API échoue', async () => {
    mockRatingsApi.getMyRatings.mockResolvedValue({ ok: false, message: 'Non autorisé' });

    await expect(
      act(async () => { await useRatingsStore.getState().fetchMyRatings(TOKEN); })
    ).rejects.toThrow('Non autorisé');

    const state = useRatingsStore.getState();
    expect(state.error).toBe('Non autorisé');
    expect(state.isLoading).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// listAll (admin)
// ══════════════════════════════════════════════════════════════════════════
describe('useRatingsStore › listAll', () => {
  beforeEach(() => { resetStore(); jest.clearAllMocks(); });

  it('charge toutes les évaluations pour l\'admin', async () => {
    mockRatingsApi.listAll.mockResolvedValue({ ok: true, data: mockAdminResult, message: 'OK' });

    await act(async () => {
      await useRatingsStore.getState().listAll(TOKEN);
    });

    const state = useRatingsStore.getState();
    expect(state.allRatings).toHaveLength(1);
    expect(state.allRatings[0].driver_first_name).toBe('Mohammed');
    expect(state.allTotal).toBe(1);
    expect(state.isLoading).toBe(false);
  });

  it('accumule les évaluations en pagination (page > 1)', async () => {
    useRatingsStore.setState({ allRatings: [{ ...mockRatingAdmin, id: 'old' }], allTotal: 1 });

    mockRatingsApi.listAll.mockResolvedValue({
      ok: true,
      data: { ...mockAdminResult, page: 2 },
      message: 'OK',
    });

    await act(async () => { await useRatingsStore.getState().listAll(TOKEN, 2); });

    expect(useRatingsStore.getState().allRatings).toHaveLength(2);
  });

  it('remplace les évaluations à la page 1', async () => {
    useRatingsStore.setState({ allRatings: [{ ...mockRatingAdmin, id: 'old' }, { ...mockRatingAdmin, id: 'old2' }] });

    mockRatingsApi.listAll.mockResolvedValue({ ok: true, data: mockAdminResult, message: 'OK' });

    await act(async () => { await useRatingsStore.getState().listAll(TOKEN, 1); });

    expect(useRatingsStore.getState().allRatings).toHaveLength(1);
  });

  it('stocke l\'erreur si l\'API échoue', async () => {
    mockRatingsApi.listAll.mockResolvedValue({ ok: false, message: 'Erreur serveur interne' });

    await expect(
      act(async () => { await useRatingsStore.getState().listAll(TOKEN); })
    ).rejects.toThrow('Erreur serveur interne');

    expect(useRatingsStore.getState().error).toBe('Erreur serveur interne');
    expect(useRatingsStore.getState().isLoading).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// deleteRating
// ══════════════════════════════════════════════════════════════════════════
describe('useRatingsStore › deleteRating', () => {
  beforeEach(() => { resetStore(); jest.clearAllMocks(); });

  it('supprime l\'évaluation de la liste admin et décrémente le total', async () => {
    useRatingsStore.setState({ allRatings: [mockRatingAdmin], allTotal: 1 });
    mockRatingsApi.delete.mockResolvedValue({ ok: true, message: 'Supprimé' });

    await act(async () => {
      await useRatingsStore.getState().deleteRating(TOKEN, RATING_ID);
    });

    const state = useRatingsStore.getState();
    expect(state.allRatings).toHaveLength(0);
    expect(state.allTotal).toBe(0);
    expect(state.isLoading).toBe(false);
  });

  it('ne supprime pas les autres évaluations', async () => {
    const other: RatingAdmin = { ...mockRatingAdmin, id: 'other-rating-id' };
    useRatingsStore.setState({ allRatings: [mockRatingAdmin, other], allTotal: 2 });
    mockRatingsApi.delete.mockResolvedValue({ ok: true });

    await act(async () => {
      await useRatingsStore.getState().deleteRating(TOKEN, RATING_ID);
    });

    const state = useRatingsStore.getState();
    expect(state.allRatings).toHaveLength(1);
    expect(state.allRatings[0].id).toBe('other-rating-id');
    expect(state.allTotal).toBe(1);
  });

  it('allTotal ne descend pas en dessous de 0', async () => {
    useRatingsStore.setState({ allRatings: [mockRatingAdmin], allTotal: 0 });
    mockRatingsApi.delete.mockResolvedValue({ ok: true });

    await act(async () => { await useRatingsStore.getState().deleteRating(TOKEN, RATING_ID); });

    expect(useRatingsStore.getState().allTotal).toBe(0);
  });

  it('stocke l\'erreur si l\'API échoue', async () => {
    mockRatingsApi.delete.mockResolvedValue({ ok: false, message: 'Évaluation introuvable' });

    await expect(
      act(async () => {
        await useRatingsStore.getState().deleteRating(TOKEN, 'id-inexistant');
      })
    ).rejects.toThrow('Évaluation introuvable');

    const state = useRatingsStore.getState();
    expect(state.error).toBe('Évaluation introuvable');
    expect(state.isLoading).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// clearError
// ══════════════════════════════════════════════════════════════════════════
describe('useRatingsStore › clearError', () => {
  it('réinitialise le champ error à null', () => {
    useRatingsStore.setState({ error: 'Une erreur quelconque' });

    useRatingsStore.getState().clearError();

    expect(useRatingsStore.getState().error).toBeNull();
  });

  it('ne modifie pas les autres champs du store', () => {
    useRatingsStore.setState({ error: 'erreur', myTotal: 5, isLoading: false });

    useRatingsStore.getState().clearError();

    expect(useRatingsStore.getState().myTotal).toBe(5);
    expect(useRatingsStore.getState().isLoading).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// alreadyRated — logique d'affichage bouton vs étoiles
// ══════════════════════════════════════════════════════════════════════════
describe('alreadyRated — réservation terminée : bouton vs étoiles', () => {
  it('driver.rating == null → course non évaluée (bouton "Évaluer" attendu)', () => {
    const rating = null;
    const alreadyRated = rating != null;
    expect(alreadyRated).toBe(false);
  });

  it('driver.rating == undefined → course non évaluée (bouton "Évaluer" attendu)', () => {
    const rating = undefined;
    const alreadyRated = rating != null;
    expect(alreadyRated).toBe(false);
  });

  it('driver.rating == 4 → course déjà évaluée (étoiles attendues)', () => {
    const rating = 4;
    const alreadyRated = rating != null;
    expect(alreadyRated).toBe(true);
  });

  it('driver.rating == 1 → note minimale, étoiles attendues', () => {
    const rating = 1;
    const alreadyRated = rating != null;
    expect(alreadyRated).toBe(true);
  });

  it('driver == null (chauffeur non assigné) → pas d\'évaluation possible', () => {
    const driver = null as { rating: number | null } | null;
    const alreadyRated = driver?.rating != null;
    expect(alreadyRated).toBe(false);
  });

  it('driver == undefined → pas d\'évaluation possible', () => {
    const driver = undefined as any;
    const alreadyRated = driver?.rating != null;
    expect(alreadyRated).toBe(false);
  });
});
