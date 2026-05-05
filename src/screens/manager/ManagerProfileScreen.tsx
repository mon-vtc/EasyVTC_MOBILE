import React from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Alert, Platform, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../../hooks/usePermissions';
import { Colors, Spacing, Radius, Fonts } from '../../theme/colors';
import { PERMISSION_LABELS } from '../../types';
import type { ManagerPermission } from '../../types';

export default function ManagerProfileScreen() {
  const { user, logout } = useAuth();
  const { permissions } = usePermissions();

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Voulez-vous vraiment vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnecter', style: 'destructive', onPress: logout },
    ]);
  };

  const initials = `${user?.first_name?.[0] ?? ''}${user?.last_name?.[0] ?? ''}`.toUpperCase();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Carte identité */}
      <View style={styles.identityCard}>
        <View style={styles.avatarWrapper}>
          {user?.profile_photo_url ? (
            <Image source={{ uri: user.profile_photo_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
          )}
        </View>
        <Text style={styles.name}>{user?.first_name} {user?.last_name}</Text>
        <View style={styles.rolePill}>
          <Text style={styles.roleText}>Gestionnaire VTC</Text>
        </View>
      </View>

      {/* Informations */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informations</Text>
        <View style={styles.infoRow}>
          <Ionicons name="mail-outline" size={16} color={Colors.bordeauxLight} />
          <Text style={styles.infoValue}>{user?.email}</Text>
        </View>
        {user?.phone && (
          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={16} color={Colors.bordeauxLight} />
            <Text style={styles.infoValue}>{user.phone}</Text>
          </View>
        )}
      </View>

      {/* Permissions accordées */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Mes permissions ({permissions.length}/{Object.keys(PERMISSION_LABELS).length})
        </Text>
        {permissions.length === 0 ? (
          <View style={styles.emptyPerms}>
            <Ionicons name="lock-closed-outline" size={24} color={Colors.border} />
            <Text style={styles.emptyPermsText}>Aucune permission accordée</Text>
          </View>
        ) : (
          permissions.map((perm: ManagerPermission) => (
            <View key={perm} style={styles.permRow}>
              <Ionicons name="checkmark-circle" size={16} color="#34C77B" />
              <Text style={styles.permLabel}>{PERMISSION_LABELS[perm]}</Text>
            </View>
          ))
        )}
      </View>

      {/* Déconnexion */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
        <Ionicons name="log-out-outline" size={20} color={Colors.error} />
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content:   { padding: Spacing.md, paddingBottom: Spacing.xl },

  identityCard: {
    backgroundColor: Colors.white, borderRadius: Radius.md,
    padding: Spacing.lg, alignItems: 'center', marginBottom: Spacing.md,
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4,
  },
  avatarWrapper:  { marginBottom: Spacing.md },
  avatar:         { width: 80, height: 80, borderRadius: 40 },
  avatarFallback: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.beigeLight,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarInitials: { fontSize: Fonts.size.xxl, fontWeight: '700', color: Colors.bordeauxLight },
  name:     { fontSize: Fonts.size.xl, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.sm },
  rolePill: {
    backgroundColor: Colors.overlayLight,
    paddingHorizontal: Spacing.md, paddingVertical: 4,
    borderRadius: Radius.full,
  },
  roleText: { fontSize: Fonts.size.sm, fontWeight: '600', color: Colors.bordeaux },

  section: {
    backgroundColor: Colors.white, borderRadius: Radius.md,
    padding: Spacing.md, marginBottom: Spacing.md,
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: Fonts.size.md, fontWeight: '700', color: Colors.bordeauxDark,
    marginBottom: Spacing.md,
  },
  infoRow:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  infoValue: { fontSize: Fonts.size.sm, color: Colors.textPrimary },

  emptyPerms:     { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.md },
  emptyPermsText: { fontSize: Fonts.size.sm, color: Colors.textMuted },

  permRow:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: 6 },
  permLabel: { fontSize: Fonts.size.sm, color: Colors.textPrimary, flex: 1 },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.white, borderRadius: Radius.md,
    padding: Spacing.md, justifyContent: 'center',
    elevation: 1, borderWidth: 1, borderColor: '#FFCDD2',
  },
  logoutText: { fontSize: Fonts.size.md, fontWeight: '600', color: Colors.error },
});
