import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  TextInput, RefreshControl, Platform, ActivityIndicator,
} from 'react-native';
import { useAdmin } from '../../hooks/useAdmin';
import { AppIcon } from '../../components/common/AppIcon';
import { Colors, Fonts, Spacing, Radius } from '../../theme/colors';
import type { AuditLog, AuditLogListFilters } from '../../types';
import AuditLogFilterModal from '../../components/admin/AuditLogFilterModal';
import {
  DEFAULT_AUDIT_LOG_FILTERS,
  type AuditLogFilters,
  auditLogFiltersToApiParams, isAuditLogFiltersActive } from '../../hooks/useAuditLogFilters';

const ACTION_COLORS: Record<string, string> = {
  _CREATED: '#22C55E', // vert
  _UPDATED: '#3B82F6', // bleu
  _DELETED: '#EF4444', // rouge
  _LOGIN:   '#6366F1', // indigo
  _ASSIGNED:'#F59E0B', // ambre
  _SENT:    '#8B5CF6', // violet
};

function getActionColor(action: string): string {
  const suffix = Object.keys(ACTION_COLORS).find(s => action.endsWith(s));
  return suffix ? ACTION_COLORS[suffix] : Colors.textSecondary;
}

function AuditLogCard({ log, onPress }: { log: AuditLog; onPress: () => void }) {
  const user = log.user ? `${log.user.first_name} ${log.user.last_name}` : 'Système';
  const actionColor = getActionColor(log.action);
  const date = new Date(log.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  const time = new Date(log.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.cardHeader}>
        <View style={styles.actionPill}>
          <View style={[styles.actionDot, { backgroundColor: actionColor }]} />
          <Text style={styles.actionText}>{log.action}</Text>
        </View>
        <Text style={styles.dateTime}>{date} à {time}</Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.userText}>{user}</Text>
        {log.entity_type && (
          <Text style={styles.entityText}>
            sur {log.entity_type} <Text style={styles.entityId}>({log.entity_id?.slice(0, 8)})</Text>
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function AdminAuditLogsScreen({ navigation }: any) {
  const {
    auditLogs,
    auditLogsTotal,
    auditLogsPage,
    auditLogsTotalPages,
    isAuditLogsLoading,
    isFetchingNextAuditLogPage,
    auditLogsError,
    fetchAuditLogs,
    clearAuditLogsError,
  } = useAdmin();

  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<AuditLogFilters>(DEFAULT_AUDIT_LOG_FILTERS);
  const [refreshing, setRefreshing] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  const load = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const apiParams = auditLogFiltersToApiParams(filters);
      await fetchAuditLogs({ ...apiParams, page: 1, limit: 25, search: searchQuery || undefined });
    } catch (err) {
      console.error(err);
    } finally {
      if (showRefresh) setRefreshing(false);
    }
  }, [fetchAuditLogs, searchQuery, filters]);

  useEffect(() => {
    const searchDebounce = setTimeout(() => {
      load();
    }, 300);
    return () => clearTimeout(searchDebounce);
  }, [searchQuery]);

  useEffect(() => { load(); }, [filters]);

  const loadMore = useCallback(() => {
    if (isAuditLogsLoading || isFetchingNextAuditLogPage || auditLogsPage >= auditLogsTotalPages) return;
    const apiParams = auditLogFiltersToApiParams(filters);
    fetchAuditLogs({
      ...apiParams,
      page: auditLogsPage + 1,
      limit: 25,
      search: searchQuery || undefined,
    });
  }, [isAuditLogsLoading, isFetchingNextAuditLogPage, auditLogsPage, auditLogsTotalPages, fetchAuditLogs, searchQuery, filters]);

  const handleOpenDetails = (log: AuditLog) => {
    navigation.navigate('AdminAuditLogDetail', { logId: log.id });
  };

  const handleApplyFilters = (newFilters: AuditLogFilters) => {
    setFilters(newFilters);
    setFilterModalVisible(false);
  };

  const renderLog = ({ item }: { item: AuditLog }) => (
    <AuditLogCard log={item} onPress={() => handleOpenDetails(item)} />
  );

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <AppIcon name="menu" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Journaux d'audit</Text>
        <View style={styles.headerBtn} />
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchWrapper}>
          <AppIcon name="search" size={18} color={Colors.iconMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher par action, utilisateur, entité..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <AppIcon name="close-circle" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[styles.filterBtn, isAuditLogFiltersActive(filters) && styles.filterBtnActive]}
          onPress={() => setFilterModalVisible(true)}
        >
          <AppIcon
            name="funnel-outline"
            size={20}
            color={isAuditLogFiltersActive(filters) ? Colors.white : Colors.bordeaux}
          />
        </TouchableOpacity>
      </View>

      {isAuditLogFiltersActive(filters) && (
        <View style={styles.filterSummary}>
          <AppIcon name="information-circle-outline" size={14} color={Colors.bordeaux} />
          <Text style={styles.filterSummaryText} numberOfLines={1}>
            {filters.dateMode === 'specific' && filters.dateExact
              ? `Date : ${filters.dateExact.split('-').reverse().join('/')}`
              : filters.dateMode === 'period'
              ? `Période : ${filters.dateFrom?.split('-').reverse().join('/') ?? '…'} -> ${filters.dateTo?.split('-').reverse().join('/') ?? '…'}`
              : ''}
          </Text>
          <Text style={styles.filterSummaryText}>
            {' • Tri : '}
            {filters.sortField === 'created_at' ? 'Date' : 'Action'}
            {filters.sortOrder === 'asc' ? ' ↑' : ' ↓'}
          </Text>
          <TouchableOpacity style={{ marginLeft: 'auto' }} onPress={() => setFilters(DEFAULT_AUDIT_LOG_FILTERS)}>
            <AppIcon name="close-circle" size={16} color={Colors.bordeaux} />
          </TouchableOpacity>
        </View>
      )}

      {isAuditLogsLoading && auditLogs.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.bordeaux} />
          <Text style={styles.loadingText}>Chargement des journaux...</Text>
        </View>
      ) : (
        <FlatList
          data={auditLogs}
          keyExtractor={(item) => item.id}
          renderItem={renderLog}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
          ListEmptyComponent={
            !isAuditLogsLoading ? (
              <View style={styles.empty}>
                <AppIcon name="document-text-outline" size={40} color={Colors.textMuted} />
                <Text style={styles.emptyText}>Aucun journal trouvé</Text>
              </View>
            ) : null
          }
          ListFooterComponent={isFetchingNextAuditLogPage ? <ActivityIndicator style={{ marginVertical: 20 }} color={Colors.bordeaux} /> : null}
          contentContainerStyle={styles.listContent}
        />
      )}

      {auditLogsError && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{auditLogsError}</Text>
          <TouchableOpacity onPress={clearAuditLogsError}>
            <AppIcon name="close" size={20} color={Colors.error} />
          </TouchableOpacity>
        </View>
      )}

      <AuditLogFilterModal
        visible={filterModalVisible}
        filters={filters}
        onApply={handleApplyFilters}
        onClose={() => setFilterModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.bordeaux,
    paddingTop: Platform.OS === 'ios' ? 56 : Spacing.xl + 8,
    paddingBottom: Spacing.md, paddingHorizontal: Spacing.md,
  },
  headerBtn: { padding: Spacing.sm, width: 40 },
  headerTitle: { color: Colors.white, fontWeight: '800', fontSize: Fonts.size.lg },

  searchContainer: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: isAuditLogFiltersActive(DEFAULT_AUDIT_LOG_FILTERS) ? Spacing.xs : Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  searchWrapper: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
  },
  filterBtn: {
    padding: 10,
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
  },
  filterBtnActive: {
    backgroundColor: Colors.bordeaux,
  },
  filterSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    backgroundColor: Colors.bordeaux + '12',
    borderRadius: Radius.sm,
    paddingVertical: 6,
    paddingHorizontal: Spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: Colors.bordeaux,
  },
  filterSummaryText: {
    fontSize: Fonts.size.xs,
    color: Colors.bordeaux,
    fontWeight: '500',
  },
  searchInput: {
    flex: 1, fontSize: Fonts.size.sm, color: Colors.textPrimary, padding: 0,
  },

  listContent: {
    padding: Spacing.md,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07, shadowRadius: 4, elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  actionText: {
    fontSize: Fonts.size.sm,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  dateTime: {
    fontSize: Fonts.size.xs,
    color: Colors.textMuted,
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.xs,
  },
  userText: {
    fontSize: Fonts.size.sm,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  entityText: {
    fontSize: Fonts.size.sm,
    color: Colors.textSecondary,
  },
  entityId: {
    fontFamily: 'monospace',
    fontSize: Fonts.size.xs,
  },

  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  loadingText: { color: Colors.textSecondary, fontSize: Fonts.size.sm },
  empty: { alignItems: 'center', paddingVertical: 60, gap: Spacing.md },
  emptyText: { color: Colors.textMuted, fontSize: Fonts.size.md },
  errorBanner: {
    backgroundColor: Colors.errorLight, borderLeftWidth: 3, borderLeftColor: Colors.error,
    padding: Spacing.md, marginHorizontal: Spacing.md, marginTop: Spacing.sm,
    borderRadius: Radius.sm, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  errorText: { color: Colors.error, fontSize: Fonts.size.sm, flex: 1 },
});