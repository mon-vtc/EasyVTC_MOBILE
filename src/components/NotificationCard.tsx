// ══════════════════════════════════════════════════════════════════════════════
// Component — NotificationCard
// Displays a single notification with dynamic content, actions, and styling.
// ══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatRelativeTime } from '../utils/formatDate';
import type { Notification } from '../types';
import { NOTIFICATION_ICONS, NOTIFICATION_ACTION_LABELS , NotificationIconConfig} from '../types';
import { Colors, Spacing, Radius, Fonts } from '../theme/colors';

// Utilisé quand notification.type n'a pas d'entrée dans NOTIFICATION_ICONS (type inconnu/futur) —
// doit rester un objet NotificationIconConfig complet, jamais une simple chaîne, pour que
// iconConfig.icon/.color/.background restent valides plus bas.
const FALLBACK_ICON_CONFIG: NotificationIconConfig = {
  icon:       'notifications-outline',
  color:      Colors.textMuted,
  background: Colors.iconBg,
};
interface NotificationCardProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  onViewAction: (notification: Notification) => void;
  onPress: (notification: Notification) => void; // New prop for card press
}

const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  onMarkAsRead,
  onDelete,
  onViewAction,
  onPress,
}) => {
  const isRead = !!notification.read_at;
  const iconConfig = NOTIFICATION_ICONS[notification.type] || FALLBACK_ICON_CONFIG;
  const actionLabel = NOTIFICATION_ACTION_LABELS[notification.type] || 'Voir les détails';

  const timeAgo = formatRelativeTime(notification.created_at);
  return (
    // Nouvelle TouchableOpacity pour rendre toute la carte cliquable
    // Elle redirige vers l'écran de détails de la notification.
    <TouchableOpacity onPress={() => onPress(notification)} activeOpacity={0.7}>
      <View style={[styles.card, isRead ? styles.cardRead : styles.cardUnread]}>
      {!isRead && <View style={styles.unreadIndicator} />}
      
      <View style={styles.contentContainer}>
        <Text style={styles.title}>{notification.title}</Text>
        <Text style={styles.body}>{notification.body}</Text>
        <TouchableOpacity onPress={() => onViewAction(notification)} style={styles.actionButton}>
          <Text style={styles.actionButtonText}>{actionLabel}</Text>
        </TouchableOpacity>
        <View style={styles.metadataContainer}>
          <View style={[styles.iconContainer, { backgroundColor: iconConfig.background }]}>
            <Ionicons
              name={iconConfig.icon as NotificationIconConfig['icon']}
              size={20}
              color={iconConfig.color}
            />
          </View>
          <Text style={styles.timeAgo}>{timeAgo}</Text>
          {!isRead && (
            <TouchableOpacity onPress={() => onMarkAsRead(notification.id)} style={styles.secondaryActionButton}>
              <Text style={styles.secondaryActionButtonText}>Marquer lu</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => onDelete(notification.id)} style={styles.secondaryActionButton}>
            <Text style={styles.deleteActionButton}>Supprimer</Text>
          </TouchableOpacity>
        </View>
      </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    padding: 15,
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#fff',
    elevation: 1,
  },
  cardUnread: {
    borderLeftWidth: 5,
    borderLeftColor: Colors.bordeauxLight,
  },
  cardRead: {
    borderLeftWidth: 4,
    borderLeftColor: '#E5E7EB',
  },
  unreadIndicator: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.bordeauxLight,
  },
  iconContainer: {
    width: 30,
    height: 30,
    borderRadius: 22,          // cercle parfait
    marginRight: 15,
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor est appliqué inline via iconConfig.background
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontFamily: Fonts.bold, fontWeight: 'bold',
    marginBottom: 5,
    color: Colors.bordeauxLight,
  },
  body: {
    fontSize: 14,
    color: '#555',
    marginBottom: 10,
  },
  actionButton: {
    marginTop: 5,
    paddingVertical: 5,
    paddingHorizontal: 10,
    alignSelf: 'flex-start',
    borderRadius: Radius.full,
    backgroundColor: '#EFEAEA',
  },
  actionButtonText: {
    color: Colors.bordeauxLight,
    fontFamily: Fonts.bold, fontWeight: 'bold',
    fontSize: 13,
  },
  metadataContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 8,
  },
  timeAgo: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  secondaryActionButton: {
    marginLeft: Spacing.xs,
  },
  secondaryActionButtonText: {
    fontSize: 12,
    color: Colors.bordeauxLight,
    fontFamily: Fonts.regular, fontWeight: '400',
  },
  deleteActionButton: {
    fontSize: 12,
    color: 'red',
    fontFamily: Fonts.regular, fontWeight: '400',
  },
});

export default NotificationCard;