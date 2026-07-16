// ══════════════════════════════════════════════════════════════════════════════
// SCREEN — Mes Revenus (Driver)
// ══════════════════════════════════════════════════════════════════════════════
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  TouchableOpacity, RefreshControl, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors, Fonts, Spacing, Radius } from '../../theme/colors';
import { useDriver } from '../../hooks/useDriver';
import { useNotifications } from '../../hooks/useNotifications';
import type { DriverRevenuesResult, RevenueTrip, RevenuesPeriod, RevenueStatus } from '../../types';
import { AppIcon } from '../../components/common/AppIcon';
import { AppHeader } from '../../components/common/AppHeader';
import { useBottomInset } from '../../hooks/useSafeAreaPadding';

const REVENUE_PERIODS: { label: string; value: RevenuesPeriod }[] = [
  { label: 'Jour', value: 'day' },
  { label: 'Semaine', value: 'week' },
  { label: 'Mois', value: 'month' },
  { label: 'Tout', value: 'all' },
];

const REVENUE_STATUS_FILTERS: { label: string; value: 'completed' | 'cancelled' | undefined }[] = [
  { label: 'Toutes', value: undefined },
  { label: 'Terminées', value: 'completed' },
  { label: 'Annulées', value: 'cancelled' },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatCurrency(value: number, currency: string): string {
  return new Intl.NumberFormat(currency === 'EUR' ? 'fr-FR' : 'fr-SN', {
    style: 'currency',
    currency,
    minimumFractionDigits: currency === 'EUR' ? 2 : 0,
    maximumFractionDigits: currency === 'EUR' ? 2 : 0,
  }).format(value);
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function formatTime(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

const PERIOD_LABELS: Record<string, string> = {
  day:   'du jour',
  month: 'du mois',
  week:  'de la semaine',
  all: 'totaux',
};

const STATUS_LABELS: Record<string, string> = {
  completed: 'Courses terminées',
  cancelled: 'Courses annulées',
  undefined: 'Toutes les courses',
};

const getTitleSuffix = (period: DriverRevenuesResult | null): string =>
  period ? (PERIOD_LABELS[period.period] ?? 'total') : '';

const getStatusLabel = (status: 'completed' | 'cancelled' | undefined): string =>
  STATUS_LABELS[String(status) ?? 'undefined'] ?? 'Toutes les courses';

// ── Composants de l'écran ────────────────────────────────────────────────────

function SummaryCard({ revenues, status }: { revenues: DriverRevenuesResult | null; status: 'completed' | 'cancelled' | undefined }) {
  const totalRevenue = revenues?.total_net ?? 0;
  const totalTrips = revenues?.total_trips ?? 0;
  const avgRevenue = totalTrips > 0 ? totalRevenue / totalTrips : 0;
  const currency = revenues?.currency ?? 'EUR';

  return (
    <LinearGradient
      colors={[Colors.bordeaux, Colors.bordeauxLight]}
      style={styles.summaryCard}
    >
      <Text style={styles.summaryTitle}>Revenus {getTitleSuffix(revenues)}</Text>
      <Text style={styles.summaryAmount}>{formatCurrency(totalRevenue, currency)}</Text>
      <View style={styles.summaryStats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{totalTrips}</Text>
          <Text style={styles.statLabel}>{'Courses' + '  '}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{formatCurrency(avgRevenue, currency)}</Text>
          <Text style={styles.statLabel}>{'Revenu moyen' + '  '}</Text>
        </View>
      </View>
      <View style={styles.statusLabel}>
        <Text style={styles.statusLabelText}>{getStatusLabel(status)}</Text>
      </View>
    </LinearGradient>
  );
}

function PeriodFilterBlock({ activePeriod, onPeriodChange }: { activePeriod: RevenuesPeriod; onPeriodChange: (period: RevenuesPeriod) => void }) {
  return (
    <View style={styles.filterCard}>
      <Text style={styles.filterTitle}>Période</Text>
      <View style={styles.filterButtons}>
        {REVENUE_PERIODS.map(period => (
          <TouchableOpacity
            key={period.value}
            style={[
              styles.filterButton,
              activePeriod === period.value ? styles.filterButtonActive : styles.filterButtonInactive
            ]}
            onPress={() => onPeriodChange(period.value)}
          >
            <Text style={activePeriod === period.value ? styles.filterTextActive : styles.filterTextInactive}>
              {period.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function StatusFilterBlock({ activeStatus, onStatusChange }: { activeStatus: 'completed' | 'cancelled' | undefined; onStatusChange: (status: 'completed' | 'cancelled' | undefined) => void }) {
  return (
    <View style={styles.filterCard}>
      <Text style={styles.filterTitle}>Statut</Text>
      <View style={styles.filterButtons}>
        {REVENUE_STATUS_FILTERS.map(status => (
          <TouchableOpacity
            key={status.value ?? 'all'}
            style={[
              styles.filterButton,
              activeStatus === status.value ? styles.filterButtonActive : styles.filterButtonInactive
            ]}
            onPress={() => onStatusChange(status.value)}
          >
            <Text style={activeStatus === status.value ? styles.filterTextActive : styles.filterTextInactive}>
              {status.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function HistoryItem({ item, onInvoicePress, activeStatus }: { item: RevenueTrip; onInvoicePress: (reservationId: string) => void; activeStatus?: 'completed' | 'cancelled' | undefined }) {
  // TODO: Le statut "Payé" / "En attente" n'est pas dans les données de revenus.
  // Il faudrait l'ajouter à l'API ou le déduire d'une autre source (ex: facture).
  // Pour l'instant, on simule.
  const isPaid = Math.random() > 0.2;

  return (
    <View style={styles.historyCard}>
      <View style={styles.historyHeader}>
        <Text style={styles.historyRef}>BC-{item.reservation_id.substring(0, 8).toUpperCase()}</Text>
        <View style={[styles.statusBadge, isPaid ? styles.statusPaid : styles.statusPending]}>
          <Text style={isPaid ? styles.statusTextPaid : styles.statusTextPending}>
            {isPaid ? 'Payé' : 'En attente'}
          </Text>
        </View>
      </View>

      <View style={styles.historyRow}>
        <Ionicons name="person-outline" size={16} color={Colors.textSecondary} />
        <Text style={styles.historyText}>{item.client_first_name?.split(',')[0] || 'Client inconnu'} {item.client_last_name?.split(',')[0] || 'Inconnu'}</Text>
      </View>

      <View style={styles.historyRow}>
        <Ionicons name="map-outline" size={16} color={Colors.textSecondary} />
        <Text style={styles.historyText}>{item.pickup_address.split(',')[0]} <AppIcon name='arrow-forward' size={10} /> {item.dest_address.split(',')[0]}</Text>
      </View>

      <View style={[styles.historyRow, { justifyContent: 'space-between' }]}>
        <View style={{ flexDirection: 'row' }}>
          <Ionicons name="calendar-outline" size={16} color={Colors.textMuted} />
          <Text style={styles.historyDate}>{formatDate(item.scheduled_at)}</Text>
        </View>
        <View style={{ flexDirection: 'row' }}>
          <Ionicons name="time-outline" size={16} color={Colors.textMuted} style={{ marginLeft: Spacing.md }} />
          <Text style={styles.historyDate}>{formatTime(item.scheduled_at)}</Text>
        </View>
      </View>

      <View style={styles.separator} />

      {activeStatus !== 'cancelled' && (
        <View style={styles.historyFooter}>
          <Text style={styles.historyAmount}>{formatCurrency(item.price_final, item.currency)}</Text>
          {item.rating !== null && (
            <View style={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map(star => (
                <Ionicons
                  key={star}
                  name={star <= Math.round(item.rating!) ? 'star' : 'star-outline'}
                  size={16}
                  color={star <= Math.round(item.rating!) ? '#F5A623' : Colors.border}
                />
              ))}
              {/* <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text> */}
            </View>
          )}
          <TouchableOpacity onPress={() => onInvoicePress(item.reservation_id)}>
            <Text style={styles.invoiceLink}>Facture</Text>
          </TouchableOpacity>
        </View>  
      )}
    </View>
  );
}

export default function DriverRevenuesScreen() {
  const navigation = useNavigation<any>();
  const { unreadCount } = useNotifications();
  const { fetchRevenuesWithFilters, revenues, isFetchingRevenues, revenuesError } = useDriver();
  const [activePeriod, setActivePeriod] = useState<RevenuesPeriod>('week');
  const [activeStatus, setActiveStatus] = useState<'completed' | 'cancelled' | undefined>(undefined);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localRefreshing, setLocalRefreshing] = useState(false);
  const listBottomInset = useBottomInset(styles.listContainer.paddingBottom);

  const handleFetchRevenues = useCallback(async (period: RevenuesPeriod, status: 'completed' | 'cancelled' | undefined, page: number = 1) => {
    try {
      setError(null);
      if (page === 1) {
        setLocalRefreshing(true);
      } else {
        setIsLoadingMore(true);
      }
      await fetchRevenuesWithFilters(period, status, page);
    } catch (e: any) {
      setError(e.message || 'Erreur lors de la récupération des revenus');
    } finally {
      setLocalRefreshing(false);
      setIsLoadingMore(false);
    }
  }, [fetchRevenuesWithFilters]);

  useEffect(() => {
    handleFetchRevenues(activePeriod, activeStatus, 1);
  }, [activePeriod, activeStatus]);

  const handleRefresh = () => {
    handleFetchRevenues(activePeriod, activeStatus, 1);
  };

  const handleLoadMore = () => {
    if (revenues && revenues.page && !isFetchingRevenues && !isLoadingMore) {
      const nextPage = revenues.page + 1;
      const totalPages = Math.ceil((revenues.total_trips_unfiltered || 0) / (revenues.limit || 20));
      if (nextPage <= totalPages) {
        handleFetchRevenues(activePeriod, activeStatus, nextPage);
      }
    }
  };

  const handleInvoicePress = (reservationId: string) => {
    navigation.navigate('DriverInvoiceDetails', { reservationId });
  };

  const renderListHeader = () => (
    <>
      <SummaryCard revenues={revenues} status={activeStatus} />
      <PeriodFilterBlock activePeriod={activePeriod} onPeriodChange={setActivePeriod} />
      <StatusFilterBlock activeStatus={activeStatus} onStatusChange={setActiveStatus} />
      <View style={styles.historyTitleContainer}>
        <Text style={styles.historyTitle}>Historique</Text>
        <TouchableOpacity>
          <Text style={styles.exportButton}>Exporter</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  const renderEmpty = () => {
    if (isFetchingRevenues && (!revenues || revenues.trips.length === 0)) {
      return <ActivityIndicator color={Colors.bordeaux} style={{ marginTop: Spacing.xl }} />;
    }
    if (error || revenuesError) {
      return <Text style={styles.errorText}>{error || revenuesError}</Text>;
    }
    return (
      <View style={styles.emptyState}>
        <Ionicons name="wallet-outline" size={48} color={Colors.border} />
        <Text style={styles.emptyTitle}>Aucun revenu</Text>
        <Text style={styles.emptyText}>
          Les revenus de vos courses {'\n'}
          {activeStatus === 'completed' ? 'terminées' : activeStatus === 'cancelled' ? 'annulées' : ''}
          {'\n'}apparaîtront ici.
        </Text>
      </View>
    );
  };

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return <ActivityIndicator color={Colors.bordeaux} style={{ marginVertical: Spacing.md }} />;
  };

  return (
    <View style={styles.root}>
      <AppHeader
        left="menu"
        title="Revenus"
        rightIcon={{
          name: 'notifications-outline',
          onPress: () => navigation.navigate('DriverNotificationList' as never),
          badge: unreadCount,
        }}
      />
      <FlatList
        data={revenues?.trips ?? []}
        keyExtractor={(item, index) => `${item.reservation_id}-${index}`}
        renderItem={({ item }) => <HistoryItem item={item} onInvoicePress={handleInvoicePress} activeStatus={activeStatus} />}
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={localRefreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.bordeaux}
          />
        }
        contentContainerStyle={[styles.listContainer, { paddingBottom: listBottomInset }]}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// STYLES
// ══════════════════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F3F3F3' },
  listContainer: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  errorText: { textAlign: 'center', color: Colors.error, marginTop: Spacing.lg },

  summaryCard: {
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  summaryTitle: { fontSize: Fonts.size.sm, color: Colors.white, opacity: 0.8 },
  summaryAmount: { fontSize: 42, fontFamily: Fonts.bold, fontWeight: '900', color: Colors.white, marginVertical: Spacing.xs },
  summaryStats: { flexDirection: 'row', justifyContent: 'space-around', marginTop: Spacing.sm },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: Fonts.size.lg, fontFamily: Fonts.bold, fontWeight: '700', color: Colors.white },
  statLabel: { fontSize: Fonts.size.xs, color: Colors.white, opacity: 0.8, marginTop: 2 },
  statusLabel: { marginTop: Spacing.md, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: Radius.sm },
  statusLabelText: { color: Colors.white, fontSize: Fonts.size.xs, fontFamily: Fonts.semibold, fontWeight: '600', textAlign: 'center' },

  filterCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  filterTitle: { fontSize: Fonts.size.sm, fontFamily: Fonts.semibold, fontWeight: '600', color: Colors.textSecondary, marginBottom: Spacing.sm },
  filterButtons: { flexDirection: 'row', gap: Spacing.sm },
  filterButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButtonActive: { backgroundColor: Colors.bordeaux },
  filterButtonInactive: { backgroundColor: Colors.background },
  filterTextActive: { color: Colors.white, fontFamily: Fonts.bold, fontWeight: '700' },
  filterTextInactive: { color: Colors.textSecondary, fontFamily: Fonts.semibold, fontWeight: '600' },

  ratingContainer: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  ratingText: { fontSize: Fonts.size.sm, color: Colors.textMuted, marginLeft: Spacing.xs },

  historyTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  historyTitle: { fontSize: Fonts.size.xl, fontFamily: Fonts.bold, fontWeight: '800', color: Colors.bordeaux },
  exportButton: { fontSize: Fonts.size.sm, fontFamily: Fonts.semibold, fontWeight: '600', color: Colors.bordeaux },

  historyCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  historyRef: { fontSize: Fonts.size.md, fontFamily: Fonts.bold, fontWeight: '700', color: Colors.bordeaux },
  statusBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: Radius.full },
  statusPaid: { backgroundColor: '#DCFCE7' },
  statusPending: { backgroundColor: '#FEF3C7' },
  statusTextPaid: { color: '#166534', fontSize: Fonts.size.xs, fontFamily: Fonts.bold, fontWeight: '700' },
  statusTextPending: { color: '#92400E', fontSize: Fonts.size.xs, fontFamily: Fonts.bold, fontWeight: '700' },

  historyRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.xs },
  historyText: { fontSize: Fonts.size.sm, color: Colors.textPrimary },
  historyDate: { fontSize: Fonts.size.sm, color: Colors.textMuted },

  separator: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.sm },

  historyFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  historyAmount: { fontSize: Fonts.size.lg, fontFamily: Fonts.bold, fontWeight: '800', color: Colors.bordeaux },
  invoiceLink: { fontSize: Fonts.size.sm, fontFamily: Fonts.semibold, fontWeight: '600', color: Colors.bordeaux },

  emptyState: { alignItems: 'center', paddingTop: Spacing.xxl },
  emptyTitle: { fontSize: Fonts.size.lg, fontFamily: Fonts.bold, fontWeight: '700', color: Colors.textSecondary, marginTop: Spacing.md },
  emptyText: { fontSize: Fonts.size.sm, color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.sm, lineHeight: 20 },
});
