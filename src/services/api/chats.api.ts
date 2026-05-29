// ══════════════════════════════════════════════════════════════════════════════
// SERVICE — CHAT API
// ══════════════════════════════════════════════════════════════════════════════
import { api } from '../../lib/api';
import type { ApiResponse } from '../../types';
import type {
  ChatMessageListResult,
  ChatMessage,
  ConversationListResult,
  AdminConversationListResult,
  SupportTicketListResult,
  SupportTicketDetail,
  CreateSupportTicketDto,
  SupportMessage,
  SupportTicketStatus,
  SupportTicketPriority,
  SupportListFilters,
} from '../../types/chats.type';

/**
 * Récupère la liste des conversations pour les clients et chauffeurs.
 * @route GET /chat/conversations
 */
const listMyConversations = (
  token: string,
  page = 1,
  limit = 20,
): Promise<ApiResponse<ConversationListResult>> => {
  return api.get(
    `/chat/conversations?page=${page}&limit=${limit}`,
    token,
  );
};

/**
 * Récupère la liste de toutes les conversations actives pour les admins/managers (supervision).
 * @route GET /admin/chat
 */
const listAdminConversations = (
  token: string,
  page = 1,
  limit = 20,
): Promise<ApiResponse<AdminConversationListResult>> => {
  return api.get(
    `/admin/chat?page=${page}&limit=${limit}`,
    token,
  );
};

/**
 * Alias pour listAdminConversations — conversations actives pour supervision admin.
 * @route GET /admin/chat
 */
const listActiveConversationsForSupervision = (
  token: string,
  page = 1,
  limit = 20,
): Promise<ApiResponse<AdminConversationListResult>> => {
  return listAdminConversations(token, page, limit);
};


/**
 * Récupère les messages d'une conversation (= une réservation), paginés.
 */
const getMessages = (
  token: string,
  reservationId: string,
  page = 1,
  limit = 20,
): Promise<ApiResponse<ChatMessageListResult>> => {
  return api.get<ChatMessageListResult>(
    `/chat/reservations/${reservationId}/messages?page=${page}&limit=${limit}`,
    token,
  );
};

/**
 * Envoie un nouveau message dans une conversation.
 */
const sendMessage = (
  token: string,
  reservationId: string,
  content: string,
): Promise<ApiResponse<ChatMessage>> => {
  return api.post<ChatMessage>(
    `/chat/reservations/${reservationId}/messages`,
    { content },
    token,
  );
};

/**
 * Crée un nouveau ticket de support.
 * @route POST /support/tickets
 */
const createSupportTicket = (
  token: string,
  dto: CreateSupportTicketDto,
): Promise<ApiResponse<SupportTicketDetail>> => {
  return api.post('/support/tickets', dto, token);
};

/**
 * Récupère la liste des tickets de support pour l'utilisateur.
 * @route GET /support/tickets
 */
const listSupportTickets = (
  token: string,
  filters: SupportListFilters = {},
): Promise<ApiResponse<SupportTicketListResult>> => {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.status) params.set('status', filters.status);

  return api.get(`/support/tickets?${params.toString()}`, token);
};

/**
 * Récupère le détail et les messages d'un ticket de support.
 * @route GET /support/tickets/:ticketId
 */
const getSupportTicketDetail = (
  token: string,
  ticketId: string,
): Promise<ApiResponse<SupportTicketDetail>> => {
  return api.get(`/support/tickets/${ticketId}`, token);
};

/**
 * Envoie un message dans un ticket de support.
 * @route POST /support/tickets/:ticketId/messages
 */
const sendSupportMessage = (
  token: string,
  ticketId: string,
  content: string,
): Promise<ApiResponse<SupportMessage>> => {
  return api.post(`/support/tickets/${ticketId}/messages`, { content }, token);
};

/**
 * Met à jour le statut ou la priorité d'un ticket (Admin/Manager).
 * @route PUT /support/tickets/:ticketId/status
 */
const updateSupportTicketStatus = (
  token: string,
  ticketId: string,
  status: SupportTicketStatus,
  priority?: SupportTicketPriority,
): Promise<ApiResponse<SupportTicketDetail>> => {
  const payload: { status: SupportTicketStatus; priority?: SupportTicketPriority } = { status };
  if (priority) {
    payload.priority = priority;
  }
  return api.put(`/support/tickets/${ticketId}/status`, payload, token);
};


/**
 * Marque les messages d'une conversation comme lus (non implémenté backend).
 */
const markAsRead = (token: string, conversationId: string): Promise<ApiResponse<void>> => {
  return api.post<void>(`/chat/reservations/${conversationId}/read`, {}, token);
};

export const chatApi = {
  listMyConversations,
  listAdminConversations,
  listActiveConversationsForSupervision,
  getMessages,
  sendMessage,
  markAsRead,
  createSupportTicket,
  listSupportTickets,
  getSupportTicketDetail,
  sendSupportMessage,
  updateSupportTicketStatus,
};