import { useUsersStore } from '../store';
import { useAuth }       from './useAuth';
import type { ListUsersParams, UpdateUserStatusPayload } from '../types';

// ✅ Hook réservé Admin/Manager — expose les actions avec le token automatiquement
export function useUsers() {
  const { accessToken } = useAuth() as any;

  // On récupère depuis le store
  const users      = useUsersStore(s => s.users);
  const total      = useUsersStore(s => s.total);
  const page       = useUsersStore(s => s.page);
  const totalPages = useUsersStore(s => s.totalPages);
  const isLoading  = useUsersStore(s => s.isLoading);
  const error      = useUsersStore(s => s.error);

  const _fetchUsers       = useUsersStore(s => s.fetchUsers);
  const _fetchUserById    = useUsersStore(s => s.fetchUserById);
  const _updateUserStatus = useUsersStore(s => s.updateUserStatus);
  const clearError        = useUsersStore(s => s.clearError);

  return {
    users,
    total,
    page,
    totalPages,
    isLoading,
    error,
    clearError,

    fetchUsers: (params?: ListUsersParams) =>
      _fetchUsers(accessToken, params),

    fetchUserById: (userId: string) =>
      _fetchUserById(accessToken, userId),

    updateUserStatus: (userId: string, payload: UpdateUserStatusPayload) =>
      _updateUserStatus(accessToken, userId, payload),
    
  };
}