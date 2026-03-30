import { useAuth }      from './useAuth';
import type { ClientUser } from '../types';

//  Réservé aux clients — expose uniquement les fonctionnalités client
export function useClient() {
  const auth = useAuth();

  if (!auth.isClient) {
    throw new Error('useClient() ne peut être utilisé que par un client.');
  }

  return {
    // Profil
    user:           auth.user as ClientUser,
    localAvatarUri: auth.localAvatarUri,
    isLoading:      auth.isLoading,
    error:          auth.error,
    clearError:     auth.clearError,

    // Actions autorisées pour un client
    updateProfile:  auth.updateProfile,
    uploadAvatar:   auth.uploadAvatar,
    resetPassword:  auth.changePassword,
    logout:         auth.logout,
  };
}