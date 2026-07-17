// ══════════════════════════════════════════════════════════════════════════════
// SCREEN — Admin Chat (Supervision - Lecture seule)
// Affiche la conversation en lecture seule pour l'admin
// Bouton d'appel au chauffeur au lieu de zone de saisie de messages
// ══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useChat } from '../../hooks/useChat';
import { Colors, Spacing, Fonts } from '../../theme/colors';
import { Ionicons } from '@expo/vector-icons';
import type { ChatMessage, ActiveConversation } from '../../types';
import { AppHeader } from '../../components/common/AppHeader';
import { useToast } from '../../hooks/useToast';
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  header: {
    backgroundColor: Colors.bordeaux,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: Fonts.medium, fontWeight: '500',
    color: Colors.white,
    marginBottom: 0,
    marginHorizontal: Spacing.md,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.overlayLight,
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  messageBubble: {
    marginVertical: 6,
    maxWidth: '85%',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  messageFromClient: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.overlayLight,
    marginLeft: 0,
  },
  messageFromDriver: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.bordeaux,
    marginRight: 0,
  },
  messageFromAdmin: {
    alignSelf: 'flex-start',
    backgroundColor: '#E3F2FD',
    marginLeft: 16,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 18,
  },
  messageTextClient: {
    color: Colors.textPrimary,
  },
  messageTextDriver: {
    color: Colors.white,
  },
  messageTextAdmin: {
    color: Colors.textPrimary,
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  messageTimeClient: {
    color: Colors.textSecondary,
  },
  messageTimeDriver: {
    color: Colors.overlayLight,
  },
  messageTimeAdmin: {
    color: Colors.textSecondary,
  },
  messageRow: {
    marginVertical: 3,
  },
  footer: {
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.overlayLight,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  callButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 8,
  },
  callButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bordeaux,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  callButtonText: {
    fontSize: 14,
    fontFamily: Fonts.semibold, fontWeight: '600',
    color: Colors.white,
  },
  readOnlyBanner: {
    backgroundColor: '#FFF3CD',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  readOnlyText: {
    fontSize: 12,
    color: '#856404',
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  senderLabel: {
    fontSize: 10,
    fontFamily: Fonts.semibold, fontWeight: '600',
    marginBottom: 2,
  },
  senderLabelClient: {
    color: Colors.textSecondary,
  },
  senderLabelDriver: {
    color: Colors.overlayLight,
  },
  senderLabelAdmin: {
    color: Colors.textSecondary,
  },
});

interface AdminChatScreenProps {
  route: any;
  navigation: any;
}

export default function AdminChatScreen({ route, navigation }: AdminChatScreenProps) {
  const { reservationId, conversation } = route.params as {
    reservationId: string;
    conversation?: ActiveConversation;
  };
  const insets = useSafeAreaInsets();

  const { showToast } = useToast();

  const {
    activeConversationMessages,
    activeConversationMessagesPage,
    activeConversationMessagesTotalPages,
    isLoadingMessages,
    fetchMessages,
    error,
  } = useChat();
  const [loadingMore, setLoadingMore] = useState(false);
  const pageRef = useRef(1);

  const hasMoreMessages = activeConversationMessagesPage < activeConversationMessagesTotalPages;

  useEffect(() => {
    pageRef.current = 1;
    loadMessages(1);
  }, [reservationId]);

  const loadMessages = async (page: number) => {
    if (page > 1 && !hasMoreMessages) return;

    try {
      if (page === 1) {
        await fetchMessages(reservationId, page, 50, false);
        pageRef.current = page;
      } else {
        setLoadingMore(true);
        await fetchMessages(reservationId, page, 50, true);
        pageRef.current = page;
        setLoadingMore(false);
      }
    } catch (err) {
      console.error('Erreur chargement messages:', err);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (!isLoadingMessages && !loadingMore && hasMoreMessages) {
      loadMessages(activeConversationMessagesPage + 1);
    }
  };

  const handleCallDriver = useCallback(async () => {
    // La liste de conversations admin ne renvoie pas le téléphone du chauffeur pour l'instant.
    showToast({ type: 'error', title: 'Erreur', message: 'Numéro de téléphone non disponible' });
  }, [showToast]);

  const handleCallClient = useCallback(async () => {
    // La liste de conversations admin ne renvoie pas le téléphone du client pour l'instant.
    showToast({ type: 'error', title: 'Erreur', message: 'Numéro de téléphone non disponible' });
  }, [showToast]);

  const formatTime = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const getSenderLabel = (senderRole: string): string => {
    switch (senderRole) {
      case 'client':
        return 'Client';
      case 'driver':
        return 'Chauffeur';
      case 'admin':
        return 'Admin';
      default:
        return 'Utilisateur';
    }
  };

  const renderMessageItem = ({ item }: { item: ChatMessage }) => {
    const isFromDriver = item.sender_role === 'driver';
    const isFromClient = item.sender_role === 'client';
    const isFromAdmin = item.sender_role === 'admin';

    const bubbleStyle = isFromDriver ? styles.messageFromDriver : isFromClient ? styles.messageFromClient : styles.messageFromAdmin;
    const textStyle = isFromDriver ? styles.messageTextDriver : isFromClient ? styles.messageTextClient : styles.messageTextAdmin;
    const timeStyle = isFromDriver ? styles.messageTimeDriver : isFromClient ? styles.messageTimeClient : styles.messageTimeAdmin;
    const senderLabelStyle = isFromDriver ? styles.senderLabelDriver : isFromClient ? styles.senderLabelClient : styles.senderLabelAdmin;

    return (
      <View style={styles.messageRow}>
        <View style={[styles.messageBubble, bubbleStyle]}>
          {!isFromDriver && !isFromClient && (
            <Text style={[styles.senderLabel, senderLabelStyle]}>{getSenderLabel(item.sender_role)}</Text>
          )}
          <Text style={[styles.messageText, textStyle]}>{item.content}</Text>
          <Text style={[styles.messageTime, timeStyle]}>{formatTime(item.created_at)}</Text>
        </View>
      </View>
    );
  };

  if (isLoadingMessages && activeConversationMessages.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.bordeaux} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <AppHeader
        left="back"
        title={conversation ? `${conversation.client?.first_name} ${conversation.client?.last_name} - ${conversation.driver?.first_name} ${conversation.driver?.last_name}` : 'Conversation'}
        subtitle={conversation ? `${conversation.pickup_address} → ${conversation.dest_address}` : undefined}
        onBack={() => { if (navigation.canGoBack()) navigation.goBack(); }}
      />

      {/* Read-only banner */}
      {/* <View style={styles.readOnlyBanner}>
        <Ionicons name="eye-outline" size={16} color="#856404" />
        <Text style={styles.readOnlyText}>Mode supervision - Lecture seule</Text>
      </View> */}

      {/* Messages */}
      {activeConversationMessages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Aucun message</Text>
        </View>
      ) : (
        <FlatList
          style={styles.messagesList}
          data={activeConversationMessages}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          renderItem={renderMessageItem}
          inverted
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore ? <ActivityIndicator size="small" color={Colors.bordeaux} style={{ marginVertical: 8 }} /> : null
          }
        />
      )}

      {/* Footer with call buttons */}
      <View style={[styles.footer, { paddingBottom: styles.footer.paddingVertical + insets.bottom }]}>
        <View style={styles.callButtonContainer}>
          <TouchableOpacity style={styles.callButton} onPress={handleCallDriver}>
            <Ionicons name="call" size={18} color={Colors.white} />
            <Text style={styles.callButtonText}>Appeler chauffeur</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.callButton} onPress={handleCallClient}>
            <Ionicons name="call" size={18} color={Colors.white} />
            <Text style={styles.callButtonText}>Appeler client</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
