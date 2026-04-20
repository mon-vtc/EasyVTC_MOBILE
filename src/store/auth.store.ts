  import { create } from 'zustand';
  import { authApi }        from '../services/api/auth.api';
  import { userApi }        from '../services/api/user.api'
  import { authStorage as secureStorage }  from '../services/auth/auth-storage';
  import type { AuthUser, LoginPayload, RegisterPayload, UpdateProfilePayload } from '../types';

  // ── Utilitaire : aplatir la réponse API → AuthUser/DriverUser ──
  export function mapApiUser(raw: any): AuthUser {
    if (raw?.role !== 'driver') return raw;

    return {
      // Champs racine
      ...raw,
      // Champs driver aplatis depuis raw.driver
      driverStatus: raw.driver?.status        ?? 'pending',
      vehicle_type: raw.driver?.vehicle_type  ?? null,
      siret:        raw.driver?.siret         ?? null,
      zone:         raw.driver?.zone          ?? null,
      iban:         raw.driver?.iban          ?? null,
      vtc_license:  raw.driver?.vtc_license   ?? null,
      tva_rate:     raw.driver?.tva_rate      ?? 0,
      is_online:    raw.driver?.is_online     ?? false,
      // Véhicule actif
      vehicle:      raw.vehicle               ?? null,
    };
  }

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
    loginWithGoogle: (accessToken: string, refreshToken?: string) => Promise<void>;
    register:       (payload: RegisterPayload)  => Promise<void>;
    logout:         ()                          => Promise<void>;
    forceLogout:    ()                          => Promise<void>;
    changePassword:  (currentPassword: string, newPassword: string, confirmPassword: string) => Promise<void>;
    forgotPassword: (email: string)             => Promise<void>;
    resetPassword:  (token: string, newPassword: string) => Promise<void>;
    updateProfile: (payload: UpdateProfilePayload) => Promise<void>;
    uploadAvatar:   (formData: FormData, pendingImage?: string) => Promise<void>;
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

    // ── Login ───────────────────────────────────────────────────────
  login: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authApi.login(payload);
      if (!res.ok || !res.data) throw new Error(res.message ?? 'Erreur de connexion');
      const { user, access_token, refresh_token } = res.data;
      await secureStorage.setTokens(access_token, refresh_token ?? '');
      set({
        user: mapApiUser(user),   // ← fix ici
        accessToken: access_token,
        refreshToken: refresh_token,
        isLoading: false,
      });
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Erreur inconnue', isLoading: false });
      throw err;
    }
  },

  // ── Hydrate ─────────────────────────────────────────────────────
  hydrate: async () => {
    try {
      const accessToken  = await secureStorage.getAccessToken();
      const refreshToken = await secureStorage.getRefreshToken();

      if (accessToken) {
        const res = await authApi.me(accessToken);
        if (res.ok && res.data) {
          set({ user: mapApiUser(res.data), accessToken, refreshToken, isHydrated: true }); // ← fix
          return;
        }

        if (refreshToken) {
          const refreshRes = await authApi.refresh(refreshToken);
          if (refreshRes.ok && refreshRes.data) {
            const { access_token, refresh_token } = refreshRes.data;
            await secureStorage.setTokens(access_token, refresh_token);
            const meRes = await authApi.me(access_token);
            if (meRes.ok && meRes.data) {
              set({
                user: mapApiUser(meRes.data),   // ← fix
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

  // ── Register ────────────────────────────────────────────────────
  register: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authApi.register(payload);
      if (!res.ok || !res.data) throw new Error(res.message ?? 'Erreur lors de la création du compte');
      const { user, access_token, refresh_token } = res.data;
      await secureStorage.setTokens(access_token, refresh_token ?? '');
      set({
        user: mapApiUser(user),   // ← fix
        accessToken: access_token,
        refreshToken: refresh_token,
        isLoading: false,
      });
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Erreur inconnue', isLoading: false });
      throw err;
    }
  },

    // ── Login with Google ─────────────────────────────────────────────────
    loginWithGoogle: async (accessToken, refreshToken) => {
      set({ isLoading: true, error: null });
      try {
        const res = await authApi.google(accessToken, refreshToken);
        if (!res.ok || !res.data) throw new Error(res.message ?? 'Erreur de connexion avec Google');
        const { user, access_token, refresh_token } = res.data;
        await secureStorage.setTokens(access_token, refresh_token ?? '');
        set({
          user: mapApiUser(user),
          accessToken: access_token,
          refreshToken: refresh_token,
          isLoading: false,
        });
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

    // ── Force logout (pour token expiré — pas d'appel API) ──────────────────
    forceLogout: async () => {
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

    // ── Reset Password (depuis email — token Supabase) ──────────────────────
    resetPassword: async (token, newPassword) => {
      set({ isLoading: true, error: null });
      try {
        const res = await authApi.resetPassword(token, newPassword);
        if (!res.ok) throw new Error(res.message ?? 'Erreur lors de la réinitialisation');
        set({ isLoading: false });
      } catch (err: unknown) {
        set({ error: err instanceof Error ? err.message : 'Erreur inconnue', isLoading: false });
        throw err;
      }
    },

    // ── Change Password (utilisateur connecté) ────────────────────────────────
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
        if (!res.ok || !res.data) throw new Error(res.message ?? "Erreur lors de l'upload de l'avatar");

        // Mettre à jour profile_photo_url avec l'URL retournée par le backend
        const currentUser = get().user;
        const updatedUser = currentUser
          ? { ...currentUser, profile_photo_url: res.data.profile_photo_url }
          : currentUser;

        if (localUri) set({ user: updatedUser as AuthUser, localAvatarUri: localUri, isLoading: false });
        else set({ user: updatedUser as AuthUser, isLoading: false });
      } catch (err: unknown) {
        set({ error: err instanceof Error ? err.message : 'Erreur inconnue', isLoading: false });
        throw err;
      }
    },

    clearError: () => set({ error: null }),
  }));