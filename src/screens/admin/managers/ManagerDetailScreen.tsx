// screens/admin/managers/ManagerDetailScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, Linking, Platform, Image, Modal,
  TextInput, Alert, 
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAdmin } from '../../../hooks/useAdmin';
import { Colors, Spacing, Radius, Fonts } from '../../../theme/colors';
import type { ManagersStackParamList, UserProfile } from '../../../types';

type Nav = NativeStackNavigationProp<ManagersStackParamList, 'ManagerDetail'>;

type ManagerStatus = 'active' | 'inactive' | 'locked';

const STATUS_CONFIG: Record<ManagerStatus, { label: string; bg: string; color: string; dot: string }> = {
  active:   { label: 'Actif',    bg: '#E6F9F1', color: '#34C77B', dot: '#34C77B' },
  inactive: { label: 'Inactif',  bg: '#FFF3E0', color: '#E65100', dot: '#E65100' },
  locked:   { label: 'Suspendu', bg: '#FDECEA', color: '#E53935', dot: '#E53935' },
};

// ── Modal statut ─────────────────────────────────────────────────
type NextStatus = 'active' | 'inactive' | 'locked';

function ChangeStatusModal({
  manager, visible, onClose, onConfirm, isLoading,
}: {
  manager:   UserProfile | null;
  visible:   boolean;
  onClose:   () => void;
  onConfirm: (status: NextStatus, reason: string) => void;
  isLoading: boolean;
}) {
  const [chosen, setChosen] = useState<NextStatus | null>(null);
  const [reason, setReason] = useState('');

  const reset = () => { setChosen(null); setReason(''); };
  const handleClose = () => { reset(); onClose(); };

  // Define all possible actions with 'as const' to preserve literal types
  const ALL_ACTIONS = [
    { status: 'active' as const,   label: 'Activer',    icon: 'checkmark-circle-outline', color: '#2E7D32' },
    { status: 'inactive' as const, label: 'Désactiver', icon: 'pause-circle-outline',     color: '#E65100' },
    { status: 'locked' as const,   label: 'Suspendre',  icon: 'ban-outline',              color: '#C62828' },
  ].filter(a => a.status !== manager?.status);

  const ACTIONS: { status: NextStatus; label: string; icon: string; color: string }[] = ALL_ACTIONS;

  if (!manager) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={modalSt.overlay}>
        <View style={modalSt.card}>
          <Text style={modalSt.title}>Modifier le statut</Text>
          <Text style={modalSt.subtitle}>{manager.first_name} {manager.last_name} · Gestionnaire</Text>

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
            placeholder="Ex : Demande de l'utilisateur, Documents non conformes…"
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
  overlay:        { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  card: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.lg, borderTopRightRadius: Radius.lg,
    padding: Spacing.lg, paddingBottom: Spacing.xl,
  },
  title:          { fontSize: Fonts.size.lg, fontWeight: '800', color: Colors.bordeaux, marginBottom: 4 },
  subtitle:       { fontSize: Fonts.size.sm, color: Colors.textMuted, marginBottom: Spacing.md },
  label:          { fontSize: Fonts.size.sm, fontWeight: '600', color: Colors.textSecondary, marginBottom: Spacing.xs },
  option: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    padding: Spacing.sm, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.xs,
  },
  optionSelected: { borderColor: Colors.bordeaux, backgroundColor: Colors.overlayLight },
  optionLabel:    { fontSize: Fonts.size.md, fontWeight: '600' },
  input: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md,
    padding: Spacing.md, fontSize: Fonts.size.sm, color: Colors.textPrimary,
    minHeight: 72, textAlignVertical: 'top',
  },
  btnRow:         { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
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

// ── Screen principal ─────────────────────────────────────────────
export default function ManagerDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<any>();
  const { managerId } = route.params as { managerId: string };

  const { fetchManagerById, changeManagerStatus } = useAdmin();
  const [manager,      setManager]      = useState<UserProfile | null>(null);
  const [isLoading,    setIsLoading]    = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [actionLoading,setActionLoading]= useState(false);

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      fetchManagerById(managerId)
        .then(data => setManager(data))
        .finally(() => setIsLoading(false));
    }, [managerId])
  );

  const handleStatusConfirm = async (status: NextStatus, reason: string) => {
    if (!manager) return;
    setActionLoading(true);
    try {
      const updated = await changeManagerStatus(manager.id, { status, reason });
      if (updated) setManager(updated);
      await fetchManagerById(manager.id); // Re-fetch to ensure all data is fresh
      setModalVisible(false);
    } catch (err: any) {
      Alert.alert('Erreur', err.message ?? 'Impossible de modifier le statut.');
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.bordeaux} />
      </View>
    );
  }

  if (!manager) {
    return (
      <View style={styles.center}>
        <Ionicons name="person-outline" size={48} color={Colors.border} />
        <Text style={styles.errorText}>Gestionnaire introuvable.</Text>
      </View>
    );
  }

  const initials   = `${manager.first_name?.[0] ?? ''}${manager.last_name?.[0] ?? ''}`.toUpperCase();
  const statusCfg  = STATUS_CONFIG[manager.status as ManagerStatus] ?? STATUS_CONFIG.inactive;
  const memberSince = new Date(manager.created_at).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profil gestionnaire</Text>
        <TouchableOpacity
          style={styles.headerEditBtn}
          onPress={() => navigation.navigate('EditManager', { managerId: manager.id })}
        >
          <Ionicons name="pencil-outline" size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Carte identité */}
        <View style={styles.identityCard}>
          <View style={styles.avatarWrapper}>
            {manager.profile_photo_url ? (
              <Image source={{ uri: manager.profile_photo_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            )}
          </View>

          <View style={styles.nameRow}>
            <Text style={styles.managerName}>{manager.first_name} {manager.last_name}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
              <View style={[styles.statusDot, { backgroundColor: statusCfg.dot }]} />
              <Text style={[styles.statusText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
            </View>
          </View>

          <View style={styles.rolePill}>
            <Text style={styles.roleText}>Gestionnaire</Text>
          </View>
        </View>

        {/* Actions rapides */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionCard}
            activeOpacity={0.7}
            onPress={() => Linking.openURL(`mailto:${manager.email}`)}
          >
            <View style={[styles.actionIconCircle, { backgroundColor: '#EAF0FB' }]}>
              <Ionicons name="mail-outline" size={22} color="#5B8DEF" />
            </View>
            <Text style={styles.actionLabel}>Email</Text>
          </TouchableOpacity>

          {manager.phone && (
            <TouchableOpacity
              style={styles.actionCard}
              activeOpacity={0.7}
              onPress={() => Linking.openURL(`tel:${manager.phone!}`)}
            >
              <View style={[styles.actionIconCircle, { backgroundColor: '#E6F9F1' }]}>
                <Ionicons name="call-outline" size={22} color="#34C77B" />
              </View>
              <Text style={styles.actionLabel}>Appeler</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.actionCard}
            activeOpacity={0.7}
            onPress={() => setModalVisible(true)}
          >
            <View style={[styles.actionIconCircle, { backgroundColor: '#F5E2E2' }]}>
              <Ionicons name="shield-outline" size={22} color={Colors.bordeaux} />
            </View>
            <Text style={styles.actionLabel}>Statut</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('ManagerPermissions', { managerId: manager.id })}
          >
            <View style={[styles.actionIconCircle, { backgroundColor: '#EDE7F6' }]}>
              <Ionicons name="key-outline" size={22} color="#7B1FA2" />
            </View>
            <Text style={styles.actionLabel}>Accès</Text>
          </TouchableOpacity>
        </View>

        {/* Contact */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-outline" size={18} color={Colors.bordeauxLight} />
            <Text style={styles.sectionTitle}>Contact</Text>
          </View>

          <TouchableOpacity
            style={styles.infoRow}
            activeOpacity={0.7}
            onPress={() => Linking.openURL(`mailto:${manager.email}`)}
          >
            <View style={[styles.infoIcon, { backgroundColor: '#EAF0FB' }]}>
              <Ionicons name="mail-outline" size={16} color="#5B8DEF" />
            </View>
            <Text style={styles.infoValue}>{manager.email}</Text>
          </TouchableOpacity>

          <View style={styles.infoRow}>
            <View style={[styles.infoIcon, { backgroundColor: '#E6F9F1' }]}>
              <Ionicons name="call-outline" size={16} color="#34C77B" />
            </View>
            <Text style={styles.infoValue}>{manager.phone ?? '—'}</Text>
          </View>
        </View>

        {/* Informations */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="briefcase-outline" size={18} color={Colors.bordeauxLight} />
            <Text style={styles.sectionTitle}>Informations</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Statut</Text>
            <Text style={[styles.detailValue, { color: statusCfg.color }]}>{statusCfg.label}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Membre depuis</Text>
            <Text style={styles.detailValue}>{memberSince}</Text>
          </View>

          {manager.coverage_zone ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Zone de couverture</Text>
              <Text style={styles.detailValue}>{manager.coverage_zone}</Text>
            </View>
          ) : null}

          {manager.priority_level ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Niveau de priorité</Text>
              <Text style={styles.detailValue}>
                {manager.priority_level === 1 ? 'Standard'
                  : manager.priority_level === 2 ? 'Prioritaire'
                  : 'Haute priorité'}
              </Text>
            </View>
          ) : null}

          {manager.status_reason && (
            <View style={[styles.detailRow, { flexDirection: 'column', gap: 4 }]}>
              <Text style={styles.detailLabel}>Motif du statut</Text>
              <Text style={[styles.detailValue, { textAlign: 'left' }]}>{manager.status_reason}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <ChangeStatusModal
        manager={manager}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onConfirm={handleStatusConfirm}
        isLoading={actionLoading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: Colors.background },
  center:      { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.md },
  errorText:   { fontSize: Fonts.size.md, color: Colors.textMuted },

  header: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    backgroundColor:   Colors.bordeaux,
    paddingTop:        Platform.OS === 'ios' ? 56 : Spacing.xl + 8,
    paddingBottom:     Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  headerBtn:     { padding: Spacing.sm, width: 40 },
  headerTitle:   { fontSize: Fonts.size.lg, fontWeight: '600', color: Colors.white },
  headerEditBtn: { padding: Spacing.sm, width: 40, alignItems: 'flex-end' },

  scroll:        { flex: 1 },
  scrollContent: { padding: Spacing.md, paddingBottom: Spacing.xl },

  identityCard: {
    backgroundColor: Colors.white, borderRadius: Radius.md,
    padding: Spacing.md, marginBottom: Spacing.sm,
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4,
  },
  avatarWrapper:  { marginBottom: Spacing.sm },
  avatar:         { width: 64, height: 64, borderRadius: 32 },
  avatarFallback: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: Colors.beigeLight,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarInitials: { fontSize: Fonts.size.xl, fontWeight: '700', color: Colors.bordeauxLight },
  nameRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: Spacing.sm,
  },
  managerName: { fontSize: Fonts.size.xl, fontWeight: '700', color: Colors.textPrimary, flex: 1 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full,
  },
  statusDot:  { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: Fonts.size.sm, fontWeight: '600' },
  rolePill: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.overlayLight,
    paddingHorizontal: Spacing.md, paddingVertical: 4,
    borderRadius: Radius.full,
  },
  roleText: { fontSize: Fonts.size.sm, fontWeight: '600', color: Colors.bordeaux },

  actionsRow:   { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  actionCard: {
    flex: 1, backgroundColor: Colors.white, borderRadius: Radius.md,
    paddingVertical: Spacing.md, alignItems: 'center', gap: 6,
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4,
  },
  actionIconCircle: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
  },
  actionLabel: { fontSize: Fonts.size.xs, color: Colors.textSecondary, fontWeight: '500' },

  sectionCard: {
    backgroundColor: Colors.white, borderRadius: Radius.md,
    padding: Spacing.md, marginBottom: Spacing.sm,
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.md },
  sectionTitle:  { fontSize: Fonts.size.md, fontWeight: '700', color: Colors.bordeauxDark },

  infoRow:  { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  infoIcon: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  infoValue: { fontSize: Fonts.size.sm, color: Colors.textPrimary, flex: 1 },

  detailRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  detailLabel: { fontSize: Fonts.size.sm, color: Colors.textSecondary },
  detailValue: { fontSize: Fonts.size.sm, fontWeight: '600', color: Colors.textPrimary, textAlign: 'right', maxWidth: '55%' },
});
