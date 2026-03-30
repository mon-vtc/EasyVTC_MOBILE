import { create } from 'zustand';
import { authApi }        from '../services/api/auth.api';
import { authStorage as secureStorage }  from '../services/auth/auth-storage';
import type { AuthUser, LoginPayload, RegisterPayload } from '../types/auth.types';

interface AuthState {
  user:         AuthUser | null;
  accessToken:  string | null;
  refreshToken: string | null;
  isLoading:    boolean;
  isHydrated:   boolean;
  error:        string | null;

  // Actions
  hydrate:        () => Promise<void>;
  login:          (payload: LoginPayload)    => Promise<void>;
  register:       (payload: RegisterPayload) => Promise<void>;
  logout:         () => Promise<void>;
  forgotPassword: (email: string)            => Promise<void>;
  clearError:     () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user:         null,
  accessToken:  null,
  refreshToken: null,
  isLoading:    false,
  isHydrated:   false,
  error:        null,

  // ── Hydratation au démarrage de l'app ──────────────────────────────────
  hydrate: async () => {
    try {
      const accessToken  = await secureStorage.getAccessToken();
      const refreshToken = await secureStorage.getRefreshToken();

      if (accessToken) {
        // Vérifier que le token est encore valide
        const res = await authApi.me(accessToken);
        if (res.ok && res.data) {
          set({ user: res.data, accessToken, refreshToken, isHydrated: true });
          return;
        }

        // Token expiré → tenter le refresh
        if (refreshToken) {
          const refreshRes = await authApi.refresh(refreshToken);
          if (refreshRes.ok && refreshRes.data) {
            const { access_token, refresh_token } = refreshRes.data;
            await secureStorage.setTokens(access_token, refresh_token);
            const meRes = await authApi.me(access_token);
            if (meRes.ok && meRes.data) {
              set({
                user: meRes.data,
                accessToken: access_token,
                refreshToken: refresh_token,
                isHydrated: true,
              });
              return;
            }
          }
        }
      }
    } catch (_) {}

    await secureStorage.clearTokens();
    set({ user: null, accessToken: null, refreshToken: null, isHydrated: true });
  },

  // ── Login ───────────────────────────────────────────────────────────────
  login: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authApi.login(payload);
      if (!res.ok || !res.data) throw new Error(res.message ?? 'Erreur de connexion');
      const { user, access_token, refresh_token } = res.data;
      await secureStorage.setTokens(access_token, refresh_token);
      set({ user, accessToken: access_token, refreshToken: refresh_token, isLoading: false });
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Erreur inconnue', isLoading: false });
      throw err;
    }
  },

  // ── Register ────────────────────────────────────────────────────────────
  register: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authApi.register(payload);
      if (!res.ok || !res.data) throw new Error(res.message ?? 'Erreur lors de la création du compte');
      const { user, access_token, refresh_token } = res.data;
      await secureStorage.setTokens(access_token, refresh_token);
      set({ user, accessToken: access_token, refreshToken: refresh_token, isLoading: false });
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Erreur inconnue', isLoading: false });
      throw err;
    }
  },

  // ── Logout ──────────────────────────────────────────────────────────────
  logout: async () => {
    const { accessToken } = get();
    try { if (accessToken) await authApi.logout(accessToken); } catch (_) {}
    await secureStorage.clearTokens();
    set({ user: null, accessToken: null, refreshToken: null, error: null });
  },

  // ── Forgot Password ─────────────────────────────────────────────────────
  forgotPassword: async (email) => {
    set({ isLoading: true, error: null });
    try {
      await authApi.forgotPassword(email);
      set({ isLoading: false });
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Erreur inconnue', isLoading: false });
      throw err;
    }
  },

  clearError: () => set({ error: null }),
}));