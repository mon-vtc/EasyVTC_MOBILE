// ══════════════════════════════════════════════════════════════════════════════
// COMPONENT — Admin / Item de la liste des Gestionnaires
// ══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import type { UserProfile } from '../../../types';
import { AppIcon } from '../../../components/common/AppIcon';
import { Colors, Spacing, Radius, Fonts } from '../../../theme/colors';

const STATUS_COLORS: Record<string, { Background: string; color: string }> = {
  active: {Background: Colors.success, color: Colors.white},
  inactive: {Background: Colors.black, color: Colors.white},
  locked: {Background: Colors.errorLight, color: Colors.black},
};

interface ManagerListItemProps {
  manager: UserProfile;
  onPress: () => void;
  onEdit: () => void;
  onView: () => void;
}

export default function ManagerListItem({ manager, onPress, onEdit, onView }: ManagerListItemProps) {
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.mainContainer}>
        <View style={styles.avatarContainer}>
          {manager.profile_photo_url ? (
            <Image source={{ uri: manager.profile_photo_url }} style={styles.avatar} />
          ) : (
            <View style={styles.initialsCircle}>
              <Text >
                {getInitials(manager.first_name, manager.last_name)}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.infoContainer}>
          <View style={{ flexDirection: 'column', alignItems: 'flex-start', gap: Spacing.xs }}>
            <Text style={styles.name}>{`${manager.first_name} ${manager.last_name}`}</Text>
            <Text style={styles.role}>{manager.role}</Text>
            <Text style={styles.email}>{manager.email}</Text>
          </View>
        </View>
        {manager.status && (
          <View style={[styles.statusWrapper, { backgroundColor: STATUS_COLORS[manager.status]?.Background || Colors.beigeLight, padding: Spacing.xs, borderRadius: Radius.full }]}>
            <Text style={{ color: STATUS_COLORS[manager.status]?.color || Colors.textPrimary, fontSize: 12, fontWeight: '500' }}>
              {manager.status.toUpperCase()}
            </Text>
          </View>
        )}

      </View>
      <View style={styles.actionContainer}>
        <TouchableOpacity style={styles.actionButton} onPress={onEdit}>
          <AppIcon name="pencil-outline" size={20} color={Colors.bordeaux} />
          <Text style={{ color: Colors.bordeaux }}>Modifier</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={onView}>
          <AppIcon name="eye-outline" size={20} color={Colors.bordeaux} />
          <Text style={{ color: Colors.bordeaux }}>Voir</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    alignItems: 'stretch',
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    marginBottom: Spacing.sm,
    marginHorizontal: Spacing.md,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  mainContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.xxl,
    padding: Spacing.sm
  },

  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    shadowColor: Colors.bordeaux,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  avatarContainer: {
    marginRight: Spacing.md,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  initialsCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.bordeauxLight,
    justifyContent: 'center',
    alignItems: 'center',
    color: Colors.white,
  },

  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    color: Colors.bordeauxLight,
    marginBottom: 2,
    fontWeight: '600',
    fontSize: Fonts.size.md,
  },
  role: {
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
    fontWeight: '500',
    fontSize: Fonts.size.md,
  },
  email: {
    color: Colors.bordeaux,
    marginBottom: Spacing.xs,
    fontWeight: '500',
    opacity: 0.8,
  },
  statusWrapper: {
    alignSelf: 'flex-start',
    marginTop: Spacing.md,
  },
});