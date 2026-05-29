import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useChat } from '../../hooks/useChat';
import { useAuth } from '../../hooks/useAuth';
import { Colors, Fonts, Spacing } from '../../theme/colors';
import { AppIcon } from '../../components/common/AppIcon'; 
import type { ConversationSummary } from '../../types/chats.type';

// ─────────────────────────────────────────────────────────────────────────────
// ConversationCard
// ─────────────────────────────────────────────────────────────────────────────

interface ConversationCardProps {
  conversation: ConversationSummary;
  onPress: () => void;
}

function ConversationCard({ conversation, onPress }: ConversationCardProps) {
  const { other_party, last_message, unread_count } = conversation;

  const recipientName = other_party
    ? `${other_party.first_name} ${other_party.last_name}`
    : 'Interlocuteur inconnu';

  const timeAgo = last_message?.created_at
    ? new Date(last_message.created_at).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {/* Avatar */}
      <View style={styles.avatar}>
        {other_party?.profile_photo_url  ? (
          <Image
            source={{ uri: other_party.profile_photo_url }}
            style={styles.avatarImage}
          />
        ) : 
            <AppIcon
              name={other_party?.role === 'driver' ? 'car-sport-outline' : 'person-outline'}
              size={24}
              color={Colors.textSecondary}
            />
        }
        
      </View>

      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.name} numberOfLines={1}>
            {recipientName}
          </Text>
          <Text style={styles.time}>{timeAgo}</Text>
        </View>

        <View style={styles.messageRow}>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {last_message?.content ?? 'Aucun message'}
          </Text>
          {unread_count > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{unread_count}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DriverMessagesScreen
// ─────────────────────────────────────────────────────────────────────────────

export default function DriverMessagesScreen({ navigation }: any) {
  const { user } = useAuth();
  const { conversations, isLoadingConversations, fetchConversations } = useChat();
  
  useFocusEffect(
    React.useCallback(() => {
      if (user?.role) fetchConversations();
    }, [fetchConversations, user?.role]),
  );

  if (isLoadingConversations && conversations.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.bordeaux} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <AppIcon name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Messages</Text>
        
      </View>
      <FlatList
        data={conversations}
        keyExtractor={item => item.reservation_id}
        renderItem={({ item }) => (
          <ConversationCard
            conversation={item}
            onPress={() =>
              navigation.navigate('ChatScreen', {
                reservationId: item.reservation_id,
              })
            }
          />
        )}
        ListEmptyComponent={
          <View style={styles.centered}>
            <AppIcon name="chatbubbles-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyText}>Aucune conversation</Text>
          </View>
        }
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: '50%',
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.bordeaux, paddingTop: Platform.OS === 'ios' ? 56 : Spacing.xl + 8, paddingBottom: Spacing.md, paddingHorizontal: Spacing.md },
  headerBtn: { padding: Spacing.sm, width: 40 },
  headerTitle: { color: Colors.white, fontWeight: '800', fontSize: Fonts.size.lg },
  
  list: {
    padding: Spacing.md,
  },
  emptyText: {
    marginTop: Spacing.md,
    fontSize: Fonts.size.md,
    color: Colors.textMuted,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  avatarImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  content: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: Fonts.size.md,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  time: {
    fontSize: Fonts.size.xs,
    color: Colors.textMuted,
  },
  messageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: Fonts.size.sm,
    color: Colors.textSecondary,
    flex: 1,
  },
  unreadBadge: {
    backgroundColor: Colors.bordeaux,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginLeft: Spacing.sm,
  },
  unreadText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: 'bold',
  },
});