import { useAuth }      from './useAuth';
import type { ClientUser } from '../types';
import { usePromoCodesStore } from '../store/promo-codes.store';
import { useCallback } from 'react';
import { useAuthStore } from '../store/auth.store';
//  Réservé aux clients — expose uniquement les fonctionnalités client
export function useClient() {
  const auth = useAuth();

  if (!auth.isClient) {
    throw new Error('useClient() ne peut être utilisé que par un client.');
  }

  const accessToken = useAuthStore(s => s.accessToken);

  // Promo Codes
  const myActivePromoCodes     = usePromoCodesStore(s => s.myActivePromoCodes);
  const myExpiredPromoCodes    = usePromoCodesStore(s => s.myExpiredPromoCodes);
  const myTotalSavings         = usePromoCodesStore(s => s.myTotalSavings);
  const myActiveCount          = usePromoCodesStore(s => s.myActiveCount);
  const isFetchingMyPromoCodes = usePromoCodesStore(s => s.isFetchingMyPromoCodes);
  const myPromoCodesError      = usePromoCodesStore(s => s.myPromoCodesError);
  const _fetchMyPromoCodes     = usePromoCodesStore(s => s.fetchMyPromoCodes);
  const _clearMyPromoCodesError  = usePromoCodesStore(s => s.clearMyPromoCodesError);

  const fetchMyPromoCodes = useCallback(
    () => {
      if (!accessToken) return;
      _fetchMyPromoCodes(accessToken);
    },
    [accessToken, _fetchMyPromoCodes],
  );

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

    // Promo Codes
    myActivePromoCodes,
    myExpiredPromoCodes,
    myTotalSavings,
    myActiveCount,
    isFetchingMyPromoCodes,
    myPromoCodesError,
    fetchMyPromoCodes,
    clearMyPromoCodesError: _clearMyPromoCodesError,
  };
}