// ══════════════════════════════════════════════════════════════════════════════
// SCREEN — Admin Discussion (Supervision)
// Affiche la liste des conversations actives pour la supervision en temps réel
// ══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useMemo } from 'react';
import {
  View,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useChat } from '../../hooks/useChat';
import { useNotifications } from '../../hooks/useNotifications';
import { AppHeader } from '../../components/common/AppHeader';
import { formatRelativeTime } from '../../utils/formatDate';
import { Colors, Fonts } from '../../theme/colors';
import { Ionicons } from '@expo/vector-icons';
import type { ActiveConversation } from '../../types';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  contentContainer: {
    paddingVertical: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyIcon: {
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  conversationCard: {
    marginHorizontal: 12,
    marginVertical: 6,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: Colors.white,
    borderLeftWidth: 4,
    borderLeftColor: Colors.overlayLight,
    shadowColor: Colors.black,
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  conversationCardActive: {
    borderLeftColor: Colors.bordeauxLight, // Couleur pour les conversations avec messages non lus
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reservationId: {
    fontSize: 14,
    fontFamily: Fonts.semibold, fontWeight: '600',
    color: Colors.textPrimary,
  },
  unreadBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: Colors.bordeaux,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadText: {
    fontSize: 12,
    fontFamily: Fonts.bold, fontWeight: '700',
    color: Colors.white,
  },
  participantsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  participantBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.overlayLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  participantLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: Fonts.medium, fontWeight: '500',
  },
  participantName: {
    fontSize: 12,
    color: Colors.textPrimary,
    fontFamily: Fonts.semibold, fontWeight: '600',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  addressIcon: {
    marginTop: 2,
  },
  addressText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  lastMessageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.overlayLight,
  },
  lastMessage: {
    flex: 1,
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  timeText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.bordeaux,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 12,
    fontFamily: Fonts.semibold, fontWeight: '600',
    color: Colors.white,
  },
});

interface AdminDiscussionScreenProps {
  navigation: any;
}

export default function AdminDiscussionScreen({ navigation }: AdminDiscussionScreenProps) {
  const {
    supervisedConversations,
    supervisedConversationsTotal,
    supervisedConversationsPage,
    isLoadingSupervisedConversations,
    fetchSupervisedConversations,
    error,
    clearError,
  } = useChat();
  const { unreadCount } = useNotifications();

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async (page = 1) => {
    try {
      await fetchSupervisedConversations(page, 20);
    } catch (err) {
      console.error('Erreur chargement conversations supervision:', err);
    }
  };

  const handleRefresh = () => {
    loadConversations(1);
  };

  const handleLoadMore = () => {
    if (supervisedConversationsPage * 20 < supervisedConversationsTotal) {
      loadConversations(supervisedConversationsPage + 1);
    }
  };

  const handleViewConversation = (conversation: ActiveConversation) => {
    navigation.navigate('AdminChatScreen', {
      reservationId: conversation.reservation_id,
      conversation,
    });
  };

  const formatTimeAgo = (dateStr: string | null): string => {
    if (!dateStr) return '';
    return formatRelativeTime(dateStr);
  };

  const sortedConversations = useMemo(() => {
    return [...supervisedConversations].sort((a, b) => {
      const aTime = new Date(a.last_message_at ?? 0).getTime();
      const bTime = new Date(b.last_message_at ?? 0).getTime();
      return bTime - aTime;
    });
  }, [supervisedConversations]);

  const renderConversationCard = ({ item }: { item: ActiveConversation }) => {
    const isActive = item.unread_count > 0;

    return (
      <TouchableOpacity
        style={[styles.conversationCard, isActive && styles.conversationCardActive]}
        onPress={() => handleViewConversation(item)}
        activeOpacity={0.7}
      >
        {/* Entête : Réservation ID + Badge non-lus */}
        <View style={styles.headerRow}>
          <Text style={styles.reservationId}>
            Réservation {item.reservation_id.substring(0, 8).toUpperCase()}
          </Text>
          {item.unread_count > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unread_count}</Text>
            </View>
          )}
        </View>

        {/* Participants */}
        <View style={styles.participantsRow}>
          {item.client && (
            <View style={styles.participantBadge}>
              <Ionicons name="person-outline" size={12} color={Colors.textSecondary} />
              <Text style={styles.participantName}>
                {item.client.first_name} {item.client.last_name}
              </Text>
            </View>
          )}
          {item.driver && (
            <View style={styles.participantBadge}>
              <Ionicons name="car-outline" size={12} color={Colors.textSecondary} />
              <Text style={styles.participantName}>
                {item.driver.first_name} {item.driver.last_name}
              </Text>
            </View>
          )}
        </View>

        {/* Adresses */}
        <View style={styles.addressRow}>
          <Ionicons name="navigate-outline" size={14} color={Colors.textSecondary} style={styles.addressIcon} />
          <Text style={styles.addressText}>
            {item.pickup_address} → {item.dest_address}
          </Text>
        </View>

        {/* Dernier message + Heure + Bouton */}
        {item.last_message && (
          <View style={styles.lastMessageRow}>
            <Text numberOfLines={1} style={styles.lastMessage}>
              {item.last_message}
            </Text>
            <Text style={styles.timeText}>{formatTimeAgo(item.last_message_at)}</Text>
          </View>
        )}

        {/* Bouton d'action */}
        <TouchableOpacity
          style={[styles.actionButton, { marginTop: item.last_message ? 8 : 0 }]}
          onPress={() => handleViewConversation(item)}
        >
          <Text style={styles.actionButtonText}>Consulter</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const header = (
    <AppHeader
      left="menu"
      title="Supervision chats"
      rightIcon={{
        name: 'notifications-outline',
        onPress: () => navigation.navigate('AdminNotificationList' as never),
        badge: unreadCount,
      }}
    />
  );

  if (isLoadingSupervisedConversations && supervisedConversations.length === 0) {
    return (
      <View style={{ flex: 1 }}>
        {header}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.bordeaux} />
        </View>
      </View>
    );
  }

  if (!isLoadingSupervisedConversations && supervisedConversations.length === 0) {
    return (
      <View style={{ flex: 1 }}>
        {header}
        <View style={styles.container}>
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={48} color={Colors.textSecondary} style={styles.emptyIcon} />
            <Text style={styles.emptyText}>Aucune conversation active pour le moment</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {header}
      <FlatList
        contentContainerStyle={styles.contentContainer}
        style={styles.container}
        data={sortedConversations}
        keyExtractor={item => item.reservation_id}
        renderItem={renderConversationCard}
        refreshControl={<RefreshControl refreshing={isLoadingSupervisedConversations} onRefresh={handleRefresh} />}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          isLoadingSupervisedConversations && supervisedConversations.length > 0 ? (
            <ActivityIndicator size="small" color={Colors.bordeaux} style={{ marginVertical: 16 }} />
          ) : null
        }
      />
    </View>
  );
}
