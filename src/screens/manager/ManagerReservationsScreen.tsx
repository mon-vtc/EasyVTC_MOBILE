// import React, { useEffect, useState } from 'react';
// import {
//   View, Text, FlatList, StyleSheet,
//   TouchableOpacity, ActivityIndicator, Platform,
// } from 'react-native';
// import { useNavigation, useFocusEffect } from '@react-navigation/native';
// import { Ionicons } from '@expo/vector-icons';
// import { useAuthStore } from '../../store/auth.store';
// import { usePermissions } from '../../hooks/usePermissions';
// import { api } from '../../lib/api';
// import { Colors, Spacing, Radius, Fonts } from '../../theme/colors';

// interface Reservation {
//   id:             string;
//   status:         string;
//   scheduled_at:   string;
//   pickup_address: string;
//   dest_address:   string;
//   client_first_name?: string;
//   client_last_name?:  string;
//   driver_first_name?: string;
//   driver_last_name?:  string;
// }

// const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
//   pending:    { label: 'En attente',    color: '#F57C00', bg: '#FFF3E0' },
//   confirmed:  { label: 'Confirmée',     color: '#1976D2', bg: '#E3F2FD' },
//   assigned:   { label: 'Attribuée',     color: '#7B1FA2', bg: '#F3E5F5' },
//   in_progress:{ label: 'En cours',      color: '#388E3C', bg: '#E8F5E9' },
//   completed:  { label: 'Terminée',      color: '#546E7A', bg: '#ECEFF1' },
//   cancelled:  { label: 'Annulée',       color: '#C62828', bg: '#FFEBEE' },
// };

// export default function ManagerReservationsScreen() {
//   const navigation  = useNavigation();
//   const accessToken = useAuthStore(s => s.accessToken);
//   const { hasPermission } = usePermissions();

//   const [reservations, setReservations] = useState<Reservation[]>([]);
//   const [isLoading,    setIsLoading]    = useState(true);
//   const [error,        setError]        = useState<string | null>(null);

//   const load = async () => {
//     setIsLoading(true);
//     setError(null);
//     try {
//       const res = await api.get<{ reservations: Reservation[]; total: number }>(
//         '/reservations',
//         accessToken ?? undefined,
//       );
//       if (res.ok && res.data) {
//         setReservations(res.data.reservations ?? []);
//       } else {
//         setError(res.message ?? 'Erreur lors du chargement');
//       }
//     } catch {
//       setError('Impossible de contacter le serveur');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   useFocusEffect(React.useCallback(() => { load(); }, []));

//   if (!hasPermission('view_reservations')) {
//     return (
//       <View style={styles.center}>
//         <Ionicons name="lock-closed-outline" size={48} color={Colors.border} />
//         <Text style={styles.permText}>Accès non autorisé</Text>
//       </View>
//     );
//   }

//   if (isLoading) {
//     return <View style={styles.center}><ActivityIndicator size="large" color={Colors.bordeaux} /></View>;
//   }

//   if (error) {
//     return (
//       <View style={styles.center}>
//         <Ionicons name="alert-circle-outline" size={40} color={Colors.error} />
//         <Text style={styles.permText}>{error}</Text>
//         <TouchableOpacity onPress={load} style={styles.retryBtn}>
//           <Text style={styles.retryText}>Réessayer</Text>
//         </TouchableOpacity>
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       <View style={styles.header}>
//         <TouchableOpacity style={styles.headerBtn} onPress={() => (navigation as any).openDrawer()}>
//           <Ionicons name="menu-outline" size={26} color={Colors.white} />
//         </TouchableOpacity>
//         <Text style={styles.headerTitle}>Réservations</Text>
//         <View style={styles.headerBtn} />
//       </View>

//       <FlatList
//         data={reservations}
//         keyExtractor={item => item.id}
//         contentContainerStyle={styles.list}
//         showsVerticalScrollIndicator={false}
//         ListEmptyComponent={
//           <View style={styles.center}>
//             <Ionicons name="car-outline" size={48} color={Colors.border} />
//             <Text style={styles.permText}>Aucune réservation</Text>
//           </View>
//         }
//         renderItem={({ item }) => {
//           const cfg = STATUS_CFG[item.status] ?? { label: item.status, color: Colors.textSecondary, bg: Colors.background };
//           const date = new Date(item.scheduled_at).toLocaleDateString('fr-FR', {
//             day: '2-digit', month: 'short', year: 'numeric',
//             hour: '2-digit', minute: '2-digit',
//           });
//           return (
//             <View style={styles.card}>
//               <View style={styles.cardHeader}>
//                 <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
//                   <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
//                 </View>
//                 <Text style={styles.date}>{date}</Text>
//               </View>

//               <View style={styles.routeRow}>
//                 <Ionicons name="navigate-outline" size={14} color={Colors.bordeaux} />
//                 <Text style={styles.address} numberOfLines={1}>{item.pickup_address}</Text>
//               </View>
//               <View style={styles.routeRow}>
//                 <Ionicons name="location-outline" size={14} color={Colors.textSecondary} />
//                 <Text style={styles.address} numberOfLines={1}>{item.dest_address}</Text>
//               </View>

//               {(item.client_first_name || item.driver_first_name) && (
//                 <View style={styles.actorsRow}>
//                   {item.client_first_name && (
//                     <View style={styles.actor}>
//                       <Ionicons name="person-outline" size={12} color={Colors.textMuted} />
//                       <Text style={styles.actorText}>{item.client_first_name} {item.client_last_name}</Text>
//                     </View>
//                   )}
//                   {item.driver_first_name && (
//                     <View style={styles.actor}>
//                       <Ionicons name="car-outline" size={12} color={Colors.textMuted} />
//                       <Text style={styles.actorText}>{item.driver_first_name} {item.driver_last_name}</Text>
//                     </View>
//                   )}
//                 </View>
//               )}

//               {hasPermission('assign_reservation') && item.status === 'pending' && (
//                 <TouchableOpacity style={styles.assignBtn} activeOpacity={0.7}>
//                   <Ionicons name="person-add-outline" size={14} color={Colors.white} />
//                   <Text style={styles.assignText}>Attribuer un chauffeur</Text>
//                 </TouchableOpacity>
//               )}
//             </View>
//           );
//         }}
//       />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: Colors.background },
//   center:    { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.md },
//   permText:  { fontSize: Fonts.size.md, color: Colors.textMuted, textAlign: 'center' },

//   header: {
//     flexDirection:     'row',
//     alignItems:        'center',
//     justifyContent:    'space-between',
//     backgroundColor:   Colors.bordeaux,
//     paddingTop:        Platform.OS === 'ios' ? 56 : Spacing.xl + 8,
//     paddingBottom:     Spacing.md,
//     paddingHorizontal: Spacing.md,
//   },
//   headerBtn:   { padding: Spacing.sm, width: 40 },
//   headerTitle: { fontSize: Fonts.size.lg, fontFamily: Fonts.semibold, fontWeight: '600', color: Colors.white },

//   list:      { padding: Spacing.md, paddingBottom: Spacing.xl },

//   card: {
//     backgroundColor: Colors.white, borderRadius: Radius.md,
//     padding: Spacing.md, marginBottom: Spacing.sm,
//     elevation: 2, shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4,
//   },
//   cardHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
//   statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: Radius.full },
//   statusText:  { fontSize: Fonts.size.xs, fontFamily: Fonts.bold, fontWeight: '700' },
//   date:        { fontSize: Fonts.size.xs, color: Colors.textMuted },

//   routeRow:   { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
//   address:    { flex: 1, fontSize: Fonts.size.sm, color: Colors.textPrimary },

//   actorsRow:  { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.sm, flexWrap: 'wrap' },
//   actor:      { flexDirection: 'row', alignItems: 'center', gap: 4 },
//   actorText:  { fontSize: Fonts.size.xs, color: Colors.textMuted },

//   assignBtn: {
//     marginTop: Spacing.sm,
//     flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
//     backgroundColor: Colors.bordeaux, borderRadius: Radius.md,
//     paddingVertical: Spacing.sm,
//   },
//   assignText: { fontSize: Fonts.size.sm, fontFamily: Fonts.semibold, fontWeight: '600', color: Colors.white },

//   retryBtn:  { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: Radius.md, backgroundColor: Colors.bordeaux },
//   retryText: { color: Colors.white, fontFamily: Fonts.semibold, fontWeight: '600' },
// });



import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList,
  TextInput, RefreshControl, Platform, ActivityIndicator, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useReservation } from '../../hooks/useReservation';
import { Colors, Spacing, Radius, Fonts } from '../../theme/colors';
import DriverPickerModal from '../admin/DriverPickerModal';
import { useToast } from '../../hooks/useToast';
import type { Reservation, ReservationStatus, AvailableDriverDto } from '../../types/reservations.types';
import { usePermissions } from '../../hooks/usePermissions';

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
  const { hasPermission } = usePermissions();

  return (
    <TouchableOpacity style={cardStyles.wrapper} onPress={onPress} activeOpacity={0.75}>

      <View style={cardStyles.row1}>
        <View style={[cardStyles.badge, { backgroundColor: statusCfg.bg }]}>
          <Ionicons name={statusCfg.icon as any} size={11} color={statusCfg.color} />
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
            <Ionicons name="calendar-outline" size={12} color={Colors.textMuted} />
            <Text style={cardStyles.meta}>{date} • {time}</Text>
          </View>
          {driverName ? (
            <View style={cardStyles.metaRow}>
              <Ionicons name="person-outline" size={12} color={Colors.textMuted} />
              <Text style={cardStyles.meta}>{driverName}</Text>
            </View>
          ) : (
            <View style={cardStyles.metaRow}>
              <Ionicons name="person-outline" size={12} color={Colors.textMuted} />
              <Text style={[cardStyles.meta, { color: '#E65100' }]}>Non assigné</Text>
            </View>
          )}
        </View>
        {hasPermission('assign_reservation') && status === 'pending' && (
          <TouchableOpacity style={cardStyles.detailsBtn} onPress={onAssign} activeOpacity={0.8}>
            <Text style={cardStyles.detailsBtnText}>{buttonText}</Text>
          </TouchableOpacity>
        )}
        {status !== 'pending' && (
          <TouchableOpacity style={cardStyles.detailsBtn} onPress={onPress} activeOpacity={0.8}>
            <Text style={cardStyles.detailsBtnText}>{buttonText}</Text>
          </TouchableOpacity>
        )}
      </View>

    </TouchableOpacity>
  );
}

const cardStyles = StyleSheet.create({
  wrapper: {
    backgroundColor: Colors.white,
    borderRadius:    Radius.md,
    padding:         Spacing.md,
    marginVertical:  Spacing.xs,
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 2 },
    shadowOpacity:   0.07,
    shadowRadius:    5,
    elevation:       2,
  },
  row1: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: Radius.full, paddingVertical: 3, paddingHorizontal: Spacing.sm,
  },
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
  detailsBtn: {
    backgroundColor: Colors.bordeaux,
    borderRadius: Radius.sm,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginLeft: Spacing.sm,
  },
  detailsBtnText: { color: Colors.white, fontSize: Fonts.size.xs, fontFamily: Fonts.bold, fontWeight: '700' },
});

// ── ÉCRAN PRINCIPAL ───────────────────────────────────────────────────────────
export default function ManagerReservationsScreen({ navigation }: any) {
  const { reservations, fetchAll, isLoading, isFetchingNextPage, page, totalPages, error, clearError, assign } = useReservation();
  const { hasPermission } = usePermissions();
  const { showToast } = useToast();

  const [activeTab,   setActiveTab]   = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing,  setRefreshing]  = useState(false);

  // Driver picker
  const [pickerVisible, setPickerVisible]                   = useState(false);
  const [targetReservation, setTargetReservation]           = useState<Reservation | null>(null);

  const activeTabRef = useRef(activeTab);
  useEffect(() => { activeTabRef.current = activeTab; }, [activeTab]);

  const buildFilters = useCallback((p?: number): any => {
    const filters: any = {};
    if (activeTabRef.current !== 'all') {
      const tab = TABS.find(t => t.key === activeTabRef.current);
      if (tab?.statusFilter) filters.status = tab.statusFilter;
    }
    if (p) filters.page = p;
    return filters;
  }, []);

  const load = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      await fetchAll(buildFilters());
    } catch (err) {
      console.error(err);
    } finally {
      if (showRefresh) setRefreshing(false);
    }
  }, [fetchAll, buildFilters]);

  const loadMore = useCallback(() => {
    if (isLoading || isFetchingNextPage || page >= totalPages) return;
    fetchAll(buildFilters(page + 1)).catch(() => {});
  }, [isLoading, isFetchingNextPage, page, totalPages, fetchAll, buildFilters]);

  useEffect(() => { load(); }, [activeTab]);

  const handleTabChange = (tab: FilterTab) => {
    setActiveTab(tab);
    setSearchQuery('');
  };

  const filteredReservations = useMemo(() => {
    if (!searchQuery) return reservations;
    const q = searchQuery.toLowerCase();
    return reservations.filter(r =>
      r.id.toLowerCase().includes(q) ||
      r.pickup_address.toLowerCase().includes(q) ||
      r.dest_address.toLowerCase().includes(q) ||
      (r.client && `${r.client.first_name} ${r.client.last_name}`.toLowerCase().includes(q)) ||
      (r.driver  && `${r.driver.user.first_name} ${r.driver.user.last_name}`.toLowerCase().includes(q))
    );
  }, [reservations, searchQuery]);

  const handleOpenReservation = (reservationId: string) => {
    navigation.navigate('ManagerReservationDetail', { reservationId });
  };

  /* ── Ouvre le picker pour une réservation ── */
  const handleAssignPress = (reservation: Reservation) => {
    setTargetReservation(reservation);
    setPickerVisible(true);
  };

  /* ── Confirme l'assignation ── */
  const handleAssignConfirm = async (driver: AvailableDriverDto) => {
    if (!targetReservation) return;
    try {
      await assign(targetReservation.id, driver.id);
      setPickerVisible(false);
      setTargetReservation(null);
      showToast({ type: 'success', title: 'Succès', message: `${driver.user.first_name} ${driver.user.last_name} a été assigné avec succès.` });
      load();
    } catch (err: any) {
      showToast({ type: 'error', title: 'Erreur', message: err?.message || "Erreur lors de l'assignation." });
      throw err; // laisse le modal ouvert
    }
  };

  const targetRef = targetReservation
    ? `BC-${targetReservation.id.split('-').pop()?.toUpperCase()}`
    : undefined;

  const renderReservation = ({ item }: { item: Reservation }) => (
    <ReservationCard
      reservation={item}
      onPress={() => handleOpenReservation(item.id)}
      onAssign={() => handleAssignPress(item)}
    />
  );

  return (
    <View style={styles.flex}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.openDrawer()}>
          <Ionicons name="menu" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Réservations</Text>
        <View style={styles.headerBtn} />
      </View>

      {/* ── Filtres ── */}
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

      {/* ── Recherche ── */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={Colors.iconMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher par ID, adresse, client, chauffeur..."
          placeholderTextColor={Colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* ── Liste ── */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.bordeaux} />
          <Text style={styles.loadingText}>Chargement des réservations…</Text>
        </View>
      ) : (
        <FlatList
          data={filteredReservations}
          keyExtractor={item => item.id}
          renderItem={renderReservation}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={isFetchingNextPage ? <ActivityIndicator size="small" color={Colors.bordeaux} style={{ padding: 16 }} /> : null}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="calendar-outline" size={40} color={Colors.textMuted} />
              <Text style={styles.emptyText}>Aucune réservation trouvée</Text>
            </View>
          }
          contentContainerStyle={styles.scroll}
        />
      )}

      {/* ── Bandeau erreur ── */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={clearError}>
            <Ionicons name="close" size={20} color={Colors.error} />
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

    </View>
  );
}

// ── STYLES ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },

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
  headerTitle: { color: Colors.white, fontFamily: Fonts.bold, fontWeight: '800', fontSize: Fonts.size.lg },

  tabsWrapper: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tabsContent: {
    paddingHorizontal: Spacing.md,
    paddingVertical:   Spacing.sm,
    flexDirection:     'row',
    gap:               Spacing.sm,
    alignItems:        'center',
  },
  tab: {
    paddingHorizontal: Spacing.md,
    paddingVertical:   7,
    borderRadius:      Radius.full,
    backgroundColor:   Colors.background,
    borderWidth:       1,
    borderColor:       Colors.border,
  },
  tabActive:      { backgroundColor: Colors.bordeaux, borderColor: Colors.bordeaux },
  tabLabel:       { fontSize: Fonts.size.sm, fontFamily: Fonts.semibold, fontWeight: '600', color: Colors.textMuted },
  tabLabelActive: { color: Colors.white },

  searchContainer: {
    flexDirection:    'row',
    alignItems:       'center',
    gap:              Spacing.sm,
    backgroundColor:  Colors.surface,
    borderRadius:     Radius.md,
    marginHorizontal: Spacing.md,
    marginVertical:   Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical:  Platform.OS === 'ios' ? 10 : 6,
    borderWidth:      1,
    borderColor:      Colors.border,
  },
  searchInput: { flex: 1, fontSize: Fonts.size.sm, color: Colors.textPrimary, padding: 0 },

  scroll: { padding: Spacing.md, paddingTop: Spacing.sm },

  empty:     { alignItems: 'center', paddingVertical: 60, gap: Spacing.md },
  emptyText: { color: Colors.textMuted, fontSize: Fonts.size.md },

  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  loadingText:      { color: Colors.textSecondary, fontSize: Fonts.size.sm },

  errorBanner: {
    backgroundColor:  Colors.errorLight,
    borderLeftWidth:  3,
    borderLeftColor:  Colors.error,
    padding:          Spacing.md,
    marginHorizontal: Spacing.md,
    marginTop:        Spacing.sm,
    borderRadius:     Radius.sm,
    flexDirection:    'row',
    justifyContent:   'space-between',
    alignItems:       'center',
  },
  errorText: { color: Colors.error, fontSize: Fonts.size.sm, flex: 1 },
});
