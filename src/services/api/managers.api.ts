// ══════════════════════════════════════════════════════════════════════════════
// API — Module Gestionnaires (Admin)
// ══════════════════════════════════════════════════════════════════════════════

import { api } from '../../lib/api';
import type { ApiResponse, UserProfile } from '../../types';
import type {
  CreateManagerDto,
  UpdateManagerDto,
  ChangeManagerStatusDto,
  ManagerListFilters,
  ManagerListResult,
  SetManagerPermissionsDto,
  ManagerPermissionsResult,
} from '../../types/admin.types';

const buildQs = (filters?: ManagerListFilters): string => {
  const params = new URLSearchParams();
  if (filters?.page)   params.set('page',   String(filters.page));
  if (filters?.limit)  params.set('limit',  String(filters.limit));
  if (filters?.status) params.set('status', filters.status);
  if (filters?.search) params.set('search', filters.search);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
};

export const managersApi = {

  /** POST /admin/managers — Créer un gestionnaire */
  create: (token: string, dto: CreateManagerDto): Promise<ApiResponse<UserProfile>> =>
    api.post('/admin/managers', dto, token),

  /** GET /admin/managers — Lister les gestionnaires */
  list: (token: string, filters?: ManagerListFilters): Promise<ApiResponse<ManagerListResult>> =>
    api.get(`/admin/managers${buildQs(filters)}`, token),

  /** GET /admin/managers/:id — Détail d'un gestionnaire */
  getById: (token: string, id: string): Promise<ApiResponse<UserProfile>> =>
    api.get(`/admin/managers/${id}`, token),

  /** PATCH /admin/managers/:id — Mettre à jour un gestionnaire */
  update: (token: string, id: string, dto: UpdateManagerDto): Promise<ApiResponse<UserProfile>> =>
    api.patch(`/admin/managers/${id}`, dto, token),

  /** PATCH /admin/managers/:id/status — Changer le statut */
  changeStatus: (token: string, id: string, dto: ChangeManagerStatusDto): Promise<ApiResponse<UserProfile>> =>
    api.patch(`/admin/managers/${id}/status`, dto, token),

  /** DELETE /admin/managers/:id — Supprimer un gestionnaire */
  delete: (token: string, id: string): Promise<ApiResponse<void>> =>
    api.delete(`/admin/managers/${id}`, token),

  /** GET /admin/managers/:id/permissions — Lire les permissions d'un gestionnaire */
  getPermissions: (token: string, id: string): Promise<ApiResponse<ManagerPermissionsResult>> =>
    api.get(`/admin/managers/${id}/permissions`, token),

  /** PUT /admin/managers/:id/permissions — Définir les permissions d'un gestionnaire */
  setPermissions: (token: string, id: string, dto: SetManagerPermissionsDto): Promise<ApiResponse<ManagerPermissionsResult>> =>
    api.put(`/admin/managers/${id}/permissions`, dto, token),
};