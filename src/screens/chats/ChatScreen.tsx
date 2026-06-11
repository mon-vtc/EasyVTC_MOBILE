// ══════════════════════════════════════════════════════════════════════════════
// SCREEN — CHAT SCREEN (from scratch, no gifted-chat)
// ══════════════════════════════════════════════════════════════════════════════
import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform,
  ActivityIndicator, Image
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { useChat } from '../../hooks/useChat';
import { useReservation } from '../../hooks/useReservation';
import { useAuth } from '../../hooks/useAuth';
import { Colors, Fonts, Spacing } from '../../theme/colors';
import { AppIcon } from '../../components/common/AppIcon';
import type { ChatMessage } from '../../types/chats.type';


type ChatScreenRouteProp = RouteProp<
  { ChatScreen: { reservationId?: string } },
  'ChatScreen'
>;

// ─────────────────────────────────────────────────────────────────────────────
// MessageBubble
// ─────────────────────────────────────────────────────────────────────────────
interface BubbleProps {
  message: ChatMessage;
  isOwn: boolean;
}

function MessageBubble({ message, isOwn }: BubbleProps) {
  const time = new Date(message.created_at).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={[b.row, isOwn ? b.rowRight : b.rowLeft, {elevation: 1, shadowColor: Colors.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2}]}>
      <View style={[b.bubble, isOwn ? b.bubbleOwn : b.bubbleOther]}>
        <Text style={[b.text, isOwn ? b.textOwn : b.textOther]}>
          {message.content}
        </Text>
        <Text style={[b.time, isOwn ? b.timeOwn : b.timeOther]}>
          {time}
          {isOwn && (
            <Text> {message.read_at ? ' ✓✓' : ' ✓'}</Text>
          )}
        </Text>
      </View>
    </View>
  );
}

const b = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginVertical: 3,
    paddingHorizontal: 12,
  },
  rowRight: { justifyContent: 'flex-end' },
  rowLeft:  { justifyContent: 'flex-start' },
  bubble: {
    maxWidth: '75%',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
  },
  bubbleOwn: {
    backgroundColor: Colors.bordeaux,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: Colors.surface,
    borderBottomLeftRadius: 4,
  },
  text: {
    fontSize: 15,
    lineHeight: 20,
  },
  textOwn:   { color: Colors.white },
  textOther: { color: Colors.textPrimary },
  time: {
    fontSize: 11,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  timeOwn:   { color: Colors.white + 'AA' },
  timeOther: { color: Colors.textMuted },
});

// ─────────────────────────────────────────────────────────────────────────────
// ChatScreen
// ─────────────────────────────────────────────────────────────────────────────
export default function ChatScreen({navigation}: any) {
  const route = useRoute<ChatScreenRouteProp>();
  const { reservationId } = route.params!;
  const { user } = useAuth();
  const {
    isLoadingMessages,
    activeConversationMessages,
    fetchMessages,
    sendMessage,
    addMessageOptimistically,
    resetMessages
  } = useChat();

  const [text, setText]       = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef           = useRef<FlatList>(null);

  const { reservations, selected, fetchById } = useReservation();
  const reservation = selected?.id === reservationId
    ? selected
    : reservations.find(r => r.id === reservationId);
  const driver = reservation?.driver ?? null;

  useEffect(() => {
    if (reservationId) {
      fetchMessages(reservationId);
      // Si la réservation n'est pas dans le store, on la charge
      if (!reservation) {
        fetchById(reservationId).catch(console.error);
      }
    }
  }, [reservationId, fetchMessages]);

  // Scroll to bottom quand les messages changent
  useEffect(() => {
    if (activeConversationMessages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [activeConversationMessages.length]);

  const handleSend = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    setText('');
    setSending(true);

    const optimisticMessage: ChatMessage = {
      id: Math.random().toString(),
      reservation_id: reservationId! ,
      sender_id: user!.id,
      sender_role: user!.role,
      content: trimmed,
      created_at: new Date().toISOString(),
      read_at: null,
    };
    addMessageOptimistically(optimisticMessage);

    try {
      await sendMessage(reservationId!, trimmed);
    } finally {
      setSending(false);
    }
  }, [text, sending, reservationId, user, addMessageOptimistically, sendMessage]);

  // Séparateurs de date
  const renderItem = useCallback(({ item, index }: { item: ChatMessage; index: number }) => {
    const isOwn = item.sender_id === user!.id;
    const showDate =
      index === 0 ||
      new Date(item.created_at).toDateString() !==
      new Date(activeConversationMessages[index - 1].created_at).toDateString();

    return (
      <View>
        {showDate && (
          <View style={s.dateSeparator}>
            <Text style={s.dateSeparatorText}>
              {new Date(item.created_at).toLocaleDateString('fr-FR', {
                weekday: 'long', day: 'numeric', month: 'long',
              })}
            </Text>
          </View>
        )}
        <MessageBubble message={item} isOwn={isOwn} />
      </View>
    );
  }, [activeConversationMessages, user]);

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >

      {/* ── Header ── */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => {
          resetMessages();
          navigation.goBack();
        }} style={s.headerBtn}>
          <AppIcon name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>

        <View style={s.headerCenter}>
          {user?.role !== 'driver' && driver ?  (
            <>
              <View style={s.avatarContainer}>
                {driver.user.profile_photo_url ? (
                  <Image source={{ uri: driver.user.profile_photo_url }} style={s.avatar} />
                ) : (
                  <View style={s.avatar}><AppIcon name="person-outline" size={20} color={Colors.bordeaux} /></View>
                )}
                <View style={[s.statusIndicator, driver.is_online ? s.statusOnline : s.statusOffline]} />
              </View>
              <View>
                <Text style={s.driverName} numberOfLines={1}>
                  {driver.user.first_name} {driver.user.last_name}
                </Text>
                <Text style={s.driverStatus}>
                  {driver.is_online ? 'En ligne' : 'Hors ligne'}
                </Text>
              </View>
            </>
          ) : 
            <>
              <View style={s.avatarContainer}>
                <View style={s.avatar}>
                  {/* You can use an <Image> component here if you have the driver's avatar URL */}
                  {reservation?.client?.profile_photo_url ? (
                    <Image source={{ uri: reservation?.client?.profile_photo_url }} style={s.avatar} />

                  ) : (
                    <AppIcon name="person-outline" size={20} color={Colors.bordeaux} />
                  )
                  }
                </View>
              </View>
              <View>
                <Text style={s.driverName} numberOfLines={1}>
                  {reservation?.client?.first_name} {reservation?.client?.last_name}
                </Text>
              </View>
            </>

          }
        </View>

        <TouchableOpacity 
          style={[s.headerBtn, s.callBtn]}
          onPress={() => {
            {user?.role === 'driver' ?  (
              alert(`Appeler ${reservation?.client?.phone}`)
            ) : 
            (
              alert(`Appeler ${driver?.user.phone}`)
            )
            }
          }}
        >
          <AppIcon name="call-outline" size={22} color={Colors.white} />
        </TouchableOpacity>
      </View>
      {/* Loader pendant que la réservation charge (si elle n'était pas dans le store) */}
      {/* {!reservation && isLoadingMessages && (
        <View style={s.centered}>
          <ActivityIndicator size="large" color={Colors.bordeaux} />
        </View>
      )} */}

      {/* ── Liste messages ── */}
      {isLoadingMessages && activeConversationMessages.length === 0 && !reservation ? (
        <View style={s.centered}>
          <ActivityIndicator size="large" color={Colors.bordeaux} />
        </View>
      ) : (
      <FlatList
        ref={flatListRef}
        data={activeConversationMessages}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={s.messagesList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={s.empty}>
            <AppIcon name="chatbubbles-outline" size={48} color={Colors.textMuted} />
            <Text style={s.emptyText}>Commencez la conversation</Text>
          </View>
        }
      />
      )}

      {/* ── Input ── */}
      <View style={s.inputRow}>
        <TextInput
          style={s.input}
          value={text}
          onChangeText={setText}
          placeholder="Votre message..."
          placeholderTextColor={Colors.textMuted}
          multiline
          maxLength={1000}
          onSubmitEditing={handleSend}
          blurOnSubmit={false}
        />
        <TouchableOpacity
          style={[s.sendBtn, (!text.trim() || sending) && s.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!text.trim() || sending}
          activeOpacity={0.7}
        >
          {sending
            ? <ActivityIndicator size="small" color={Colors.white} />
            : <AppIcon name="send" size={20} color={Colors.white} />
          }
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Platform.OS === 'ios' ? 50 : Spacing.xxl,
    paddingBottom: Spacing.sm,
    backgroundColor: Colors.bordeaux,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerBtn: {
    padding: 8,
  },
  callBtn: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 20,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  statusOnline: { backgroundColor: Colors.success },
  statusOffline: { backgroundColor: Colors.textMuted },
  driverName: {
    fontSize: Fonts.size.md,
    fontWeight: '700',
    color: Colors.white,
  },
  driverStatus: {
    fontSize: Fonts.size.xs,
    color: Colors.textMuted,
  },
  messagesList: {
    paddingVertical: 12,
    flexGrow: 1,
  },
  // Séparateur de date
  dateSeparator: {
    alignItems: 'center',
    marginVertical: 10,
    elevation: 1,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  dateSeparatorText: {
    fontSize: 12,
    color: Colors.textMuted,
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  // Empty state
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: '50%',
  },
  emptyText: {
    marginTop: Spacing.md,
    fontSize: Fonts.size.md,
    color: Colors.textMuted,
  },
  // Input row
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: Colors.background,
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 120,
    backgroundColor: Colors.surface,
    borderRadius: 21,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.textPrimary,
    elevation: 1,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.bordeaux,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: Colors.bordeauxLight,
    opacity: 0.5,
  },
});