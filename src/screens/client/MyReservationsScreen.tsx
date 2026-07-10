import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList,
  TextInput, RefreshControl, ActivityIndicator, Modal
} from 'react-native';
import { useReservation }   from '../../hooks/useReservation';
import { useAuthStore }     from '../../store/auth.store';
import { invoicesApi }      from '../../services/api/invoices.api';
import { Colors, Fonts, Spacing, Radius } from '../../theme/colors';
import { useToast }         from '../../hooks/useToast';
import type { Reservation, ReservationListFilters, ReservationStatus } from '../../types/reservations.types';
import type { SubmitRatingDto } from '../../types/ratings.types';
import CancelReservationModal from '../../components/common/CancelReservationModal';
import RatingModal            from '../../components/common/RatingModal';
import { useRatingsStore } from '../../store/ratings.store';
import { AppIcon } from '../../components/common/AppIcon'
import { AppHeader } from '../../components/common/AppHeader';
import ReservationFilterModal, {
  DEFAULT_FILTERS,
  type ReservationFilters,
} from '../../components/common/ReservationFilterModal';
import { filtersToApiParams, useSortedReservations, isFiltersActive, requiresGlobalSort } from '../../hooks/useReservationFilters';


type FilterTab = 'all' | 'invoices' | 'pending' | 'assigned' | 'completed' | 'cancelled';

const TABS: { key: FilterTab; label: string; statusFilter?: ReservationStatus }[] = [
  { key: 'all',       label: 'Tous'        },
  { key: 'invoices',  label: 'Factures'    },
  { key: 'pending',   label: 'En attente',  statusFilter: 'pending'   },
  { key: 'assigned',  label: 'Confirmés',   statusFilter: 'assigned'  },
  { key: 'completed', label: 'Terminés',    statusFilter: 'completed' },
  { key: 'cancelled', label: 'Annulés',     statusFilter: 'cancelled' },
];

const STATUS_CONFIG: Record<ReservationStatus, { label: string; bg: string; color: string; icon: string }> = {
  pending:        { label: 'En attente', bg: '#FFF3E0', color: '#E65100', icon: 'time-outline' },
  assigned:       { label: 'Confirmé',   bg: '#E3F2FD', color: '#1976D2', icon: 'checkmark-circle-outline' },
  driver_arrived: { label: 'Arrivé',     bg: '#F3E5F5', color: '#7B1FA2', icon: 'location-outline' },
  in_progress:    { label: 'En cours',   bg: '#E8F5E9', color: '#2E7D32', icon: 'car-outline' },
  completed:      { label: 'Terminé',    bg: '#E8F5E9', color: '#2E7D32', icon: 'checkmark-circle' },
  cancelled:      { label: 'Annulé',     bg: '#FFEBEE', color: '#C62828', icon: 'close-circle-outline' },
};

function ReservationCard({
  reservation,
  onPress,
  onEvaluate,
  onViewInvoice,
  onCall,
  onMessage,
  onCancel
}: {
  reservation: Reservation;
  onPress: () => void;
  onEvaluate: () => void;
  onViewInvoice: () => void;
  onCall?: () => void;
  onMessage?: () => void;
  onCancel?: () => void;
}) {
  const status = reservation.status as ReservationStatus;
  const statusCfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  const ref = reservation.id.split('-').pop()?.toUpperCase() ?? reservation.id;
  const pickup = reservation.pickup_address;
  const dest = reservation.dest_address;
  const date = new Date(reservation.scheduled_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  const time = new Date(reservation.scheduled_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const driverName = reservation.driver ? `${reservation.driver.user.first_name} ${reservation.driver.user.last_name}` : 'Non assigné';
  const price = reservation.price_final ?? reservation.price_estimated;
  
  const isCancellable = ['pending', 'assigned', 'driver_arrived'].includes(status);
  const isCompleted = status === 'completed';
  const isActive = ['assigned', 'driver_arrived', 'in_progress'].includes(status);
  const showDetails = !['cancelled'].includes(status);

  return (
    <TouchableOpacity style={cardStyles.wrapper} onPress={onPress}>
      {/* Header */}
      <View style={cardStyles.header}>
        <Text style={cardStyles.id}>RES-{ref}</Text>
        <View style={[cardStyles.badge, { backgroundColor: statusCfg.bg }]}>
          <AppIcon name={statusCfg.icon as any} size={14} color={statusCfg.color} />
          <Text style={[cardStyles.badgeText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
        </View>
      </View>

      {/* Body */}
      <View style={cardStyles.body}>
        <View style={cardStyles.timeline}>
          <View style={cardStyles.timelineItem}>
            <AppIcon name="radio-button-on" size={12} color={Colors.bordeaux} />
            <Text style={cardStyles.address}>{pickup}</Text>
          </View>
          <View style={cardStyles.timelineLine} />
          <View style={cardStyles.timelineItem}>
            <AppIcon name="location" size={12} color={Colors.bordeaux} />
            <Text style={[cardStyles.address, cardStyles.dest]}>{dest}</Text>
          </View>
        </View>
        <View style={cardStyles.dateTime}>
          <View style={cardStyles.dateTime}>
            <AppIcon name='calendar-outline' size={14} color={Colors.bordeaux} />
            <Text style={cardStyles.date}>{date}</Text>
          </View>
          <View style={cardStyles.dateTime}>
            <AppIcon name='time-outline' size={14} color={Colors.bordeaux} />
           <Text style={cardStyles.time}>{time}</Text>
          </View>
        </View>
        <View style={cardStyles.driverName}>
          <AppIcon name='person-outline' size={14} color={Colors.bordeaux} />
          <Text style={cardStyles.driver}>Chauffeur : {driverName}</Text>
        </View>
      </View>

      {/* Footer */}
      <View style={cardStyles.footer}>
        <Text style={cardStyles.price}>{price}€</Text>
        <View style={cardStyles.actions}>
          {isActive && onCall && (
            <TouchableOpacity style={cardStyles.btnAction} onPress={onCall}>
              <AppIcon name="call-outline" size={14} color={Colors.white} />
              <Text style={cardStyles.btnText}>Appeler</Text>
            </TouchableOpacity>
          )}
          {isCompleted && reservation.driver?.rating == null ? (
            <TouchableOpacity style={cardStyles.btnEvaluate} onPress={onEvaluate}>
              <AppIcon name="star" size={14} color={Colors.white} />
              <Text style={cardStyles.btnText}>Évaluer</Text>
            </TouchableOpacity>
          ) : (
            isCompleted && reservation.driver?.rating != null && (
              <View style={{ flexDirection: 'row', gap: 2 }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <AppIcon
                    key={star}
                    name="star"
                    size={16}
                    color={star <= reservation.driver!.rating! ? Colors.warning : Colors.bordeauxLight}
                  />
                ))}
              </View>
            )
          )}
          {isCompleted && (
            <TouchableOpacity style={cardStyles.btnInvoice} onPress={onViewInvoice}>
              <AppIcon name="receipt-outline" size={14} color={Colors.white} />
              <Text style={cardStyles.btnText}>Facture</Text>
            </TouchableOpacity>
          )}
          {isCancellable && onCancel && (
            <TouchableOpacity style={cardStyles.btnCancel} onPress={onCancel}>
              <AppIcon name="close-circle-outline" size={14} color={Colors.white} />
              <Text style={cardStyles.btnText}>Annuler</Text>
            </TouchableOpacity>
          )}
          {showDetails && (
            <TouchableOpacity style={cardStyles.btnView} onPress={onPress}>
              <AppIcon name="chevron-forward" size={14} color={Colors.bordeaux} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const cardStyles = StyleSheet.create({
  wrapper: { backgroundColor: Colors.white, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  id: { fontSize: Fonts.size.md, fontFamily: Fonts.bold, fontWeight: '700', color: Colors.bordeaux },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: Radius.full, paddingVertical: 4, paddingHorizontal: Spacing.sm },
  badgeText: { fontSize: Fonts.size.xs, fontFamily: Fonts.bold, fontWeight: '700' },
  body: { marginBottom: Spacing.sm },
  timeline: { marginBottom: Spacing.sm },
  timelineItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginVertical: 2 },
  driverName: { flexDirection: 'row', marginBottom: Spacing.xs },
  timelineLine: { width: 1, height: 20, backgroundColor: Colors.border, marginLeft: 6 },
  address: { fontSize: Fonts.size.sm, color: Colors.textPrimary },
  dest: { fontFamily: Fonts.bold, fontWeight: '700' },
  dateTime: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.xs },
  date: { fontSize: Fonts.size.sm, color: Colors.textMuted, marginBottom: Spacing.xs, paddingLeft: Spacing.sm },
  time: { fontSize: Fonts.size.sm, color: Colors.textMuted, marginBottom: Spacing.xs, paddingLeft: Spacing.sm },
  driver: { fontSize: Fonts.size.sm, color: Colors.textSecondary, paddingLeft: Spacing.sm },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  price: { fontSize: Fonts.size.lg, fontFamily: Fonts.bold, fontWeight: '800', color: Colors.bordeaux, flexShrink: 0 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, flexWrap: 'wrap', justifyContent: 'flex-end', flex: 1, minWidth: 0 },
  btnAction:   { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.bordeaux,       borderRadius: Radius.md, paddingVertical: 6, paddingHorizontal: 10 },
  btnEvaluate: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.beige,          borderRadius: Radius.md, paddingVertical: 6, paddingHorizontal: 10 },
  btnInvoice:  { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.textSecondary,  borderRadius: Radius.md, paddingVertical: 6, paddingHorizontal: 10 },
  btnView:     { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.background,     borderRadius: Radius.md, paddingVertical: 6, paddingHorizontal: 10 },
  btnCancel:   { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.error,          borderRadius: Radius.md, paddingVertical: 6, paddingHorizontal: 10 },
  btnText: { color: Colors.white, fontSize: Fonts.size.xs, fontFamily: Fonts.bold, fontWeight: '700' },
});

export default function MyReservationsScreen({ navigation }: { navigation: any }) {
  const {
    reservations, isLoading, isFetchingNextPage, error,
    page, totalPages,
    fetchMine, fetchAllPages, clearError, cancel,
  } = useReservation();
  const accessToken = useAuthStore(s => s.accessToken);
  const token = useAuthStore(s => s.accessToken) ?? '';

  const [activeTab,           setActiveTab]           = useState<FilterTab>('all');
  const [searchQuery,         setSearchQuery]         = useState('');
  const [refreshing,          setRefreshing]          = useState(false);
  const [cancelModalVisible,  setCancelModalVisible]  = useState(false);
  const [selectedForCancel,   setSelectedForCancel]   = useState<Reservation | null>(null);
  const [selectedForRating,   setSelectedForRating]   = useState<Reservation | null>(null);
  const [ratingModalVisible,  setRatingModalVisible]  = useState(false);
  const [filterModalVisible,  setFilterModalVisible]  = useState(false);
  const [filters,             setFilters]             = useState<ReservationFilters>(DEFAULT_FILTERS);

  const [isSorting, setIsSorting] = useState(false);

  const activeTabRef = useRef(activeTab);
  const { showToast } = useToast();
  useEffect(() => { activeTabRef.current = activeTab; }, [activeTab]);

const load = useCallback(async (showRefresh = false) => {
  if (showRefresh) setRefreshing(true);
  
  const needsGlobalSort = requiresGlobalSort(filters);
  if (needsGlobalSort && !showRefresh) setIsSorting(true); // ← loader tri
  
  try {
    const apiParams = filtersToApiParams(filters);
    const listFilters: ReservationListFilters = { ...apiParams, page: 1 };
    const currentTab = activeTabRef.current;
    if (currentTab !== 'all' && currentTab !== 'invoices') {
      const tab = TABS.find(t => t.key === currentTab);
      if (tab?.statusFilter) listFilters.status = tab.statusFilter;
    } else if (currentTab === 'invoices') {
      listFilters.status = 'completed';
    }

    if (needsGlobalSort) {
      await fetchAllPages(listFilters);
    } else {
      await fetchMine(listFilters);
    }
  } catch (err) {
    console.error(err);
  } finally {
    setIsSorting(false);
    if (showRefresh) setRefreshing(false);
  }
}, [fetchMine, fetchAllPages, filters]);

useEffect(() => { load(); }, [activeTab, filters]);

// Désactiver loadMore quand tri global actif (tout est déjà chargé)
const loadMore = useCallback(() => {
  if (requiresGlobalSort(filters)) return; // ← rien à faire, tout est chargé
  if (isLoading || isFetchingNextPage || page >= totalPages) return;

    const apiParams = filtersToApiParams(filters);
    const listFilters: ReservationListFilters = { ...apiParams, page: page + 1 };
    const currentTab = activeTabRef.current;
    if (currentTab !== 'all' && currentTab !== 'invoices') {
      const tab = TABS.find(t => t.key === currentTab);
      if (tab?.statusFilter) listFilters.status = tab.statusFilter;
    } else if (currentTab === 'invoices') {
      listFilters.status = 'completed';
    }
    fetchMine(listFilters).catch(err => {
      console.error("Failed to load more reservations:", err);
    });
}, [filters, isLoading, isFetchingNextPage, page, totalPages, fetchMine]);
  

  const handleTabChange = (tab: FilterTab) => {
    setActiveTab(tab);
    setSearchQuery('');
  };

  const handleApplyFilters = (newFilters: ReservationFilters) => {
    setFilters(newFilters);
    setFilterModalVisible(false);
  };

  // Tri côté client (tri sur la liste déjà filtrée par le backend)
  const sortedReservations = useSortedReservations(reservations, filters);

  // Recherche textuelle sur le résultat trié
  const filteredReservations = useMemo(() => {
    if (!searchQuery) return sortedReservations;
    const query = searchQuery.toLowerCase();
    return sortedReservations.filter(r =>
      r.id.toLowerCase().includes(query) ||
      r.pickup_address.toLowerCase().includes(query) ||
      r.dest_address.toLowerCase().includes(query) ||
      (r.driver?.user && `${r.driver.user.first_name} ${r.driver.user.last_name}`.toLowerCase().includes(query))
    );
  }, [sortedReservations, searchQuery]);

  // ── Rating ──────────────────────────────────────────────────────────────────
  const isSubmitting = useRatingsStore(s => s.isSubmitting);
  const submitRating = useRatingsStore(s => s.submitRating);

  const handleEvaluate = useCallback((reservation: Reservation) => {
    if (reservation.driver?.rating != null) {
      showToast({ title: 'Déjà évalué', message: 'Vous avez déjà soumis une évaluation pour cette course.', type: 'info' });
      return;
    }
    setSelectedForRating(reservation);
    setRatingModalVisible(true);
  }, [showToast]);

  const handleRatingSubmit = useCallback(async (dto: SubmitRatingDto) => {
    if (!accessToken || !selectedForRating?.id) return;
    try {
      await submitRating(accessToken, selectedForRating.id, dto);
      setRatingModalVisible(false);
      setSelectedForRating(null);
      showToast({ title: 'Merci !', message: `Votre note de ${dto.note}/5 a bien été enregistrée.`, type: 'success' });
      load(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la soumission';
      setRatingModalVisible(false);
      setSelectedForRating(null);
      showToast({ title: 'Erreur', message: msg, type: 'error' });
    }
  }, [accessToken, selectedForRating, submitRating, showToast, load]);

  const handleViewInvoice = async (reservation: Reservation) => {
    try {
      const res = await invoicesApi.fetchByReservationId(token, reservation.id);
      if (res.ok && res.data) {
        navigation.navigate('InvoiceDetails', { invoiceId: res.data.id });
      } else {
        showToast({ type: 'warning', title: 'Facture indisponible', message: res.message ?? 'La facture n\'est pas encore disponible pour cette course.' });
      }
    } catch {
      showToast({ title: 'Erreur', message: 'Impossible de récupérer la facture. Veuillez réessayer.', type: 'error' });
    }
  };

  const handleCall = (reservation: Reservation) => {
    if (reservation.driver?.user?.phone) {
      showToast({ title: 'Appel', message: `Appel au chauffeur: ${reservation.driver.user.phone}`, type: 'info' });
    } else {
      showToast({ title: 'Non disponible', message: 'Le numéro du chauffeur n\'est pas disponible', type: 'warning' });
    }
  };

  const handleMessage = (reservation: Reservation) => {
    navigation.navigate('ChatScreen', { driverId: reservation.driver_id });
  };

  const handleCancel = (reservation: Reservation) => {
    setSelectedForCancel(reservation);
    setCancelModalVisible(true);
  };

  const handleCancelConfirm = async (reason: string) => {
    if (!selectedForCancel) return;
    try {
      await cancel(selectedForCancel.id, reason);
      setCancelModalVisible(false);
      showToast({ title: 'Succès', message: 'La réservation a été annulée', type: 'success' });
      load(true);
    } catch (error: any) {
      showToast({ title: 'Erreur', message: error?.message ?? 'Impossible d\'annuler la réservation', type: 'error' });
    }
  };

  const filtersActive = isFiltersActive(filters);

  const renderReservation = ({ item }: { item: Reservation }) => {
    if (!item) return null;
    return (
    <ReservationCard
      reservation={item}
      onPress={() => navigation.navigate('ReservationDetails', { reservationId: item.id })}
      onEvaluate={() => handleEvaluate(item)}
      onViewInvoice={() => handleViewInvoice(item)}
      onCall={() => handleCall(item)}
      onMessage={() => handleMessage(item)}
      onCancel={() => handleCancel(item)}
    />
  )};

  return (
    <View style={styles.flex}>
      {/* Header */}
      <AppHeader left="none" title="Mes réservations" />

      {/* Tabs */}
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
            >
              <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Search + Sort */}
      <View style={styles.searchContainer}>
        <View style={styles.searchWrapper}>
          <AppIcon name="search" size={20} color={Colors.textMuted}  />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher par ID, adresse, chauffeur..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <AppIcon name="close-circle" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
        {/* Bouton de tri — badge rouge si filtres actifs */}
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
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, width: 'auto' }}>
              <Text style={styles.filterSummaryText}>  •  Tri : {filters.sortField === 'price' ? 'prix' : 'date'}</Text>
              <AppIcon
                name={filters.sortOrder === 'asc' ? 'arrow-up-outline' : 'arrow-down-outline'}
                size={13}
                color={Colors.bordeaux}
              />
            </View>
          )}
          <TouchableOpacity style={{ marginLeft: 'auto' }} onPress={() => { setFilters(DEFAULT_FILTERS); }}>
            <AppIcon name="close-circle" size={16} color={Colors.bordeaux} />
          </TouchableOpacity>
        </View>
      )}

      {/* List */}
      {(isLoading || isSorting) ? (
  <View style={styles.loaderContainer}>
    <ActivityIndicator size="large" color={Colors.bordeaux} />
    <Text style={styles.loaderText}>
      {isSorting ? 'Tri en cours…' : 'Chargement…'}
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
        ListEmptyComponent={!isLoading ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Aucune réservation trouvée</Text>
          </View>
        ) : null}
        ListFooterComponent={isFetchingNextPage ? <ActivityIndicator style={{ marginVertical: 20 }} color={Colors.bordeaux} /> : null}
        contentContainerStyle={filteredReservations.length > 0 ? styles.scroll : styles.flex}
      />
      )}

      {/* Error */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={clearError}>
            <AppIcon name="close" size={20} color={Colors.error} />
          </TouchableOpacity>
        </View>
      )}

      {/* Modal d'annulation */}
      <CancelReservationModal
        visible={cancelModalVisible}
        reservationRef={selectedForCancel ? `RES-${selectedForCancel.id.split('-').pop()?.toUpperCase()}` : undefined}
        onConfirm={handleCancelConfirm}
        onClose={() => {
          setCancelModalVisible(false);
          setSelectedForCancel(null);
        }}
      />

      {/* Modal de notation */}
      <RatingModal
        visible={ratingModalVisible}
        driverName={
          selectedForRating?.driver?.user
            ? `${selectedForRating.driver.user.first_name} ${selectedForRating.driver.user.last_name}`
            : undefined
        }
        isSubmitting={isSubmitting}
        onConfirm={handleRatingSubmit}
        onClose={() => setRatingModalVisible(false)}
      />

      {/* Modal de filtres */}
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
  flex: { flex: 1, backgroundColor: Colors.background },
  tabsWrapper: { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  tabsContent: { paddingHorizontal: Spacing.md, paddingVertical: 12, alignItems: 'center', gap: Spacing.sm },
  tab: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 999, backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#E0E0E0', minHeight: 36 },
  tabActive: { backgroundColor: Colors.bordeaux, borderColor: Colors.bordeaux },
  tabLabel: { fontSize: 14, fontFamily: Fonts.semibold, fontWeight: '600', color: '#333333' },
  tabLabelActive: { color: '#FFFFFF', fontFamily: Fonts.bold, fontWeight: 'bold' },

  // Barre recherche + tri
  searchContainer: { flexDirection: 'row', alignItems: 'center', marginHorizontal: Spacing.md, marginVertical: Spacing.sm, gap: Spacing.sm },
  searchWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radius.md, paddingHorizontal: Spacing.md, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  searchIcon: { marginRight: Spacing.sm },
  searchInput: { flex: 1, height: 44, fontSize: Fonts.size.md, color: Colors.textPrimary, paddingVertical: Spacing.sm },
  filterBtn: {
    padding: 10,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
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
  filterSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.xs,
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
    fontFamily: Fonts.medium, fontWeight: '500',
  },

  scroll: { padding: Spacing.md, paddingTop: Spacing.sm },
  empty: { alignItems: 'center', paddingVertical: 60, gap: Spacing.md },
  emptyText: { color: Colors.textMuted, fontSize: Fonts.size.md },
  errorBanner: { backgroundColor: Colors.errorLight, borderLeftWidth: 3, borderLeftColor: Colors.error, padding: Spacing.md, marginHorizontal: Spacing.md, marginTop: Spacing.sm, borderRadius: Radius.sm, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  errorText: { color: Colors.error, fontSize: Fonts.size.sm, flex: 1 },

  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  loaderText: {
    color: Colors.textSecondary,
    fontSize: Fonts.size.sm,
  },
});