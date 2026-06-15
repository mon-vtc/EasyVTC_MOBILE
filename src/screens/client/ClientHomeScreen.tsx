import React, { useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, StatusBar, Platform,
} from 'react-native';
import { Ionicons }  from '@expo/vector-icons';
import { Colors, Fonts, Spacing, Radius } from '../../theme/colors';
import { useAuth }   from '../../hooks/useAuth';
import { useReservation } from '../../hooks/useReservation';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { ClientTabParamList, ClientStackParamList }   from '../../types/auth.types';
import { LinearGradient } from 'expo-linear-gradient';
import { useNotifications } from '../../hooks/useNotifications';  

type Props = CompositeScreenProps<
  BottomTabScreenProps<ClientTabParamList, 'ClientHome'>,
  NativeStackScreenProps<ClientStackParamList>
>;

type Ride = {
  id: string;
  status: string;
  price: string;
  date: string;
  from: string;
  to: string;
  driver: string;
  vehicle: string;
};

// ── Données mock ────────────────────────────────────────────────
const QUICK_ACTIONS = [
  { icon: 'time-outline',         label: 'Historique' },
  { icon: 'heart-outline',        label: 'Favoris'    },
  { icon: 'pricetag-outline',     label: 'Promos'     },
  { icon: 'headset-outline',      label: 'Support'    },
] as const;

// ── Composants ──────────────────────────────────────────────────
function RideCard({ ride, onPress }: { ride: Ride, onPress: () => void}) {
  const status = ride.status === 'confirmed' 
    ? { label: 'Confirmée', bg: Colors.successLight, color: Colors.success }
    : { label: 'En attente', bg: Colors.warningLight, color: Colors.warning };
  return (
    <TouchableOpacity style={cardStyles.wrapper} onPress={onPress}>
      {/* Status + Prix */}
      <View style={cardStyles.topRow}>
        <View style={[cardStyles.badge, { backgroundColor: status.bg }]}>
          <Text style={[cardStyles.badgeText, { color: status.color }]}>{status.label}</Text>
        </View>
        <Text style={cardStyles.price}>{ride.price}</Text>
      </View>

      {/* Date */}
      <Text style={cardStyles.date}>{ride.date}</Text>

      {/* Trajet */}
      <View style={cardStyles.routeRow}>
        <Ionicons name="radio-button-on" size={14} color="#4CAF50" />
        <Text style={cardStyles.routeText}>{ride.from}</Text>
      </View>
      <View style={cardStyles.routeRow}>
        <Ionicons name="location" size={14} color={Colors.bordeaux} />
        <Text style={cardStyles.routeText}>{ride.to}</Text>
      </View>

      {/* Driver + Véhicule */}
      <View style={cardStyles.bottomRow}>
        <View style={cardStyles.infoItem}>
          <Ionicons name="person-outline" size={14} color={Colors.textMuted} />
          <Text style={cardStyles.infoText}>{ride.driver}</Text>
        </View>
        <View style={cardStyles.infoItem}>
          <Ionicons name="car-outline" size={14} color={Colors.textMuted} />
          <Text style={cardStyles.infoText}>{ride.vehicle}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const cardStyles = StyleSheet.create({
  wrapper: {
    backgroundColor: Colors.surface,
    borderRadius:    Radius.md,
    padding:         Spacing.md,
    marginBottom:    Spacing.sm,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }
  },
  topRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginBottom:   Spacing.xs,
  },
  badge: {
    borderRadius:    Radius.full,
    paddingVertical: 3,
    paddingHorizontal: Spacing.sm,
  },
  badgeText: { fontSize: Fonts.size.xs, fontWeight: '700' },
  price:     { fontSize: Fonts.size.lg, fontWeight: '800', color: Colors.textPrimary },
  date:      { fontSize: Fonts.size.xs, color: Colors.textMuted, marginBottom: Spacing.sm },
  routeRow:  { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: 4 },
  routeText: { fontSize: Fonts.size.sm, color: Colors.textSecondary },
  bottomRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    marginTop:      Spacing.sm,
    paddingTop:     Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  infoItem:  { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  infoText:  { fontSize: Fonts.size.sm, color: Colors.textMuted },
});

// ── Screen ──────────────────────────────────────────────────────
export default function ClientHomeScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { homeReservations, fetchHomeReservations } = useReservation();
  const firstName = user?.first_name ?? 'Marie';
  const { notifications, unreadCount } = useNotifications();

  // useEffect :
  useEffect(() => {
    fetchHomeReservations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const upcomingRides = useMemo(() => {
    const now = new Date();
    return homeReservations
      .filter(r => new Date(r.scheduled_at) > now && ['pending', 'assigned'].includes(r.status))
      .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
      .slice(0, 2)
      .map(r => ({
        id: r.id,
        status: r.status === 'assigned' ? 'confirmed' : 'pending',
        price: `${(r.price_final || r.price_estimated).toFixed(2)}€`,
        date: new Date(r.scheduled_at).toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }) + ' à ' + new Date(r.scheduled_at).toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        from: r.pickup_address,
        to: r.dest_address,
        driver: r.driver ? `${r.driver.user.first_name} ${r.driver.user.last_name}` : 'Non assigné',
        vehicle: r.vehicle_type || '—',
      }));
  }, [homeReservations]);

  return (
    <LinearGradient 
          colors={[Colors.bordeaux, Colors.bordeauxLight]} 
          start={{ x: 0, y: 0 }} 
          end={{ x: 1, y: 1 }}
          style={styles.flex}
    >
      <View style={styles.flex}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.bordeaux} />

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Header bordeaux ── */}
          <LinearGradient 
                  colors={[Colors.bordeaux, Colors.bordeauxLight]} 
                  start={{ x: 0, y: 0 }} 
                  end={{ x: 1, y: 1 }}
                  style={styles.header}>

            <View style={styles.headerTop}>
              <View style={styles.headerGreet}>
                <Text style={styles.greeting}>Bonjour {firstName} 👋</Text>
                <Text style={styles.subGreeting}>Où souhaitez-vous aller{'\n'}aujourd'hui ?</Text>
              </View>
              <View style={styles.headerIcons}>
                {/* Cloche avec badge */}
                <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Notifications')}>
                  <Ionicons name="notifications-outline" size={26} color={Colors.white} />
                  <View style={styles.notifBadge}>
                    <Text style={styles.notifText}>{ unreadCount}</Text>
                  </View>
                </TouchableOpacity>
                {/* Profil */}
                <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('ClientProfile')}>
                  <Ionicons name="person-circle-outline" size={26} color={Colors.white} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Bouton Nouvelle réservation */}
            <TouchableOpacity
              style={styles.newRideBtn}
              onPress={() => navigation.navigate('CreateReservation')}
            >
              <Ionicons name="add-circle-outline" size={20} color={Colors.bordeaux} />
              <Text style={styles.newRideBtnText}>Nouvelle réservation</Text>
            </TouchableOpacity>
          </LinearGradient>

          {/* ── Quick Actions ── */}
          <View style={styles.section}>
            <View style={styles.quickActions}>
              {QUICK_ACTIONS.map((action) => (
                <TouchableOpacity 
                  key={action.label} 
                  style={styles.quickAction}
                  onPress={() => {
                    switch (action.label) {
                      case 'Historique':
                        navigation.navigate('MyReservations');
                        break;
                      case 'Favoris':
                        navigation.navigate('MyFavorites');
                        break;
                      case 'Promos':
                        navigation.navigate('PromoCodes'); // TODO: Créer l'écran Promotions
                        break;
                      case 'Support':
                        navigation.navigate('SupportList');
                        break;
                    }
                  }}
                >
                  <View style={styles.quickActionIcon}>
                    <Ionicons name={action.icon} size={22} color={Colors.bordeaux} />
                  </View>
                  <Text style={styles.quickActionLabel}>{action.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ── Courses à venir ── */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Courses à venir</Text>
              <TouchableOpacity onPress={() => navigation.navigate('MyReservations')}>
                <Text style={styles.seeAll}>Voir tout</Text>
              </TouchableOpacity>
            </View>

            {upcomingRides.map((ride) => (
              <RideCard key={ride.id} ride={ride} onPress={() => navigation.navigate('ReservationDetails', { reservationId: ride.id })} />
            ))}
          </View>

          {/* ── Programme fidélité ── */}
          <View style={[styles.section, { marginBottom: Spacing.xxl }]}>
            <LinearGradient 
                  colors={[Colors.bordeaux, Colors.bordeauxLight]} 
                  start={{ x: 0, y: 0 }} 
                  end={{ x: 1, y: 1 }}
                  style={styles.flex}
            >
              <View style={styles.loyaltyCard}>
                <View style={styles.loyaltyTop}>
                  <View>
                    <Text style={styles.loyaltyTitle}>Programme fidélité</Text>
                    <Text style={styles.loyaltySub}>Gagnez des points à chaque course</Text>
                  </View>
                  <Ionicons name="gift-outline" size={36} color="rgba(255,255,255,0.6)" />
                </View>
                <View style={styles.loyaltyPoints}>
                  <Text style={styles.loyaltyPointsLabel}>Points accumulés</Text>
                  <Text style={styles.loyaltyPointsValue}>450</Text>
                </View>
              </View>

            </LinearGradient>
          </View>

        </ScrollView>
      </View>

        </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex:   { flex: 1, backgroundColor: Colors.background, borderRadius: Radius.lg },
  scroll: { flexGrow: 1 },

  // Header
  header: {
    backgroundColor:   Colors.bordeaux,
    paddingTop:        Platform.OS === 'ios' ? 56 : Spacing.xl + 16,
    paddingHorizontal: Spacing.lg,
    paddingBottom:     Spacing.xl,
    borderBottomLeftRadius:  Radius.xl,
    borderBottomRightRadius:  Radius.xl,
  },
  headerTop: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'flex-start',
    marginBottom:   Spacing.lg,
  },
  headerGreet:  { flex: 1 },
  greeting:     { fontSize: Fonts.size.xl, fontWeight: '800', color: Colors.white, marginBottom: 4 },
  subGreeting:  { fontSize: Fonts.size.sm, color: 'rgba(255,255,255,0.8)', lineHeight: 20 },
  headerIcons:  { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm},
  iconBtn:      { position: 'relative', padding: 6,borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)' },
  notifBadge: {
    position:        'absolute',
    top:             2, right: 2,
    backgroundColor: '#FF5252',
    borderRadius:    8,
    minWidth:        16, height: 16,
    alignItems:      'center',
    justifyContent:  'center',
    paddingHorizontal: 3,
  },
  notifText: { color: Colors.white, fontSize: 9, fontWeight: '800' },

  newRideBtn: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderRadius:   Radius.md,
    paddingVertical: Spacing.lg,
    gap:            Spacing.sm,
  },
  newRideBtnText: {
    color:      Colors.bordeaux,
    fontWeight: 'bold',
    fontSize:   Fonts.size.lg,
  },

  // Section générique
  section: {
    paddingHorizontal: Spacing.lg,
    marginTop:         Spacing.lg,
  },
  sectionHeader: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginBottom:   Spacing.md,
  },
  sectionTitle: {
    fontSize:   Fonts.size.lg,
    fontWeight: '800',
    color:      Colors.textPrimary,
  },
  seeAll: {
    fontSize: Fonts.size.sm,
    color:    Colors.bordeaux,
    fontWeight: '600',
  },

  // Quick actions
  quickActions: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    marginTop:      Spacing.sm,
  },
  quickAction: { alignItems: 'center', gap: Spacing.xs, backgroundColor: Colors.surface, padding: Spacing.sm, borderRadius: Radius.md, flex: 1, marginHorizontal: Spacing.xs, elevation: 2, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }},
  quickActionIcon: {
    width:          56, height: 56,
    borderRadius:   28,
    backgroundColor: Colors.iconBg,
    alignItems:     'center',
    justifyContent: 'center'
  },
  quickActionLabel: {
    fontSize: Fonts.size.xs,
    color:    Colors.textSecondary,
    fontWeight: '500',
  },

  // Loyalty
  loyaltyCard: {
    // backgroundColor:   Colors.bordeaux,
    borderRadius:      Radius.lg,
    padding:           Spacing.lg,
  },
  loyaltyTop: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'flex-start',
    marginBottom:   Spacing.md,
  },
  loyaltyTitle: { fontSize: Fonts.size.lg, fontWeight: '800', color: Colors.white },
  loyaltySub:   { fontSize: Fonts.size.sm, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  loyaltyPoints: {
    flexDirection:   'row',
    justifyContent:  'space-between',
    alignItems:      'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius:    Radius.md,
    padding:         Spacing.md,
  },
  loyaltyPointsLabel: { color: 'rgba(255,255,255,0.8)', fontSize: Fonts.size.sm },
  loyaltyPointsValue: { color: Colors.white, fontSize: Fonts.size.xl, fontWeight: '800' },
});