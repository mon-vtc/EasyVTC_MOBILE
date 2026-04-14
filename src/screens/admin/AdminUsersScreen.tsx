// screens/admin/AdminUsersScreen.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Image, RefreshControl, Modal, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons }  from '@expo/vector-icons';
import { Colors, Fonts, Spacing, Radius } from '../../theme/colors';
import { useAdmin }  from '../../hooks/useAdmin';
import type { AuthUser, UserRole, UserStatus } from '../../types';

type FilterTab = 'tous' | 'clients' | 'chauffeurs';

const TABS: { key: FilterTab; label: string; role?: UserRole }[] = [
  { key: 'tous',      label: 'Tous'       },
  { key: 'clients',   label: 'Clients',   role: 'client' },
  { key: 'chauffeurs',label: 'Chauffeurs',role: 'driver' },
];

const ROLE_LABELS: Record<UserRole, string> = {
  client:  'Client',
  driver:  'Chauffeur',
  admin:   'Admin',
  manager: 'Gestionnaire',
};

const STATUS_CONFIG: Record<UserStatus, { label: string; bg: string; color: string }> = {
  active:   { label: 'Actif',    bg: '#E8F5E9', color: '#2E7D32' },
  inactive: { label: 'Inactif',  bg: '#FFF3E0', color: '#E65100' },
  locked:   { label: 'Suspendu', bg: '#f5e2e2', color: '#C62828' },
};

// ── Carte utilisateur ────────────────────────────────────────────
function UserCard({
  user,
  onAction,
}: {
  user:     AuthUser;
  onAction: (user: AuthUser) => void;
}) {
  const initials = `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase();
  const statusCfg = STATUS_CONFIG[user.status] ?? STATUS_CONFIG.active;

  return (
    <View style={cardStyles.wrapper}>
      <View style={cardStyles.top}>
        {/* Avatar */}
        <View style={cardStyles.avatar}>
          {user.profile_photo_url ? (
            <Image source={{ uri: user.profile_photo_url }} style={cardStyles.avatarImg} />
          ) : (
            <Text style={cardStyles.avatarInitials}>{initials}</Text>
          )}
        </View>

        {/* Infos */}
        <View style={cardStyles.info}>
          <View style={cardStyles.nameRow}>
            <Text style={cardStyles.name} numberOfLines={1}>
              {user.first_name} {user.last_name}
            </Text>
            <View style={[cardStyles.badge, { backgroundColor: statusCfg.bg }]}>
              <Text style={[cardStyles.badgeText, { color: statusCfg.color }]}>
                {statusCfg.label}
              </Text>
            </View>
          </View>
          <Text style={cardStyles.email} numberOfLines={1}>{user.email}</Text>
          {user.phone && (
            <Text style={cardStyles.phone}>{user.phone}</Text>
          )}
        </View>
      </View>

      {/* Footer */}
      <View style={cardStyles.footer}>
        <View style={cardStyles.rolePill}>
          <Text style={cardStyles.roleText}>{ROLE_LABELS[user.role]}</Text>
        </View>
        <TouchableOpacity
          style={cardStyles.actionBtn}
          onPress={() => onAction(user)}
          activeOpacity={0.75}
        >
          <Ionicons name="shield-outline" size={14} color={Colors.bordeaux} />
          <Text style={cardStyles.actionText}>Gérer le statut</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const cardStyles = StyleSheet.create({
  wrapper: {
    backgroundColor: Colors.surface,
    borderRadius:    Radius.md,
    borderWidth:     1,
    borderColor:     Colors.border,
    padding:         Spacing.md,
    marginBottom:    Spacing.sm,
  },
  top:           { flexDirection: 'row', alignItems: 'flex-start', marginBottom: Spacing.sm },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.beigeLight,
    alignItems: 'center', justifyContent: 'center',
    marginRight: Spacing.md, overflow: 'hidden', flexShrink: 0,
  },
  avatarImg:      { width: '100%', height: '100%' },
  avatarInitials: { fontSize: Fonts.size.md, fontWeight: '700', color: Colors.bordeaux },
  info:           { flex: 1 },
  nameRow:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm },
  name:           { fontSize: Fonts.size.md, fontWeight: '700', color: Colors.textPrimary, flex: 1 },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical:   2,
    borderRadius:      Radius.full,
  },
  badgeText:  { fontSize: Fonts.size.xs, fontWeight: '600' },
  email:      { fontSize: Fonts.size.sm, color: Colors.textMuted, marginTop: 2 },
  phone:      { fontSize: Fonts.size.sm, color: Colors.textSecondary, marginTop: 1 },
  footer: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    paddingTop:     Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  rolePill: {
    backgroundColor: Colors.overlayLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical:   3,
    borderRadius:      Radius.full,
  },
  roleText:   { fontSize: Fonts.size.xs, fontWeight: '600', color: Colors.bordeaux },
  actionBtn:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionText: { fontSize: Fonts.size.sm, color: Colors.bordeaux, fontWeight: '500' },
});

// ── Modal changement de statut ───────────────────────────────────
type NextStatus = 'active' | 'inactive' | 'locked';

function StatusModal({
  user,
  visible,
  onClose,
  onConfirm,
  isLoading,
}: {
  user:      AuthUser | null;
  visible:   boolean;
  onClose:   () => void;
  onConfirm: (status: NextStatus, reason: string) => void;
  isLoading: boolean;
}) {
  const [chosen, setChosen] = useState<NextStatus | null>(null);
  const [reason, setReason] = useState('');

  const reset = () => { setChosen(null); setReason(''); };
  const handleClose = () => { reset(); onClose(); };

  const ACTIONS: { status: NextStatus; label: string; icon: string; color: string }[] = [
    { status: 'active',   label: 'Activer',    icon: 'checkmark-circle-outline', color: '#2E7D32' },
    { status: 'inactive', label: 'Désactiver', icon: 'pause-circle-outline',     color: '#E65100' },
    { status: 'locked',   label: 'Suspendre',  icon: 'ban-outline',              color: '#C62828' },
  ].filter(a => a.status !== user?.status);

  const handleConfirm = () => {
    if (!chosen) { Alert.alert('Action requise', 'Sélectionnez un statut.'); return; }
    if (!reason.trim()) { Alert.alert('Motif requis', 'Saisissez un motif pour cette action.'); return; }
    onConfirm(chosen, reason.trim());
    reset();
  };

  if (!user) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={modalStyles.overlay}>
        <View style={modalStyles.card}>
          <Text style={modalStyles.title}>Statut du compte</Text>
          <Text style={modalStyles.subtitle}>
            {user.first_name} {user.last_name} · {ROLE_LABELS[user.role]}
          </Text>

          <Text style={modalStyles.sectionLabel}>Nouvelle action</Text>
          {ACTIONS.map(a => (
            <TouchableOpacity
              key={a.status}
              style={[modalStyles.option, chosen === a.status && modalStyles.optionSelected]}
              onPress={() => setChosen(a.status)}
              activeOpacity={0.8}
            >
              <Ionicons name={a.icon as any} size={18} color={a.color} />
              <Text style={[modalStyles.optionLabel, { color: a.color }]}>{a.label}</Text>
              {chosen === a.status && (
                <Ionicons name="checkmark" size={16} color={a.color} style={{ marginLeft: 'auto' }} />
              )}
            </TouchableOpacity>
          ))}

          <Text style={[modalStyles.sectionLabel, { marginTop: Spacing.md }]}>Motif *</Text>
          <TextInput
            style={modalStyles.reasonInput}
            value={reason}
            onChangeText={setReason}
            placeholder="Ex : Documents non conformes, Demande de l'utilisateur…"
            placeholderTextColor={Colors.textPlaceholder}
            multiline
            numberOfLines={3}
          />

          <View style={modalStyles.btnRow}>
            <TouchableOpacity style={modalStyles.btnCancel} onPress={handleClose}>
              <Text style={modalStyles.btnCancelText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[modalStyles.btnConfirm, (!chosen || !reason.trim()) && modalStyles.btnDisabled]}
              onPress={handleConfirm}
              disabled={isLoading || !chosen || !reason.trim()}
            >
              {isLoading
                ? <ActivityIndicator size="small" color={Colors.white} />
                : <Text style={modalStyles.btnConfirmText}>Confirmer</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  overlay:  { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  card: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius:  Radius.lg,
    borderTopRightRadius: Radius.lg,
    padding:   Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  title:        { fontSize: Fonts.size.lg, fontWeight: '800', color: Colors.bordeaux, marginBottom: 4 },
  subtitle:     { fontSize: Fonts.size.sm, color: Colors.textMuted, marginBottom: Spacing.md },
  sectionLabel: { fontSize: Fonts.size.sm, fontWeight: '600', color: Colors.textSecondary, marginBottom: Spacing.xs },
  option: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             Spacing.sm,
    padding:         Spacing.sm,
    borderRadius:    Radius.md,
    borderWidth:     1,
    borderColor:     Colors.border,
    marginBottom:    Spacing.xs,
  },
  optionSelected: { borderColor: Colors.bordeaux, backgroundColor: Colors.overlayLight },
  optionLabel:    { fontSize: Fonts.size.md, fontWeight: '600' },
  reasonInput: {
    borderWidth:    1,
    borderColor:    Colors.border,
    borderRadius:   Radius.md,
    padding:        Spacing.md,
    fontSize:       Fonts.size.sm,
    color:          Colors.textPrimary,
    minHeight:      72,
    textAlignVertical: 'top',
  },
  btnRow:          { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
  btnCancel: {
    flex: 1, paddingVertical: Spacing.md,
    borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center',
  },
  btnCancelText:   { fontSize: Fonts.size.md, color: Colors.textSecondary, fontWeight: '600' },
  btnConfirm: {
    flex: 2, paddingVertical: Spacing.md,
    borderRadius: Radius.md, backgroundColor: Colors.bordeaux,
    alignItems: 'center',
  },
  btnConfirmText:  { fontSize: Fonts.size.md, color: Colors.white, fontWeight: '700' },
  btnDisabled:     { opacity: 0.4 },
});

// ── Screen principal ─────────────────────────────────────────────
export default function AdminUsersScreen() {
  const {
    fetchUsers, fetchClients, fetchDrivers,
    activateUser, deactivateUser, lockUser,
    users, total, isUsersLoading, usersError, clearUsersError,
  } = useAdmin();

  const [activeTab,    setActiveTab]    = useState<FilterTab>('tous');
  const [search,       setSearch]       = useState('');
  const [refreshing,   setRefreshing]   = useState(false);
  const [actionUser,   setActionUser]   = useState<AuthUser | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [actionLoading,setActionLoading]= useState(false);

  const fetchRef = useRef(fetchUsers);
  fetchRef.current = fetchUsers;
  const fetchClientsRef = useRef(fetchClients);
  fetchClientsRef.current = fetchClients;
  const fetchDriversRef = useRef(fetchDrivers);
  fetchDriversRef.current = fetchDrivers;

  const load = useCallback(async (tab: FilterTab, q: string) => {
    const params = q.trim() ? { search: q.trim() } : undefined;
    if (tab === 'clients')    await fetchClientsRef.current(params);
    else if (tab === 'chauffeurs') await fetchDriversRef.current(params);
    else                      await fetchRef.current(params);
  }, []);

  // Chargement initial
  useEffect(() => { load(activeTab, search); }, []);

  // Rechargement sur changement d'onglet
  const handleTabChange = (tab: FilterTab) => {
    setActiveTab(tab);
    setSearch('');
    load(tab, '');
  };

  // Recherche avec debounce
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSearch = (text: string) => {
    setSearch(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => load(activeTab, text), 400);
  };

  // Pull-to-refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await load(activeTab, search).catch(() => null);
    setRefreshing(false);
  };

  // Ouvrir modal statut
  const openAction = (user: AuthUser) => {
    setActionUser(user);
    setModalVisible(true);
  };

  // Confirmer changement statut
  const handleStatusConfirm = async (status: 'active' | 'inactive' | 'locked', reason: string) => {
    if (!actionUser) return;
    setActionLoading(true);
    try {
      if (status === 'active')   await activateUser(actionUser.id, reason);
      else if (status === 'inactive') await deactivateUser(actionUser.id, reason);
      else                       await lockUser(actionUser.id, reason);
      setModalVisible(false);
      setActionUser(null);
      await load(activeTab, search);
    } catch (err: any) {
      Alert.alert('Erreur', err.message ?? 'Impossible de modifier le statut.');
    } finally {
      setActionLoading(false);
    }
  };

  // Alerte erreur
  useEffect(() => {
    if (usersError) {
      Alert.alert('Erreur', usersError, [{ text: 'OK', onPress: clearUsersError }]);
    }
  }, [usersError]);

  return (
    <View style={styles.container}>
      {/* Barre de recherche */}
      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={18} color={Colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={handleSearch}
          placeholder="Nom, email, téléphone…"
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
      {!isUsersLoading && (
        <Text style={styles.countText}>{total} utilisateur{total > 1 ? 's' : ''}</Text>
      )}

      {/* Liste */}
      {isUsersLoading && !refreshing ? (
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
          {users.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={48} color={Colors.border} />
              <Text style={styles.emptyText}>Aucun utilisateur trouvé</Text>
            </View>
          ) : (
            users.map(u => (
              <UserCard key={u.id} user={u} onAction={openAction} />
            ))
          )}
        </ScrollView>
      )}

      {/* Modal statut */}
      <StatusModal
        user={actionUser}
        visible={modalVisible}
        onClose={() => { setModalVisible(false); setActionUser(null); }}
        onConfirm={handleStatusConfirm}
        isLoading={actionLoading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: Colors.background },
  searchRow: {
    flexDirection:  'row',
    alignItems:     'center',
    backgroundColor: Colors.surface,
    margin:          Spacing.md,
    marginBottom:    Spacing.sm,
    borderRadius:    Radius.md,
    borderWidth:     1,
    borderColor:     Colors.border,
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
  tab: {
    flex: 1, paddingVertical: Spacing.xs,
    borderRadius: Radius.sm - 1,
    alignItems:   'center',
  },
  tabActive:     { backgroundColor: Colors.bordeaux },
  tabText:       { fontSize: Fonts.size.sm, color: Colors.textMuted,  fontWeight: '600' },
  tabTextActive: { fontSize: Fonts.size.sm, color: Colors.white,      fontWeight: '700' },
  countText: {
    fontSize:       Fonts.size.xs,
    color:          Colors.textMuted,
    marginHorizontal: Spacing.lg,
    marginBottom:   Spacing.xs,
  },
  list:    { paddingHorizontal: Spacing.md, paddingBottom: Spacing.xl },
  center:  { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  empty:   { alignItems: 'center', paddingTop: 60, gap: Spacing.md },
  emptyText: { fontSize: Fonts.size.md, color: Colors.textMuted },
});
