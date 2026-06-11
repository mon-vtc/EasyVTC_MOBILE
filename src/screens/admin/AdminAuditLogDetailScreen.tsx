import React, { useEffect, useState, useMemo} from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Platform } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useAdmin } from '../../hooks/useAdmin';
import { AppIcon } from '../../components/common/AppIcon';
import { Colors, Fonts, Spacing, Radius } from '../../theme/colors';
import type { AdminAuditLogsStackParamList } from '../../types';

type ScreenRouteProp = RouteProp<AdminAuditLogsStackParamList, 'AdminAuditLogDetail'>;

function DetailRow({ label, value, color }: { label: string; value: string | null | undefined; color?: string }) {
  if (!value) return null;
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, color ? { color } : {}]}>{value}</Text>
    </View>
  );
}

function ValueChange({ field, oldValue, newValue }: { field: string; oldValue: any; newValue: any }) {
  const formatValue = (val: any) => {
    if (val === null || val === undefined) return <Text style={styles.valueNull}>null</Text>;
    if (typeof val === 'boolean') return <Text style={styles.valueBool}>{val ? 'true' : 'false'}</Text>;
    if (typeof val === 'number') return <Text style={styles.valueNumber}>{val}</Text>;
    return <Text style={styles.valueString}>"{String(val)}"</Text>;
  };

  return (
    <View style={styles.changeRow}>
      <Text style={styles.changeField}>{field}:</Text>
      <View style={styles.changeValues}>
        {oldValue !== undefined && (
          <View style={styles.valueWrapper}>
            <Text style={styles.valueOldLabel}>Avant:</Text>
            {formatValue(oldValue)}
          </View>
        )}
        {newValue !== undefined && (
          <View style={styles.valueWrapper}>
            <Text style={styles.valueNewLabel}>Après:</Text>
            {formatValue(newValue)}
          </View>
        )}
      </View>
    </View>
  );
}

export default function AdminAuditLogDetailScreen({ navigation }: any) {
  const route = useRoute<ScreenRouteProp>();
  const { logId } = route.params;
  const {
    selectedAuditLog: log,
    isAuditLogsLoading: loading,
    auditLogsError: error,
    fetchLogById,
  } = useAdmin();

  useEffect(() => {
    fetchLogById(logId).catch(console.error);
  }, [logId, fetchLogById]);

  const changedFields = useMemo(() => {
    if (!log || !log.old_value && !log.new_value) return [];
    const oldKeys = Object.keys(log.old_value || {});
    const newKeys = Object.keys(log.new_value || {});
    const allKeys = Array.from(new Set([...oldKeys, ...newKeys]));

    return allKeys.filter(key => {
      const oldValue = log.old_value?.[key];
      const newValue = log.new_value?.[key];
      return JSON.stringify(oldValue) !== JSON.stringify(newValue);
    });
  }, [log]);

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.bordeaux} /></View>;
  }

  if (error || !log) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error || 'Log non trouvé'}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.retryText}>Retour</Text></TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <AppIcon name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Détail du log</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <DetailRow label="Action" value={log.action} />
          <DetailRow label="Date" value={new Date(log.created_at).toLocaleString('fr-FR')} />
          <DetailRow label="Utilisateur" value={log.user ? `${log.user.first_name} ${log.user.last_name}` : 'Système'} />
          <DetailRow label="Email" value={log.user?.email} />
          <DetailRow label="ID Utilisateur" value={log.user_id} />
        </View>

        <View style={styles.card}>
          <DetailRow label="Entité" value={log.entity_type} />
          <DetailRow label="ID Entité" value={log.entity_id} />
        </View>

        {changedFields.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Changements</Text>
            {changedFields.map(field => (
              <ValueChange
                key={field}
                field={field}
                oldValue={log.old_value?.[field]}
                newValue={log.new_value?.[field]}
              />
            ))}
          </View>
        )}

        <View style={styles.card}>
          <DetailRow label="Adresse IP" value={log.ip_address} />
          <DetailRow label="User Agent" value={log.user_agent} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.bordeaux,
    paddingTop: Platform.OS === 'ios' ? 56 : Spacing.xl + 8,
    paddingBottom: Spacing.md, paddingHorizontal: Spacing.md,
  },
  headerBtn: { padding: Spacing.sm, width: 40 },
  headerTitle: { color: Colors.white, fontWeight: '800', fontSize: Fonts.size.lg },
  scroll: { padding: Spacing.md, gap: Spacing.md },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: Spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07, shadowRadius: 4, elevation: 2,
  },
  cardTitle: { fontSize: Fonts.size.md, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.sm },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  detailLabel: { fontSize: Fonts.size.sm, color: Colors.textSecondary, flex: 1 },
  detailValue: { fontSize: Fonts.size.sm, fontWeight: '600', color: Colors.textPrimary, flex: 2, textAlign: 'right' },
  changeRow: {
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  changeField: { fontSize: Fonts.size.sm, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.xs },
  changeValues: { gap: Spacing.xs, paddingLeft: Spacing.sm },
  valueWrapper: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  valueOldLabel: { fontSize: Fonts.size.xs, color: Colors.error, width: 40 },
  valueNewLabel: { fontSize: Fonts.size.xs, color: Colors.success, width: 40 },
  valueNull: { fontStyle: 'italic', color: Colors.textMuted },
  valueBool: { fontWeight: '600' },
  valueNumber: { color: Colors.bordeaux, fontWeight: '600' },
  valueString: { color: Colors.textPrimary },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.md },
  errorText: { color: Colors.error, fontSize: Fonts.size.md, marginBottom: Spacing.md },
  retryText: { color: Colors.bordeaux, fontWeight: '600', fontSize: Fonts.size.md },
});