// ══════════════════════════════════════════════════════════════════════════════
// SCREEN — Admin / Voir le profil d'un Gestionnaire
// Conforme à : Image 1 — "Admin qui consulte les informations du gestionnaire"
// ══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Platform,
  Image,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAdmin } from '../../../hooks/useAdmin';
import { Colors, Spacing, Radius } from '../../../theme/colors';
import type { ManagersStackParamList, UserProfile } from '../../../types';

type Nav = NativeStackNavigationProp<ManagersStackParamList, 'ManagerDetail'>;

export default function ManagerDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<any>();
  const { managerId } = route.params as { managerId: string };
  const { fetchManagerById, user } = useAdmin();
  const [manager, setManager] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    (async () => {
      try {
        const data = await fetchManagerById(managerId);
        setManager(data);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [managerId]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.bordeauxLight} />
      </View>
    );
  }

  if (!manager) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Gestionnaire introuvable.</Text>
      </View>
    );
  }

  const fullName = `${manager.first_name} ${manager.last_name}`;
  const isActive = manager.status === 'active';

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Voir le profil</Text>
        {user?.role && (
          <View style={styles.roleContent}>
            <Ionicons style={styles.iconRole} name="person" size={16} color={Colors.white} />
            <Text style={styles.roleText}>
              {user.role === 'admin' ? 'Administrateur' : ''}
            </Text>
          </View>
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Carte identité ── */}
        <View style={styles.identityCard}>
          {/* Avatar */}
          <View style={styles.avatarWrapper}>
            {manager.profile_photo_url ? (
              <Image source={{ uri: manager.profile_photo_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitials}>
                  {manager.first_name?.[0]}{manager.last_name?.[0]}
                </Text>
              </View>
            )}
          </View>

          {/* Nom + statut */}
          <View style={styles.nameRow}>
            <Text style={styles.managerName}>{fullName}</Text>
            <View style={[styles.statusBadge, isActive ? styles.statusActive : styles.statusInactive]}>
              <View style={[styles.statusDot, isActive ? styles.dotActive : styles.dotInactive]} />
              <Text style={[styles.statusText, isActive ? styles.statusTextActive : styles.statusTextInactive]}>
                {isActive ? 'Actif' : 'Inactif'}
              </Text>
            </View>
          </View>

          {/* Rôle */}
          <Text style={styles.roleLabel}>Gestionnaire</Text>

          {/* Tags */}
          <View style={styles.tagsRow}>
            <View style={styles.tagGestionnaire}>
              <Text style={styles.tagGestionnaireText}>Gestionnaire</Text>
            </View>
            {manager.company && (
              <View style={styles.tagCompany}>
                <Text style={styles.tagCompanyIcon}>⭐</Text>
                <Text style={styles.tagCompanyText}>{manager.company}</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Actions rapides : Message / Appeler ── */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionCard}
            activeOpacity={0.7}
            onPress={() => {/* Navigation vers messagerie */}}
          >
            <View style={[styles.actionIconCircle, { backgroundColor: '#EAF0FB' }]}>
              <Ionicons name="chatbubble-outline" size={24} color="#5B8DEF" />
            </View>
            <Text style={styles.actionLabel}>Message</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            activeOpacity={0.7}
            onPress={() => manager.phone && Linking.openURL(`tel:${manager.phone}`)}
          >
            <View style={[styles.actionIconCircle, { backgroundColor: '#E6F9F1' }]}>
              <Ionicons name="call-outline" size={24} color="#34C77B" />
            </View>
            <Text style={styles.actionLabel}>Appelant</Text>
          </TouchableOpacity>
        </View>

        {/* ── Section Contact ── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-outline" size={18} color={Colors.bordeauxLight} />
            <Text style={styles.sectionTitle}>Contact</Text>
          </View>

          {/* Email */}
          <TouchableOpacity
            style={styles.contactRow}
            activeOpacity={0.7}
            onPress={() => manager.email && Linking.openURL(`mailto:${manager.email}`)}
          >
            <View style={[styles.contactIconCircle, { backgroundColor: '#EAF0FB' }]}>
              <Ionicons name="mail-outline" size={18} color="#5B8DEF" />
            </View>
            <Text style={styles.contactValue}>{manager.email || '—'}</Text>
          </TouchableOpacity>

          {/* Téléphone */}
          <TouchableOpacity
            style={styles.contactRow}
            activeOpacity={0.7}
            onPress={() => manager.phone && Linking.openURL(`tel:${manager.phone}`)}
          >
            <View style={[styles.contactIconCircle, { backgroundColor: '#E6F9F1' }]}>
              <Ionicons name="call-outline" size={18} color="#34C77B" />
            </View>
            <Text style={styles.contactValue}>{manager.phone || '—'}</Text>
          </TouchableOpacity>
        </View>

        {/* ── Section Informations professionnelles ── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="briefcase-outline" size={18} color={Colors.bordeauxLight} />
            <Text style={styles.sectionTitle}>Informations professionnelles</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Zone de couverture</Text>
            <Text style={styles.infoValue} numberOfLines={1}>
              {manager.zone || 'Paris Est (11e, 12e,20e…)'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Ancienneté</Text>
            <Text style={styles.infoValue}>
              {Math.floor((Date.now() - new Date(manager.created_at).getTime()) / (1000 * 60 * 60 * 24 * 365)) < 1
                ? 'Moins d\'un an'
                : Math.floor((Date.now() - new Date(manager.created_at).getTime()) / (1000 * 60 * 60 * 24 * 365)) + ' ans'
              }
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* FAB + (accès rapide création) */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('CreateManager')}
      >
        <Ionicons name="add-outline" size={28} color={Colors.white} />
      </TouchableOpacity>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // ── Header ─────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.bordeaux,
    paddingTop: Platform.OS === 'ios' ? 56 : Spacing.xl + 8,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  headerBtn: { padding: Spacing.sm, width: 40 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: Colors.white },
  roleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: Radius.full,
    padding: Spacing.sm,
  },
  iconRole: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: Radius.full,
    padding: Spacing.sm,
  },
  roleText: {
    fontSize: 11,
    color: Colors.white,
    marginLeft: 4,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
  },

  // ── Scroll ─────────────────────────────────────────────────────────────────
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.md, paddingBottom: 100 },

  // ── Carte identité ─────────────────────────────────────────────────────────
  identityCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  avatarWrapper: { marginBottom: Spacing.sm },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarFallback: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.beigeLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.bordeauxLight,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  managerName: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  statusActive: { backgroundColor: '#E6F9F1' },
  statusInactive: { backgroundColor: '#FDECEA' },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  dotActive: { backgroundColor: '#34C77B' },
  dotInactive: { backgroundColor: '#E53935' },
  statusText: { fontSize: 13, fontWeight: '600' },
  statusTextActive: { color: '#34C77B' },
  statusTextInactive: { color: '#E53935' },
  roleLabel: {
    fontSize: 14,
    color: Colors.bordeauxLight,
    marginBottom: Spacing.sm,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginTop: 4,
  },
  tagGestionnaire: {
    backgroundColor: '#F3EDE8',
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  tagGestionnaireText: {
    fontSize: 13,
    color: Colors.bordeauxLight,
    fontWeight: '500',
  },
  tagCompany: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.beigeLight,
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  tagCompanyIcon: { fontSize: 13 },
  tagCompanyText: { fontSize: 13, color: Colors.textPrimary, fontWeight: '500' },

  // ── Actions rapides ────────────────────────────────────────────────────────
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  actionCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    gap: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  actionIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },

  // ── Section générique ──────────────────────────────────────────────────────
  sectionCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.bordeauxDark,
  },

  // ── Contacts ───────────────────────────────────────────────────────────────
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  contactIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactValue: {
    fontSize: 14,
    color: Colors.textPrimary,
    flex: 1,
  },

  // ── Infos pro ──────────────────────────────────────────────────────────────
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  infoLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
    maxWidth: '55%',
    textAlign: 'right',
  },

  // ── États ──────────────────────────────────────────────────────────────────
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  errorText: {
    fontSize: 14,
    color: Colors.error,
    textAlign: 'center',
  },

  // ── FAB ────────────────────────────────────────────────────────────────────
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: Colors.bordeauxLight,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: Colors.bordeauxDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },
});