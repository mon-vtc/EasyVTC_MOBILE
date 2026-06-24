import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Switch,
  TouchableOpacity, ActivityIndicator, Platform,
} from 'react-native'; 
import { useNavigation, useRoute } from '@react-navigation/native';
import { useToast } from '../../../hooks/useToast';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAdmin } from '../../../hooks/useAdmin';
import { Colors, Spacing, Radius, Fonts } from '../../../theme/colors';
import { MANAGER_PERMISSIONS, PERMISSION_LABELS } from '../../../types';
import type { ManagersStackParamList, ManagerPermission } from '../../../types';

type Nav = NativeStackNavigationProp<ManagersStackParamList, 'ManagerPermissions'>;

const PERMISSION_GROUPS: { title: string; icon: string; permissions: ManagerPermission[] }[] = [
  {
    title: 'Réservations',
    icon: 'car-outline',
    permissions: ['view_reservations', 'assign_reservation', 'cancel_reservation'],
  },
  {
    title: 'Utilisateurs & équipe',
    icon: 'people-outline',
    permissions: ['view_users', 'view_drivers', 'view_clients'],
  },
  {
    title: 'Tarification',
    icon: 'pricetag-outline',
    permissions: ['view_pricing'],
  },
  {
    title: 'Documents chauffeurs',
    icon: 'document-text-outline',
    permissions: ['view_documents'],
  },
  {
    title: 'Documents financiers',
    icon: 'receipt-outline',
    permissions: ['view_orders', 'view_invoices'],
  },
  {
    title: 'Évaluations',
    icon: 'star-outline',
    permissions: ['view_ratings'],
  },
  {
    title: 'Support & chat',
    icon: 'chatbubbles-outline',
    permissions: ['manage_support'],
  },
];

export default function ManagerPermissionsScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<any>();
  const { managerId } = route.params as { managerId: string };

  const { getManagerPermissions, setManagerPermissions } = useAdmin();
  const { showToast } = useToast();

  const [selected, setSelected]     = useState<Set<ManagerPermission>>(new Set());
  const [isLoading, setIsLoading]   = useState(true);
  const [isSaving,  setIsSaving]    = useState(false);
  const [isDirty,   setIsDirty]     = useState(false);

  const loadPermissions = useCallback(async () => {
    try {
      const result = await getManagerPermissions(managerId);
      setSelected(new Set(result.permissions));
    } catch (err: any) {
      showToast({ title: 'Erreur', message: err.message ?? 'Impossible de charger les permissions.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [managerId]);

  useEffect(() => { loadPermissions(); }, [loadPermissions]);

  const toggle = (permission: ManagerPermission) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(permission) ? next.delete(permission) : next.add(permission);
      return next;
    });
    setIsDirty(true);
  };

  const toggleGroup = (permissions: ManagerPermission[]) => {
    const allOn = permissions.every(p => selected.has(p));
    setSelected(prev => {
      const next = new Set(prev);
      permissions.forEach(p => allOn ? next.delete(p) : next.add(p));
      return next;
    });
    setIsDirty(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await setManagerPermissions(managerId, { permissions: Array.from(selected) });
      setIsDirty(false);
      showToast({ title: 'Succès', message: 'Les permissions ont été mises à jour.', type: 'success' });
    } catch (err: any) {
      showToast({ title: 'Erreur', message: err.message ?? 'Impossible de sauvegarder les permissions.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectAll = () => {
    setSelected(new Set(MANAGER_PERMISSIONS as unknown as ManagerPermission[]));
    setIsDirty(true);
  };

  const handleClearAll = () => {
    setSelected(new Set());
    setIsDirty(true);
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.bordeaux} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Permissions</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Actions globales */}
        <View style={styles.globalRow}>
          <TouchableOpacity style={styles.globalBtn} onPress={handleSelectAll} activeOpacity={0.7}>
            <Ionicons name="checkmark-done-outline" size={16} color={Colors.bordeaux} />
            <Text style={styles.globalBtnText}>Tout accorder</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.globalBtn} onPress={handleClearAll} activeOpacity={0.7}>
            <Ionicons name="close-circle-outline" size={16} color={Colors.textSecondary} />
            <Text style={[styles.globalBtnText, { color: Colors.textSecondary }]}>Tout retirer</Text>
          </TouchableOpacity>
        </View>

        {/* Compteur */}
        <View style={styles.countBanner}>
          <Ionicons name="shield-checkmark-outline" size={16} color={Colors.bordeauxLight} />
          <Text style={styles.countText}>
            {selected.size} permission{selected.size !== 1 ? 's' : ''} accordée{selected.size !== 1 ? 's' : ''} sur {MANAGER_PERMISSIONS.length}
          </Text>
        </View>

        {/* Groupes de permissions */}
        {PERMISSION_GROUPS.map(group => {
          const groupAllOn = group.permissions.every(p => selected.has(p));
          return (
            <View key={group.title} style={styles.groupCard}>
              <TouchableOpacity
                style={styles.groupHeader}
                onPress={() => toggleGroup(group.permissions)}
                activeOpacity={0.7}
              >
                <View style={styles.groupTitleRow}>
                  <Ionicons name={group.icon as any} size={18} color={Colors.bordeauxLight} />
                  <Text style={styles.groupTitle}>{group.title}</Text>
                </View>
                <Switch
                  value={groupAllOn}
                  onValueChange={() => toggleGroup(group.permissions)}
                  trackColor={{ false: Colors.border, true: Colors.bordeauxLight }}
                  thumbColor={groupAllOn ? Colors.bordeaux : Colors.white}
                />
              </TouchableOpacity>

              {group.permissions.map((permission, idx) => (
                <View
                  key={permission}
                  style={[styles.permRow, idx === group.permissions.length - 1 && styles.permRowLast]}
                >
                  <Text style={styles.permLabel}>{PERMISSION_LABELS[permission]}</Text>
                  <Switch
                    value={selected.has(permission)}
                    onValueChange={() => toggle(permission)}
                    trackColor={{ false: Colors.border, true: Colors.bordeauxLight }}
                    thumbColor={selected.has(permission) ? Colors.bordeaux : Colors.white}
                  />
                </View>
              ))}
            </View>
          );
        })}
      </ScrollView>

      {/* Bouton sauvegarder */}
      {isDirty && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={isSaving}
            activeOpacity={0.8}
          >
            {isSaving
              ? <ActivityIndicator size="small" color={Colors.white} />
              : <>
                  <Ionicons name="save-outline" size={18} color={Colors.white} />
                  <Text style={styles.saveBtnText}>Enregistrer les permissions</Text>
                </>
            }
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: Colors.background },
  center:      { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    backgroundColor:   Colors.bordeaux,
    paddingTop:        Platform.OS === 'ios' ? 56 : Spacing.xl + 8,
    paddingBottom:     Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  headerBtn:   { padding: Spacing.sm, width: 40 },
  headerTitle: { fontSize: Fonts.size.lg, fontWeight: '600', color: Colors.white },

  scroll:        { flex: 1 },
  scrollContent: { padding: Spacing.md, paddingBottom: Spacing.xl },

  globalRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  globalBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.white, borderRadius: Radius.md,
    paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md,
    borderWidth: 1, borderColor: Colors.border,
    elevation: 1,
  },
  globalBtnText: { fontSize: Fonts.size.sm, fontWeight: '600', color: Colors.bordeaux },

  countBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.overlayLight,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  countText: { fontSize: Fonts.size.sm, color: Colors.bordeauxDark, fontWeight: '500' },

  groupCard: {
    backgroundColor: Colors.white, borderRadius: Radius.md,
    marginBottom: Spacing.sm,
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4,
    overflow: 'hidden',
  },
  groupHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  groupTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  groupTitle:    { fontSize: Fonts.size.md, fontWeight: '700', color: Colors.bordeauxDark },

  permRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  permRowLast:  { borderBottomWidth: 0 },
  permLabel:    { fontSize: Fonts.size.sm, color: Colors.textPrimary, flex: 1, paddingRight: Spacing.sm },

  footer: {
    padding: Spacing.md,
    paddingBottom: Platform.OS === 'ios' ? Spacing.xl : Spacing.md,
    backgroundColor: Colors.white,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  saveBtn: {
    backgroundColor: Colors.bordeaux, borderRadius: Radius.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: Spacing.md,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText:     { fontSize: Fonts.size.md, fontWeight: '700', color: Colors.white },
});
