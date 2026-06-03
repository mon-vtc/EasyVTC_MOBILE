import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Image, RefreshControl, Modal, ActivityIndicator,
  Platform,
} from 'react-native';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, Radius } from '../../../theme/colors';
import { useClientsStore, useAuthStore } from '../../../store';
import { useToast } from '../../../hooks/useToast';
import type { ClientWithStats, ClientGlobalStats, ClientListFilters, ClientsStackParamList } from '../../../types';

type Nav = NativeStackNavigationProp<ClientsStackParamList, 'ClientsList'>;

type FilterTab = 'tous' | 'actifs' | 'inactifs';

const TABS: { key: FilterTab; label: string; status?: 'active' | 'inactive' | 'locked' }[] = [
  { key: 'tous',     label: 'Tous' },
  { key: 'actifs',   label: 'Actifs',   status: 'active'   },
  { key: 'inactifs', label: 'Inactifs', status: 'inactive' },
];

const STATUS_CONFIG = {
  active:   { label: 'Actif',    bg: '#E8F5E9', color: '#2E7D32' },
  inactive: { label: 'Inactif',  bg: '#FFF3E0', color: '#E65100' },
  locked:   { label: 'Suspendu', bg: '#f5e2e2', color: '#C62828' },
};

// ── Actions de statut ─────────────────────────────────────────────────────────
type NextStatus = 'active' | 'inactive' | 'locked';

function StatusModal({
  client, visible, onClose, onConfirm, isLoading,
}: {
  client:    ClientWithStats | null;
  visible:   boolean;
  onClose:   () => void;
  onConfirm: (status: NextStatus, reason: string) => void;
  isLoading: boolean;
}) {
  const [chosen, setChosen] = useState<NextStatus | null>(null);
  const [reason, setReason] = useState('');

  const reset = () => { setChosen(null); setReason(''); };
  const handleClose = () => { reset(); onClose(); };

  const ACTIONS: { status: NextStatus; label: string; icon: string; color: string }[] = ([
    { status: 'active' as NextStatus,   label: 'Activer',    icon: 'checkmark-circle-outline', color: '#2E7D32' },
    { status: 'inactive' as NextStatus, label: 'Désactiver', icon: 'pause-circle-outline',     color: '#E65100' },
    { status: 'locked' as NextStatus,   label: 'Suspendre',  icon: 'ban-outline',              color: '#C62828' },
  ]).filter(a => a.status !== client?.status);

  if (!client) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={modalSt.overlay}>
        <View style={modalSt.card}>
          <Text style={modalSt.title}>Statut du compte</Text>
          <Text style={modalSt.subtitle}>{client.first_name} {client.last_name}</Text>

          <Text style={modalSt.label}>Nouvelle action</Text>
          {ACTIONS.map(a => (
            <TouchableOpacity
              key={a.status}
              style={[modalSt.option, chosen === a.status && modalSt.optionSelected]}
              onPress={() => setChosen(a.status)}
              activeOpacity={0.8}
            >
              <Ionicons name={a.icon as any} size={18} color={a.color} />
              <Text style={[modalSt.optionLabel, { color: a.color }]}>{a.label}</Text>
              {chosen === a.status && (
                <Ionicons name="checkmark" size={16} color={a.color} style={{ marginLeft: 'auto' }} />
              )}
            </TouchableOpacity>
          ))}

          <Text style={[modalSt.label, { marginTop: Spacing.md }]}>Motif *</Text>
          <TextInput
            style={modalSt.input}
            value={reason}
            onChangeText={setReason}
            placeholder="Ex : Demande utilisateur, Comportement inapproprié…"
            placeholderTextColor={Colors.textPlaceholder}
            multiline
            numberOfLines={3}
          />

          <View style={modalSt.btnRow}>
            <TouchableOpacity style={modalSt.btnCancel} onPress={handleClose}>
              <Text style={modalSt.btnCancelText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[modalSt.btnConfirm, (!chosen || !reason.trim()) && modalSt.btnDisabled]}
              onPress={() => {
                if (!chosen || !reason.trim()) return;
                onConfirm(chosen, reason.trim());
                reset();
              }}
              disabled={isLoading || !chosen || !reason.trim()}
            >
              {isLoading
                ? <ActivityIndicator size="small" color={Colors.white} />
                : <Text style={modalSt.btnConfirmText}>Confirmer</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const modalSt = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  card: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius:  Radius.lg,
    borderTopRightRadius: Radius.lg,
    padding:   Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  title:         { fontSize: Fonts.size.lg, fontWeight: '800', color: Colors.bordeaux, marginBottom: 4 },
  subtitle:      { fontSize: Fonts.size.sm, color: Colors.textMuted, marginBottom: Spacing.md },
  label:         { fontSize: Fonts.size.sm, fontWeight: '600', color: Colors.textSecondary, marginBottom: Spacing.xs },
  option: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    padding: Spacing.sm, borderRadius: Radius.md, borderWidth: 1,
    borderColor: Colors.border, marginBottom: Spacing.xs,
  },
  optionSelected: { borderColor: Colors.bordeaux, backgroundColor: Colors.overlayLight },
  optionLabel:    { fontSize: Fonts.size.md, fontWeight: '600' },
  input: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md,
    padding: Spacing.md, fontSize: Fonts.size.sm, color: Colors.textPrimary,
    minHeight: 72, textAlignVertical: 'top',
  },
  btnRow:        { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
  btnCancel: {
    flex: 1, paddingVertical: Spacing.md, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border, alignItems: 'center',
  },
  btnCancelText:  { fontSize: Fonts.size.md, color: Colors.textSecondary, fontWeight: '600' },
  btnConfirm: {
    flex: 2, paddingVertical: Spacing.md, borderRadius: Radius.md,
    backgroundColor: Colors.bordeaux, alignItems: 'center',
  },
  btnConfirmText: { fontSize: Fonts.size.md, color: Colors.white, fontWeight: '700' },
  btnDisabled:    { opacity: 0.4 },
});

// ── Carte client ─────────────────────────────────────────────────────────────
function ClientCard({
  client, onPress, onAction,
}: {
  client:   ClientWithStats;
  onPress:  (c: ClientWithStats) => void;
  onAction: (c: ClientWithStats) => void;
}) {
  const initials  = `${client.first_name?.[0] ?? ''}${client.last_name?.[0] ?? ''}`.toUpperCase();
  const statusCfg = STATUS_CONFIG[client.status] ?? STATUS_CONFIG.active;

  const lastDate = client.last_trip_date
    ? new Date(client.last_trip_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
    : '—';

  return (
    <TouchableOpacity style={cardSt.wrapper} onPress={() => onPress(client)} activeOpacity={0.75}>
      {/* Ligne titre */}
      <View style={cardSt.topRow}>
        <View style={cardSt.avatar}>
          {client.profile_photo_url
            ? <Image source={{ uri: client.profile_photo_url }} style={cardSt.avatarImg} />
            : <Text style={cardSt.avatarInitials}>{initials}</Text>
          }
        </View>

        <View style={cardSt.nameBlock}>
          <View style={cardSt.nameRow}>
            <Text style={cardSt.name} numberOfLines={1}>
              {client.first_name} {client.last_name}
            </Text>
            <View style={[cardSt.badge, { backgroundColor: statusCfg.bg }]}>
              <Text style={[cardSt.badgeText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
            </View>
          </View>

          {/* Note */}
          {client.avg_rating !== null ? (
            <View style={cardSt.ratingRow}>
              <Ionicons name="star" size={13} color="#F59E0B" />
              <Text style={cardSt.ratingText}>{client.avg_rating.toFixed(1)}</Text>
            </View>
          ) : null}

          {/* Email */}
          <View style={cardSt.infoRow}>
            <Ionicons name="mail-outline" size={13} color={Colors.textMuted} />
            <Text style={cardSt.infoText} numberOfLines={1}>{client.email}</Text>
          </View>

          {/* Téléphone */}
          {client.phone && (
            <View style={cardSt.infoRow}>
              <Ionicons name="call-outline" size={13} color={Colors.textMuted} />
              <Text style={cardSt.infoText}>{client.phone}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Stats footer */}
      <View style={cardSt.footer}>
        <View style={cardSt.stat}>
          <Text style={cardSt.statLabel}>Courses</Text>
          <Text style={cardSt.statValue}>{client.total_trips}</Text>
        </View>
        <View style={cardSt.stat}>
          <Text style={cardSt.statLabel}>Dépensé</Text>
          <Text style={cardSt.statValue}>{client.total_spent.toFixed(0)} €</Text>
        </View>
        <View style={cardSt.stat}>
          <Text style={cardSt.statLabel}>Dernière</Text>
          <Text style={cardSt.statValue}>{lastDate}</Text>
        </View>
        <TouchableOpacity
          style={cardSt.actionBtn}
          onPress={(e) => { e.stopPropagation(); onAction(client); }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.75}
        >
          <Ionicons name="shield-outline" size={14} color={Colors.bordeaux} />
          <Text style={cardSt.actionText}>Statut</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const cardSt = StyleSheet.create({
  wrapper: {
    backgroundColor: Colors.surface,
    borderRadius:    Radius.md,
    borderWidth:     1,
    borderColor:     Colors.border,
    padding:         Spacing.md,
    marginBottom:    Spacing.sm,
  },
  topRow:    { flexDirection: 'row', alignItems: 'flex-start', marginBottom: Spacing.sm },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.beigeLight,
    alignItems: 'center', justifyContent: 'center',
    marginRight: Spacing.md, overflow: 'hidden', flexShrink: 0,
  },
  avatarImg:      { width: '100%', height: '100%' },
  avatarInitials: { fontSize: Fonts.size.md, fontWeight: '700', color: Colors.bordeaux },
  nameBlock:  { flex: 1 },
  nameRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.xs, marginBottom: 2 },
  name:       { fontSize: Fonts.size.md, fontWeight: '700', color: Colors.textPrimary, flex: 1 },
  badge: {
    paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: Radius.full,
  },
  badgeText:  { fontSize: Fonts.size.xs, fontWeight: '600' },
  ratingRow:  { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 2 },
  ratingText: { fontSize: Fonts.size.sm, color: Colors.textPrimary, fontWeight: '600' },
  infoRow:    { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  infoText:   { fontSize: Fonts.size.sm, color: Colors.textMuted, flex: 1 },
  footer: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'space-between',
    paddingTop:      Spacing.sm,
    borderTopWidth:  1,
    borderTopColor:  Colors.border,
    gap:             Spacing.xs,
  },
  stat:       { alignItems: 'center', flex: 1 },
  statLabel:  { fontSize: 10, color: Colors.textMuted, marginBottom: 1 },
  statValue:  { fontSize: Fonts.size.sm, fontWeight: '700', color: Colors.textPrimary },
  actionBtn:  { flexDirection: 'row', alignItems: 'center', gap: 3 },
  actionText: { fontSize: Fonts.size.sm, color: Colors.bordeaux, fontWeight: '500' },
});

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({ icon, label, value, iconBg, iconColor }: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string; value: string;
  iconBg: string; iconColor: string;
}) {
  return (
    <View style={kpiSt.card}>
      <View style={[kpiSt.iconCircle, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <Text style={kpiSt.label}>{label}</Text>
      <Text style={kpiSt.value}>{value}</Text>
    </View>
  );
}

const kpiSt = StyleSheet.create({
  card: {
    flex: 1, backgroundColor: Colors.surface,
    borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.sm, alignItems: 'center', gap: 4,
  },
  iconCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  label:      { fontSize: 10, color: Colors.textMuted, textAlign: 'center' },
  value:      { fontSize: Fonts.size.md, fontWeight: '800', color: Colors.textPrimary },
});

// ── Écran principal ───────────────────────────────────────────────────────────
export default function AdminClientsScreen() {
  const navigation   = useNavigation<Nav>();
  const accessToken  = useAuthStore(s => s.accessToken);

  const { showToast } = useToast();

  const {
    clients, total, globalStats, isLoading,
    fetchClients, changeClientStatus, error, clearError,
  } = useClientsStore();

  const [activeTab,     setActiveTab]     = useState<FilterTab>('tous');
  const [search,        setSearch]        = useState('');
  const [refreshing,    setRefreshing]    = useState(false);
  const [actionClient,  setActionClient]  = useState<ClientWithStats | null>(null);
  const [modalVisible,  setModalVisible]  = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async (tab: FilterTab, q: string) => {
    const params: ClientListFilters = {};
    if (tab === 'actifs')   params.status = 'active';
    if (tab === 'inactifs') params.status = 'inactive';
    if (q.trim()) params.search = q.trim();
    await fetchClients(accessToken!, params);
  }, [fetchClients, accessToken]);

  useEffect(() => { load('tous', ''); }, []);

  const handleTabChange = (tab: FilterTab) => {
    setActiveTab(tab);
    setSearch('');
    load(tab, '');
  };

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSearch = (text: string) => {
    setSearch(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => load(activeTab, text), 400);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await load(activeTab, search).catch(() => null);
    setRefreshing(false);
  };

  const handleStatusConfirm = async (status: NextStatus, reason: string) => {
    if (!actionClient) return;
    setActionLoading(true);
    try {
      await changeClientStatus(accessToken!, actionClient.id, { status, reason });
      setModalVisible(false);
      setActionClient(null);
      await load(activeTab, search);
    } catch (err: any) {
      showToast({ title: 'Erreur', message: err.message ?? 'Impossible de modifier le statut.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    if (error) showToast({ title: 'Erreur', message: error, type: 'error', onPress: clearError });
  }, [error]);

  const stats = globalStats ?? { active_count: 0, total_trips: 0, total_revenue: 0 };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
        >
          <Ionicons name="menu-outline" size={26} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Clients</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* KPIs */}
      <View style={styles.kpiRow}>
        <KpiCard
          icon="person-outline"
          label="Actifs"
          value={String(stats.active_count)}
          iconBg="#E6F4EA"
          iconColor="#34A853"
        />
        <KpiCard
          icon="car-outline"
          label="Courses"
          value={String(stats.total_trips)}
          iconBg="#E8F0FE"
          iconColor="#4285F4"
        />
        <KpiCard
          icon="cash-outline"
          label="Revenus"
          value={`${stats.total_revenue.toFixed(0)} €`}
          iconBg="#FDF3E6"
          iconColor="#E67E22"
        />
      </View>

      {/* Recherche */}
      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={18} color={Colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={handleSearch}
          placeholder="Rechercher un client..."
          placeholderTextColor={Colors.textPlaceholder}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      {/* Onglets */}
      <View style={styles.tabRow}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => handleTabChange(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Total */}
      {!isLoading && (
        <Text style={styles.countText}>{total} client{total > 1 ? 's' : ''}</Text>
      )}

      {/* Liste */}
      {isLoading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.bordeaux} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.bordeaux}
              colors={[Colors.bordeaux]}
            />
          }
          keyboardShouldPersistTaps="handled"
        >
          {clients.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={48} color={Colors.border} />
              <Text style={styles.emptyText}>Aucun client trouvé</Text>
            </View>
          ) : (
            clients.map(c => (
              <ClientCard
                key={c.id}
                client={c}
                onPress={client => navigation.navigate('ClientDetail', { clientId: client.id })}
                onAction={client => { setActionClient(client); setModalVisible(true); }}
              />
            ))
          )}
        </ScrollView>
      )}

      <StatusModal
        client={actionClient}
        visible={modalVisible}
        onClose={() => { setModalVisible(false); setActionClient(null); }}
        onConfirm={handleStatusConfirm}
        isLoading={actionLoading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: {
    flexDirection:      'row',
    alignItems:         'center',
    justifyContent:     'space-between',
    backgroundColor:    Colors.bordeaux,
    paddingTop:         Platform.OS === 'ios' ? 56 : Spacing.xl + 8,
    paddingBottom:      Spacing.md,
    paddingHorizontal:  Spacing.md,
  },
  headerBtn:   { padding: Spacing.sm, width: 40 },
  headerTitle: { fontSize: Fonts.size.lg, fontWeight: '700', color: Colors.white },

  kpiRow: {
    flexDirection:    'row',
    gap:              Spacing.sm,
    marginHorizontal: Spacing.md,
    marginTop:        Spacing.md,
    marginBottom:     Spacing.sm,
  },

  searchRow: {
    flexDirection:    'row',
    alignItems:       'center',
    backgroundColor:  Colors.surface,
    margin:           Spacing.md,
    marginTop:        Spacing.sm,
    marginBottom:     Spacing.sm,
    borderRadius:     Radius.md,
    borderWidth:      1,
    borderColor:      Colors.border,
    paddingHorizontal: Spacing.sm,
  },
  searchIcon:  { marginRight: Spacing.xs },
  searchInput: {
    flex: 1, paddingVertical: Spacing.sm,
    fontSize: Fonts.size.sm, color: Colors.textPrimary,
  },

  tabRow: {
    flexDirection:    'row',
    marginHorizontal: Spacing.md,
    marginBottom:     Spacing.sm,
    backgroundColor:  Colors.surface,
    borderRadius:     Radius.md,
    borderWidth:      1,
    borderColor:      Colors.border,
    padding:          3,
  },
  tab:          { flex: 1, paddingVertical: Spacing.xs, borderRadius: Radius.sm - 1, alignItems: 'center' },
  tabActive:    { backgroundColor: Colors.bordeaux },
  tabText:      { fontSize: Fonts.size.sm, color: Colors.textMuted,  fontWeight: '600' },
  tabTextActive:{ fontSize: Fonts.size.sm, color: Colors.white,      fontWeight: '700' },

  countText: {
    fontSize: Fonts.size.xs, color: Colors.textMuted,
    marginHorizontal: Spacing.lg, marginBottom: Spacing.xs,
  },
  list:   { paddingHorizontal: Spacing.md, paddingBottom: Spacing.xl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  empty:  { alignItems: 'center', paddingTop: 60, gap: Spacing.md },
  emptyText: { fontSize: Fonts.size.md, color: Colors.textMuted },
});
