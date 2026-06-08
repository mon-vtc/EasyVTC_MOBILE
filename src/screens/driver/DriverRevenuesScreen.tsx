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
import { Colors, Fonts, Spacing, Radius } from '../../theme/colors';
import { useDriver } from '../../hooks/useDriver';
import type { DriverRevenuesResult, RevenueTrip, RevenuesPeriod } from '../../types';

const REVENUE_FILTERS: { label: string; value: RevenuesPeriod }[] = [
  { label: 'Semaine', value: 'week' },
  { label: 'Mois', value: 'month' },
  { label: 'Tout', value: 'all' },
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

// ── Composants de l'écran ────────────────────────────────────────────────────

function SummaryCard({ revenues }: { revenues: DriverRevenuesResult | null }) {
  const totalRevenue = revenues?.total_net ?? 0;
  const totalTrips = revenues?.total_trips ?? 0;
  const avgRevenue = totalTrips > 0 ? totalRevenue / totalTrips : 0;
  const currency = revenues?.currency ?? 'EUR';

  return (
    <LinearGradient
      colors={[Colors.bordeaux, Colors.bordeauxLight]}
      style={styles.summaryCard}
    >
      <Text style={styles.summaryTitle}>Revenus de la {revenues?.period === 'month' ? 'mois' : 'semaine'}</Text>
      <Text style={styles.summaryAmount}>{formatCurrency(totalRevenue, currency)}</Text>
      <View style={styles.summaryStats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{totalTrips}</Text>
          <Text style={styles.statLabel}>Courses</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{formatCurrency(avgRevenue, currency)}</Text>
          <Text style={styles.statLabel}>Revenu moyen</Text>
        </View>
      </View>
    </LinearGradient>
  );
}

function FilterBlock({ activeFilter, onFilterChange }: { activeFilter: RevenuesPeriod, onFilterChange: (filter: RevenuesPeriod) => void }) {
  return (
    <View style={styles.filterCard}>
      <Text style={styles.filterTitle}>Filtrer par</Text>
      <View style={styles.filterButtons}>
        {REVENUE_FILTERS.map(filter => (
          <TouchableOpacity
            key={filter.value}
            style={[
              styles.filterButton,
              activeFilter === filter.value ? styles.filterButtonActive : styles.filterButtonInactive
            ]}
            onPress={() => onFilterChange(filter.value)}
          >
            <Text style={activeFilter === filter.value ? styles.filterTextActive : styles.filterTextInactive}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function HistoryItem({ item }: { item: RevenueTrip }) {
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
        <Text style={styles.historyText}>{item.client_first_name?.split(',')[0] || 'Client inconnu'}  {item.client_last_name?.split(',')[0] || 'Inconnu'}</Text>
      </View>

      <View style={styles.historyRow}>
        <Ionicons name="map-outline" size={16} color={Colors.textSecondary} />
        <Text style={styles.historyText}>{item.pickup_address.split(',')[0]} → {item.dest_address.split(',')[0]}</Text>
      </View>

      <View style={styles.historyRow}>
        <Ionicons name="calendar-outline" size={16} color={Colors.textMuted} />
        <Text style={styles.historyDate}>{formatDate(item.scheduled_at)}</Text>
        <Ionicons name="time-outline" size={16} color={Colors.textMuted} style={{ marginLeft: Spacing.md }} />
        <Text style={styles.historyDate}>{formatTime(item.scheduled_at)}</Text>
      </View>

      <View style={styles.separator} />

      <View style={styles.historyFooter}>
        <Text style={styles.historyAmount}>{formatCurrency(item.price_final, item.currency)}</Text>
        <TouchableOpacity>
          <Text style={styles.invoiceLink}>Facture</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function DriverRevenuesScreen() {
  const { getMyRevenues } = useDriver();
  const [revenues, setRevenues] = useState<DriverRevenuesResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<RevenuesPeriod>('week');

  const loadRevenues = useCallback(async (period: RevenuesPeriod) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getMyRevenues(period);
      setRevenues(data);
    } catch (e: any) {
      setError(e.message || "Erreur lors de la récupération des revenus.");
    } finally {
      setIsLoading(false);
    }
  }, [getMyRevenues]);

  useEffect(() => {
    loadRevenues(activeFilter);
  }, [activeFilter, loadRevenues]);

  const handleRefresh = () => {
    loadRevenues(activeFilter);
  };

  const renderListHeader = () => (
    <>
      <SummaryCard revenues={revenues} />
      <FilterBlock activeFilter={activeFilter} onFilterChange={setActiveFilter} />
      <View style={styles.historyTitleContainer}>
        <Text style={styles.historyTitle}>Historique</Text>
        <TouchableOpacity>
          <Text style={styles.exportButton}>Exportateur</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  const renderEmpty = () => {
    if (isLoading) return <ActivityIndicator color={Colors.bordeaux} style={{ marginTop: Spacing.xl }} />;
    if (error) return <Text style={styles.errorText}>{error}</Text>;
    return (
      <View style={styles.emptyState}>
        <Ionicons name="wallet-outline" size={48} color={Colors.border} />
        <Text style={styles.emptyTitle}>Aucun revenu</Text>
        <Text style={styles.emptyText}>Les revenus de vos courses terminées{'\n'}apparaîtront ici.</Text>
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <FlatList
        data={revenues?.trips ?? []}
        keyExtractor={(item) => item.reservation_id}
        renderItem={({ item }) => <HistoryItem item={item} />}
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            tintColor={Colors.bordeaux}
          />
        }
        contentContainerStyle={styles.listContainer}
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
  summaryAmount: { fontSize: 42, fontWeight: '900', color: Colors.white, marginVertical: Spacing.xs },
  summaryStats: { flexDirection: 'row', justifyContent: 'space-around', marginTop: Spacing.sm },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: Fonts.size.lg, fontWeight: '700', color: Colors.white },
  statLabel: { fontSize: Fonts.size.xs, color: Colors.white, opacity: 0.8, marginTop: 2 },

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
  filterTitle: { fontSize: Fonts.size.sm, fontWeight: '600', color: Colors.textSecondary, marginBottom: Spacing.sm },
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
  filterTextActive: { color: Colors.white, fontWeight: '700' },
  filterTextInactive: { color: Colors.textSecondary, fontWeight: '600' },

  historyTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  historyTitle: { fontSize: Fonts.size.xl, fontWeight: '800', color: Colors.bordeaux },
  exportButton: { fontSize: Fonts.size.sm, fontWeight: '600', color: Colors.bordeaux },

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
  historyRef: { fontSize: Fonts.size.md, fontWeight: '700', color: Colors.bordeaux },
  statusBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: Radius.full },
  statusPaid: { backgroundColor: '#DCFCE7' },
  statusPending: { backgroundColor: '#FEF3C7' },
  statusTextPaid: { color: '#166534', fontSize: Fonts.size.xs, fontWeight: '700' },
  statusTextPending: { color: '#92400E', fontSize: Fonts.size.xs, fontWeight: '700' },

  historyRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.xs },
  historyText: { fontSize: Fonts.size.sm, color: Colors.textPrimary },
  historyDate: { fontSize: Fonts.size.sm, color: Colors.textMuted },

  separator: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.sm },

  historyFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  historyAmount: { fontSize: Fonts.size.lg, fontWeight: '800', color: Colors.bordeaux },
  invoiceLink: { fontSize: Fonts.size.sm, fontWeight: '600', color: Colors.bordeaux },

  emptyState: { alignItems: 'center', paddingTop: Spacing.xxl },
  emptyTitle: { fontSize: Fonts.size.lg, fontWeight: '700', color: Colors.textSecondary, marginTop: Spacing.md },
  emptyText: { fontSize: Fonts.size.sm, color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.sm, lineHeight: 20 },
});