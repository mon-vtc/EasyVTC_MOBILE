import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList,
  TextInput, RefreshControl, Alert, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useReservation } from '../../hooks/useReservation';
import { Colors, Fonts, Spacing, Radius } from '../../theme/colors';
import type { Reservation, ReservationStatus } from '../../types/reservations.types';

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

function ReservationCard({ reservation, onPress, onEvaluate, onViewInvoice }: {
  reservation: Reservation; onPress: () => void; onEvaluate: () => void; onViewInvoice: () => void;
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

  return (
    <TouchableOpacity style={cardStyles.wrapper} onPress={onPress}>
      {/* Header */}
      <View style={cardStyles.header}>
        <Text style={cardStyles.id}>BC-{ref}</Text>
        <View style={[cardStyles.badge, { backgroundColor: statusCfg.bg }]}>
          <Ionicons name={statusCfg.icon as any} size={14} color={statusCfg.color} />
          <Text style={[cardStyles.badgeText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
        </View>
      </View>

      {/* Body */}
      <View style={cardStyles.body}>
        {/* Timeline */}
        <View style={cardStyles.timeline}>
          <View style={cardStyles.timelineItem}>
            <Ionicons name="radio-button-on" size={12} color={Colors.bordeaux} />
            <Text style={cardStyles.address}>{pickup}</Text>
          </View>
          <View style={cardStyles.timelineLine} />
          <View style={cardStyles.timelineItem}>
            <Ionicons name="location" size={12} color={Colors.bordeaux} />
            <Text style={[cardStyles.address, cardStyles.dest]}>{dest}</Text>
          </View>
        </View>

        {/* Date and Time */}
        <View style={cardStyles.dateTime}>
          <Text style={cardStyles.date}>{date}</Text>
          <Text style={cardStyles.time}>{time}</Text>
        </View>

        {/* Driver */}
        <Text style={cardStyles.driver}>{driverName}</Text>
      </View>

      {/* Footer */}
      <View style={cardStyles.footer}>
        <Text style={cardStyles.price}>{price}€</Text>
        <View style={cardStyles.actions}>
          {status === 'completed' && (
            <TouchableOpacity style={cardStyles.btnEvaluate} onPress={onEvaluate}>
              <Ionicons name="star" size={14} color={Colors.white} />
              <Text style={cardStyles.btnText}>Évaluer</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={onViewInvoice}>
            <Text style={cardStyles.invoiceLink}>Facture</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const cardStyles = StyleSheet.create({
  wrapper: { backgroundColor: Colors.white, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  id: { fontSize: Fonts.size.md, fontWeight: '700', color: Colors.bordeaux },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: Radius.full, paddingVertical: 4, paddingHorizontal: Spacing.sm },
  badgeText: { fontSize: Fonts.size.xs, fontWeight: '700' },
  body: { marginBottom: Spacing.sm },
  timeline: { marginBottom: Spacing.sm },
  timelineItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginVertical: 2 },
  timelineLine: { width: 1, height: 20, backgroundColor: Colors.border, marginLeft: 6 },
  address: { fontSize: Fonts.size.sm, color: Colors.textPrimary },
  dest: { fontWeight: '700' },
  dateTime: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.xs },
  date: { fontSize: Fonts.size.sm, color: Colors.textMuted },
  time: { fontSize: Fonts.size.sm, color: Colors.textMuted },
  driver: { fontSize: Fonts.size.sm, color: Colors.textSecondary },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  price: { fontSize: Fonts.size.lg, fontWeight: '800', color: Colors.bordeaux },
  actions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  btnEvaluate: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.beige, borderRadius: Radius.md, paddingVertical: 8, paddingHorizontal: Spacing.sm },
  btnText: { color: Colors.white, fontSize: Fonts.size.sm, fontWeight: '700' },
  invoiceLink: { color: Colors.bordeaux, fontSize: Fonts.size.sm, fontWeight: '600', textDecorationLine: 'underline' },
});

export default function MyReservationsScreen({ navigation }: { navigation: any }) {
  const {
    reservations, isLoading, error,
    fetchMine, clearError,
  } = useReservation();

  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const activeTabRef = useRef(activeTab);
  useEffect(() => { activeTabRef.current = activeTab; }, [activeTab]);

  const load = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const filters: Record<string, any> = {};
      const currentTab = activeTabRef.current;
      if (currentTab !== 'all' && currentTab !== 'invoices') {
        const tab = TABS.find(t => t.key === currentTab);
        if (tab?.statusFilter) filters.status = tab.statusFilter;
      } else if (currentTab === 'invoices') {
        filters.status = 'completed';
      }
      await fetchMine(filters);
    } catch (err) {
      console.error(err);
    } finally {
      if (showRefresh) setRefreshing(false);
    }
  }, [fetchMine]);

  useEffect(() => { load(); }, [activeTab]);

  const handleTabChange = (tab: FilterTab) => {
    setActiveTab(tab);
    setSearchQuery('');
  };

  const filteredReservations = useMemo(() => {
    let filtered = reservations;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r =>
        r.id.toLowerCase().includes(query) ||
        r.pickup_address.toLowerCase().includes(query) ||
        r.dest_address.toLowerCase().includes(query) ||
        (r.driver && `${r.driver.user.first_name} ${r.driver.user.last_name}`.toLowerCase().includes(query))
      );
    }
    return filtered;
  }, [reservations, searchQuery]);

  const handleEvaluate = (reservation: Reservation) => {
    Alert.alert('Évaluer', `Évaluer la réservation ${reservation.id}`);
  };

  const handleViewInvoice = (reservation: Reservation) => {
    Alert.alert('Facture', `Voir la facture pour ${reservation.id}`);
  };

  const renderReservation = ({ item }: { item: Reservation }) => (
    <ReservationCard
      reservation={item}
      onPress={() => navigation.navigate('ReservationDetails', { reservationId: item.id })}
      onEvaluate={() => handleEvaluate(item)}
      onViewInvoice={() => handleViewInvoice(item)}
    />
  );

  return (
    <View style={styles.flex}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mes réservations</Text>
        <View style={styles.headerBtn} />
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsContainer}>
        <View style={styles.tabs}>
          {TABS.map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => handleTabChange(tab.key)}
            >
              <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={Colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher par ID, adresse, chauffeur..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* List */}
      <FlatList
        data={filteredReservations}
        keyExtractor={item => item.id}
        renderItem={renderReservation}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Aucune réservation trouvée</Text>
          </View>
        }
        contentContainerStyle={styles.scroll}
      />

      {/* Error */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={clearError}>
            <Ionicons name="close" size={20} color={Colors.error} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.bordeaux, paddingTop: Platform.OS === 'ios' ? 56 : Spacing.xl + 8, paddingBottom: Spacing.md, paddingHorizontal: Spacing.md },
  headerBtn: { padding: Spacing.sm, width: 40 },
  headerTitle: { color: Colors.white, fontWeight: '800', fontSize: Fonts.size.lg },
  tabsContainer: { backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tabs: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, gap: Spacing.sm, flexDirection: 'row' },
  tab: { alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.md, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border },
  tabActive: { backgroundColor: Colors.bordeaux, borderColor: Colors.bordeaux },
  tabLabel: { fontSize: Fonts.size.sm, color: Colors.textMuted },
  tabLabelActive: { color: Colors.white },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radius.md, marginHorizontal: Spacing.md, marginVertical: Spacing.sm, paddingHorizontal: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  searchIcon: { marginRight: Spacing.sm },
  searchInput: { flex: 1, fontSize: Fonts.size.md, color: Colors.textPrimary },
  scroll: { padding: Spacing.md, paddingTop: Spacing.sm },
  empty: { alignItems: 'center', paddingVertical: 60, gap: Spacing.md },
  emptyText: { color: Colors.textMuted, fontSize: Fonts.size.md },
  errorBanner: { backgroundColor: Colors.errorLight, borderLeftWidth: 3, borderLeftColor: Colors.error, padding: Spacing.md, marginHorizontal: Spacing.md, marginTop: Spacing.sm, borderRadius: Radius.sm, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  errorText: { color: Colors.error, fontSize: Fonts.size.sm, flex: 1 },
});
