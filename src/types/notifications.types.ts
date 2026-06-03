// ══════════════════════════════════════════════════════════════════════════════
// TYPES — Module Notifications (Frontend Specific)
// ══════════════════════════════════════════════════════════════════════════════

import {
  Notification as BackendNotification,
  NotificationType as BackendNotificationType,
  NotificationListFilters as BackendNotificationListFilters,
} from './notifications.back.types';
import { AppIconProps } from './app-icon-props.types';
import { Colors } from '../theme/colors';

// Re-export backend types for convenience
export type Notification = BackendNotification;
export type NotificationType = BackendNotificationType;
export type NotificationListFilters = BackendNotificationListFilters;

// // Frontend-specific types for UI
// export type NotificationIconMap = Record<NotificationType, AppIconProps['name']>;
export type NotificationActionLabelMap = Record<NotificationType, string>;

// // Define the icon mapping based on the specification
// export const NOTIFICATION_ICONS: NotificationIconMap = {
//   reservation_confirmed: 'checkmark-circle', // Spec: ride_created (check vert)
//   trip_reminder:         'time',             // Spec: ride_reminder (horloge orange)
//   driver_arrived:        'person',           // Spec: client_waiting (utilisateur bleu)
//   invoice_available:     'document-text',    // Spec: invoice_available (document gris)
//   trip_assigned:         'car',              // Spec: Nouvelle course (chauffeur)
//   reservation_cancelled: 'close-circle',     // Spec: course annulée
//   document_expiry:       'warning',          // Spec: warning (document expiry)
//   new_reservation_admin: 'briefcase',        // Admin: nouvelle réservation à traiter
// };
// ══════════════════════════════════════════════════════════════════════════════
// Notification icon config — icône + couleur + background par type
// ══════════════════════════════════════════════════════════════════════════════

export type NotificationIconConfig = {
  icon: AppIconProps['name'];
  color: string;
  background: string;
};

export type NotificationIconMap = Record<string, NotificationIconConfig>;

export const NOTIFICATION_ICONS: NotificationIconMap = {
  reservation_confirmed: {
    icon:       'checkmark-circle',
    color:      '#22C55E',   // vert confirmé
    background: '#DCFCE7',
  },
  trip_reminder: {
    icon:       'time',
    color:      '#F97316',   // orange rappel
    background: '#FEF3C7',
  },
  driver_arrived: {
    icon:       'car',
    color:      '#3B82F6',   // bleu chauffeur en approche
    background: '#DBEAFE',
  },
  invoice_available: {
    icon:       'document-text',
    color:      '#6B7280',   // gris document
    background: '#F3F4F6',
  },
  trip_assigned: {
    icon:       'car',
    color:      Colors.bordeauxLight,
    background: '#EFEAEA',
  },
  reservation_cancelled: {
    icon:       'close-circle',
    color:      '#EF4444',   // rouge annulation
    background: '#FEE2E2',
  },
  document_expiry: {
    icon:       'warning',
    color:      '#EAB308',   // ambre avertissement
    background: '#FEF9C3',
  },
  new_reservation_admin: {
    icon:       'briefcase',
    color:      Colors.bordeauxLight,
    background: '#EFEAEA',
  },
  new_message : {
    icon: 'mail',
    color: Colors.bordeauxLight,
    background: '#EFEAEA',
  
  } ,    // Destinataire : nouveau message reçu dans le chat course
  support_reply: {
    icon : 'mail-sharp',
    color: Colors.bordeauxLight,
    background: '#EFEAEA'
  }

};

// Define action labels for buttons
export const NOTIFICATION_ACTION_LABELS: NotificationActionLabelMap = {
  reservation_confirmed: 'Voir la course',
  trip_reminder:         'Voir la course',
  driver_arrived:        'Voir la course',
  invoice_available:     'Voir la facture',
  trip_assigned:         'Voir la course',
  reservation_cancelled: 'Voir la course',
  document_expiry:       'Voir les documents',
  new_reservation_admin: 'Traiter la réservation',
  support_reply: 'Voir la réponse',
  new_message: 'Voir le message',
};

// Frontend-specific payload for real-time notifications
// This mirrors the Notification interface but is explicitly for Socket.IO payloads
// to ensure consistency with what the backend emits.
export interface RealtimeNotificationPayload {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, string>;
  read_at: string | null;
  created_at: string;
}