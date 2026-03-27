import { create } from 'zustand';
import { authApi }        from '../services/api/auth.api';
import { userApi }        from '../services/api/user.api'
import { authStorage as secureStorage }  from '../services/auth/auth-storage';
import type { AuthUser, LoginPayload, RegisterPayload, UpdateProfilePayload } from '../types';

interface AuthState {
  user:           AuthUser  | null;
  localAvatarUri: string | null;
  accessToken:    string    | null;
  refreshToken:   string    | null;
  isLoading:      boolean;
  isHydrated:     boolean;
  error:          string    | null;

  // Actions
  hydrate:        ()                          => Promise<void>;
  login:          (payload: LoginPayload)     => Promise<void>;
  loginWithGoogle: (token: string)             => Promise<void>;
  register:       (payload: RegisterPayload)  => Promise<void>;
  logout:         ()                          => Promise<void>;
  changePassword:  (currentPassword: string, newPassword: string, confirmPassword: string) => Promise<void>;
  forgotPassword: (email: string)             => Promise<void>;
  updateProfile: (payload: UpdateProfilePayload) => Promise<void>;
  uploadAvatar:   (formData: FormData, pendingImage?: string)          => Promise<void>;
  clearError:     ()                          => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user:         null,
  localAvatarUri: null,
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

  // ── Login with Google ─────────────────────────────────────────────────
  loginWithGoogle: async (token) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authApi.google(token);
      if (!res.ok || !res.data) throw new Error(res.message ?? 'Erreur de connexion avec Google');
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

  // ── Reset Password  ─────────────────────────
  changePassword: async (currentPassword, newPassword, confirmPassword) => {
    set({ isLoading: true, error: null });
    const { accessToken } = get();
    try {

      if (!accessToken) throw new Error('Utilisateur non authentifié');
      
      
      const res = await authApi.changePassword( currentPassword, newPassword, confirmPassword, accessToken);

      if (!res.ok) throw new Error(res.message ?? 'Mot de passe actuel incorrect');

      set({ isLoading: false });
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Erreur inconnue', isLoading: false });
      throw err; 
    }
  },

  updateProfile: async (payload) => {
    set({ isLoading: true, error: null });
    const { accessToken, user } = get();
    try {
      if (!accessToken) throw new Error('Utilisateur non authentifié');

      const res = await userApi.updateMe(accessToken, payload);
      if (!res.ok || !res.data) throw new Error(res.message ?? 'Erreur lors de la mise à jour');

      const updatedUser: AuthUser = {
        ...res.data,
        // Le backend retourne AuthUser de base — on réinjecte les champs driver si présents
        ...(user?.role === 'driver' && {
          vtc_license: (user as any).vtc_license,
          iban: (payload as any).iban ?? (user as any).iban,
          vehicle: {
            ...(user as any).vehicle,
            ...(payload as any).vehicle_model && { model: (payload as any).vehicle_model },
            ...(payload as any).vehicle_color && { color: (payload as any).vehicle_color },
            ...(payload as any).vehicle_brand && { brand: (payload as any).vehicle_brand },
          },
        }),
      };

      set({ user: updatedUser, isLoading: false });
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Erreur inconnue', isLoading: false });
      throw err;
    }
  },

  uploadAvatar: async (formData: FormData, localUri?: string) => {
    set({ isLoading: true, error: null });
    const { accessToken } = get();  
    try {
      if (!accessToken) throw new Error('Utilisateur non authentifié');
      
      const res = await authApi.uploadAvatar(formData, accessToken);
      
      if (!res.ok || !res.data) throw new Error(res.message ?? 'Erreur lors de l\'upload de l\'avatar');

      // Optionnel : mettre à jour le contexte avec la nouvelle URL retournée
      const updatedUser = { ...get().user } as AuthUser;

      console.log(updatedUser);

      if (localUri) set({ user: updatedUser, localAvatarUri: localUri, isLoading: false });
      else  set({ user: updatedUser, isLoading: false });

    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Erreur inconnue', isLoading: false });
      throw err;
    }
  },

  clearError: () => set({ error: null }),
}));