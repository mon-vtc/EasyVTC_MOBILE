import { useEffect, useMemo, useRef } from 'react';
import { useAuthStore } from '../store/auth.store';
import { useNotificationsStore } from '../store/notifications.store';

export const useNotifications = () => {
  const { accessToken } = useAuthStore();
  const hasFetched = useRef(false); // ← flag pour éviter les appels multiples

  const {
    notifications,
    unreadCount,
    isLoading,
    isFetchingNextPage,
    hasMore,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    removeNotificationLocally,
    // initRealtime,
    // disconnectRealtime,
    clearError,
  } = useNotificationsStore();

  // Connexion temps réel
  // useEffect(() => {
  //   if (accessToken) {
  //     initRealtime(accessToken);
  //   }
  //   return () => {
  //     disconnectRealtime();
  //   };
  // }, [accessToken]); // ← retirer initRealtime/disconnectRealtime des deps si non mémoïsées

  // Fetch initial — une seule fois
  useEffect(() => {
    if (accessToken && !hasFetched.current) {
      hasFetched.current = true;
      fetchNotifications(accessToken);
    }
  }, [accessToken]); // ← accessToken suffit comme dépendance

  const handleRefresh = () => {
    if (accessToken) {
      hasFetched.current = true; // déjà fetché, on refresh manuellement
      fetchNotifications(accessToken, false);
    }
  };

  const loadMore = () => {
    if (accessToken && hasMore && !isFetchingNextPage) {
      fetchNotifications(accessToken, true);
    }
  };

  const unreadMessagesCount = useMemo(() => 
    notifications.filter(n => !n.read_at && n.type === 'new_message').length,
    [notifications]
  );

  const unreadSupportCount = useMemo(() =>
    notifications.filter(n => !n.read_at && n.type === 'support_reply').length,
    [notifications]
  );

  return {
    notifications,
    unreadCount,
    isLoading,
    isFetchingNextPage,
    hasMore,
    error,
    unreadMessagesCount,
    unreadSupportCount,
    fetchNotifications: handleRefresh,
    markAsRead:   (id: string) => accessToken && markAsRead(accessToken, id),
    markAllAsRead: ()          => accessToken && markAllAsRead(accessToken),
    removeNotificationLocally,
    loadMore,
    clearError,
  };
};