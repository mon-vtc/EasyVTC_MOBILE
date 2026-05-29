import React, { useState, useMemo, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Image, Platform, Modal, TextInput, Pressable, Alert, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useChat } from '../../hooks/useChat';
import { useAuth } from '../../hooks/useAuth';
import { Colors, Fonts, Spacing } from '../../theme/colors';
import { AppIcon } from '../../components/common/AppIcon';
import TicketCard from '../../components/support/TicketCard';
import { Logo } from '../../constants/logo';

import type { SupportTicketRow, SupportTicketStatus, CreateSupportTicketDto, SupportTicketCategory} from '../../types/chats.type';

const STATUS_TABS: SupportTicketStatus[] = ['pending', 'in_progress', 'resolved'];

const STATUS_LABELS: Record<SupportTicketStatus, string> = {
  pending: 'En attente',
  in_progress: 'En cours',
  resolved: 'Résolus',
};

const PRIORITY_LABELS: Record<string, string> = {
  normal: 'Normal',
  urgent: 'Urgent',
};



export default function SupportListScreen({ navigation }: any) {
  const { user } = useAuth();
  const { supportTickets, isLoadingSupportTickets, fetchSupportTickets, createSupportTicket, fetchSupportTicketsRaw } = useChat();
  const [activeTab, setActiveTab] = useState<SupportTicketStatus>('pending');
  const [modalVisible, setModalVisible] = useState(false);
  const [allTickets, setAllTickets] = useState<SupportTicketRow[]>([]);

  // Counts computed from the full tickets set (allTickets) so they are independent
  // from the current display filter (activeTab). We still fetch per-tab for the
  // visible list to keep UI snappy, but statistics reflect the global state.
  const counts = useMemo(() => {
    const source = allTickets ?? [];
    const visible = source.filter(t => {
      if (user?.role === 'admin' || user?.role === 'manager') return true;
      return t.user?.id === user?.id;
    });
    return {
      pending: visible.filter(v => v.status === 'pending').length,
      in_progress: visible.filter(v => v.status === 'in_progress').length,
      resolved: visible.filter(v => v.status === 'resolved').length,
    } as Record<SupportTicketStatus, number>;
  }, [allTickets, user?.role, user?.id]);

  useFocusEffect(
    React.useCallback(() => {
      if (user?.role) {
        fetchSupportTickets({ status: activeTab });
        // load all tickets for statistics (non-destructive)
        (async () => {
          const all = await fetchSupportTicketsRaw?.();
          if (all) setAllTickets(all);
        })();
      }
    }, [fetchSupportTickets, user?.role, activeTab]),
  );

  const renderContent = () => {
    if (isLoadingSupportTickets && supportTickets.length === 0) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.bordeaux} />
        </View>
      );
    }

    const visibleTickets = supportTickets.filter(t => {
      // Admins and managers see all tickets; others see only their own tickets
      if (user?.role === 'admin' || user?.role === 'manager') return true;
      return t.user?.id === user?.id;
    });

    return (
      <FlatList
        data={visibleTickets}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TicketCard
            ticket={item}
            onPress={() => navigation.navigate('SupportChat', { ticketId: item.id, subject: item.subject })}
          />
        )}
        ListEmptyComponent={
          <View style={styles.centered}>
            <AppIcon name="chatbubbles-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyText}>Aucun ticket dans cette catégorie</Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={isLoadingSupportTickets}
            onRefresh={() => fetchSupportTickets({ status: activeTab })}
            tintColor={Colors.bordeaux}
          />
        }
        contentContainerStyle={styles.list}
      />
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
            <AppIcon name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>

          <View style={styles.brandContainer}>
            <Image source={Logo.LogoEasyVTC} style={styles.logo} resizeMode="contain" />
          </View>

          <View style={styles.headerBtn} />
        </View>

        <View style={styles.supportStatusPill}>
          <View style={styles.supportStatusInfo}>
            <View style={styles.headsetCircle}>
              <AppIcon name="headset" size={16} color={Colors.white} />
            </View>
            <View>
              <Text style={styles.supportPillTitle}>Équipe Support</Text>
              <Text style={styles.supportPillSubtitle}>En ligne</Text>
            </View>
          </View>

          <View style={styles.supportStatusBadge}>
            <View style={styles.supportStatusDot} />
          </View>
        </View>
      </View>

      <View style={styles.tabsContainer}>
        {STATUS_TABS.map(status => (
          <TouchableOpacity
            key={status}
            style={[styles.tab, activeTab === status && styles.activeTab]}
            onPress={() => setActiveTab(status)}
          >
            <Text style={[styles.tabText, activeTab === status && styles.activeTabText]}>
              {STATUS_LABELS[status]}
            </Text>
            <Text style={styles.tabCount}>{counts[status]}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {renderContent()}
      <SupportTicketModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onCreate={async (dto : CreateSupportTicketDto) => {
          try {
            await createSupportTicket(dto);
            setModalVisible(false);
            // reload tickets for current tab
            fetchSupportTickets({ status: activeTab });
            // refresh global stats
            (async () => {
              const all = await fetchSupportTicketsRaw?.();
              if (all) setAllTickets(all);
            })();
            Alert.alert('Ticket créé', 'Votre demande a bien été envoyée au support.');
          } catch (err: any) {
            Alert.alert('Erreur', err?.message ?? 'Impossible de créer le ticket.');
          }
        }}
      />
    </View>
  );
}

function SupportTicketModal({
  visible,
  onClose,
  onCreate,
}: {
  visible: boolean;
  onClose: () => void;
  onCreate: (dto: CreateSupportTicketDto) => Promise<void>;
}) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState<SupportTicketCategory>('other');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!subject.trim() || !message.trim()) {
      Alert.alert('Champs requis', 'Veuillez remplir le sujet et le message.');
      return;
    }
    setLoading(true);
    try {
      await onCreate({ category, subject: subject.trim(), message: message.trim() });
      setSubject(''); setMessage(''); setCategory('other');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={modalStyles.backdrop}>
        <View style={modalStyles.container}>
          <Text style={modalStyles.title}>Nouveau ticket</Text>
          <TextInput
            style={modalStyles.input}
            placeholder="Sujet"
            value={subject}
            onChangeText={setSubject}
          />
          <TextInput
            style={[modalStyles.input, { height: 100 }]}
            placeholder="Décrivez votre problème..."
            value={message}
            onChangeText={setMessage}
            multiline
          />

          <View style={modalStyles.categoryRow}>
            {['reservation','payment','driver','account','technical','other'].map((c) => (
              <Pressable
                key={c}
                onPress={() => setCategory(c as any)}
                style={[modalStyles.categoryBtn, category === c && modalStyles.categoryActive]}
              >
                <Text style={category === c ? modalStyles.categoryActiveText : modalStyles.categoryText}>{c}</Text>
              </Pressable>
            ))}
          </View>

          <View style={modalStyles.actionsRow}>
            <TouchableOpacity style={[modalStyles.actionBtn, { backgroundColor: Colors.surface }]} onPress={onClose} disabled={loading}>
              <Text style={[modalStyles.actionText, { color: Colors.textPrimary }]}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[modalStyles.actionBtn, { backgroundColor: Colors.bordeaux }]} onPress={submit} disabled={loading}>
              {loading ? <ActivityIndicator color={Colors.white} /> : <Text style={modalStyles.actionText}>Envoyer</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 20 },
  container: { backgroundColor: Colors.surface, borderRadius: 12, padding: 16 },
  title: { fontSize: Fonts.size.lg, fontWeight: '800', marginBottom: 12 },
  input: { backgroundColor: Colors.background, borderRadius: 8, padding: 10, marginBottom: 10, borderWidth: 1, borderColor: Colors.border },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12, justifyContent: 'space-between' },
  categoryBtn: { paddingVertical: 8, paddingHorizontal: 10, borderRadius: 8, backgroundColor: Colors.background, margin: 4, minWidth: 80, alignItems: 'center' },
  categoryActive: { backgroundColor: Colors.bordeaux },
  categoryText: { color: Colors.textSecondary, textTransform: 'capitalize' },
  categoryActiveText: { color: Colors.white, fontWeight: '700', textTransform: 'capitalize' },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  actionBtn: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center', marginHorizontal: 6 },
  actionText: { color: Colors.white, fontWeight: '700' },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: '30%',
  },
  header: {
    backgroundColor: Colors.bordeaux,
    paddingTop: Platform.OS === 'ios' ? 56 : Spacing.xl + 8,
    paddingBottom: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: Colors.white,
    fontWeight: '800',
    fontSize: Fonts.size.lg,
  },
  brandContainer: {
    alignItems: 'center',
  },
  logo:        { width: 40, height: 40 },
  headerBtn: { padding: Spacing.sm, width: 40 },
  supportStatusPill: {
    marginTop: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: Spacing.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  supportStatusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headsetCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  headsetEmoji: {
    fontSize: 18,
  },
  supportPillTitle: {
    fontSize: Fonts.size.sm,
    fontWeight: '700',
    color: Colors.white,
  },
  supportPillSubtitle: {
    fontSize: Fonts.size.xs,
    color: Colors.white,
    opacity: 0.8,
    marginTop: 2,
  },
  supportStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    },
  supportStatusDot: {
    width: 10,
    height: 10,
    borderRadius: 4,
    backgroundColor: '#4ADE80',
    marginRight: Spacing.xs,
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: Spacing.md,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: Colors.bordeaux,
    borderRadius: 8,
  },
  tabText: {
    fontSize: Fonts.size.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  activeTabText: {
    color: Colors.white,
  },
  tabCount: {
    fontSize: Fonts.size.xs,
    color: Colors.textMuted,
    marginTop: 4,
  },
  list: {
    paddingHorizontal: Spacing.md,
  },
  emptyText: {
    marginTop: Spacing.md,
    fontSize: Fonts.size.md,
    color: Colors.textMuted,
  },
  ticketCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  ticketCardPending: {
    borderWidth: 1,
    borderColor: Colors.bordeaux,
  },
  ticketHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: Spacing.sm,
  },
  pendingIndicator: {
    position: 'absolute',
    top: 0,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.bordeaux,
    borderWidth: 1,
    borderColor: Colors.white,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontWeight: '700',
    fontSize: Fonts.size.md,
  },
  userRole: {
    textTransform: 'capitalize',
    color: Colors.textSecondary,
    fontSize: Fonts.size.xs,
  },
  priorityBadge: {
    backgroundColor: Colors.overlayLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priorityText: {
    color: Colors.bordeaux,
    fontWeight: '600',
    fontSize: Fonts.size.xs,
  },
  ticketSubject: {
    fontSize: Fonts.size.sm,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  ticketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketTime: {
    color: Colors.textMuted,
    fontSize: Fonts.size.xs,
  },
  actionButton: {
    backgroundColor: Colors.bordeaux,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionButtonText: {
    color: Colors.white,
    fontWeight: '700',
  },
});