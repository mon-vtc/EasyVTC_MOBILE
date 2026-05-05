import { useAuth } from './useAuth';
import type { ManagerPermission } from '../types';

/**
 * Vérifie les permissions RBAC du manager connecté.
 * Les admins ont toutes les permissions implicitement.
 */
export function usePermissions() {
  const { user } = useAuth();

  const hasPermission = (permission: ManagerPermission): boolean => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return (user.permissions ?? []).includes(permission);
  };

  const hasAnyPermission = (...permissions: ManagerPermission[]): boolean =>
    permissions.some(p => hasPermission(p));

  const hasAllPermissions = (...permissions: ManagerPermission[]): boolean =>
    permissions.every(p => hasPermission(p));

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    permissions: user?.permissions ?? [],
  };
}
