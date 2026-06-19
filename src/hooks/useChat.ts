// ══════════════════════════════════════════════════════════════════════════════
// HOOK — useChat
// ══════════════════════════════════════════════════════════════════════════════
import { useCallback, useEffect, useRef } from 'react';
import { useAuthStore } from '../store/auth.store';
import { useChatStore } from '../store/chat.store';
import type {
  ChatMessage,
  CreateSupportTicketDto,
  SupportListFilters,
  SupportMessage,
  SupportTicketStatus,
} from '../types/chats.type';

export function useChat() {
  const accessToken = useAuthStore(s => s.accessToken);

  const user = useAuthStore(s => s.user);
  // ✅ Sélecteurs atomiques : chaque valeur a sa propre subscription Zustand,
  //    ce qui évite les re-renders inutiles et stabilise les refs dans useCallback.
  const conversations              = useChatStore(s => s.conversations);
  const activeConversationMessages = useChatStore(s => s.activeConversationMessages);
  const isLoadingConversations     = useChatStore(s => s.isLoadingConversations);
  const isLoadingMessages          = useChatStore(s => s.isLoadingMessages);
  const activeConversationMessagesPage = useChatStore(s => s.activeConversationMessagesPage);
  const activeConversationMessagesTotal = useChatStore(s => s.activeConversationMessagesTotal);
  const activeConversationMessagesTotalPages = useChatStore(s => s.activeConversationMessagesTotalPages);
  const isSendingMessage           = useChatStore(s => s.isSendingMessage);
  const error                      = useChatStore(s => s.error);
  // Support
  const supportTickets             = useChatStore(s => s.supportTickets);
  const activeSupportTicket        = useChatStore(s => s.activeSupportTicket);
  const isLoadingSupportTickets    = useChatStore(s => s.isLoadingSupportTickets);
  const isLoadingSupportTicketDetail = useChatStore(s => s.isLoadingSupportTicketDetail);
  const isSendingSupportMessage    = useChatStore(s => s.isSendingSupportMessage);
  const supportError               = useChatStore(s => s.supportError);
  // Supervision admin
  const supervisedConversations    = useChatStore(s => s.supervisedConversations);
  const supervisedConversationsTotal = useChatStore(s => s.supervisedConversationsTotal);
  const supervisedConversationsPage = useChatStore(s => s.supervisedConversationsPage);
  const isLoadingSupervisedConversations = useChatStore(s => s.isLoadingSupervisedConversations);

  // Actions (stables entre les renders — Zustand garantit des références stables)
  const _fetchConversations      = useChatStore(s => s.fetchConversations);
  const _fetchMessages           = useChatStore(s => s.fetchMessages);
  const _sendMessage             = useChatStore(s => s.sendMessage);
  const _addMessageOptimistically = useChatStore(s => s.addMessageOptimistically);
  const _markChatAsRead          = useChatStore(s => s.markChatAsRead);
  const _markSupportAsRead       = useChatStore(s => s.markSupportAsRead);
  const _clearError              = useChatStore(s => s.clearError);
  const _resetMessages           = useChatStore(s => s.resetMessages);
  const _fetchSupportTickets     = useChatStore(s => s.fetchSupportTickets);
  const _fetchSupportTicketsRaw  = useChatStore(s => s.fetchSupportTicketsRaw);
  const _fetchSupportTicketDetail= useChatStore(s => s.fetchSupportTicketDetail);
  const _createSupportTicket     = useChatStore(s => s.createSupportTicket);
  const _sendSupportMessage      = useChatStore(s => s.sendSupportMessage);
  const _updateSupportTicketStatus = useChatStore(s => s.updateSupportTicketStatus);
  const _addSupportMessageOptimistically = useChatStore(s => s.addSupportMessageOptimistically);
  const _clearSupportError       = useChatStore(s => s.clearSupportError);
  // Supervision admin
  const _fetchSupervisedConversations = useChatStore(s => s.fetchSupervisedConversations);

  if (!accessToken) {
    throw new Error('useChat() ne peut être utilisé que par un utilisateur authentifié.');
  }

  // ✅ useCallback avec dépendances stables (accessToken + action Zustand stable)
  const fetchConversations = useCallback(
    () => {
      if (!user?.role) return;
      _fetchConversations(accessToken, user.role)
    },
    [accessToken, _fetchConversations, user?.role],
  );

  const fetchMessages = useCallback(
    (reservationId: string, page?: number, limit?: number, append = false) =>
      _fetchMessages(accessToken, reservationId, page, limit),
    [accessToken, _fetchMessages],
  );

  const sendMessage = useCallback(
    (reservationId: string, content: string) =>
      _sendMessage(accessToken, reservationId, content),
    [accessToken, _sendMessage],
  );

  const addMessageOptimistically = useCallback(
    (message: ChatMessage) => _addMessageOptimistically(message),
    [_addMessageOptimistically],
  );

  const markChatAsRead = useCallback(
    (reservationId: string) => _markChatAsRead(accessToken, reservationId),
    [accessToken, _markChatAsRead],
  );

  const markSupportAsRead = useCallback(
    (ticketId: string) => _markSupportAsRead(accessToken, ticketId),
    [accessToken, _markSupportAsRead],
  );

  // Actions Support
  const fetchSupportTickets = useCallback(
    (filters?: SupportListFilters) => _fetchSupportTickets(accessToken, filters),
    [accessToken, _fetchSupportTickets],
  );

  const fetchSupportTicketsRaw = useCallback(
    (filters?: SupportListFilters) => _fetchSupportTicketsRaw(accessToken, filters),
    [accessToken, _fetchSupportTicketsRaw],
  );

  const fetchSupportTicketDetail = useCallback(
    (ticketId: string) => _fetchSupportTicketDetail(accessToken, ticketId),
    [accessToken, _fetchSupportTicketDetail],
  );

  const createSupportTicket = useCallback(
    (dto: CreateSupportTicketDto) => _createSupportTicket(accessToken, dto),
    [accessToken, _createSupportTicket],
  );

  const sendSupportMessage = useCallback(
    (ticketId: string, content: string) => _sendSupportMessage(accessToken, ticketId, content),
    [accessToken, _sendSupportMessage],
  );

  const updateSupportTicketStatus = useCallback(
    (ticketId: string, status: SupportTicketStatus) =>
      _updateSupportTicketStatus(accessToken, ticketId, status),
    [accessToken, _updateSupportTicketStatus],
  );

  const addSupportMessageOptimistically = useCallback(
    (message: SupportMessage) => _addSupportMessageOptimistically(message),
    [_addSupportMessageOptimistically],
  );

  // Supervision admin
  const fetchSupervisedConversations = useCallback(
    (page?: number, limit?: number) =>
      _fetchSupervisedConversations(accessToken, page, limit),
    [accessToken, _fetchSupervisedConversations],
  );

  return {
    // ── State ──────────────────────────────────────────────────────────────
    conversations,
    activeConversationMessages,
    activeConversationMessagesPage,
    activeConversationMessagesTotal,
    activeConversationMessagesTotalPages,
    isLoadingConversations,
    isLoadingMessages,
    isSendingMessage,
    error,
    // Support State
    supportTickets,
    activeSupportTicket,
    isLoadingSupportTickets,
    isLoadingSupportTicketDetail,
    isSendingSupportMessage,
    supportError,
    // Supervision admin State
    supervisedConversations,
    supervisedConversationsTotal,
    supervisedConversationsPage,
    isLoadingSupervisedConversations,
    // ── Actions ────────────────────────────────────────────────────────────
    fetchConversations,
    fetchMessages,
    sendMessage,
    markChatAsRead,
    markSupportAsRead,
    addMessageOptimistically,
    clearError:    _clearError,
    resetMessages: _resetMessages,
    // Support Actions
    fetchSupportTickets,
    fetchSupportTicketsRaw,
    fetchSupportTicketDetail,
    createSupportTicket,
    sendSupportMessage,
    updateSupportTicketStatus,
    addSupportMessageOptimistically,
    clearSupportError: _clearSupportError,
    // Supervision admin Actions
    fetchSupervisedConversations,
  };
}