// ══════════════════════════════════════════════════════════════════════════════
// Screen — NotificationsScreen
// Displays a real-time, paginated list of user notifications.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useNotifications } from '../../hooks/useNotifications';
import NotificationCard from '../../components/NotificationCard';
import type { AuthUser, Notification } from '../../types';
import { Colors, Spacing } from '../../theme/colors';
import { useAuthStore } from '../../store/auth.store';
import type { NavigationProp } from '@react-navigation/native';

const NotificationsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<any>>();
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
    loadMore,
    clearError,
  } = useNotifications();
  const { user } = useAuthStore();
  const handleRefresh = useCallback(() => {
    clearError();
    fetchNotifications(); // Fetch first page, not load more
  }, [fetchNotifications]);

  const handleMarkAsRead = useCallback(async (id: string) => {
    try {
      await markAsRead(id);
    } catch (err) {
      Alert.alert('Erreur', (err as Error).message);
    }
  }, [markAsRead]);

  const handleMarkAllAsRead = useCallback(async () => {
    try {
      await markAllAsRead();
    } catch (err) {
      Alert.alert('Erreur', (err as Error).message);
    }
  }, [markAllAsRead]);

  const handleDeleteNotification = useCallback((id: string) => {
    Alert.alert(
      'Supprimer la notification',
      'Êtes-vous sûr de vouloir supprimer cette notification ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            // For now, client-side removal as no backend DELETE endpoint is specified.
            // A real implementation would call a backend API to delete the notification.
            removeNotificationLocally(id);
            Alert.alert('Succès', 'Notification supprimée localement.');
          },
        },
      ]
    );
  }, [removeNotificationLocally]);

  const handleViewAction = useCallback((notification: Notification) => {
    // Implement navigation logic based on notification.type and notification.data
    // Example: navigate to reservation details if data.reservation_id exists
    if (notification.type === 'reservation_confirmed' || notification.type === 'trip_assigned' || notification.type === 'trip_reminder' || notification.type === 'driver_arrived' || notification.type === 'reservation_cancelled') {
      if (notification.data?.reservation_id) {
        // Assuming a route named 'ReservationDetails' exists in your navigation stack
        // @ts-ignore - Type checking for navigation can be complex with nested navigators

        if (user?.role === 'client') {
          navigation.navigate('ReservationDetails', { reservationId: notification.data.reservation_id });
        } else { if (user?.role === 'driver') {
           navigation.navigate('DriverReservationDetails', { reservationId: notification.data.reservation_id });
          } else if (user?.role === 'admin') {
            navigation.navigate('AdminReservationDetails', { reservationId: notification.data.reservation_id });
          } else if (user?.role === 'manager') {
            navigation.navigate('ManagerReservationDetails', { reservationId: notification.data.reservation_id });
          }
        }
      } else {
        // Fallback for reservation-related types if no reservation_id
        navigation.navigate('NotificationDetails', { notification: notification });
      }
    } else if (notification.type === 'invoice_available') {
      if (notification.data?.invoice_id) {
        // @ts-ignore
        navigation.navigate('InvoiceDetails', { invoiceId: notification.data.invoice_id });
      } else {
        // Fallback for invoice-related types if no invoice_id
        navigation.navigate('NotificationDetails', { notification: notification });
      }
    } else if (notification.type === 'document_expiry') {
      // @ts-ignore
      navigation.navigate('DriverDocuments'); // Assuming a route for driver documents
    } else {
      // Default navigation for any other notification type
      navigation.navigate('NotificationDetails', { notification: notification });
    }
    // Mark as read if not already
    if (!notification.read_at) {
      handleMarkAsRead(notification.id);
    }
  }, [navigation, handleMarkAsRead]);

  const handleViewDetails = useCallback((notification: Notification) => {
    navigation.navigate('NotificationDetails', { notification: notification });
    // Mark as read if not already
    if (!notification.read_at) {
      handleMarkAsRead(notification.id);
    }
  }, [navigation, handleMarkAsRead]);

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Erreur: {error}</Text>
        {/* <TouchableOpacity onPress={clearError} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Effacer l'erreur</Text>
        </TouchableOpacity> */}
        <TouchableOpacity onPress={handleRefresh} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, ((user as AuthUser)?.role === 'client') ? {marginTop: Spacing.xl} : {}]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.headerRight}>
          {notifications.length > 0 && unreadCount > 0 && (
            <TouchableOpacity onPress={handleMarkAllAsRead} style={styles.markAllReadButton}>
              <Text style={styles.markAllReadButtonText}>Tout marquer comme lu</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      {unreadCount > 0 && (
        <Text style={styles.unreadCountText}>{unreadCount} non lue{unreadCount > 1 ? 's' : ''}</Text>
      )}

      {isLoading && notifications.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.bordeaux} />
          <Text style={styles.loadingText}>Chargement des notifications...</Text>
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>Aucune notification pour le moment.</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <NotificationCard
              notification={item}
              onMarkAsRead={handleMarkAsRead}
              onDelete={handleDeleteNotification}
              onViewAction={handleViewAction}
              onPress={handleViewDetails}
            />
          )}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={isFetchingNextPage ? <ActivityIndicator size="small" color="#3B82F6" style={styles.loader} /> : null}
          refreshControl={
            <RefreshControl refreshing={isLoading && notifications.length > 0} onRefresh={handleRefresh} />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.bordeauxLight,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unreadCountText: {
    fontSize: 14,
    color: '#6B7280',
    marginRight: 10,
    marginLeft : Spacing.md,
  },
  markAllReadButton: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
    backgroundColor: Colors.bordeauxLight,
  },
  markAllReadButtonText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '600',

  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: Colors.bordeauxDark,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginHorizontal: 20,
    marginBottom: 10,
  },
  retryButton: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 15,
    backgroundColor: '#3B82F6',
    borderRadius: 5,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  loader: {
    marginVertical: 20,
  },
});

export default NotificationsScreen;