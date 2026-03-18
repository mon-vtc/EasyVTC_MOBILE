import { useAuthStore } from '../store/auth.store';

// Hook pratique pour accéder à l'état auth dans les composants
export function useAuth() {
  return useAuthStore((s) => ({
    user:           s.user,
    isLoading:      s.isLoading,
    isHydrated:     s.isHydrated,
    isAuthenticated: !!s.user,
    isClient:       s.user?.role === 'client',
    isDriver:       s.user?.role === 'driver',
    isAdmin:        s.user?.role === 'admin',
    isManager:      s.user?.role === 'manager',
    error:          s.error,
    login:          s.login,
    register:       s.register,
    logout:         s.logout,
    forgotPassword: s.forgotPassword,
    clearError:     s.clearError,
  }));
}