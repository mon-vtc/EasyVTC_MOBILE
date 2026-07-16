// ══════════════════════════════════════════════════════════════════════════════
// Résolution du routage d'une notification vers l'écran cible.
// Miroir de la logique `handleViewAction` de NotificationsScreen.tsx, mais
// utilisable en dehors de l'arbre React (ex: tap sur une notification push)
// via la navigationRef globale.
// ══════════════════════════════════════════════════════════════════════════════

import { navigate } from '../navigation/navigationRef';
import type { Notification, UserRole } from '../types';

// Écran racine (Stack) qui enveloppe le Drawer de chaque rôle — voir
// {Driver,Admin,Manager}Navigator.tsx : le RootStack de chaque navigator
// n'expose que ce seul nom ('XxxMain'), le Drawer lui-même (avec ses écrans
// 'DriverDocuments', 'AdminReservations', etc.) est imbriqué un niveau plus
// bas. Un navigate() déclenché depuis la navigationRef globale (tap sur une
// notification push, hors de l'arbre React) part toujours de ce niveau
// racine, donc il faut repasser par 'XxxMain' avant de cibler un écran du
// Drawer — sinon React Navigation lève "action NAVIGATE not handled by any
// navigator" (le nom du Drawer n'existe pas au niveau racine).
const ROOT_SCREEN: Partial<Record<UserRole, string>> = {
  driver:  'DriverMain',
  admin:   'AdminMain',
  manager: 'ManagerMain',
};

export function navigateFromNotification(notification: Notification, role: UserRole | undefined): void {
  const reservationId = notification.data?.reservation_id;
  const invoiceId      = notification.data?.invoice_id;
  const ticketId       = notification.data?.ticket_id;
  const subject        = notification.data?.subject;

  const rootScreen = role ? ROOT_SCREEN[role] : undefined;

  // Navigue vers un écran du Drawer (`drawerScreen`), optionnellement en ciblant
  // un écran précis de son Stack imbriqué (`nested`).
  const navigateToNested = (drawerScreen: string, nested?: { screen: string; params: Record<string, unknown> }) => {
    if (rootScreen) {
      navigate(rootScreen, { screen: drawerScreen, params: nested } as object);
    } else {
      navigate(drawerScreen, nested as object);
    }
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
        navigateToNested('DriverDocuments');
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
        navigateToNested('AdminDocuments');
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
        navigateToNested('ManagerDocuments');
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
    notification.type === 'reservation_cancelled' ||
    notification.type === 'driver_reminder_24h' ||
    notification.type === 'driver_reminder_2h' ||
    notification.type === 'driver_reminder_30min'
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
      if (reservationId && role === 'driver') {
        navigateToNested('DriverMessages', { screen: 'ChatScreen', params: { reservationId } });
      } else if (reservationId && role === 'admin') {
        navigateToNested('AdminDiscussions', { screen: 'AdminChatScreen', params: { reservationId } });
      } else if (reservationId && (!role || role === 'client')) {
        navigate('ChatScreen', { reservationId });
      } else {
        navigate('NotificationDetails', { notification });
      }
      break;

    case 'support_reply':
      if (ticketId && role === 'driver') {
        navigateToNested('DriverSupport', { screen: 'SupportChat', params: { ticketId, subject: subject ?? 'Ticket de support' } });
      } else if (ticketId && role === 'admin') {
        navigateToNested('AdminSupport', { screen: 'SupportChat', params: { ticketId, subject: subject ?? 'Ticket de support' } });
      } else if (ticketId && (!role || role === 'client')) {
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
