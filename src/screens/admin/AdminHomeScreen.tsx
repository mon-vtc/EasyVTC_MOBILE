import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts, Spacing, Radius } from '../../theme/colors';

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

type Driver = {
  id: string;
  name: string;
  vehicleType: "Berline" | "Van" | "Standard";
  rating: number;
  isOnline: boolean;
  avatarUrl?: string;
};

type DashboardData = {
  stats: {
    pending: number;
    activeDrivers: number;
    revenue: number;
    rides: number;
  };
  bookings: Booking[];
  drivers: Driver[];
};

const mockData: DashboardData = {
  stats: {
    pending: 5,
    activeDrivers: 12,
    revenue: 2450,
    rides: 28,
  },
  bookings: [
    {
      id: '1',
      bookingCode: 'BC-2025-00145',
      clientName: 'Marie Dubois',
      route: 'Massy, 91300 → Aéroport Paris-Orly',
      dateTime: '15 janvier 2026 à 14h30',
      price: 65,
    },
    {
      id: '2',
      bookingCode: 'BC-2025-00148',
      clientName: 'Jean Dupont',
      route: 'Paris 15ème → Gare Montparnasse',
      dateTime: '15 janvier 2026 à 18:00',
      price: 28,
    },
  ],
  drivers: [
    { id: '1', name: 'Mohamed Diallo', vehicleType: 'Berline', rating: 4.8, isOnline: true },
    { id: '2', name: 'Fatima Zahra', vehicleType: 'Van', rating: 4.9, isOnline: true },
    { id: '3', name: 'Pierre Martin', vehicleType: 'Standard', rating: 4.7, isOnline: true },
  ],
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

const BookingCard = ({ booking }: { booking: Booking }) => (
  <View style={styles.bookingCard}>
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
    <TouchableOpacity style={styles.assignButton} activeOpacity={0.8}>
      <Text style={styles.assignButtonText}>Attribuer un chauffeur</Text>
    </TouchableOpacity>
  </View>
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

export default function AdminHomeScreen({ navigation } : any) {
  const { stats, bookings, drivers } = mockData;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Section KPI */}
      <View style={styles.statsGrid}>
        <StatCard icon="time-outline" value={String(stats.pending)} label="En attente" colors={['#4A90E2', '#2C6DA9']} />
        <StatCard icon="person-outline" value={String(stats.activeDrivers)} label="Chauffeurs actifs" colors={['#50E3C2', '#34A88A']} />
        <StatCard icon="logo-euro" value={`${stats.revenue} €`} label="CA du jour" colors={[Colors.bordeaux, '#A12C32']} />
        <StatCard icon="car-sport-outline" value={String(stats.rides)} label="Courses du jour" colors={['#BD10E0', '#8A0B9E']} />
      </View>

      {/* Section Réservations en attente */}
      <View style={styles.section}>
        <SectionHeader title="Réservations en attente" actionText="Voir tout" actionOnPress={() => navigation.navigate('AdminReservations')} />
        {bookings.map(booking => <BookingCard key={booking.id} booking={booking} />)}
      </View>

      {/* Section Chauffeurs disponibles */}
      <View style={styles.section}>
        <SectionHeader title="Chauffeurs disponibles" actionText={`${drivers.filter(d => d.isOnline).length} en ligne`} />
        {drivers.map(driver => <DriverItem key={driver.id} driver={driver} />)}
      </View>
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
