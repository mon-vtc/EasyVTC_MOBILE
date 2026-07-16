import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  TextInput,
  RefreshControl,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { AppIcon } from '../../components/common/AppIcon'
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useReservation } from '../../hooks/useReservation';
import { useToast } from '../../hooks/useToast';
import { useNotifications } from '../../hooks/useNotifications';
import { AppHeader } from '../../components/common/AppHeader';
import { Colors, Fonts, Spacing, Radius } from '../../theme/colors';
import DriverPickerModal from './DriverPickerModal';
import type { Reservation, ReservationStatus, AvailableDriverDto, ReservationListFilters } from '../../types/reservations.types';
import ReservationFilterModal, {
  DEFAULT_FILTERS,
  type ReservationFilters,
} from '../../components/common/ReservationFilterModal';
import { filtersToApiParams, useSortedReservations, isFiltersActive , requiresGlobalSort} from '../../hooks/useReservationFilters';

type FilterTab = 'all' | 'pending' | 'assigned' | 'completed' | 'cancelled';

const TABS: { key: FilterTab; label: string; statusFilter?: ReservationStatus }[] = [
  { key: 'all',       label: 'Tous' },
  { key: 'pending',   label: 'En attente',  statusFilter: 'pending' },
  { key: 'assigned',  label: 'Confirmés',   statusFilter: 'assigned' },
  { key: 'completed', label: 'Terminés',    statusFilter: 'completed' },
  { key: 'cancelled', label: 'Annulés',     statusFilter: 'cancelled' },
];

const STATUS_CONFIG: Record<ReservationStatus, { label: string; bg: string; color: string; icon: string }> = {
  pending:        { label: 'En attente', bg: '#FFF3E0', color: '#E65100',  icon: 'time-outline' },
  assigned:       { label: 'Confirmé',   bg: '#E3F2FD', color: '#1976D2',  icon: 'checkmark-circle-outline' },
  driver_arrived: { label: 'Arrivé',     bg: '#F3E5F5', color: '#7B1FA2',  icon: 'location-outline' },
  in_progress:    { label: 'En cours',   bg: '#E8F5E9', color: '#2E7D32',  icon: 'car-outline' },
  completed:      { label: 'Terminé',    bg: '#E8F5E9', color: '#2E7D32',  icon: 'checkmark-circle' },
  cancelled:      { label: 'Annulé',     bg: '#FFEBEE', color: '#C62828',  icon: 'close-circle-outline' },
};

// ── Card ──────────────────────────────────────────────────────────────────────
function ReservationCard({
  reservation,
  onPress,
  onAssign,
}: {
  reservation: Reservation;
  onPress: () => void;
  onAssign: () => void;
}) {
  const status    = reservation.status as ReservationStatus;
  const statusCfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  const ref       = `BC-${reservation.id.split('-').pop()?.toUpperCase()}`;
  const clientName = reservation.client
    ? `${reservation.client.first_name} ${reservation.client.last_name}`
    : 'Client inconnu';
  const driverName = reservation.driver
    ? `${reservation.driver.user.first_name} ${reservation.driver.user.last_name}`
    : null;
  const price = reservation.price_final ?? reservation.price_estimated;
  const date  = new Date(reservation.scheduled_at).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
  const time  = new Date(reservation.scheduled_at).toLocaleTimeString('fr-FR', {
    hour: '2-digit', minute: '2-digit',
  });

  const isPending    = status === 'pending';
  const buttonText   = isPending ? 'Assigner' : 'Détails';
  const buttonAction = isPending ? onAssign : onPress;

  return (
    <TouchableOpacity style={cardStyles.wrapper} onPress={onPress} activeOpacity={0.75}>
      <View style={cardStyles.row1}>
        <View style={[cardStyles.badge, { backgroundColor: statusCfg.bg }]}>
          <AppIcon name={statusCfg.icon as any} size={11} color={statusCfg.color} />
          <Text style={[cardStyles.badgeText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
        </View>
        <Text style={cardStyles.price}>
          {price != null ? `${price.toFixed(2)} €` : '—'}
        </Text>
      </View>

      <View style={cardStyles.row2}>
        <Text style={cardStyles.clientName} numberOfLines={1}>{clientName}</Text>
        <Text style={cardStyles.ref}>{ref}</Text>
      </View>

      <View style={cardStyles.sep} />

      <View style={cardStyles.routeBlock}>
        <View style={cardStyles.routeRow}>
          <View style={[cardStyles.routeDot, { backgroundColor: '#10B981' }]} />
          <Text style={cardStyles.address} numberOfLines={1}>{reservation.pickup_address}</Text>
        </View>
        <View style={cardStyles.routeLine} />
        <View style={cardStyles.routeRow}>
          <View style={[cardStyles.routeDot, { backgroundColor: Colors.bordeaux }]} />
          <Text style={cardStyles.address} numberOfLines={1}>{reservation.dest_address}</Text>
        </View>
      </View>

      <View style={cardStyles.sep} />

      <View style={cardStyles.footer}>
        <View style={cardStyles.footerLeft}>
          <View style={cardStyles.metaRow}>
            <AppIcon name="calendar-outline" size={12} color={Colors.textMuted} />
            <Text style={cardStyles.meta}>{date} • {time}</Text>
          </View>
          {driverName ? (
            <View style={cardStyles.metaRow}>
              <AppIcon name="person-outline" size={12} color={Colors.textMuted} />
              <Text style={cardStyles.meta}>{driverName}</Text>
            </View>
          ) : (
            <View style={cardStyles.metaRow}>
              <AppIcon name="person-outline" size={12} color={Colors.textMuted} />
              <Text style={[cardStyles.meta, { color: '#E65100' }]}>Non assigné</Text>
            </View>
          )}
        </View>
        <TouchableOpacity style={cardStyles.detailsBtn} onPress={buttonAction} activeOpacity={0.8}>
          <Text style={cardStyles.detailsBtnText}>{buttonText}</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const cardStyles = StyleSheet.create({
  wrapper: { backgroundColor: Colors.white, borderRadius: Radius.md, padding: Spacing.md, marginVertical: Spacing.xs, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 5, elevation: 2 },
  row1: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: Radius.full, paddingVertical: 3, paddingHorizontal: Spacing.sm },
  badgeText: { fontSize: Fonts.size.xs, fontFamily: Fonts.bold, fontWeight: '700' },
  price: { fontSize: Fonts.size.lg, fontFamily: Fonts.bold, fontWeight: '800', color: Colors.bordeaux },
  row2: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: Spacing.sm },
  clientName: { fontSize: Fonts.size.md, fontFamily: Fonts.bold, fontWeight: '700', color: Colors.textPrimary, flex: 1, marginRight: Spacing.sm },
  ref: { fontSize: Fonts.size.xs, fontFamily: Fonts.semibold, fontWeight: '600', color: Colors.textMuted, letterSpacing: 0.4 },
  sep: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.sm },
  routeBlock: { gap: 2, marginBottom: 2 },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  routeDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  routeLine: { width: 1, height: 10, backgroundColor: Colors.border, marginLeft: 3, marginVertical: 1 },
  address: { fontSize: Fonts.size.sm, color: Colors.textSecondary, flex: 1 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerLeft: { flex: 1, gap: 3 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  meta: { fontSize: Fonts.size.xs, color: Colors.textMuted },
  detailsBtn: { backgroundColor: Colors.bordeaux, borderRadius: Radius.sm, paddingVertical: 6, paddingHorizontal: 14, marginLeft: Spacing.sm },
  detailsBtnText: { color: Colors.white, fontSize: Fonts.size.xs, fontFamily: Fonts.bold, fontWeight: '700' },
});

// ── ÉCRAN PRINCIPAL ───────────────────────────────────────────────────────────
export default function AdminReservationsScreen({ navigation }: any) {
  const {
    reservations, fetchAll, fetchAllAdminPages, isLoading, isFetchingNextPage,
    page, totalPages, error, clearError, assign
  } = useReservation();
  const [isSorting, setIsSorting] = useState(false);
  const { showToast } = useToast();
  const { unreadCount } = useNotifications();
  const insets = useSafeAreaInsets();

  const [activeTab,          setActiveTab]          = useState<FilterTab>('all');
  const [searchQuery,        setSearchQuery]        = useState('');
  const [refreshing,         setRefreshing]         = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filters,            setFilters]            = useState<ReservationFilters>(DEFAULT_FILTERS);

  // Driver picker
  const [pickerVisible,     setPickerVisible]     = useState(false);
  const [targetReservation, setTargetReservation] = useState<Reservation | null>(null);

  const activeTabRef = useRef(activeTab);
  useEffect(() => { activeTabRef.current = activeTab; }, [activeTab]);

  const load = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);

    const needsGlobalSort = requiresGlobalSort(filters);
    if (needsGlobalSort && !showRefresh) setIsSorting(true);

    try {
      const apiParams = filtersToApiParams(filters);
      const listFilters: ReservationListFilters = { ...apiParams, page: 1 };
      if (activeTabRef.current !== 'all') {
        const tab = TABS.find(t => t.key === activeTabRef.current);
        if (tab?.statusFilter) listFilters.status = tab.statusFilter;
      }

      if (needsGlobalSort) {
        await fetchAllAdminPages(listFilters); // ← fetchAllAdminPages utilise listAll côté admin
      } else {
        await fetchAll(listFilters);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSorting(false);
      if (showRefresh) setRefreshing(false);
    }
  }, [fetchAll, fetchAllAdminPages, filters]);

  useEffect(() => { load(); }, [activeTab, filters]);

  const loadMore = useCallback(() => {
    if (requiresGlobalSort(filters)) return;
    if (isLoading || isFetchingNextPage || page >= totalPages) return;

    const apiParams = filtersToApiParams(filters);
    const listFilters: ReservationListFilters = { ...apiParams, page: page + 1 };
    if (activeTabRef.current !== 'all') {
      const tab = TABS.find(t => t.key === activeTabRef.current);
      if (tab?.statusFilter) listFilters.status = tab.statusFilter;
    }

    fetchAll(listFilters).catch(err => {
      console.error("Failed to load more admin reservations:", err);
    });
  }, [filters, isLoading, isFetchingNextPage, page, totalPages, fetchAll]);

  const handleTabChange = (tab: FilterTab) => {
    setActiveTab(tab);
    setSearchQuery('');
  };

  const handleApplyFilters = (newFilters: ReservationFilters) => {
    setFilters(newFilters);
    setFilterModalVisible(false);
  };

  // Tri côté client
  const sortedReservations = useSortedReservations(reservations, filters);

  // Recherche textuelle sur le résultat trié
  const filteredReservations = useMemo(() => {
    if (!searchQuery) return sortedReservations;
    const q = searchQuery.toLowerCase();
    return sortedReservations.filter(r =>
      r.id.toLowerCase().includes(q) ||
      r.pickup_address.toLowerCase().includes(q) ||
      r.dest_address.toLowerCase().includes(q) ||
      (r.client && `${r.client.first_name} ${r.client.last_name}`.toLowerCase().includes(q)) ||
      (r.driver?.user && `${r.driver.user.first_name} ${r.driver.user.last_name}`.toLowerCase().includes(q))
    );
  }, [sortedReservations, searchQuery]);

  const handleOpenReservation = (reservationId: string) => {
    navigation.navigate('AdminReservationDetail', { reservationId });
  };

  const handleAssignPress = (reservation: Reservation) => {
    setTargetReservation(reservation);
    setPickerVisible(true);
  };

  const handleAssignConfirm = async (driver: AvailableDriverDto) => {
    if (!targetReservation) return;
    try {
      await assign(targetReservation.id, driver.id);
      setPickerVisible(false);
      setTargetReservation(null);
      showToast({ type: 'success', title: 'Succès', message: `${driver.user.first_name} ${driver.user.last_name} assigné avec succès.` });
      load();
    } catch (err: any) {
      showToast({ type: 'error', title: 'Erreur', message: err?.message || "Erreur lors de l'assignation." });
      throw err;
    }
  };

  const filtersActive = isFiltersActive(filters);

  const targetRef = targetReservation
    ? `BC-${targetReservation.id.split('-').pop()?.toUpperCase()}`
    : undefined;

  const renderReservation = ({ item }: { item: Reservation }) => {
    if (!item) return null;
    return ( // ← ajoute cette ligne
    <ReservationCard
      reservation={item}
      onPress={() => handleOpenReservation(item.id)}
      onAssign={() => handleAssignPress(item)}
    />
    )
  };

  return (
    <View style={styles.flex}>

      <AppHeader
        left="menu"
        title="Réservations"
        rightIcon={{
          name: 'notifications-outline',
          onPress: () => navigation.navigate('AdminNotificationList' as never),
          badge: unreadCount,
        }}
      />

      {/* ── Filtres par statut ── */}
      <View style={styles.tabsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContent}
          bounces={false}
        >
          {TABS.map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => handleTabChange(tab.key)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ── Recherche + Tri ── */}
      <View style={styles.searchContainer}>
        <View style={styles.searchWrapper}>
          <AppIcon name="search" size={18} color={Colors.iconMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher par ID, adresse, client, chauffeur..."
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
          <Text style={styles.filterSummaryText} numberOfLines={1}>
            {filters.dateMode === 'specific' && filters.dateExact
              ? `Date : ${filters.dateExact.split('-').reverse().join('/')}`
              : filters.dateMode === 'period'
              ? `Période : ${filters.dateFrom?.split('-').reverse().join('/') ?? '…'} -> ${filters.dateTo?.split('-').reverse().join('/') ?? '…'}`
              : ''}
              </Text>
              {(filters.sortField !== 'date' || filters.sortOrder !== 'desc') && !!filters.dateMode && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3,  }}>
                  <Text style={styles.filterSummaryText}>  •  Tri : {filters.sortField === 'price' ? 'prix' : 'date'}</Text>
                  <AppIcon
                    name={filters.sortOrder === 'asc' ? 'arrow-up-outline' : 'arrow-down-outline'}
                    size={13}
                    color={Colors.bordeaux}
                  />
                </View>
              )}
          <TouchableOpacity style={{ marginLeft: 'auto' }} onPress={() => setFilters(DEFAULT_FILTERS)}>
            <AppIcon name="close-circle" size={16} color={Colors.bordeaux} />
          </TouchableOpacity>
        </View>
      )}

      {/* ── Liste ── */}
      {(isLoading || isSorting) ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.bordeaux} />
          <Text style={styles.loadingText}>
            {isSorting ? 'Tri en cours…' : 'Chargement des réservations…'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredReservations}
          keyExtractor={item => item.id}
          renderItem={renderReservation}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          refreshControl={<RefreshControl refreshing={refreshing && !isFetchingNextPage} onRefresh={() => load(true)} />}
          ListEmptyComponent={
            !isLoading && (
              <View style={styles.empty}>
                <AppIcon name="calendar-outline" size={40} color={Colors.textMuted} />
                <Text style={styles.emptyText}>Aucune réservation trouvée</Text>
              </View>
            )
          }
          ListFooterComponent={isFetchingNextPage ? <ActivityIndicator style={{ marginVertical: 20 }} color={Colors.bordeaux} /> : null}
          contentContainerStyle={
            filteredReservations.length > 0
              ? [styles.scroll, { paddingBottom: Spacing.md + insets.bottom }]
              : styles.flex
          }
        />
      )}

      {/* ── Bandeau erreur ── */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={clearError}>
            <AppIcon name="close" size={20} color={Colors.error} />
          </TouchableOpacity>
        </View>
      )}

      {/* ── Driver Picker Modal ── */}
      <DriverPickerModal
        visible={pickerVisible}
        reservationRef={targetRef}
        vehicleType={targetReservation?.vehicle_type}
        scheduledAt={targetReservation?.scheduled_at}
        durationMin={targetReservation?.duration_min}
        onConfirm={handleAssignConfirm}
        onClose={() => {
          setPickerVisible(false);
          setTargetReservation(null);
        }}
      />

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

// ── STYLES ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },

  tabsWrapper: { backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tabsContent: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  tab:            { paddingHorizontal: Spacing.md, paddingVertical: 7, borderRadius: Radius.full, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border },
  tabActive:      { backgroundColor: Colors.bordeaux, borderColor: Colors.bordeaux },
  tabLabel:       { fontSize: Fonts.size.sm, fontFamily: Fonts.semibold, fontWeight: '600', color: Colors.textMuted },
  tabLabelActive: { color: Colors.white },

  // Recherche + tri
  searchContainer: { flexDirection: 'row', alignItems: 'center', marginHorizontal: Spacing.md, marginVertical: Spacing.sm, gap: Spacing.sm },
  searchWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.surface, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Platform.OS === 'ios' ? 10 : 6, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  searchInput: { flex: 1, fontSize: Fonts.size.sm, color: Colors.textPrimary, padding: 0 },
  filterBtn: {
    padding: 10,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
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
  filterSummary: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginHorizontal: Spacing.md, marginBottom: Spacing.xs, backgroundColor: Colors.bordeaux + '12', borderRadius: Radius.sm, paddingVertical: 6, paddingHorizontal: Spacing.sm, borderLeftWidth: 3, borderLeftColor: Colors.bordeaux },
  filterSummaryText: { fontSize: Fonts.size.xs, color: Colors.bordeaux, fontFamily: Fonts.medium, fontWeight: '500' },

  scroll: { padding: Spacing.md, paddingTop: Spacing.sm },
  empty:     { alignItems: 'center', paddingVertical: 60, gap: Spacing.md },
  emptyText: { color: Colors.textMuted, fontSize: Fonts.size.md },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  loadingText:      { color: Colors.textSecondary, fontSize: Fonts.size.sm },
  errorBanner: { backgroundColor: Colors.errorLight, borderLeftWidth: 3, borderLeftColor: Colors.error, padding: Spacing.md, marginHorizontal: Spacing.md, marginTop: Spacing.sm, borderRadius: Radius.sm, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  errorText: { color: Colors.error, fontSize: Fonts.size.sm, flex: 1 },
});