// ══════════════════════════════════════════════════════════════════════════════
// SCREEN — AdminCommissionsReportScreen
// Récap des commissions plateforme / chauffeur (brut, commission, net)
// ══════════════════════════════════════════════════════════════════════════════

import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  TouchableOpacity, RefreshControl, Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useCommissionSettings } from '../../../hooks/useCommissionSettings';
import type { CommissionDetail, CommissionPeriod } from '../../../types/commission.types';
import { Colors, Fonts, Spacing, Radius } from '../../../theme/colors';
import { AppIcon } from '../../../components/common/AppIcon';

const REPORT_PERIODS: { label: string; value: CommissionPeriod }[] = [
  { label: 'Semaine', value: 'week' },
  { label: 'Mois', value: 'month' },
  { label: 'Tout', value: 'all' },
];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function CommissionCard({ item }: { item: CommissionDetail }) {
  const driverName = item.driver ? `${item.driver.first_name} ${item.driver.last_name}` : 'Chauffeur inconnu';
  const rateLabel   = item.rate_type === 'percentage' ? `${item.rate_value}%`
    : item.rate_type === 'flat' ? `${item.rate_value} fixe`
    : 'Aucun taux actif';

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.driverName}>{driverName}</Text>
        <Text style={styles.rateBadge}>{rateLabel}</Text>
      </View>
      {item.reservation && (
        <Text style={styles.route} numberOfLines={1}>
          {item.reservation.pickup_address.split(',')[0]} <AppIcon name="arrow-forward" size={10} /> {item.reservation.dest_address.split(',')[0]}
        </Text>
      )}
      <Text style={styles.date}>{formatDate(item.calculated_at)}</Text>
      <View style={styles.separator} />
      <View style={styles.amountsRow}>
        <View style={styles.amountItem}>
          <Text style={styles.amountLabel}>Brut</Text>
          <Text style={styles.amountValue}>{formatCurrency(item.gross_amount)}</Text>
        </View>
        <View style={styles.amountItem}>
          <Text style={styles.amountLabel}>Commission</Text>
          <Text style={[styles.amountValue, styles.commissionValue]}>{formatCurrency(item.commission_amount)}</Text>
        </View>
        <View style={styles.amountItem}>
          <Text style={styles.amountLabel}>Net chauffeur</Text>
          <Text style={[styles.amountValue, styles.netValue]}>{formatCurrency(item.driver_net_amount)}</Text>
        </View>
      </View>
    </View>
  );
}

export default function AdminCommissionsReportScreen() {
  const navigation = useNavigation();
  const {
    summary, commissions, commissionsTotal, commissionsPage,
    isLoading, error, fetchSummary, fetchCommissions,
  } = useCommissionSettings();

  const [activePeriod, setActivePeriod] = useState<CommissionPeriod>('month');
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const limit = 20;

  const load = useCallback(async (period: CommissionPeriod, page: number = 1) => {
    await Promise.all([
      page === 1 ? fetchSummary(period) : Promise.resolve(),
      fetchCommissions({ period, page, limit }),
    ]);
  }, [fetchSummary, fetchCommissions]);

  useEffect(() => {
    void load(activePeriod, 1);
  }, [activePeriod, load]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await load(activePeriod, 1);
    setRefreshing(false);
  };

  const handleLoadMore = async () => {
    const totalPages = Math.ceil((commissionsTotal || 0) / limit);
    if (loadingMore || isLoading || commissionsPage >= totalPages) return;
    setLoadingMore(true);
    await load(activePeriod, commissionsPage + 1);
    setLoadingMore(false);
  };

  const noActiveRate = (summary?.commissions.length ?? 0) > 0
    && summary!.commissions.every(c => c.rate_type === 'none');

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <AppIcon name="arrow-back-outline" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Récap Commissions</Text>
        <View style={styles.headerBtn} />
      </View>

      <FlatList
        data={commissions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <CommissionCard item={item} />}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.bordeaux} />}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={
          <>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Chiffre d'affaires</Text>
              <Text style={styles.summaryAmount}>{formatCurrency(summary?.total_gross_eur ?? 0)}</Text>
              <View style={styles.summaryStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{summary?.total_rides ?? 0}</Text>
                  <Text style={styles.statLabel}>Courses</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{formatCurrency(summary?.total_commission_eur ?? 0)}</Text>
                  <Text style={styles.statLabel}>Part plateforme</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{formatCurrency(summary?.total_net_eur ?? 0)}</Text>
                  <Text style={styles.statLabel}>Part chauffeurs</Text>
                </View>
              </View>
            </View>

            {noActiveRate && (
              <View style={styles.warningBanner}>
                <AppIcon name="warning-outline" size={18} color={Colors.error} />
                <Text style={styles.warningText}>
                  Aucun taux de commission actif sur cette période : les chauffeurs perçoivent 100 % du montant. Vérifiez les règles dans "Tarification &gt; Règles de commission".
                </Text>
              </View>
            )}

            <View style={styles.filterCard}>
              <Text style={styles.filterTitle}>Période</Text>
              <View style={styles.filterButtons}>
                {REPORT_PERIODS.map(period => (
                  <TouchableOpacity
                    key={period.value}
                    style={[styles.filterButton, activePeriod === period.value ? styles.filterButtonActive : styles.filterButtonInactive]}
                    onPress={() => setActivePeriod(period.value)}
                  >
                    <Text style={activePeriod === period.value ? styles.filterTextActive : styles.filterTextInactive}>
                      {period.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <Text style={styles.historyTitle}>Détail par course</Text>
          </>
        }
        ListEmptyComponent={
          isLoading ? <ActivityIndicator color={Colors.bordeaux} style={{ marginTop: Spacing.xl }} />
          : error ? <Text style={styles.errorText}>{error}</Text>
          : <Text style={styles.emptyText}>Aucune commission sur cette période.</Text>
        }
        ListFooterComponent={loadingMore ? <ActivityIndicator color={Colors.bordeaux} style={{ marginVertical: Spacing.md }} /> : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F3F3F3' },
  header: {
    backgroundColor: Colors.bordeaux,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'android' ? Spacing.xxl : 56,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  headerTitle: { color: Colors.white, fontSize: Fonts.size.lg, fontWeight: 'bold' },
  headerBtn: { padding: Spacing.xs, width: 40, alignItems: 'center' },
  listContainer: { padding: Spacing.md, paddingBottom: Spacing.xxl },

  summaryCard: {
    backgroundColor: Colors.bordeaux,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  summaryTitle: { fontSize: Fonts.size.sm, color: Colors.white, opacity: 0.8 },
  summaryAmount: { fontSize: 38, fontWeight: '900', color: Colors.white, marginVertical: Spacing.xs },
  summaryStats: { flexDirection: 'row', justifyContent: 'space-around', marginTop: Spacing.sm },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: Fonts.size.md, fontWeight: '700', color: Colors.white },
  statLabel: { fontSize: Fonts.size.xs, color: Colors.white, opacity: 0.8, marginTop: 2 },

  warningBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: '#FEF3C7',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  warningText: { flex: 1, fontSize: Fonts.size.xs, color: '#92400E', lineHeight: 16 },

  filterCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  filterTitle: { fontSize: Fonts.size.sm, fontWeight: '600', color: Colors.textSecondary, marginBottom: Spacing.sm },
  filterButtons: { flexDirection: 'row', gap: Spacing.sm },
  filterButton: { flex: 1, paddingVertical: Spacing.sm, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
  filterButtonActive: { backgroundColor: Colors.bordeaux },
  filterButtonInactive: { backgroundColor: Colors.background },
  filterTextActive: { color: Colors.white, fontWeight: '700' },
  filterTextInactive: { color: Colors.textSecondary, fontWeight: '600' },

  historyTitle: { fontSize: Fonts.size.xl, fontWeight: '800', color: Colors.bordeaux, marginBottom: Spacing.sm },

  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  driverName: { fontSize: Fonts.size.md, fontWeight: '700', color: Colors.textPrimary },
  rateBadge: { fontSize: Fonts.size.xs, fontWeight: '700', color: Colors.bordeaux },
  route: { fontSize: Fonts.size.sm, color: Colors.textSecondary, marginTop: 4 },
  date: { fontSize: Fonts.size.xs, color: Colors.textMuted, marginTop: 2 },
  separator: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.sm },
  amountsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  amountItem: { alignItems: 'center', flex: 1 },
  amountLabel: { fontSize: Fonts.size.xs, color: Colors.textMuted },
  amountValue: { fontSize: Fonts.size.sm, fontWeight: '700', color: Colors.textPrimary, marginTop: 2 },
  commissionValue: { color: Colors.bordeaux },
  netValue: { color: Colors.success },

  errorText: { textAlign: 'center', color: Colors.error, marginTop: Spacing.lg },
  emptyText: { textAlign: 'center', color: Colors.textSecondary, marginTop: Spacing.xl, fontSize: Fonts.size.md },
});
