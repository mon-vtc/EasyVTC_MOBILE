import React, { useState, useMemo, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Image, Platform, Modal, TextInput, Pressable, Alert, RefreshControl, Linking, ScrollView
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useChat } from '../../hooks/useChat';
import { useAuth } from '../../hooks/useAuth';
import { Colors, Fonts, Spacing, Radius } from '../../theme/colors';
import { AppIcon } from '../../components/common/AppIcon';
import TicketCard from '../../components/support/TicketCard';
import { Logo } from '../../constants/logo';
import { AppIconProps } from '../../types/app-icon-props.types';
import { useToast } from '../../hooks/useToast';

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
  const { supportTickets, isLoadingSupportTickets, fetchSupportTickets, createSupportTicket, fetchSupportTicketsRaw, markSupportAsRead } = useChat();
  const [activeTab, setActiveTab] = useState<SupportTicketStatus>('pending');
  const [helpModalVisible, setHelpModalVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const { showToast } = useToast();
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
            onPress={() => {
              markSupportAsRead(item.id);
              navigation.navigate('SupportChat', { ticketId: item.id, subject: item.subject });
            }}
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

          <View style={styles.headerBtn}>
            {user?.role !== 'admin' && user?.role !== 'manager' && (
              <>
                <TouchableOpacity onPress={() => setHelpModalVisible(true)} style={styles.headerBtn}>
                  <AppIcon name="help-circle-outline" size={24} color={Colors.white} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.headerBtn}>
                  <AppIcon name="add" size={24} color={Colors.white} />
                </TouchableOpacity>
              </>
            )}
          </View>
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
            showToast({ type: 'success', title: 'Ticket créé', message: 'Votre demande a bien été envoyée au support.' });
          } catch (err: any) {
            showToast({ type: 'error', title: 'Erreur', message: err?.message ?? 'Impossible de créer le ticket.' });
          }
        }}
      />
      <HelpModal
        visible={helpModalVisible}
        onClose={() => setHelpModalVisible(false)}
        role={user?.role}
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
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!subject.trim() || !message.trim()) {
      showToast({ type: 'warning', title: 'Champs requis', message: 'Veuillez remplir le sujet et le message.' });
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
  const categories = useMemo(() => {
    return [
      { key: 'reservation', label: 'Réservation', icon: 'calendar' },
      { key: 'payment', label: 'Paiement', icon: 'card' },
      { key: 'driver', label: 'Chauffeur', icon: 'car' },
      { key: 'account', label: 'Compte', icon: 'person' },
      { key: 'technical', label: 'Technique', icon: 'settings' },
      { key: 'other', label: 'Autre', icon: 'help-circle' },
    ] as { key: SupportTicketCategory, label: string , icon: AppIconProps['name']}[];
  }, []);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={modalStyles.backdrop}>
        <View style={modalStyles.container}>
          <Text style={modalStyles.title}>Nouveau ticket</Text>
          
          <View style={modalStyles.categoryRow}>
            {categories.map((c) => (
              <Pressable
                key={c.key}
                onPress={() => setCategory(c.key as any)}
                style={[modalStyles.categoryBtn, category === c.key && modalStyles.categoryActive]}
              >
                <AppIcon name={c.icon} size={20} color={category === c.key ? Colors.white : Colors.bordeaux} />
                <Text style={category === c.key ? modalStyles.categoryActiveText : modalStyles.categoryText}>{c.label}</Text>
              </Pressable>
            ))}
          </View>
          <View>
            <TextInput
              style={modalStyles.input}
              placeholder="Sujet"
              value={subject}
              onChangeText={setSubject}
              maxLength={200}
            />
            <Text style={modalStyles.charCount}>{`${subject.length} / 200`}</Text>
          </View>
          <View>
            <TextInput
              style={[modalStyles.input, { height: 100, textAlignVertical: 'top' }]}
              placeholder="Décrivez votre problème..."
              value={message}
              onChangeText={setMessage}
              multiline
              maxLength={500}
            />
            <Text style={modalStyles.charCount}>{`${message.length} / 500`}</Text>
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

const FAQ_DATA_CLIENT = [
  { question: 'Comment annuler une réservation ?', answer: 'Vous pouvez annuler une réservation depuis l\'écran "Mes Réservations". Des frais peuvent s\'appliquer selon le délai d\'annulation.' },
  { question: 'Où puis-je trouver ma facture ?', answer: 'Vos factures sont disponibles dans la section "Mes Courses" une fois la course terminée. Vous pouvez les télécharger en PDF.' },
  { question: 'Comment contacter mon chauffeur ?', answer: 'Une fois votre course attribuée, vous pouvez appeler ou envoyer un message à votre chauffeur directement depuis les détails de la réservation.' },
  { question: 'Le prix peut-il changer ?', answer: 'Le prix est fixe pour les forfaits. Pour les courses à la demande, le prix final est calculé à la fin de la course et peut varier légèrement de l\'estimation.' },
];

const FAQ_DATA_DRIVER = [
  { question: "Comment recevoir mes paiements ?", answer: "Les paiements sont effectués par virement bancaire chaque semaine. Assurez-vous que vos informations bancaires sont à jour dans votre profil." },
  { question: "Comment modifier mes disponibilités ?", answer: "Vous pouvez gérer vos disponibilités depuis l'écran d'accueil de l'application en activant ou désactivant le mode 'En ligne'." },
  { question: "Que faire en cas d'accident ?", answer: "Assurez votre sécurité et celle du passager, puis contactez immédiatement le support via le bouton d'urgence et les autorités si nécessaire." },
  { question: "Comment annuler une course ?", answer: "Si vous ne pouvez pas effectuer une course qui vous est assignée, veuillez contacter le support client le plus rapidement possible pour qu'un autre chauffeur soit assigné." },
];

function FaqItem({ item }: { item: { question: string, answer: string } }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <View style={helpModalStyles.faqItem}>
      <TouchableOpacity style={helpModalStyles.faqQuestionRow} onPress={() => setExpanded(!expanded)}>
        <Text style={helpModalStyles.faqQuestion}>{item.question}</Text>
        <AppIcon name={expanded ? "chevron-up-outline" : "chevron-down-outline"} size={20} color={Colors.bordeaux} />
      </TouchableOpacity>
      {expanded && (
        <Text style={helpModalStyles.faqAnswer}>{item.answer}</Text>
      )}
    </View>
  );
}

function HelpModal({ visible, onClose, role }: { visible: boolean, onClose: () => void, role?: string }) {
  const handleCall = () => {
    Linking.openURL('tel:0123456789');
  };

  const handleEmail = () => {
    Linking.openURL('mailto:support@eazyvtc.com');
  };

  const FAQ_DATA = role === 'driver' ? FAQ_DATA_DRIVER : FAQ_DATA_CLIENT;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={helpModalStyles.backdrop} onPress={onClose} />
      <View style={helpModalStyles.sheet}>
        <View style={helpModalStyles.handle} />
        <Text style={helpModalStyles.title}>Support {role === 'driver' ? 'Chauffeur' : 'Client'}</Text>
        <Text style={helpModalStyles.subtitle}>Nous sommes là pour vous aider.</Text>

        <ScrollView showsVerticalScrollIndicator={false}>
          <LinearGradient
            colors={[Colors.bordeaux, Colors.bordeauxLight]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={helpModalStyles.contactCard}
          >
            <View style={helpModalStyles.contactTop}>
              <View style={helpModalStyles.contactIconBg}>
                <AppIcon name="headset-outline" size={28} color={Colors.white} />
              </View>
              <View style={helpModalStyles.contactTextContainer}>
                <Text style={helpModalStyles.contactTitle}>Besoin d'aide immédiate?</Text>
                <Text style={helpModalStyles.contactPhone}>Appelez-nous au 01 23 45 67 89</Text>
              </View>
            </View>
            <View style={helpModalStyles.contactActions}>
              <TouchableOpacity style={helpModalStyles.contactButton} onPress={handleCall}>
                <AppIcon name="call-outline" size={18} color={Colors.white} />
                <Text style={helpModalStyles.contactButtonText}>Appeler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={helpModalStyles.contactButton} onPress={handleEmail}>
                <AppIcon name="mail-outline" size={18} color={Colors.white} />
                <Text style={helpModalStyles.contactButtonText}>Email</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>

          <View style={helpModalStyles.faqContainer}>
            <Text style={helpModalStyles.faqTitle}>Questions fréquentes</Text>
            {FAQ_DATA.map((item, index) => <FaqItem key={index} item={item} />)}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const helpModalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '85%',
    backgroundColor: Colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: Spacing.md,
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.bordeauxLight,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  title: { fontSize: Fonts.size.xl, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center' },
  subtitle: { fontSize: Fonts.size.md, color: Colors.textMuted, textAlign: 'center', marginBottom: Spacing.lg },
  contactCard: {
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  contactTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  contactIconBg: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  contactTextContainer: { flex: 1 },
  contactTitle: { color: Colors.white, fontSize: Fonts.size.md, fontWeight: '700' },
  contactPhone: { color: Colors.white, opacity: 0.8, fontSize: Fonts.size.sm, marginTop: 4 },
  contactActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.lg },
  contactButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: 'rgba(255,255,255,0.1)', paddingVertical: Spacing.sm, borderRadius: Radius.md },
  contactButtonText: { color: Colors.white, fontWeight: '600' },
  faqContainer: { gap: Spacing.sm, paddingBottom: Spacing.sm },
  faqTitle: { fontSize: Fonts.size.lg, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.sm },
  faqItem: { backgroundColor: Colors.white, borderRadius: Radius.md, padding: Spacing.md, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  faqQuestionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  faqQuestion: { flex: 1, fontSize: Fonts.size.md, fontWeight: '600', color: Colors.textPrimary, marginRight: Spacing.sm },
  faqAnswer: { fontSize: Fonts.size.sm, color: Colors.textSecondary, marginTop: Spacing.sm, lineHeight: 20, borderTopWidth: 1, borderTopColor: Colors.bordeauxLight, paddingTop: Spacing.sm },
});

const modalStyles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 20 },
  container: { backgroundColor: Colors.background, borderRadius: 12, padding: 16 },
  title: { fontSize: Fonts.size.lg, fontWeight: '800', marginBottom: 16, textAlign: 'center' },
  input: { backgroundColor: Colors.white, borderRadius: 8, padding: 12, elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3 },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 2, marginBottom: 12, justifyContent: 'space-between' },
  categoryBtn: {width: '30%',   alignItems: 'center', justifyContent: 'center',padding: 2, borderRadius: 8, backgroundColor: Colors.beigeLight, margin: 4, minWidth: 80, elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3 },
  categoryActive: { backgroundColor: Colors.bordeaux },
  categoryText: { color: Colors.textSecondary, textTransform: 'capitalize', fontSize: Fonts.size.xs },
  categoryActiveText: { color: Colors.white, fontWeight: '700', textTransform: 'capitalize' },
  charCount: {
    fontSize: Fonts.size.xs,
    color: Colors.textMuted,
    textAlign: 'right',
    marginTop: 4,
    marginBottom: 10,
  },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.sm },
  actionBtn: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center', marginHorizontal: 6 , elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3 },
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
    borderRadius: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: Colors.bordeaux,
    borderRadius: 10,
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