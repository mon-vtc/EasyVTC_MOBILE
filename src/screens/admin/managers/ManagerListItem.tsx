// components — Admin / Item de la liste des Gestionnaires
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { UserProfile } from '../../../types';
import { Colors, Spacing, Radius, Fonts } from '../../../theme/colors';

type ManagerStatus = 'active' | 'inactive' | 'locked';

const STATUS_CONFIG: Record<ManagerStatus, { label: string; bg: string; color: string }> = {
  active:   { label: 'Actif',    bg: '#E8F5E9', color: '#2E7D32' },
  inactive: { label: 'Inactif',  bg: '#FFF3E0', color: '#E65100' },
  locked:   { label: 'Suspendu', bg: '#f5e2e2', color: '#C62828' },
};

interface ManagerListItemProps {
  manager:        UserProfile;
  onPress:        () => void;
  onEdit:         () => void;
  onView:         () => void;
  onPermissions?: () => void;
}

export default function ManagerListItem({ manager, onPress, onEdit, onView, onPermissions }: ManagerListItemProps) {
  const initials = `${manager.first_name?.[0] ?? ''}${manager.last_name?.[0] ?? ''}`.toUpperCase();
  const statusCfg = STATUS_CONFIG[manager.status as ManagerStatus] ?? STATUS_CONFIG.inactive;

  return (
    <TouchableOpacity style={styles.wrapper} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.top}>
        {/* Avatar */}
        <View style={styles.avatar}>
          {manager.profile_photo_url ? (
            <Image source={{ uri: manager.profile_photo_url }} style={styles.avatarImg} />
          ) : (
            <Text style={styles.avatarInitials}>{initials}</Text>
          )}
        </View>

        {/* Infos */}
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {manager.first_name} {manager.last_name}
            </Text>
            <View style={[styles.badge, { backgroundColor: statusCfg.bg }]}>
              <Text style={[styles.badgeText, { color: statusCfg.color }]}>
                {statusCfg.label}
              </Text>
            </View>
          </View>
          <Text style={styles.email} numberOfLines={1}>{manager.email}</Text>
          {manager.phone && (
            <Text style={styles.phone}>{manager.phone}</Text>
          )}
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.rolePill}>
          <Text style={styles.roleText}>Gestionnaire</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={(e) => { e.stopPropagation(); onEdit(); }}
            activeOpacity={0.75}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="pencil-outline" size={14} color={Colors.bordeaux} />
            <Text style={styles.actionText}>Modifier</Text>
          </TouchableOpacity>
          <View style={styles.actionDivider} />
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={(e) => { e.stopPropagation(); onView(); }}
            activeOpacity={0.75}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="eye-outline" size={14} color={Colors.bordeaux} />
            <Text style={styles.actionText}>Voir</Text>
          </TouchableOpacity>
          {onPermissions && (
            <>
              <View style={styles.actionDivider} />
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={(e) => { e.stopPropagation(); onPermissions(); }}
                activeOpacity={0.75}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="key-outline" size={14} color="#7B1FA2" />
                <Text style={[styles.actionText, { color: '#7B1FA2' }]}>Accès</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: Colors.surface,
    borderRadius:    Radius.md,
    borderWidth:     1,
    borderColor:     Colors.border,
    padding:         Spacing.md,
    marginBottom:    Spacing.sm,
    marginHorizontal: Spacing.md,
  },
  top:           { flexDirection: 'row', alignItems: 'flex-start', marginBottom: Spacing.sm },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.beigeLight,
    alignItems: 'center', justifyContent: 'center',
    marginRight: Spacing.md, overflow: 'hidden', flexShrink: 0,
  },
  avatarImg:      { width: '100%', height: '100%' },
  avatarInitials: { fontSize: Fonts.size.md, fontFamily: Fonts.bold, fontWeight: '700', color: Colors.bordeaux },
  info:           { flex: 1 },
  nameRow:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm },
  name:           { fontSize: Fonts.size.md, fontFamily: Fonts.bold, fontWeight: '700', color: Colors.textPrimary, flex: 1 },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical:   2,
    borderRadius:      Radius.full,
  },
  badgeText:  { fontSize: Fonts.size.xs, fontFamily: Fonts.semibold, fontWeight: '600' },
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
  roleText:     { fontSize: Fonts.size.xs, fontFamily: Fonts.semibold, fontWeight: '600', color: Colors.bordeaux },
  actions:      { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  actionBtn:    { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionText:   { fontSize: Fonts.size.sm, color: Colors.bordeaux, fontFamily: Fonts.medium, fontWeight: '500' },
  actionDivider:{ width: 1, height: 14, backgroundColor: Colors.border },
});
