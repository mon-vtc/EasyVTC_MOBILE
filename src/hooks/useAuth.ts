import { useAuthStore } from '../store/auth.store';

// Hook pratique pour accéder à l'état auth dans les composants
export function useAuth() {
  return useAuthStore((s) => ({
    user:           s.user,
    localAvatarUri: s.localAvatarUri,
    isLoading:      s.isLoading,
    isHydrated:     s.isHydrated,
    isAuthenticated: !!s.user,
    isClient:       s.user?.role === 'client',
    isDriver:       s.user?.role === 'driver',
    isAdmin:        s.user?.role === 'admin',
    isManager:      s.user?.role === 'manager',
    error:          s.error,
    login:          s.login,
    loginWithGoogle: s.loginWithGoogle,
    register:       s.register,
    logout:         s.logout,
    changePassword:  s.changePassword,
    forgotPassword: s.forgotPassword,
    resetPassword:  s.resetPassword,
    clearError:     s.clearError,
    updateProfile:  s.updateProfile,
    uploadAvatar:   s.uploadAvatar,
  }));
}
