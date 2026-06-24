import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts, Spacing, Radius } from '../../theme/colors';
import { useAdmin } from '../../hooks/useAdmin';
import { useReservation } from '../../hooks/useReservation';
import type { AdminStats, AvailableDriverDto, Reservation } from '../../types';
import DriverPickerModal from './DriverPickerModal';


// ══════════════════════════════════════════════════════════════════════════════
// TYPES & MOCK DATA
// ══════════════════════════════════════════════════════════════════════════════

type Booking = {
  id: string;
  bookingCode: string;
  clientName: string;
  route: string;
  dateTime: string;
  price: number;
};

type DashboardData = {
  stats: AdminStats | null;
  bookings: Booking[];
  drivers: Driver[];
};

type Driver = {
  id: string;
  name: string;
  vehicleType: "Berline" | "Van" | "Standard";
  rating: number;
  isOnline: boolean;
  avatarUrl?: string;
};

// ══════════════════════════════════════════════════════════════════════════════
// SOUS-COMPOSANTS
// ══════════════════════════════════════════════════════════════════════════════

const SectionHeader = ({ title, actionText, actionOnPress }: { title: string; actionText?: string; actionOnPress?: () => void; }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {actionText && <TouchableOpacity onPress={actionOnPress}><Text style={styles.sectionAction}>{actionText}</Text></TouchableOpacity>}
  </View>
);

const StatCard = ({ icon, value, label, colors }: { icon: keyof typeof Ionicons.glyphMap; value: string; label: string; colors: string[] }) => (
  <LinearGradient colors={colors} style={styles.statCard}>
    <Ionicons name={icon} size={24} color={Colors.white} style={{ opacity: 0.8 }} />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </LinearGradient>
);

const BookingCard = ({
  booking,
  onAssign,
  onPress,
}: {
  booking: Booking;
  onAssign: () => void;
  onPress: () => void;
}) => (
  <TouchableOpacity
    style={styles.bookingCard}
    onPress={onPress}
    activeOpacity={0.9}>
    <View style={styles.bookingRow1}>
      <Text style={styles.bookingCode}>{booking.bookingCode}</Text>
      <View style={styles.bookingBadge}>
        <Text style={styles.bookingBadgeText}>À attribuer</Text>
      </View>
    </View>
    <View style={styles.bookingRow}>
      <Ionicons name="person-outline" size={16} color={Colors.textSecondary} />
      <Text style={styles.bookingClient}>{booking.clientName}</Text>
    </View>
    <View style={styles.bookingRow}>
      <Ionicons name="navigate-outline" size={16} color={Colors.textSecondary} />
      <Text style={styles.bookingRoute}>{booking.route}</Text>
    </View>
    <View style={styles.bookingRowLast}>
      <Text style={styles.bookingDateTime}>{booking.dateTime}</Text>
      <Text style={styles.bookingPrice}>{booking.price} €</Text>
    </View>
    <TouchableOpacity style={styles.assignButton} activeOpacity={0.8} onPress={onAssign}>
      <Text style={styles.assignButtonText}>Attribuer un chauffeur</Text>
    </TouchableOpacity>
  </TouchableOpacity>
);

const DriverItem = ({ driver }: { driver: Driver }) => (
  <View style={styles.driverItem}>
    <View style={styles.driverAvatar}>
      <Ionicons name="person-outline" size={24} color={Colors.textSecondary} />
    </View>
    <View style={styles.driverInfo}>
      <Text style={styles.driverName}>{driver.name}</Text>
      <Text style={styles.driverVehicle}>{driver.vehicleType}</Text>
    </View>
    <View style={styles.driverStatus}>
      <Ionicons name="star" size={14} color="#FFC107" />
      <Text style={styles.driverRating}>{driver.rating.toFixed(1)}</Text>
      <View style={styles.onlineIndicator} />
    </View>
  </View>
);

// ══════════════════════════════════════════════════════════════════════════════
// ÉCRAN PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════════

export default function AdminHomeScreen({ navigation }: any) {
  const { fetchDashboardStats, drivers, fetchDrivers } = useAdmin();
  const {
    adminHomeReservations,
    fetchAdminHomeReservations,
    assign,
  } = useReservation();

  const [pickerVisible, setPickerVisible] = useState(false);

  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);


  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const mapApiDriverToLocal = (apiDriver: any): Driver => ({
    id: apiDriver.id,
    name: `${apiDriver.first_name} ${apiDriver.last_name}`,
    vehicleType: apiDriver.driver.vehicle_type,
    rating: apiDriver.rating ?? 0,
    isOnline: apiDriver.driver.is_online,
    avatarUrl: apiDriver.profile_photo_url,
  });

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      // On lance les chargements, mais on n'attend pas leur retour ici
      const statsPromise = fetchDashboardStats();
      const bookingsPromise = fetchAdminHomeReservations();
      const driversPromise = fetchDrivers({ is_online: true, limit: 5 });

      // On attend uniquement les stats, car elles ne sont pas dans un store
      const [stats] = await Promise.all([
        fetchDashboardStats(),
        bookingsPromise,
        driversPromise,
      ]);

      // On met à jour le state local avec les stats
      setData({
        stats,
        // Les réservations et chauffeurs seront lus directement depuis les hooks
        bookings: [],
        drivers: [],
      });
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetchDashboardStats, fetchAdminHomeReservations, fetchDrivers]);

  // On utilise les données des stores, qui sont mises à jour par les hooks
  const dashboardBookings = adminHomeReservations
    .slice(0, 5)
    .map((r: Reservation) => ({
          id: r.id,
          bookingCode: `RES-${r.id.split('-').pop()?.toUpperCase()}`,
          clientName: `${r.client?.first_name} ${r.client?.last_name}`,
          route: `${r.pickup_address} → ${r.dest_address}`,
          dateTime: new Date(r.scheduled_at).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }),
          price: r.price_estimated,
    }));

  const dashboardDrivers = drivers.filter(d => d.driver?.is_online).slice(0, 5).map(mapApiDriverToLocal);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return <View style={styles.container}><ActivityIndicator size="large" color={Colors.bordeaux} /></View>;
  }

  const handleAssignConfirm = async (driver: AvailableDriverDto) => {
    if (!selectedReservation) return;

    try {
      await assign(selectedReservation.id, driver.id);

      setPickerVisible(false);
      setSelectedReservation(null);

      await fetchAdminHomeReservations();
    } catch (error) {
      console.error(error);
    }
  };

  const handleAssignDriver = (reservationId: string) => {
  const reservation = adminHomeReservations.find(
      r => r.id === reservationId
    );
  
    if (!reservation) return;
  
    setSelectedReservation(reservation);
    setPickerVisible(true);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} />}
    >
      {/* Section KPI */}
      <View style={styles.statsGrid}>
        <StatCard icon="time-outline" value={String(data?.stats?.reservations?.by_status?.pending ?? 0)} label="En attente" colors={['#4A90E2', '#2C6DA9']} />
        <StatCard icon="person-outline" value={String(data?.stats?.drivers?.online ?? 0)} label="Chauffeurs en ligne" colors={['#50E3C2', '#34A88A']} />
        <StatCard icon="logo-euro" value={`${(data?.stats?.revenue?.total_eur ?? 0).toFixed(0)} €`} label="CA du jour" colors={[Colors.bordeaux, '#A12C32']} />
        <StatCard icon="car-sport-outline" value={`${data?.stats?.reservations?.total ?? 0}`} label="Courses du jour" colors={['#BD10E0', '#8A0B9E']} />
      </View>

      {/* Section Réservations en attente */}
      <View style={styles.section}>
        <SectionHeader title="Réservations en attente" actionText="Voir tout" actionOnPress={() => navigation.navigate('AdminReservations')} />
        {dashboardBookings.map(booking => (
         <BookingCard
           key={booking.id}
           booking={booking}
           onAssign={() => handleAssignDriver(booking.id)}
           onPress={() =>
             navigation.navigate('AdminReservations', {
               screen: 'AdminReservationDetail',
               params: {
                 reservationId: booking.id,
               },
             })
           }
         />
        ))}
      </View>

      {/* Section Chauffeurs disponibles */}
      <View style={styles.section}>
        <SectionHeader title="Chauffeurs disponibles" actionText={`${dashboardDrivers.length} en ligne`} />
        {dashboardDrivers.map(driver => <DriverItem key={driver.id} driver={driver} />)}
      </View>
      <DriverPickerModal
        visible={pickerVisible}
        reservationRef={
          selectedReservation
            ? `RES-${selectedReservation.id.split('-').pop()?.toUpperCase()}`
            : undefined
        }
        vehicleType={selectedReservation?.vehicle_type}
        scheduledAt={selectedReservation?.scheduled_at}
        durationMin={selectedReservation?.duration_min}
        onConfirm={handleAssignConfirm}
        onClose={() => {
          setPickerVisible(false);
          setSelectedReservation(null);
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6F8' },
  contentContainer: { padding: Spacing.md, paddingBottom: Spacing.xl, gap: 24 },

  // KPI Grid
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: Spacing.md },
  statCard: { width: '48%', height: 110, borderRadius: Radius.lg, padding: Spacing.md, justifyContent: 'space-between' },
  statValue: { color: Colors.white, fontSize: Fonts.size.xxl, fontWeight: '800' },
  statLabel: { color: Colors.white, fontSize: Fonts.size.sm, fontWeight: '600', opacity: 0.9 },

  // Section
  section: {},
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  sectionTitle: { fontSize: Fonts.size.lg, fontWeight: '800', color: Colors.textPrimary },
  sectionAction: { fontSize: Fonts.size.sm, fontWeight: '600', color: Colors.bordeaux },

  // Booking Card
  bookingCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  bookingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 8 },
  bookingRow1: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  bookingRowLast: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, marginBottom: 16 },
  bookingCode: { fontSize: Fonts.size.md, fontWeight: '700', color: Colors.textPrimary },
  bookingBadge: { backgroundColor: '#FFF3E0', paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
  bookingBadgeText: { color: '#E65100', fontSize: Fonts.size.xs, fontWeight: '700' },
  bookingClient: { fontSize: Fonts.size.md, color: Colors.textPrimary },
  bookingRoute: { fontSize: Fonts.size.sm, color: Colors.textSecondary, flex: 1 },
  bookingDateTime: { fontSize: Fonts.size.sm, color: Colors.textSecondary },
  bookingPrice: { fontSize: Fonts.size.lg, fontWeight: '800', color: Colors.textPrimary },
  assignButton: { backgroundColor: Colors.bordeaux, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  assignButtonText: { color: Colors.white, fontSize: Fonts.size.md, fontWeight: '700' },

  // Driver Item
  driverItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  driverAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  driverInfo: { flex: 1 },
  driverName: { fontSize: Fonts.size.md, fontWeight: '700', color: Colors.textPrimary },
  driverVehicle: { fontSize: Fonts.size.sm, color: Colors.textMuted, marginTop: 2 },
  driverStatus: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  driverRating: { fontSize: Fonts.size.sm, fontWeight: '600', color: Colors.textSecondary },
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginLeft: Spacing.xs,
  },

  // Styles du placeholder original (au cas où)
  placeholderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    padding: Spacing.xl,
  },
});
