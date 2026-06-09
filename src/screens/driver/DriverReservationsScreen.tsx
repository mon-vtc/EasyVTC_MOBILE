import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Image,
} from 'react-native';
import { DrawerActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Logo }    from '../../constants/logo';
import { useReservation } from '../../hooks/useReservation';
import { Colors, Fonts, Spacing, Radius } from '../../theme/colors';
import type { Reservation, ReservationStatus } from '../../types/reservations.types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { DriverReservationsStackParamList } from '../../types/auth.types';

type DriverReservationsProps = NativeStackScreenProps<DriverReservationsStackParamList, 'DriverReservationsList'>;

type FilterTab = 'all' | 'assigned' | 'in_progress' | 'completed';

const TABS: { key: FilterTab; label: string; statusFilter?: ReservationStatus }[] = [
  { key: 'all',       label: 'Toutes' },
  { key: 'assigned',  label: 'A venir', statusFilter: 'assigned' },
  { key: 'in_progress', label: 'En cours', statusFilter: 'in_progress' },
  { key: 'completed', label: 'Terminées', statusFilter: 'completed' },
];

const STATUS_CONFIG: Record<ReservationStatus, { label: string; bg: string; color: string; icon: string }> = {
  pending:      { label: 'En attente', bg: '#FFF8E1', color: '#F57F17', icon: 'time-outline' },
  assigned:     { label: 'Assignée',   bg: '#E3F2FD', color: '#1976D2', icon: 'car-outline' },
  driver_arrived:{ label: 'Arrivé',    bg: '#F3E5F5', color: '#7B1FA2', icon: 'location-outline' },
  in_progress:  { label: 'En cours',   bg: '#E8F5E9', color: '#2E7D32', icon: 'bicycle-outline' },
  completed:    { label: 'Terminée',   bg: '#E8F5E9', color: '#2E7D32', icon: 'checkmark-circle' },
  cancelled:    { label: 'Annulée',    bg: '#FFEBEE', color: '#C62828', icon: 'close-circle-outline' },
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
  if (status === 'assigned') primaryText = 'Démarrer';
  if (status === 'in_progress') primaryText = 'Continuer';

  return (
    <TouchableOpacity style={styles.card} onPress={() => onDetails(reservation.id)}>
      <View style={styles.cardHeader}>
        <View style={[styles.badge, { backgroundColor: statusCfg.bg }]}> 
          <Ionicons name={statusCfg.icon as any} size={12} color={statusCfg.color} />
          <Text style={[styles.badgeText, { color: statusCfg.color }]}> {statusCfg.label}</Text>
        </View>
        <Text style={styles.price}>{price != null ? `${price.toFixed(2)} ${currencySymbol}` : '—'}</Text>
      </View>

      <Text style={styles.ref}>{refNumber}</Text>

      <View style={styles.row}>
        <Ionicons name="location-outline" size={14} color={Colors.bordeaux} />
        <Text style={styles.routeText} numberOfLines={2}>{reservation.pickup_address}</Text>
      </View>
      <View style={styles.row}>
        <Ionicons name="navigate-outline" size={14} color="#10B981" />
        <Text style={styles.routeText} numberOfLines={2}>{reservation.dest_address}</Text>
      </View>

      <View style={styles.cardFooter} >
        <TouchableOpacity style={styles.detailBtn} onPress={() => onDetails(reservation.id)}>
          <Text style={styles.detailBtnText}>Détails</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, status === 'completed' || status === 'cancelled' ? styles.actionBtnDisabled : undefined]}
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
  const { reservations, fetchDriverReservations, start, fetchById, isLoading } = useReservation();
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [refreshing, setRefreshing] = useState(false);
  const loadingRef = useRef(false);

  const activeFilter = TABS.find(t => t.key === activeTab)?.statusFilter;

  const load = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setRefreshing(true);
    try {
      await fetchDriverReservations(activeFilter ? { status: activeFilter } : undefined);
    } catch (err) {
      console.error(err);
    } finally {
      loadingRef.current = false;
      setRefreshing(false);
    }
  }, [fetchDriverReservations, activeFilter]);

  useEffect(() => { void load(); }, [load]);

  const filteredReservations = useMemo(() => {
    if (!reservations) return [];
    if (activeTab === 'all') return reservations;
    return reservations.filter(r => r.status === activeTab);
  }, [reservations, activeTab]);

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

    if (status === 'in_progress') {
      handleDetails(id);
      return;
    }

    handleDetails(id);
  };

  return (
    <View style={styles.flex}>
    
      {/* ── Header ── */}
      <View style={styles.header}>
        {/* Barre de navigation : hamburger | logo | notif */}
        <View style={styles.headerNav}>
          <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())} style={styles.navBtn}>
            <Ionicons name="menu-outline" size={28} color={Colors.white} />
          </TouchableOpacity>
          <Image source={Logo.LogoEasyVTC} style={styles.logo} resizeMode="contain" />
          <TouchableOpacity style={styles.navBtn}>
            <Ionicons name="notifications-outline" size={24} color={Colors.white} />
          </TouchableOpacity>
        </View>
        {/* Sous-header : titre */}
        <Text style={styles.headerTitle}>Mes courses</Text>
      </View>

      <View style={styles.tabBar}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabItem, activeTab === tab.key ? styles.tabItemActive : undefined]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabLabel, activeTab === tab.key ? styles.tabLabelActive : undefined]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading && !refreshing ? (
        <View style={styles.loader}><ActivityIndicator size="large" color={Colors.bordeaux} /></View>
      ) : (
        <FlatList
          data={filteredReservations}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} colors={[Colors.bordeaux]} />}
          ListEmptyComponent={() => (
            <View style={styles.empty}><Text style={styles.emptyText}>Aucune course à afficher.</Text></View>
          )}
          renderItem={({ item }) => (
            <ReservationCard
              reservation={item}
              onDetails={handleDetails}
              onAction={handleAction}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex:   { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.lg, paddingTop: Spacing.md },
  
  header: {
    backgroundColor: Colors.bordeaux,
    paddingHorizontal: Spacing.md,
    paddingTop: Platform.OS === 'ios' ? 56 : Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  headerNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
  },
  navBtn:      { padding: 4, width: 36, alignItems: 'center' },
  logo:        { width: 40, height: 40 },
  headerTitle: { fontSize: Fonts.size.xl, fontWeight: '800', color: Colors.white, marginTop: Spacing.md },

  tabBar: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm, backgroundColor: Colors.surface, borderRadius: Radius.md, padding: 4, marginHorizontal:  Spacing.md, marginTop: Spacing.sm },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: Spacing.sm, borderRadius: Radius.sm,  },
  tabItemActive: { backgroundColor: Colors.bordeauxLight },
  tabLabel: { fontSize: Fonts.size.sm, color: Colors.textSecondary, fontWeight: '600' },
  tabLabelActive: { color: Colors.white },
  list: {marginHorizontal:  Spacing.md, paddingBottom: Spacing.xl },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: Spacing.xxl },
  empty: { marginTop: Spacing.lg, alignItems: 'center' },
  emptyText: { color: Colors.textSecondary },
  card: { backgroundColor: Colors.white, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xs },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: Fonts.size.xs, fontWeight: '700' },
  price: { fontSize: Fonts.size.lg, fontWeight: '800', color: Colors.bordeaux },
  ref: { marginBottom: Spacing.xs, color: Colors.textSecondary, fontSize: Fonts.size.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.xs },
  routeText: { fontSize: Fonts.size.sm, color: Colors.textPrimary, flex: 1 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.sm },
  detailBtn: { backgroundColor: Colors.surface, borderRadius: Radius.sm, paddingVertical: 8, paddingHorizontal: Spacing.md },
  detailBtnText: { color: Colors.bordeaux, fontWeight: '700' },
  actionBtn: { backgroundColor: Colors.bordeaux, borderRadius: Radius.sm, paddingVertical: 8, paddingHorizontal: Spacing.md },
  actionBtnDisabled: { backgroundColor: Colors.border },
  actionBtnText: { color: Colors.white, fontWeight: '700' },
});