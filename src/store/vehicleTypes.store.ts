// ══════════════════════════════════════════════════════════════════════════════
// STORE — Types de véhicule (Zustand)
// Sprint 3 — EasyVTC
// ══════════════════════════════════════════════════════════════════════════════

import { create } from 'zustand';
import { vehicleTypesApi } from '../services/api/vehicleTypes.api';
import type {
  VehicleTypePublic,
  VehicleTypeRecord,
  CreateVehicleTypePayload,
  UpdateVehicleTypePayload,
} from '../services/api/vehicleTypes.api';

interface VehicleTypesState {
  // Types actifs — utilisés côté client pour le formulaire de réservation
  activeTypes: VehicleTypePublic[];
  // Tous les types — utilisés côté admin (actifs + inactifs)
  allTypes:    VehicleTypeRecord[];

  isLoading: boolean;
  error:     string | null;

  fetchActiveTypes: (country?: string)                                              => Promise<void>;
  fetchAllTypes:    (token: string)                                                 => Promise<void>;
  createType:       (token: string, dto: CreateVehicleTypePayload)                 => Promise<void>;
  updateType:       (token: string, id: string, dto: UpdateVehicleTypePayload)     => Promise<void>;
  deleteType:       (token: string, id: string)                                    => Promise<void>;
  clearError:       ()                                                              => void;
}

export const useVehicleTypesStore = create<VehicleTypesState>((set, get) => ({
  activeTypes: [],
  allTypes:    [],
  isLoading:   false,
  error:       null,

  // ── Public : types actifs avec prix selon pays ──────────────────────────────
  fetchActiveTypes: async (country) => {
    set({ isLoading: true, error: null });
    try {
      const res = await vehicleTypesApi.getActiveTypes(country);
      if (res.ok && res.data) {
        set({ activeTypes: res.data });
      } else {
        set({ error: res.message ?? 'Erreur lors du chargement des types de véhicule' });
      }
    } catch {
      set({ error: 'Erreur réseau' });
    } finally {
      set({ isLoading: false });
    }
  },

  // ── Admin : tous les types (actifs + inactifs) ──────────────────────────────
  fetchAllTypes: async (token) => {
    set({ isLoading: true, error: null });
    try {
      const res = await vehicleTypesApi.getAllTypes(token);
      if (res.ok && res.data) {
        set({ allTypes: res.data });
      } else {
        set({ error: res.message ?? 'Erreur lors du chargement' });
      }
    } catch {
      set({ error: 'Erreur réseau' });
    } finally {
      set({ isLoading: false });
    }
  },

  // ── Admin : créer un type ───────────────────────────────────────────────────
  createType: async (token, dto) => {
    set({ isLoading: true, error: null });
    try {
      const res = await vehicleTypesApi.createType(token, dto);
      if (res.ok && res.data) {
        set((s) => ({ allTypes: [...s.allTypes, res.data!].sort((a, b) => a.sort_order - b.sort_order) }));
      } else {
        set({ error: res.message ?? 'Erreur lors de la création' });
        throw new Error(res.message ?? 'Erreur lors de la création');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la création';
      set({ error: msg });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  // ── Admin : modifier un type ────────────────────────────────────────────────
  updateType: async (token, id, dto) => {
    set({ isLoading: true, error: null });
    try {
      const res = await vehicleTypesApi.updateType(token, id, dto);
      if (res.ok && res.data) {
        set((s) => ({
          allTypes: s.allTypes
            .map((t) => (t.id === id ? res.data! : t))
            .sort((a, b) => a.sort_order - b.sort_order),
        }));
      } else {
        set({ error: res.message ?? 'Erreur lors de la mise à jour' });
        throw new Error(res.message ?? 'Erreur lors de la mise à jour');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la mise à jour';
      set({ error: msg });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  // ── Admin : supprimer un type ───────────────────────────────────────────────
  deleteType: async (token, id) => {
    set({ isLoading: true, error: null });
    try {
      const res = await vehicleTypesApi.deleteType(token, id);
      if (res.ok) {
        set((s) => ({ allTypes: s.allTypes.filter((t) => t.id !== id) }));
      } else {
        set({ error: res.message ?? 'Erreur lors de la suppression' });
        throw new Error(res.message ?? 'Erreur lors de la suppression');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la suppression';
      set({ error: msg });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
