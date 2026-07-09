// ══════════════════════════════════════════════════════════════════════════════
// API Service — Notifications
// ══════════════════════════════════════════════════════════════════════════════

import { api } from '../../lib/api';
import type {
  ApiResponse,
  Notification,
  NotificationListFilters,
} from '../../types';

interface NotificationListResponse {
  notifications: Notification[];
  total: number;
  page: number;
  limit: number;
  unread_count: number;
}

export const notificationsApi = {
  /**
   * Fetches a paginated list of notifications for the authenticated user.
   */
  list: (token: string, filters?: NotificationListFilters): Promise<ApiResponse<NotificationListResponse>> => {
    const query = new URLSearchParams();
    if (filters?.page) query.append('page', filters.page.toString());
    if (filters?.limit) query.append('limit', filters.limit.toString());
    if (filters?.unread_only) query.append('unread_only', filters.unread_only.toString());

    return api.get<NotificationListResponse>(`/notifications?${query.toString()}`, token);
  },

  /**
   * Fetches a single notification by id (used to resolve a push notification tap,
   * whose payload only carries `notification_id`, into the full entity).
   */
  getById: (token: string, id: string): Promise<ApiResponse<Notification>> => {
    return api.get<Notification>(`/notifications/${id}`, token);
  },

  /**
   * Marks a specific notification as read.
   */
  markAsRead: (token: string, id: string): Promise<ApiResponse<void>> => {
    return api.patch<void>(`/notifications/${id}/read`, {}, token);
  },

  /**
   * Marks all notifications for the authenticated user as read.
   */
  markAllAsRead: (token: string): Promise<ApiResponse<{ updated: number }>> => {
    return api.patch<{ updated: number }>('/notifications/read-all', {}, token);
  },

  /**
   * Registers the device token for push notifications.
   * Uses the /notifications/token endpoint.
   */
  registerDeviceToken: (token: string, deviceToken: string): Promise<ApiResponse<void>> => {
    return api.post('/notifications/token', { device_token: deviceToken }, token);
  },

  /**
   * Removes the device token for push notifications.
   * Uses the /notifications/token endpoint.
   */
  removeDeviceToken: (token: string): Promise<ApiResponse<void>> => {
    return api.delete('/notifications/token', token);
  },
};