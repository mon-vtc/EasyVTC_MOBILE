// ══════════════════════════════════════════════════════════════════════════════
// STORE — CHAT
// ══════════════════════════════════════════════════════════════════════════════
import { create } from 'zustand';
import { chatApi } from '../services/api/chats.api';
import type { UserRole } from '../types';
import type {
  ChatMessage,
  ConversationSummary,
  SupportTicketRow,
  SupportTicketDetail,
  SupportMessage,
  CreateSupportTicketDto,
  SupportListFilters,
  SupportTicketStatus,
} from '../types/chats.type';

interface ChatState {
  conversations: ConversationSummary[];
  conversationsPage: number;
  conversationsTotalPages: number;
  isFetchingNextConversationsPage: boolean;
  activeConversationMessages: ChatMessage[];
  activeConversationMessagesPage: number;
  activeConversationMessagesTotal: number;
  activeConversationMessagesTotalPages: number;
  supportTickets: SupportTicketRow[];
  supportTicketsPage: number;
  supportTicketsTotalPages: number;
  isFetchingNextSupportTicketsPage: boolean;
  activeSupportTicket: SupportTicketDetail | null;
  // Supervision admin
  supervisedConversations: import('../types').ActiveConversation[];
  supervisedConversationsTotal: number;
  supervisedConversationsPage: number;
  isLoadingSupervisedConversations: boolean;
  // Autres états
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;
  isSendingMessage: boolean;
  isLoadingSupportTickets: boolean;
  isLoadingSupportTicketDetail: boolean;
  isSendingSupportMessage: boolean;
  error: string | null;
  supportError: string | null;
}

interface ChatActions {
  fetchConversations: (token: string, role: UserRole, page?: number, limit?: number) => Promise<void>;
  fetchMessages: (token: string, reservationId: string, page?: number, limit?: number) => Promise<void>;
  sendMessage: (token: string, reservationId: string, content: string) => Promise<void>;
  addMessageOptimistically: (message: ChatMessage) => void;
  markChatAsRead: (token: string, reservationId: string) => Promise<void>;
  markSupportAsRead: (token: string, ticketId: string) => Promise<void>;
  clearError: () => void;
  clearSupportError: () => void;
  resetMessages: () => void;
  fetchSupportTickets: (token: string, filters?: SupportListFilters) => Promise<void>;
  fetchSupportTicketsRaw: (token: string, filters?: SupportListFilters) => Promise<SupportTicketRow[] | null>;
  fetchSupportTicketDetail: (token: string, ticketId: string) => Promise<void>;
  createSupportTicket: (token: string, dto: CreateSupportTicketDto) => Promise<SupportTicketDetail | null>;
  sendSupportMessage: (token: string, ticketId: string, content: string) => Promise<void>;
  updateSupportTicketStatus: (token: string, ticketId: string, status: SupportTicketStatus) => Promise<SupportTicketDetail>;
  addSupportMessageOptimistically: (message: SupportMessage) => void;
  // Supervision admin
  fetchSupervisedConversations: (token: string, page?: number, limit?: number) => Promise<void>;
}

export const useChatStore = create<ChatState & ChatActions>((set, get) => ({
  // ─── STATE ────────────────────────────────────────────────────────────────
  conversations: [],
  conversationsPage: 1,
  conversationsTotalPages: 1,
  isFetchingNextConversationsPage: false,
  activeConversationMessages: [],
  activeConversationMessagesPage: 1,
  activeConversationMessagesTotal: 0,
  activeConversationMessagesTotalPages: 0,
  isLoadingConversations: false,
  isLoadingMessages: false,
  isSendingMessage: false,
  supportTickets: [],
  supportTicketsPage: 1,
  supportTicketsTotalPages: 1,
  isFetchingNextSupportTicketsPage: false,
  activeSupportTicket: null,
  isLoadingSupportTickets: false,
  isLoadingSupportTicketDetail: false,
  isSendingSupportMessage: false,
  error: null,
  supportError: null,
  // Supervision admin
  supervisedConversations: [],
  supervisedConversationsTotal: 0,
  supervisedConversationsPage: 1,
  isLoadingSupervisedConversations: false,

  // ─── ACTIONS ──────────────────────────────────────────────────────────────

  clearError: () => set({ error: null }),
  clearSupportError: () => set({ supportError: null }),

  /** Vide les messages de la conversation précédente lors d'un changement de chat. */
  resetMessages: () => set({
    activeConversationMessages: [],
    activeConversationMessagesPage: 1,
    activeConversationMessagesTotal: 0,
    activeConversationMessagesTotalPages: 0,
  }),

  /**
   * Récupère les conversations actives depuis /admin/chat.
   */
  fetchConversations: async (token, role, page = 1, limit = 20) => {
    const append = page > 1;
    if (append) {
      set({ isFetchingNextConversationsPage: true });
    } else {
      set({ isLoadingConversations: true, error: null });
    }
    try {
      if (role === 'admin' || role === 'manager') {
        const response = await chatApi.listAdminConversations(token, page, limit);
        if (response.ok && response.data) {
          const incoming = response.data.conversations ?? [];
          const mappedConversations: ConversationSummary[] = incoming.map(c => ({
            reservation_id: c.reservation_id,
            status: 'unknown',
            scheduled_at: c.scheduled_at,
            pickup_address: c.pickup_address,
            dest_address: c.dest_address,
            other_party: c.client || c.driver ? {
              id: c.client?.id ?? c.driver!.id,
              first_name: c.client?.first_name ?? c.driver!.first_name,
              last_name: c.client?.last_name ?? c.driver!.last_name,
              profile_photo_url: c.client?.profile_photo_url ?? c.driver?.profile_photo_url ?? null,
              role: c.client ? 'client' : 'driver',
            } : null,
            last_message: c.last_message ? {
              content: c.last_message,
              created_at: c.last_message_at!,
              sender_role: 'unknown',
              is_mine: false,
            } : null,
            unread_count: c.unread_count,
          }));
          set(state => ({
            conversations: append ? [...state.conversations, ...mappedConversations] : mappedConversations,
            conversationsPage: page,
            conversationsTotalPages: Math.ceil((response.data!.total ?? 0) / limit) || 1,
          }));
        } else {
          throw new Error(response.message || 'Erreur lors du chargement des conversations.');
        }
      } else {
        const response = await chatApi.listMyConversations(token, page, limit);
        if (response.ok && response.data) {
          const incoming = response.data.conversations ?? [];
          set(state => ({
            conversations: append ? [...state.conversations, ...incoming] : incoming,
            conversationsPage: response.data!.page ?? page,
            conversationsTotalPages: response.data!.total_pages ?? 1,
          }));
        } else {
          throw new Error(response.message || 'Erreur lors du chargement des conversations.');
        }
      }
    } catch (err: any) {
      set({ error: err.message ?? 'Erreur inconnue' });
    } finally {
      set({ isLoadingConversations: false, isFetchingNextConversationsPage: false });
    }
  },

  /**
   * Récupère les messages d'une conversation.
   * Les messages sont stockés dans l'ordre chronologique croissant
   * (created_at ASC côté backend). GiftedChat attend l'ordre DESC :
   * si tu utilises GiftedChat, inverse dans le composant avec [...messages].reverse()
   * plutôt qu'ici pour garder le store neutre.
   */
  fetchMessages: async (token, reservationId, page = 1, limit = 20, append = false) => {
    set({ isLoadingMessages: true, error: null });
    try {
      const response = await chatApi.getMessages(token, reservationId, page, limit);
      const data = response.data;
          
      if (response.ok && data) {
        set(state => ({
          activeConversationMessages: append
            ? [...state.activeConversationMessages, ...data.messages]
            : data.messages,
          activeConversationMessagesPage: data.page,
          activeConversationMessagesTotal: data.total,
          activeConversationMessagesTotalPages: data.total_pages,
        }));
      } else {
        throw new Error(response.message || 'Erreur lors du chargement des messages.');
      }
    } catch (err: any) {
      set({ error: err.message ?? 'Erreur inconnue' });
    } finally {
      set({ isLoadingMessages: false });
    }
  },

  /**
   * Envoie un message.
   * Le message optimiste est ajouté avant cet appel via addMessageOptimistically().
   * En cas d'échec, on pourrait marquer le message comme échoué (TODO).
   */
  sendMessage: async (token, reservationId, content) => {
    set({ isSendingMessage: true });
    try {
      const response = await chatApi.sendMessage(token, reservationId, content);
      if (!response.ok) {
        throw new Error(response.message || "Erreur lors de l'envoi du message.");
      }
      // Le message réel du serveur (avec id/created_at définitifs) pourrait remplacer
      // le message optimiste ici si nécessaire.
    } catch (err: any) {
      set({ error: err.message ?? 'Erreur inconnue' });
      throw err; // Re-throw pour que le composant puisse retirer le message optimiste
    } finally {
      set({ isSendingMessage: false });
    }
  },

  /**
   * Insère un message en tête de liste avant la réponse serveur.
   * ✅ Paramètre correctement typé ChatMessage (plus de référence fantôme à ChatMessage)
   */
  addMessageOptimistically: (message) => {
    set(state => ({
      activeConversationMessages: [...state.activeConversationMessages, message],
    }));
  },

  markChatAsRead: async (token, reservationId) => {
    const currentUnread = get().conversations.find(c => c.reservation_id === reservationId)?.unread_count ?? 0;
    if (currentUnread === 0) return;

    // Mise à jour optimiste
    set(state => ({
      conversations: state.conversations.map(c =>
        c.reservation_id === reservationId ? { ...c, unread_count: 0 } : c
      ),
    }));

    try {
      await chatApi.markChatAsRead(token, reservationId);
    } catch (err) {
      console.error("Failed to mark chat as read on server:", err);
      // On pourrait vouloir rollback la mise à jour optimiste ici en cas d'erreur critique
    }
  },

  markSupportAsRead: async (token, ticketId) => {
    // Mise à jour optimiste
    set(state => ({
      supportTickets: state.supportTickets.map(t =>
        t.id === ticketId ? { ...t, unread_count: 0 } : t // Assumant un champ unread_count
      ),
    }));

    try {
      await chatApi.markSupportAsRead(token, ticketId);
    } catch (err) {
      console.error("Failed to mark support ticket as read on server:", err);
    }
  },

  // ─── ACTIONS SUPPORT ──────────────────────────────────────────────────────

  fetchSupportTickets: async (token, filters) => {
    const page = filters?.page ?? 1;
    const append = page > 1;
    if (append) {
      set({ isFetchingNextSupportTicketsPage: true });
    } else {
      set({ isLoadingSupportTickets: true, supportError: null });
    }
    try {
      const response = await chatApi.listSupportTickets(token, filters);
      if (response.ok && response.data) {
        const incoming = response.data.tickets ?? [];
        set(state => ({
          supportTickets: append ? [...state.supportTickets, ...incoming] : incoming,
          supportTicketsPage: response.data!.page ?? page,
          supportTicketsTotalPages: response.data!.total_pages ?? 1,
        }));
      } else {
        throw new Error(response.message || 'Erreur lors du chargement des tickets.');
      }
    } catch (err: any) {
      set({ supportError: err.message ?? 'Erreur inconnue' });
    } finally {
      set({ isLoadingSupportTickets: false, isFetchingNextSupportTicketsPage: false });
    }
  },

  /**
   * Récupère les tickets mais retourne les données au lieu de muter `supportTickets`.
   * Utile pour calculer des statistiques indépendantes des filtres appliqués à l'affichage.
   */
  fetchSupportTicketsRaw: async (token, filters) => {
    try {
      const response = await chatApi.listSupportTickets(token, filters);
      if (response.ok && response.data) {
        return response.data.tickets ?? [];
      }
      throw new Error(response.message || 'Erreur lors du chargement des tickets.');
    } catch (err: any) {
      set({ supportError: err.message ?? 'Erreur inconnue' });
      return null;
    }
  },

  fetchSupportTicketDetail: async (token, ticketId) => {
    set({ isLoadingSupportTicketDetail: true, supportError: null, activeSupportTicket: null });
    try {
      const response = await chatApi.getSupportTicketDetail(token, ticketId);
      if (response.ok && response.data) {
        set({ activeSupportTicket: response.data });
      } else {
        throw new Error(response.message || 'Erreur lors du chargement du ticket.');
      }
    } catch (err: any) {
      set({ supportError: err.message ?? 'Erreur inconnue' });
    } finally {
      set({ isLoadingSupportTicketDetail: false });
    }
  },

  createSupportTicket: async (token, dto) => {
    set({ isSendingSupportMessage: true, supportError: null });
    try {
      const response = await chatApi.createSupportTicket(token, dto);
      if (response.ok && response.data) {
        set(state => ({ supportTickets: [response.data!, ...state.supportTickets] }));
        return response.data;
      }
      throw new Error(response.message || 'Erreur lors de la création du ticket.');
    } catch (err: any) {
      set({ supportError: err.message ?? 'Erreur inconnue' });
      return null;
    } finally {
      set({ isSendingSupportMessage: false });
    }
  },

  sendSupportMessage: async (token, ticketId, content) => {
    set({ isSendingSupportMessage: true });
    try {
      const response = await chatApi.sendSupportMessage(token, ticketId, content);
      if (!response.ok) {
        throw new Error(response.message || "Erreur lors de l'envoi du message.");
      }
    } catch (err: any) {
      set({ supportError: err.message ?? 'Erreur inconnue' });
      throw err;
    } finally {
      set({ isSendingSupportMessage: false });
    }
  },

  updateSupportTicketStatus: async (token, ticketId, status) => {
    set({ isSendingSupportMessage: true, supportError: null });
    try {
      const response = await chatApi.updateSupportTicketStatus(token, ticketId, status);
      if (response.ok && response.data) {
        const updatedTicketInfo = response.data;
        set(state => ({
          activeSupportTicket: state.activeSupportTicket?.id === ticketId
            ? { // On fusionne les nouvelles infos avec les messages existants
                ...state.activeSupportTicket,
                ...updatedTicketInfo,
              }
            : state.activeSupportTicket,
          supportTickets: state.supportTickets.map(ticket =>
            ticket.id === ticketId ? { ...ticket, ...updatedTicketInfo } : ticket,
          ) as SupportTicketRow[],
        }));
        return response.data;
      }
      throw new Error(response.message || 'Erreur lors de la mise à jour du statut du ticket.');
    } catch (err: any) {
      set({ supportError: err.message ?? 'Erreur inconnue' });
      throw err;
    } finally {
      set({ isSendingSupportMessage: false });
    }
  },

  addSupportMessageOptimistically: (message: SupportMessage) => {
    set(state => ({
      activeSupportTicket: state.activeSupportTicket
        ? { ...state.activeSupportTicket, messages: [...state.activeSupportTicket.messages, message] }
        : null,
    }));
  },

  // ─── SUPERVISION ADMIN ─────────────────────────────────────────────────────

  fetchSupervisedConversations: async (token, page = 1, limit = 20) => {
    set({ isLoadingSupervisedConversations: true, error: null });
    try {
      const response = await chatApi.listActiveConversationsForSupervision(token, page, limit);
      if (response.ok && response.data) {
        set({
          supervisedConversations: response.data.conversations,
          supervisedConversationsTotal: response.data.total,
          supervisedConversationsPage: page,
        });
      } else {
        set({ error: response.message ?? 'Erreur lors du chargement des conversations' });
      }
    } catch (err: any) {
      set({ error: err.message ?? 'Erreur inconnue' });
    } finally {
      set({ isLoadingSupervisedConversations: false });
    }
  },
}));