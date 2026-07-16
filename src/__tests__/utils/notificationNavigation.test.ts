/**
 * Tests unitaires — navigateFromNotification (src/utils/notificationNavigation.ts)
 *
 * Couvre le routage d'une notification (push tapée ou bouton "Voir" dans la liste)
 * vers l'écran cible, pour les 4 rôles (client/driver/admin/manager) et tous les
 * types de notification gérés, y compris les 3 rappels chauffeur
 * (driver_reminder_24h/2h/30min) qui doivent désormais deep-linker directement
 * vers la réservation, comme trip_reminder côté client.
 *
 * Mock : navigate (src/navigation/navigationRef.ts)
 */

jest.mock('../../navigation/navigationRef', () => ({
  navigate: jest.fn(),
}));

import { navigate } from '../../navigation/navigationRef';
import { navigateFromNotification } from '../../utils/notificationNavigation';
import type { Notification, NotificationType, UserRole } from '../../types';

const mockNavigate = navigate as jest.MockedFunction<typeof navigate>;

// ── Helper ───────────────────────────────────────────────────────
function makeNotification(
  type: NotificationType,
  data: Record<string, string> | null = null,
): Notification {
  return {
    id: 'notif-1',
    user_id: 'user-1',
    type,
    channel: 'push',
    status: 'sent',
    title: 'Titre',
    body: 'Corps',
    data,
    read_at: null,
    sent_at: new Date().toISOString(),
    error_log: null,
    created_at: new Date().toISOString(),
  };
}

beforeEach(() => {
  mockNavigate.mockClear();
});

// ── Types "réservation" : reservation_confirmed / trip_assigned / trip_reminder /
//    driver_arrived / reservation_cancelled / driver_reminder_24h / _2h / _30min ──
describe('navigateFromNotification — types réservation', () => {
  const RESERVATION_TYPES: NotificationType[] = [
    'reservation_confirmed',
    'trip_assigned',
    'trip_reminder',
    'driver_arrived',
    'reservation_cancelled',
    'driver_reminder_24h',
    'driver_reminder_2h',
    'driver_reminder_30min',
  ];

  it.each(RESERVATION_TYPES)('%s sans reservation_id → NotificationDetails', (type) => {
    const notification = makeNotification(type, null);
    navigateFromNotification(notification, 'client');

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('NotificationDetails', { notification });
  });

  it.each(RESERVATION_TYPES)('%s avec reservation_id, rôle client → ReservationDetails', (type) => {
    const notification = makeNotification(type, { reservation_id: 'resa-42' });
    navigateFromNotification(notification, 'client');

    expect(mockNavigate).toHaveBeenCalledWith('ReservationDetails', { reservationId: 'resa-42' });
  });

  it.each(RESERVATION_TYPES)('%s avec reservation_id, rôle undefined → ReservationDetails (défaut client)', (type) => {
    const notification = makeNotification(type, { reservation_id: 'resa-42' });
    navigateFromNotification(notification, undefined);

    expect(mockNavigate).toHaveBeenCalledWith('ReservationDetails', { reservationId: 'resa-42' });
  });

  // Les 3 rappels chauffeur sont le cœur du correctif : ils doivent désormais
  // atterrir directement sur la course du chauffeur, pas sur l'écran générique.
  const DRIVER_REMINDER_TYPES: NotificationType[] = [
    'driver_reminder_24h',
    'driver_reminder_2h',
    'driver_reminder_30min',
  ];

  // Driver/admin/manager sont un Stack racine ('XxxMain') qui enveloppe un
  // Drawer — les écrans du Drawer ('DriverNotifications', 'AdminReservations'...)
  // ne sont pas visibles depuis la racine sans repasser explicitement par
  // 'XxxMain' (voir notificationNavigation.ts, ROOT_SCREEN).
  it.each(DRIVER_REMINDER_TYPES)('%s avec reservation_id, rôle driver → DriverReservationDetails imbriqué sous DriverMain', (type) => {
    const notification = makeNotification(type, { reservation_id: 'resa-42' });
    navigateFromNotification(notification, 'driver');

    expect(mockNavigate).toHaveBeenCalledWith('DriverMain', {
      screen: 'DriverNotifications',
      params: { screen: 'DriverReservationDetails', params: { reservationId: 'resa-42' } },
    });
  });

  it('trip_reminder avec reservation_id, rôle admin → AdminReservationDetail imbriqué sous AdminMain', () => {
    const notification = makeNotification('trip_reminder', { reservation_id: 'resa-42' });
    navigateFromNotification(notification, 'admin');

    expect(mockNavigate).toHaveBeenCalledWith('AdminMain', {
      screen: 'AdminReservations',
      params: { screen: 'AdminReservationDetail', params: { reservationId: 'resa-42' } },
    });
  });

  it('trip_reminder avec reservation_id, rôle manager → ManagerReservationDetail imbriqué sous ManagerMain', () => {
    const notification = makeNotification('trip_reminder', { reservation_id: 'resa-42' });
    navigateFromNotification(notification, 'manager');

    expect(mockNavigate).toHaveBeenCalledWith('ManagerMain', {
      screen: 'ManagerReservations',
      params: { screen: 'ManagerReservationDetail', params: { reservationId: 'resa-42' } },
    });
  });
});

// ── invoice_available ──────────────────────────────────────────────
describe('navigateFromNotification — invoice_available', () => {
  it('sans invoice_id → NotificationDetails', () => {
    const notification = makeNotification('invoice_available', null);
    navigateFromNotification(notification, 'client');

    expect(mockNavigate).toHaveBeenCalledWith('NotificationDetails', { notification });
  });

  it('avec invoice_id, rôle client → InvoiceDetails', () => {
    const notification = makeNotification('invoice_available', { invoice_id: 'inv-7' });
    navigateFromNotification(notification, 'client');

    expect(mockNavigate).toHaveBeenCalledWith('InvoiceDetails', { invoiceId: 'inv-7' });
  });

  it('avec invoice_id, rôle driver → DriverInvoiceDetails imbriqué sous DriverMain', () => {
    const notification = makeNotification('invoice_available', { invoice_id: 'inv-7' });
    navigateFromNotification(notification, 'driver');

    expect(mockNavigate).toHaveBeenCalledWith('DriverMain', {
      screen: 'DriverInvoices',
      params: { screen: 'DriverInvoiceDetails', params: { invoiceId: 'inv-7' } },
    });
  });

  it('avec invoice_id, rôle admin → InvoiceDetails imbriqué sous AdminMain > AdminInvoices', () => {
    const notification = makeNotification('invoice_available', { invoice_id: 'inv-7' });
    navigateFromNotification(notification, 'admin');

    expect(mockNavigate).toHaveBeenCalledWith('AdminMain', {
      screen: 'AdminInvoices',
      params: { screen: 'InvoiceDetails', params: { invoiceId: 'inv-7' } },
    });
  });

  it('avec invoice_id, rôle manager → InvoiceDetails imbriqué sous ManagerMain > ManagerInvoices', () => {
    const notification = makeNotification('invoice_available', { invoice_id: 'inv-7' });
    navigateFromNotification(notification, 'manager');

    expect(mockNavigate).toHaveBeenCalledWith('ManagerMain', {
      screen: 'ManagerInvoices',
      params: { screen: 'InvoiceDetails', params: { invoiceId: 'inv-7' } },
    });
  });
});

// ── document_expiry ────────────────────────────────────────────────
describe('navigateFromNotification — document_expiry', () => {
  // Ce type ne porte ni reservation_id ni invoice_id (seulement document_id) :
  // shipToRole() tombe donc toujours sur la route "liste documents" du rôle.
  it('rôle driver → DriverDocuments imbriqué sous DriverMain', () => {
    const notification = makeNotification('document_expiry', { document_id: 'doc-1' });
    navigateFromNotification(notification, 'driver');

    expect(mockNavigate).toHaveBeenCalledWith('DriverMain', { screen: 'DriverDocuments', params: undefined });
  });

  it('rôle admin → AdminDocuments imbriqué sous AdminMain', () => {
    const notification = makeNotification('document_expiry', { document_id: 'doc-1' });
    navigateFromNotification(notification, 'admin');

    expect(mockNavigate).toHaveBeenCalledWith('AdminMain', { screen: 'AdminDocuments', params: undefined });
  });

  it('rôle manager → ManagerDocuments imbriqué sous ManagerMain', () => {
    const notification = makeNotification('document_expiry', { document_id: 'doc-1' });
    navigateFromNotification(notification, 'manager');

    expect(mockNavigate).toHaveBeenCalledWith('ManagerMain', { screen: 'ManagerDocuments', params: undefined });
  });

  // Cas limite documenté : un document_expiry ne devrait jamais être envoyé à un
  // client (les documents appartiennent aux chauffeurs), mais si c'était le cas,
  // shipToRole() ne trouve aucune route et ne navigue nulle part.
  it('rôle client (cas limite) → aucune navigation déclenchée', () => {
    const notification = makeNotification('document_expiry', { document_id: 'doc-1' });
    navigateFromNotification(notification, 'client');

    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

// ── new_message ─────────────────────────────────────────────────────
describe('navigateFromNotification — new_message', () => {
  it('avec reservation_id → ChatScreen', () => {
    const notification = makeNotification('new_message', { reservation_id: 'resa-9' });
    navigateFromNotification(notification, 'client');

    expect(mockNavigate).toHaveBeenCalledWith('ChatScreen', { reservationId: 'resa-9' });
  });

  it('sans reservation_id → NotificationDetails', () => {
    const notification = makeNotification('new_message', null);
    navigateFromNotification(notification, 'client');

    expect(mockNavigate).toHaveBeenCalledWith('NotificationDetails', { notification });
  });

  it('avec reservation_id, rôle driver → ChatScreen imbriqué sous DriverMain > DriverMessages', () => {
    const notification = makeNotification('new_message', { reservation_id: 'resa-9' });
    navigateFromNotification(notification, 'driver');

    expect(mockNavigate).toHaveBeenCalledWith('DriverMain', {
      screen: 'DriverMessages',
      params: { screen: 'ChatScreen', params: { reservationId: 'resa-9' } },
    });
  });

  it('avec reservation_id, rôle admin → AdminChatScreen imbriqué sous AdminMain > AdminDiscussions', () => {
    const notification = makeNotification('new_message', { reservation_id: 'resa-9' });
    navigateFromNotification(notification, 'admin');

    expect(mockNavigate).toHaveBeenCalledWith('AdminMain', {
      screen: 'AdminDiscussions',
      params: { screen: 'AdminChatScreen', params: { reservationId: 'resa-9' } },
    });
  });
});

// ── support_reply ───────────────────────────────────────────────────
describe('navigateFromNotification — support_reply', () => {
  it('avec ticket_id et subject → SupportChat avec le sujet fourni', () => {
    const notification = makeNotification('support_reply', {
      ticket_id: 'ticket-3',
      subject:   'Problème de paiement',
    });
    navigateFromNotification(notification, 'client');

    expect(mockNavigate).toHaveBeenCalledWith('SupportChat', {
      ticketId: 'ticket-3',
      subject:  'Problème de paiement',
    });
  });

  it('avec ticket_id sans subject → SupportChat avec le sujet par défaut', () => {
    const notification = makeNotification('support_reply', { ticket_id: 'ticket-3' });
    navigateFromNotification(notification, 'client');

    expect(mockNavigate).toHaveBeenCalledWith('SupportChat', {
      ticketId: 'ticket-3',
      subject:  'Ticket de support',
    });
  });

  it('sans ticket_id → NotificationDetails', () => {
    const notification = makeNotification('support_reply', null);
    navigateFromNotification(notification, 'client');

    expect(mockNavigate).toHaveBeenCalledWith('NotificationDetails', { notification });
  });

  it('avec ticket_id, rôle driver → SupportChat imbriqué sous DriverMain > DriverSupport', () => {
    const notification = makeNotification('support_reply', { ticket_id: 'ticket-3' });
    navigateFromNotification(notification, 'driver');

    expect(mockNavigate).toHaveBeenCalledWith('DriverMain', {
      screen: 'DriverSupport',
      params: { screen: 'SupportChat', params: { ticketId: 'ticket-3', subject: 'Ticket de support' } },
    });
  });

  it('avec ticket_id, rôle admin → SupportChat imbriqué sous AdminMain > AdminSupport', () => {
    const notification = makeNotification('support_reply', { ticket_id: 'ticket-3' });
    navigateFromNotification(notification, 'admin');

    expect(mockNavigate).toHaveBeenCalledWith('AdminMain', {
      screen: 'AdminSupport',
      params: { screen: 'SupportChat', params: { ticketId: 'ticket-3', subject: 'Ticket de support' } },
    });
  });
});

// ── Types sans navigation dédiée (digests admin, type inconnu) ──────
describe('navigateFromNotification — types par défaut', () => {
  const DEFAULT_TYPES: NotificationType[] = ['new_document_admin', 'weekly_digest_admin', 'new_reservation_admin'];

  it.each(DEFAULT_TYPES)('%s → NotificationDetails (pas de cible unique)', (type) => {
    const notification = makeNotification(type, null);
    navigateFromNotification(notification, 'admin');

    expect(mockNavigate).toHaveBeenCalledWith('NotificationDetails', { notification });
  });

  it('type totalement inconnu → NotificationDetails (repli sûr)', () => {
    const notification = makeNotification('type_futur_non_gere' as NotificationType, null);
    navigateFromNotification(notification, 'client');

    expect(mockNavigate).toHaveBeenCalledWith('NotificationDetails', { notification });
  });
});
