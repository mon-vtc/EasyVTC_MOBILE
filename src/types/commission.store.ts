// ══════════════════════════════════════════════════════════════════════════════
// STORE — Commission Settings (Zustand)
// Sprint 6 — EasyVTC
// ══════════════════════════════════════════════════════════════════════════════

import { create } from 'zustand';
import { commissionApi } from '../services/api/commission.api';
import type {
  CommissionSetting,
  CreateCommissionSettingDto,
  UpdateCommissionSettingDto,
  CommissionZone,
} from '../types/commission.types';

interface CommissionSettingsState {
  settings:  CommissionSetting[];
  isLoading: boolean;
  isSaving:  boolean;
  error:     string | null;

  fetchSettings: (token: string, filters?: { zone?: CommissionZone; is_active?: boolean }) => Promise<void>;
  createSetting: (token: string, dto: CreateCommissionSettingDto) => Promise<CommissionSetting | null>;
  updateSetting: (token: string, id: string, dto: UpdateCommissionSettingDto) => Promise<CommissionSetting | null>;
  deleteSetting: (token: string, id: string) => Promise<void>;
  clearError:    () => void;
}

export const useCommissionSettingsStore = create<CommissionSettingsState>((set) => ({
  settings:  [],
  isLoading: false,
  isSaving:  false,
  error:     null,

  // ── GET /admin/commission-settings ──────────────────────────────────────────
  fetchSettings: async (token, filters) => {
    set({ isLoading: true, error: null });
    try {
      const res = await commissionApi.listSettings(token, filters);
      if (!res.ok || !res.data) throw new Error(res.message ?? 'Erreur de chargement');
      set({ settings: res.data, isLoading: false });
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Erreur inconnue', isLoading: false });
      throw err;
    }
  },

  // ── POST /admin/commission-settings ─────────────────────────────────────────
  createSetting: async (token, dto) => {
    set({ isSaving: true, error: null });
    try {
      const res = await commissionApi.createSetting(token, dto);
      if (!res.ok || !res.data) throw new Error(res.message ?? 'Erreur de création');
      set(state => ({ settings: [...state.settings, res.data!] }));
      return res.data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      set({ error: message });
      throw new Error(message);
    } finally {
      set({ isSaving: false });
    }
  },

  // ── PATCH /admin/commission-settings/:id ────────────────────────────────────
  updateSetting: async (token, id, dto) => {
    set({ isSaving: true, error: null });
    try {
      const res = await commissionApi.updateSetting(token, id, dto);
      if (!res.ok || !res.data) throw new Error(res.message ?? 'Erreur de mise à jour');
      set(state => ({ settings: state.settings.map(s => s.id === id ? res.data! : s) }));
      return res.data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      set({ error: message });
      throw new Error(message);
    } finally {
      set({ isSaving: false });
    }
  },

  // ── DELETE /admin/commission-settings/:id ───────────────────────────────────
  deleteSetting: async (token, id) => {
    set({ isSaving: true, error: null });
    try {
      const res = await commissionApi.deleteSetting(token, id);
      if (!res.ok) throw new Error(res.message ?? 'Erreur de suppression');
      set(state => ({ settings: state.settings.filter(s => s.id !== id) }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      set({ error: message });
      throw new Error(message);
    } finally {
      set({ isSaving: false });
    }
  },

  clearError: () => set({ error: null }),
}));