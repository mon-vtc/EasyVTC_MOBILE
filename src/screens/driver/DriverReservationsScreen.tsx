import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { AppIcon } from '../../components/common/AppIcon';
import { AppHeader } from '../../components/common/AppHeader';
import { useReservation } from '../../hooks/useReservation';
import { Colors, Fonts, Spacing, Radius } from '../../theme/colors';
import type { Reservation, ReservationListFilters, ReservationStatus } from '../../types/reservations.types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { DriverReservationsStackParamList } from '../../types/auth.types';
import ReservationFilterModal, {
  DEFAULT_FILTERS,
  type ReservationFilters,
} from '../../components/common/ReservationFilterModal';
import { filtersToApiParams, useSortedReservations, isFiltersActive, requiresGlobalSort } from '../../hooks/useReservationFilters';

type DriverReservationsProps = NativeStackScreenProps<DriverReservationsStackParamList, 'DriverReservationsList'>;

type FilterTab = 'all' | 'assigned' | 'in_progress' | 'completed';

const TABS: { key: FilterTab; label: string; statusFilter?: ReservationStatus }[] = [
  { key: 'all',         label: 'Toutes' },
  { key: 'assigned',    label: 'A venir',   statusFilter: 'assigned' },
  { key: 'in_progress', label: 'En cours',  statusFilter: 'in_progress' },
  { key: 'completed',   label: 'Terminées', statusFilter: 'completed' },
];

const STATUS_CONFIG: Record<ReservationStatus, { label: string; bg: string; color: string; icon: string }> = {
  pending:       { label: 'En attente', bg: '#FFF8E1', color: '#F57F17', icon: 'time-outline' },
  assigned:      { label: 'Assignée',   bg: '#E3F2FD', color: '#1976D2', icon: 'car-outline' },
  driver_arrived:{ label: 'Arrivé',     bg: '#F3E5F5', color: '#7B1FA2', icon: 'location-outline' },
  in_progress:   { label: 'En cours',   bg: '#E8F5E9', color: '#2E7D32', icon: 'bicycle-outline' },
  completed:     { label: 'Terminée',   bg: '#E8F5E9', color: '#2E7D32', icon: 'checkmark-circle' },
  cancelled:     { label: 'Annulée',    bg: '#FFEBEE', color: '#C62828', icon: 'close-circle-outline' },
};

function ReservationCard({ reservation, onDetails, onAction }: {
  reservation: Reservation;
  onDetails: (id: string) => void;
  onAction: (id: string, status: ReservationStatus) => void;
}) {
  const status = reservation.status as ReservationStatus;
  const statusCfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  const price = reservation.price_final ?? reservation.price_estimated;
  const refNumber = `BC-${reservation.id.slice(-6).toUpperCase()}`;
  const currencySymbol = reservation.country === 'france' ? '€' : ' CFA';

  let primaryText = 'Voir';
  if (status === 'assigned')    primaryText = 'Démarrer';
  if (status === 'in_progress') primaryText = 'Continuer';

  return (
    <TouchableOpacity style={styles.card} onPress={() => onDetails(reservation.id)}>
      <View style={styles.cardHeader}>
        <View style={[styles.badge, { backgroundColor: statusCfg.bg }]}>
          <AppIcon name={statusCfg.icon as any} size={12} color={statusCfg.color} />
          <Text style={[styles.badgeText, { color: statusCfg.color }]}> {statusCfg.label}</Text>
        </View>
        <Text style={styles.price}>{price != null ? `${price.toFixed(2)} ${currencySymbol}` : '—'}</Text>
      </View>

      <Text style={styles.ref}>{refNumber}</Text>

      <View style={styles.row}>
        <AppIcon name="location-outline" size={14} color={Colors.bordeaux} />
        <Text style={styles.routeText} numberOfLines={2}>{reservation.pickup_address}</Text>
      </View>
      <View style={styles.row}>
        <AppIcon name="navigate-outline" size={14} color="#10B981" />
        <Text style={styles.routeText} numberOfLines={2}>{reservation.dest_address}</Text>
      </View>

      <View style={styles.cardFooter}>
        <TouchableOpacity style={styles.detailBtn} onPress={() => onDetails(reservation.id)}>
          <Text style={styles.detailBtnText}>Détails</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, (status === 'completed' || status === 'cancelled') ? styles.actionBtnDisabled : undefined]}
          onPress={() => onAction(reservation.id, status)}
          disabled={status === 'completed' || status === 'cancelled'}
        >
          <Text style={styles.actionBtnText}>{primaryText}</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

export default function DriverReservationsScreen({ navigation }: DriverReservationsProps) {
  const {
    reservations, fetchDriverReservations, fetchAllDriverPages,
    start, isLoading, isFetchingNextPage, page, totalPages
  } = useReservation();

  const [isSorting, setIsSorting] = useState(false);

  const [activeTab,          setActiveTab]          = useState<FilterTab>('all');
  const [refreshing,         setRefreshing]         = useState(false);
  const [searchQuery,        setSearchQuery]        = useState('');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filters,            setFilters]            = useState<ReservationFilters>(DEFAULT_FILTERS);

  const loadingRef    = useRef(false);
  const activeFilter  = TABS.find(t => t.key === activeTab)?.statusFilter;

  const load = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setRefreshing(true);

    const needsGlobalSort = requiresGlobalSort(filters);
    if (needsGlobalSort) setIsSorting(true);

    try {
      const apiParams = filtersToApiParams(filters);
      const listFilters: ReservationListFilters = { ...apiParams, page: 1 };
      if (activeFilter) listFilters.status = activeFilter;

      if (needsGlobalSort) {
        await fetchAllDriverPages(listFilters);
      } else {
        await fetchDriverReservations(listFilters);
      }
    } catch (err) {
      console.error(err);
    } finally {
      loadingRef.current = false;
      setIsSorting(false);
      setRefreshing(false);
    }
  }, [fetchDriverReservations, fetchAllDriverPages, activeFilter, filters]);

  useEffect(() => { load(); }, [load]);

  const loadMore = useCallback(() => {
    if (requiresGlobalSort(filters)) return;
    if (isLoading || isFetchingNextPage || page >= totalPages) return;

    const apiParams = filtersToApiParams(filters);
    const listFilters: ReservationListFilters = { ...apiParams, page: page + 1 };
    if (activeFilter) {
      listFilters.status = activeFilter;
    }

    fetchDriverReservations(listFilters).catch(err => {
      console.error("Failed to load more driver reservations:", err);
    });
  }, [filters, isLoading, isFetchingNextPage, page, totalPages, fetchDriverReservations]);

  const handleApplyFilters = (newFilters: ReservationFilters) => {
    setFilters(newFilters);
    setFilterModalVisible(false);
  };

  // Tri côté client
  const sortedReservations = useSortedReservations(reservations, filters);

  // Filtre par tab (côté client pour 'all' si besoin)
  const tabFiltered = useMemo(() => {
    if (!sortedReservations) return [];
    if (activeTab === 'all') return sortedReservations;
    return sortedReservations.filter(r => r.status === activeTab);
  }, [sortedReservations, activeTab]);

  // Recherche textuelle sur le résultat trié + filtré
  const searchedReservations = useMemo(() => {
    if (!searchQuery) return tabFiltered;
    const query = searchQuery.toLowerCase();
    return tabFiltered.filter(r =>
      r.id.toLowerCase().includes(query) ||
      r.pickup_address.toLowerCase().includes(query) ||
      r.dest_address.toLowerCase().includes(query) ||
      (r.client && `${r.client.first_name} ${r.client.last_name}`.toLowerCase().includes(query))
    );
  }, [tabFiltered, searchQuery]);

  const handleDetails = (id: string) => {
    navigation.navigate('DriverReservationDetails', { reservationId: id });
  };

  const handleAction = async (id: string, status: ReservationStatus) => {
    if (status === 'assigned') {
      try {
        await start(id);
        await load();
        navigation.navigate('DriverReservationDetails', { reservationId: id });
      } catch (err: any) {
        console.error(err);
      }
      return;
    }
    handleDetails(id);
  };

  const filtersActive = isFiltersActive(filters);

  return (
    <View style={styles.flex}>

      {/* ── Header ── */}
      <AppHeader
        left="menu"
        title="Mes courses"
        rightIcon={{
          name: 'notifications-outline',
          onPress: () => navigation.getParent()?.getParent()?.navigate('DriverNotificationList' as any),
        }}
      />

      {/* ── Onglets ── */}
      <View style={styles.tabBar}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabItem, activeTab === tab.key ? styles.tabItemActive : undefined]}
            onPress={() => { setActiveTab(tab.key); setSearchQuery(''); }}
          >
            <Text style={[styles.tabLabel, activeTab === tab.key ? styles.tabLabelActive : undefined]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Recherche + Tri ── */}
      <View style={styles.searchContainer}>
        <View style={styles.searchWrapper}>
          <AppIcon name="search" size={18} color={Colors.iconMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher par ID, adresse, client..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <AppIcon name="close-circle" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[styles.filterBtn, filtersActive && styles.filterBtnActive]}
          onPress={() => setFilterModalVisible(true)}
        >
          <AppIcon
            name="funnel-outline"
            size={20}
            color={filtersActive ? Colors.white : Colors.bordeaux}
          />
          {filtersActive && <View style={styles.filterBadge} />}
        </TouchableOpacity>
      </View>

      {/* Résumé des filtres actifs */}
      {filtersActive && (
        <View style={styles.filterSummary}>
          <AppIcon name="information-circle-outline" size={14} color={Colors.bordeaux} />
          <Text style={styles.filterSummaryText}>
            {filters.dateMode === 'specific' && filters.dateExact
              ? `Date : ${filters.dateExact.split('-').reverse().join('/')}`
              : filters.dateMode === 'period'
              ? `Période : ${filters.dateFrom?.split('-').reverse().join('/') ?? '…'} -> ${filters.dateTo?.split('-').reverse().join('/') ?? '…'}`
              : ''}
          </Text>
          {(filters.sortField !== 'date' || filters.sortOrder !== 'desc') && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
              <Text style={styles.filterSummaryText}>  •  Tri : {filters.sortField === 'price' ? 'prix' : 'date'}</Text>
              <AppIcon
                name={filters.sortOrder === 'asc' ? 'arrow-up-outline' : 'arrow-down-outline'}
                size={13}
                color={Colors.bordeaux}
              />
            </View>
          )}
          <TouchableOpacity onPress={() => setFilters(DEFAULT_FILTERS)}>
            <AppIcon name="close-circle" size={16} color={Colors.bordeaux} />
          </TouchableOpacity>
        </View>
      )}

      {/* ── Liste ── */}
      {(isLoading && !refreshing) || isSorting ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={Colors.bordeaux} />
          {isSorting && (
            <Text style={{ color: Colors.textSecondary, fontSize: Fonts.size.sm, marginTop: Spacing.sm }}>
              Tri en cours…
            </Text>
          )}
        </View>
      ) : (
        <FlatList
          data={searchedReservations}
          keyExtractor={(item) => item.id}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          contentContainerStyle={searchedReservations.length > 0 ? styles.list : styles.flex}
          refreshControl={<RefreshControl refreshing={refreshing && !isFetchingNextPage} onRefresh={load} colors={[Colors.bordeaux]} />}
          ListFooterComponent={isFetchingNextPage ? <ActivityIndicator style={{ marginVertical: 20 }} color={Colors.bordeaux} /> : null}
          ListEmptyComponent={() => (
            !isLoading && (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>Aucune course à afficher.</Text>
              </View>
            )
          )}
          renderItem={({ item }) => {
            if (!item) return null;
            return (
            <ReservationCard
              reservation={item}
              onDetails={handleDetails}
              onAction={handleAction}
            />)
          }
          }
        />
      )}

      {/* ── Modal de filtres ── */}
      <ReservationFilterModal
        visible={filterModalVisible}
        filters={filters}
        onApply={handleApplyFilters}
        onClose={() => setFilterModalVisible(false)}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  flex:   { flex: 1, backgroundColor: Colors.background },

  tabBar:        { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm, backgroundColor: Colors.surface, borderRadius: Radius.md, padding: 4, marginHorizontal: Spacing.md, marginTop: Spacing.sm },
  tabItem:       { flex: 1, alignItems: 'center', paddingVertical: Spacing.sm, borderRadius: Radius.sm },
  tabItemActive: { backgroundColor: Colors.bordeauxLight },
  tabLabel:      { fontSize: Fonts.size.sm, color: Colors.textSecondary, fontFamily: Fonts.semibold, fontWeight: '600' },
  tabLabelActive:{ color: Colors.white },

  // Recherche + tri
  searchContainer: { flexDirection: 'row', alignItems: 'center', marginHorizontal: Spacing.md, marginBottom: Spacing.sm, gap: Spacing.sm, zIndex: 1 },
  searchWrapper:   { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.surface, borderRadius: Radius.md, paddingHorizontal: Spacing.md, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1, zIndex: 1 },
  searchInput:     { flex: 1, height: 44, fontSize: Fonts.size.sm, color: Colors.textPrimary, paddingVertical: 0, zIndex: 1 },
  filterBtn: {
    padding: 10,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
    zIndex: 1,
    position: 'relative',
  },
  filterBtnActive: {
    backgroundColor: Colors.bordeaux,
  },
  filterBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.warning ?? '#F59E0B',
    borderWidth: 1.5,
    borderColor: Colors.white,
  },

  // Résumé filtres
  filterSummary: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginHorizontal: Spacing.md, marginBottom: Spacing.sm, backgroundColor: Colors.bordeaux + '12', borderRadius: Radius.sm, paddingVertical: 6, paddingHorizontal: Spacing.sm, borderLeftWidth: 3, borderLeftColor: Colors.bordeaux },
  filterSummaryText: { flex: 1, fontSize: Fonts.size.xs, color: Colors.bordeaux, fontFamily: Fonts.medium, fontWeight: '500' },

  list:  { marginHorizontal: Spacing.md, paddingBottom: Spacing.xl },
  loader:{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: Spacing.xxl },
  empty: { marginTop: Spacing.lg, alignItems: 'center' },
  emptyText: { color: Colors.textSecondary },

  card: { backgroundColor: Colors.white, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xs },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: Fonts.size.xs, fontFamily: Fonts.bold, fontWeight: '700' },
  price: { fontSize: Fonts.size.lg, fontFamily: Fonts.bold, fontWeight: '800', color: Colors.bordeaux },
  ref: { marginBottom: Spacing.xs, color: Colors.textSecondary, fontSize: Fonts.size.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.xs },
  routeText: { fontSize: Fonts.size.sm, color: Colors.textPrimary, flex: 1 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.sm },
  detailBtn: { backgroundColor: Colors.surface, borderRadius: Radius.sm, paddingVertical: 8, paddingHorizontal: Spacing.md },
  detailBtnText: { color: Colors.bordeaux, fontFamily: Fonts.bold, fontWeight: '700' },
  actionBtn: { backgroundColor: Colors.bordeaux, borderRadius: Radius.sm, paddingVertical: 8, paddingHorizontal: Spacing.md },
  actionBtnDisabled: { backgroundColor: Colors.border },
  actionBtnText: { color: Colors.white, fontFamily: Fonts.bold, fontWeight: '700' },
});