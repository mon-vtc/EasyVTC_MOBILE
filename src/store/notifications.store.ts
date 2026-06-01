// ══════════════════════════════════════════════════════════════════════════════
// STORE — Notifications (Zustand)
// ══════════════════════════════════════════════════════════════════════════════

import { create } from 'zustand';
import { notificationsApi } from '../services/api/notifications.api';
import { initializeSocket, disconnectSocket, getSocket } from '../lib/socket';
import type { Notification, RealtimeNotificationPayload } from '../types';

interface NotificationsState {
  notifications: Notification[];
  unreadCount:   number;
  total:         number;
  page:          number;
  limit:         number;
  hasMore:       boolean;
  isLoading:     boolean;
  isFetchingNextPage: boolean;
  isRealtimeConnected: boolean;
  error:         string | null;

  // Actions
  // initRealtime:        (token: string) => void;
  // disconnectRealtime:  () => void;
  fetchNotifications:  (token: string, loadMore?: boolean) => Promise<void>;
  markAsRead:          (token: string, id: string) => Promise<void>;
  markAllAsRead:       (token: string) => Promise<void>;
  removeNotificationLocally: (id: string) => void; // Client-side removal for now
  clearError:          () => void;
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  notifications:       [],
  unreadCount:         0,
  total:               0,
  page:                1,
  limit:               10, // Default limit for pagination
  hasMore:             true,
  isLoading:           false,
  isFetchingNextPage:  false,
  isRealtimeConnected: false,
  error:               null,

  // initRealtime: (token) => {
  //   if (get().isRealtimeConnected) return;

  //   initializeSocket(token);
  //   const socket = getSocket();

  //   if (socket) {
  //     socket.on('notification:new', (payload: RealtimeNotificationPayload) => {
  //       console.log('Realtime: new notification', payload);
  //       set((state) => ({
  //         notifications: [payload as Notification, ...state.notifications],
  //         unreadCount: state.unreadCount + 1,
  //         total: state.total + 1,
  //       }));
  //     });

  //     socket.on('notification:updated', (payload: RealtimeNotificationPayload) => {
  //       console.log('Realtime: notification updated', payload);
  //       set((state) => {
  //         const updatedNotifications = state.notifications.map((notif) =>
  //           notif.id === payload.id ? { ...notif, ...payload } : notif
  //         );
  //         // Adjust unread count if a notification was marked as read
  //         const oldNotif = state.notifications.find(n => n.id === payload.id);
  //         let newUnreadCount = state.unreadCount;
  //         if (oldNotif && !oldNotif.read_at && payload.read_at) {
  //           newUnreadCount = Math.max(0, newUnreadCount - 1);
  //         }
  //         return {
  //           notifications: updatedNotifications,
  //           unreadCount: newUnreadCount,
  //         };
  //       });
  //     });

  //     set({ isRealtimeConnected: true });
  //   }
  // },

  // disconnectRealtime: () => {
  //   if (!get().isRealtimeConnected) return;
  //   const socket = getSocket();
  //   if (socket) {
  //     socket.off('notification:new');
  //     socket.off('notification:updated');
  //   }
  //   disconnectSocket();
  //   set({ isRealtimeConnected: false });
  // },

  fetchNotifications: async (token, loadMore = false) => {
    const { isLoading, isFetchingNextPage, page, limit, hasMore } = get();

    if (isLoading || isFetchingNextPage || (!hasMore && loadMore)) return;

    if (loadMore) {
      set({ isFetchingNextPage: true, error: null });
    } else {
      set({ isLoading: true, error: null, notifications: [], page: 1, hasMore: true });
    }

    try {
      const nextPage = loadMore ? page + 1 : 1;
      const res = await notificationsApi.list(token, { page: nextPage, limit });

      if (!res.ok || !res.data) throw new Error(res.message ?? 'Erreur de chargement des notifications');

      set((state) => ({
        notifications: loadMore ? [...state.notifications, ...res.data!.notifications] : res.data!.notifications,
        total:         res.data!.total,
        unreadCount:   res.data!.unread_count,
        page:          nextPage,
        hasMore:       res.data!.notifications.length === limit,
        isLoading:     false,
        isFetchingNextPage: false,
      }));
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Erreur inconnue', isLoading: false, isFetchingNextPage: false });
      throw err;
    }
  },

  markAsRead: async (token, id) => {
    try {
      await notificationsApi.markAsRead(token, id);
      // Optimistic update: update local state immediately
      set((state) => ({
        notifications: state.notifications.map((notif) =>
          notif.id === id && !notif.read_at ? { ...notif, read_at: new Date().toISOString() } : notif
        ),
        unreadCount: Math.max(0, state.unreadCount - (state.notifications.find(n => n.id === id && !n.read_at) ? 1 : 0)),
      }));
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Erreur lors du marquage comme lu' });
      throw err;
    }
  },

  markAllAsRead: async (token) => {
    try {
      const res = await notificationsApi.markAllAsRead(token);
      if (!res.ok) throw new Error(res.message ?? 'Erreur lors du marquage de toutes les notifications comme lues');
      set((state) => ({
        notifications: state.notifications.map((notif) =>
          !notif.read_at ? { ...notif, read_at: new Date().toISOString() } : notif
        ),
        unreadCount: 0,
      }));
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Erreur lors du marquage de toutes les notifications comme lues' });
      throw err;
    }
  },

  removeNotificationLocally: (id) => {
    set((state) => {
      const notificationToRemove = state.notifications.find(n => n.id === id);
      let newUnreadCount = state.unreadCount;
      if (notificationToRemove && !notificationToRemove.read_at) {
        newUnreadCount = Math.max(0, newUnreadCount - 1);
      }
      return {
        notifications: state.notifications.filter((notif) => notif.id !== id),
        unreadCount: newUnreadCount,
        total: state.total - 1,
      };
    });
  },

  clearError: () => set({ error: null }),
}));