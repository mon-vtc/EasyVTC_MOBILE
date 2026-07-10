import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { useChat } from '../../hooks/useChat';
import { useAuth } from '../../hooks/useAuth';
import { Colors, Fonts, Spacing } from '../../theme/colors';
import { AppIcon } from '../../components/common/AppIcon';
import { AppHeader } from '../../components/common/AppHeader';
import type { SupportMessage } from '../../types/chats.type';
import { useToast } from '../../hooks/useToast';

// ─────────────────────────────────────────────────────────────────────────────
// MessageBubble
// ─────────────────────────────────────────────────────────────────────────────
interface BubbleProps {
  message: SupportMessage;
  isOwn: boolean;
}

function SupportMessageBubble({ message, isOwn }: BubbleProps) {
  const time = new Date(message.created_at).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={[b.row, isOwn ? b.rowRight : b.rowLeft]}>
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
  text: { fontSize: 15, lineHeight: 20 },
  textOwn:   { color: Colors.white },
  textOther: { color: Colors.textPrimary },
  time: { fontSize: 11, marginTop: 4, alignSelf: 'flex-end' },
  timeOwn:   { color: Colors.white + 'AA' },
  timeOther: { color: Colors.textMuted },
});

export default function SupportChatScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const {
    activeSupportTicket,
    isLoadingSupportTicketDetail,
    sendSupportMessage,
    markSupportAsRead,
    updateSupportTicketStatus,
    addSupportMessageOptimistically,
    fetchSupportTicketDetail,
  } = useChat();

  const { showToast } = useToast();
  const [text, setText]       = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef           = useRef<FlatList>(null);

  const { ticketId, subject } = route.params;

  useFocusEffect(
    useCallback(() => {
      if (ticketId) markSupportAsRead(ticketId);
    }, [ticketId, markSupportAsRead])
  );

  useEffect(() => {
    fetchSupportTicketDetail(ticketId);
  }, [ticketId, fetchSupportTicketDetail]);

  // Scroll to bottom quand les messages changent
  useEffect(() => {
    if (activeSupportTicket?.messages?.length) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [activeSupportTicket?.messages?.length]);

  const isResolved = activeSupportTicket?.status === 'resolved';

  const onSend = useCallback(
    async () => {
      const content = text.trim();
      if (!content || sending || isResolved) return;

      const optimisticMessage: any = {
        id: Math.random().toString(),
        ticket_id: ticketId,
        sender_id: user!.id,
        sender_role: user!.role,
        content,
        created_at: new Date().toISOString(),
        read_at: null,
      };

      setText('');
      setSending(true);
      addSupportMessageOptimistically(optimisticMessage);

      try {
        if ((user?.role === 'admin' || user?.role === 'manager') && activeSupportTicket?.status === 'pending') {
          await updateSupportTicketStatus(ticketId, 'in_progress');
        }
        await sendSupportMessage(ticketId, content);
      } catch (error) {
        console.error('Failed to send support message:', error);
      } finally {
        setSending(false);
      }
    },
    [ticketId, user, text, sending, sendSupportMessage, updateSupportTicketStatus, addSupportMessageOptimistically, fetchSupportTicketDetail, activeSupportTicket?.status, isResolved],
  );

  const handleResolveTicket = useCallback(async () => {
    if (!activeSupportTicket) return;

    try {
      await updateSupportTicketStatus(ticketId, 'resolved');
      await fetchSupportTicketDetail(ticketId);
      showToast({ type: 'success', title: 'Ticket clôturé', message: 'Le ticket a bien été marqué comme résolu.' });
    } catch (err: any) {
      showToast({ type: 'error', title: 'Erreur', message: err?.message ?? 'Impossible de clôturer le ticket.' });
    }
  }, [ticketId, updateSupportTicketStatus, fetchSupportTicketDetail, activeSupportTicket]);

  // Séparateurs de date
  const renderItem = useCallback(({ item, index }: { item: SupportMessage; index: number }) => {
    const isOwn = item.sender_id === user!.id;
    const showDate =
      index === 0 ||
      new Date(item.created_at).toDateString() !==
      new Date(activeSupportTicket!.messages[index - 1].created_at).toDateString();

    return (
      <View>
        {showDate && (
          <View style={s.dateSeparator}>
            <Text style={s.dateSeparatorText}>
              {new Date(item.created_at).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </Text>
          </View>
        )}
        <SupportMessageBubble message={item} isOwn={isOwn} />
      </View>
    );
  }, [activeSupportTicket, user]);

  if (isLoadingSupportTicketDetail && !activeSupportTicket) {
    return (
      <View style={s.centered}>
        <ActivityIndicator size="large" color={Colors.bordeaux} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {/* ── Header ── */}
      <AppHeader left="back" title={subject || 'Support'} />

      {activeSupportTicket?.status && (
        <View style={s.statusBanner}>
          <Text style={s.statusBannerText}>
            {activeSupportTicket.status === 'resolved'
              ? 'Ticket clôturé — lecture seule'
              : activeSupportTicket.status === 'in_progress'
              ? 'Support en cours'
              : 'Ticket en attente'}
          </Text>
          {(activeSupportTicket.status === 'in_progress' && (user?.role === 'admin' || user?.role === 'manager')) && (
            <TouchableOpacity style={s.closeBtn} onPress={handleResolveTicket} disabled={sending}>
              <Text style={s.closeBtnText}>Clôturer</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* ── Liste messages ── */}
      <FlatList
        ref={flatListRef}
        data={activeSupportTicket?.messages ?? []}
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

      {/* ── Input ── */}
      <View style={s.inputRow}>
        <TextInput
          style={[s.input, isResolved && s.inputDisabled]}
          value={text}
          onChangeText={setText}
          placeholder={isResolved ? 'Ticket clôturé, lecture seule' : 'Votre message...'}
          placeholderTextColor={Colors.textMuted}
          multiline
          maxLength={1000}
          onSubmitEditing={onSend}
          blurOnSubmit={false}
          editable={!isResolved}
        />
        <TouchableOpacity
          style={[s.sendBtn, (isResolved || !text.trim() || sending) && s.sendBtnDisabled]}
          onPress={onSend}
          disabled={isResolved || !text.trim() || sending}
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

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  statusBannerText: {
    color: Colors.textPrimary,
    fontSize: Fonts.size.sm,
    fontFamily: Fonts.semibold, fontWeight: '600',
  },
  closeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.bordeaux,
    borderRadius: 12,
  },
  closeBtnText: {
    color: Colors.white,
    fontFamily: Fonts.bold, fontWeight: '700',
    fontSize: Fonts.size.xs,
  },
  messagesList: {
    paddingVertical: 12,
    flexGrow: 1,
  },
  // Séparateur de date
  dateSeparator: {
    alignItems: 'center',
    marginVertical: 10,
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
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.white,
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
  },
  inputDisabled: {
    opacity: 0.6,
    backgroundColor: Colors.surface,
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