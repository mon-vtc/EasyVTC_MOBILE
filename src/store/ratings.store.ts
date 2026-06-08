// ══════════════════════════════════════════════════════════════════════════════
// STORE — Évaluations (Zustand)
// Sprint 6 — EazyVTC
// ══════════════════════════════════════════════════════════════════════════════

import { create } from 'zustand';
import { ratingsApi } from '../services/api/ratings.api';
import type { RatingWithClient, RatingAdmin, SubmitRatingDto } from '../types/ratings.types';

interface RatingsState {
  // ── Vue chauffeur (ses propres évaluations) ────────────────────────────────
  myRatings:    RatingWithClient[];
  myAvgNote:    number | null;
  myTotal:      number;
  myPage:       number;
  myTotalPages: number;

  // ── Vue admin (liste globale) ──────────────────────────────────────────────
  allRatings:    RatingAdmin[];
  allTotal:      number;
  allPage:       number;
  allTotalPages: number;

  // ── UI ─────────────────────────────────────────────────────────────────────
  isLoading:    boolean;
  isSubmitting: boolean;
  error:        string | null;

  // ── Actions ────────────────────────────────────────────────────────────────
  fetchMyRatings: (token: string, page?: number) => Promise<void>;
  listAll:        (token: string, page?: number) => Promise<void>;
  submitRating:   (token: string, reservationId: string, dto: SubmitRatingDto) => Promise<void>;
  deleteRating:   (token: string, ratingId: string) => Promise<void>;
  clearError:     () => void;
}

export const useRatingsStore = create<RatingsState>((set) => ({
  myRatings:    [],
  myAvgNote:    null,
  myTotal:      0,
  myPage:       1,
  myTotalPages: 1,

  allRatings:    [],
  allTotal:      0,
  allPage:       1,
  allTotalPages: 1,

  isLoading:    false,
  isSubmitting: false,
  error:        null,

  // ── GET /drivers/me/ratings ───────────────────────────────────────────────
  fetchMyRatings: async (token, page = 1) => {
    set({ isLoading: true, error: null });
    try {
      const res = await ratingsApi.getMyRatings(token, page, 20);
      if (!res.ok || !res.data) throw new Error(res.message ?? 'Erreur de chargement');
      const incoming = res.data.ratings;
      set(state => ({
        myRatings:    page === 1 ? incoming : [...state.myRatings, ...incoming],
        myAvgNote:    res.data!.avg_note,
        myTotal:      res.data!.total,
        myPage:       res.data!.page,
        myTotalPages: res.data!.total_pages,
        isLoading:    false,
      }));
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Erreur inconnue', isLoading: false });
      throw err;
    }
  },

  // ── GET /admin/ratings ────────────────────────────────────────────────────
  listAll: async (token, page = 1) => {
    set({ isLoading: true, error: null });
    try {
      const res = await ratingsApi.listAll(token, page, 20);
      if (!res.ok || !res.data) throw new Error(res.message ?? 'Erreur de chargement');
      const incoming = res.data.ratings;
      set(state => ({
        allRatings:    page === 1 ? incoming : [...state.allRatings, ...incoming],
        allTotal:      res.data!.total,
        allPage:       res.data!.page,
        allTotalPages: res.data!.total_pages,
        isLoading:     false,
      }));
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Erreur inconnue', isLoading: false });
      throw err;
    }
  },

  // ── POST /reservations/:id/rating ─────────────────────────────────────────
  submitRating: async (token, reservationId, dto) => {
    set({ isSubmitting: true, error: null });
    try {
      const res = await ratingsApi.submit(token, reservationId, dto);
      if (!res.ok) throw new Error(res.message ?? "Erreur lors de la soumission de l'évaluation");
      set({ isSubmitting: false });
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Erreur inconnue', isSubmitting: false });
      throw err;
    }
  },

  // ── DELETE /admin/ratings/:id ─────────────────────────────────────────────
  deleteRating: async (token, ratingId) => {
    set({ isLoading: true, error: null });
    try {
      const res = await ratingsApi.delete(token, ratingId);
      if (!res.ok) throw new Error(res.message ?? 'Erreur lors de la suppression');
      set(state => ({
        allRatings: state.allRatings.filter(r => r.id !== ratingId),
        allTotal:   Math.max(0, state.allTotal - 1),
        isLoading:  false,
      }));
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Erreur inconnue', isLoading: false });
      throw err;
    }
  },

  clearError: () => set({ error: null }),
}));
