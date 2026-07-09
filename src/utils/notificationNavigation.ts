// ══════════════════════════════════════════════════════════════════════════════
// Résolution du routage d'une notification vers l'écran cible.
// Miroir de la logique `handleViewAction` de NotificationsScreen.tsx, mais
// utilisable en dehors de l'arbre React (ex: tap sur une notification push)
// via la navigationRef globale.
// ══════════════════════════════════════════════════════════════════════════════

import { navigate } from '../navigation/navigationRef';
import type { Notification, UserRole } from '../types';

export function navigateFromNotification(notification: Notification, role: UserRole | undefined): void {
  const reservationId = notification.data?.reservation_id;
  const invoiceId      = notification.data?.invoice_id;
  const ticketId       = notification.data?.ticket_id;
  const subject        = notification.data?.subject;

  const navigateToNested = (route: string, nested: { screen: string; params: Record<string, unknown> }) => {
    navigate(route, nested as object);
  };

  const shipToRole = (): boolean => {
    switch (role) {
      case 'driver':
        if (reservationId) {
          navigateToNested('DriverNotifications', { screen: 'DriverReservationDetails', params: { reservationId } });
          return true;
        }
        if (invoiceId) {
          navigateToNested('DriverInvoices', { screen: 'DriverInvoiceDetails', params: { invoiceId } });
          return true;
        }
        navigate('DriverDocuments');
        return true;

      case 'admin':
        if (reservationId) {
          navigateToNested('AdminReservations', { screen: 'AdminReservationDetail', params: { reservationId } });
          return true;
        }
        if (invoiceId) {
          navigateToNested('AdminInvoices', { screen: 'InvoiceDetails', params: { invoiceId } });
          return true;
        }
        navigate('AdminDocuments');
        return true;

      case 'manager':
        if (reservationId) {
          navigateToNested('ManagerReservations', { screen: 'ManagerReservationDetail', params: { reservationId } });
          return true;
        }
        if (invoiceId) {
          navigateToNested('ManagerInvoices', { screen: 'InvoiceDetails', params: { invoiceId } });
          return true;
        }
        navigate('ManagerDocuments');
        return true;

      case 'client':
      default:
        if (reservationId) {
          navigate('ReservationDetails', { reservationId });
          return true;
        }
        if (invoiceId) {
          navigate('InvoiceDetails', { invoiceId });
          return true;
        }
        return false;
    }
  };

  if (
    notification.type === 'reservation_confirmed' ||
    notification.type === 'trip_assigned' ||
    notification.type === 'trip_reminder' ||
    notification.type === 'driver_arrived' ||
    notification.type === 'reservation_cancelled'
  ) {
    if (!reservationId) {
      navigate('NotificationDetails', { notification });
    } else {
      shipToRole();
    }
    return;
  }

  if (notification.type === 'invoice_available') {
    if (!invoiceId) {
      navigate('NotificationDetails', { notification });
    } else {
      shipToRole();
    }
    return;
  }

  if (notification.type === 'document_expiry') {
    shipToRole();
    return;
  }

  switch (notification.type) {
    case 'new_message':
      if (reservationId) {
        navigate('ChatScreen', { reservationId });
      } else {
        navigate('NotificationDetails', { notification });
      }
      break;

    case 'support_reply':
      if (ticketId) {
        navigate('SupportChat', { ticketId, subject: subject ?? 'Ticket de support' });
      } else {
        navigate('NotificationDetails', { notification });
      }
      break;

    default:
      navigate('NotificationDetails', { notification });
      break;
  }
}
