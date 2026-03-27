import { useAuth }      from './useAuth';
import { useAuthStore } from '../store/auth.store';
import type { DriverUser, UpdateDriverProfilePayload } from '../types';

// Réservé aux chauffeurs
export function useDriver() {
  const auth       = useAuth();
  const accessToken = useAuthStore(s => s.accessToken);

  if (!auth.isDriver) {
    throw new Error('useDriver() ne peut être utilisé que par un chauffeur.');
  }

  // Mise à jour étendue incluant les champs spécifiques chauffeur
  const updateDriverProfile = async (payload: UpdateDriverProfilePayload & {
    iban?:          string;
    vehicle_type?: string;
  }) => {
    await auth.updateProfile(payload);
  };

  return {
    // Profil
    user:           auth.user as DriverUser,
    localAvatarUri: auth.localAvatarUri,
    isLoading:      auth.isLoading,
    error:          auth.error,
    clearError:     auth.clearError,

    // Champs spécifiques chauffeur
    vtcLicense:  (auth.user as DriverUser)?.vtc_license ?? null,
    iban:        (auth.user as DriverUser)?.iban         ?? null,
    vehicle_type:     (auth.user as DriverUser)?.vehicle      ?? null,

    // Actions autorisées pour un chauffeur
    updateProfile: updateDriverProfile,
    uploadAvatar:  auth.uploadAvatar,
    changePassword: auth.changePassword,
    login:         auth.login,
    logout:        auth.logout,
  };
}