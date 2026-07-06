// ══════════════════════════════════════════════════════════════════════════════
// SCREEN — DriverHomeScreen
// Sprint 3 — EasyVTC
// ══════════════════════════════════════════════════════════════════════════════
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View, Text, ScrollView, Switch, StyleSheet,
  ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { useDriver }   from '../../hooks/useDriver';
import { AppIcon }     from '../../components/common/AppIcon';
import { useAlert } from '../../hooks/useAlert';
import { Colors }      from '../../theme/colors';
import { useReservation } from '../../hooks/useReservation';

// ══════════════════════════════════════════════════════════════════════════════
// TYPES LOCAUX
// ══════════════════════════════════════════════════════════════════════════════

interface DayStats {
  rides:    number;
  revenue:  number;
  rating:   number | null;
}

const EMPTY_STATS: DayStats = { rides: 0, revenue: 0, rating: null };

// ══════════════════════════════════════════════════════════════════════════════
// SOUS-COMPOSANTS
// ══════════════════════════════════════════════════════════════════════════════

// ── Carte statut + toggle ─────────────────────────────────────────────────────
function StatusCard({
  isOnline,
  isToggling,
  driverStatus,
  onToggle,
}: {
  isOnline:     boolean;
  isToggling:   boolean;
  driverStatus: string | null;
  onToggle:     (v: boolean) => void;
}) {
  const canGoOnline = driverStatus === 'active' || driverStatus === 'probationary';
  const isOnTrip = driverStatus === 'on_trip';


  return (
    <View style={sc.card}>
      <View style={sc.row}>
        <View>
          <Text style={sc.title}>Statut</Text>
          <Text style={[sc.subtitle, isOnline && sc.subtitleOnline]}>
            {isOnline ? 'Vous êtes disponible' : 'Vous êtes hors ligne'}
          </Text>
        </View>
        {isToggling
          ? <ActivityIndicator color={Colors.bordeaux} />
          : (
            <Switch
              value={isOnline}
              onValueChange={onToggle}
              disabled={isOnTrip || (!canGoOnline && !isOnline)}
              trackColor={{ false: '#D1D5DB', true: Colors.bordeauxLight }}
              thumbColor={Colors.white}
              ios_backgroundColor="#D1D5DB"
              testID="driver-status-toggle"
            />
          )
        }
      </View>

      {/* Message contextuel */}
      {isOnTrip && (
        <View style={[sc.infoBox, sc.infoBoxWarn]}>
          <AppIcon name="warning-outline" size={18} color="#92400E" />
          <Text style={[sc.infoText, sc.infoTextWarn]}>
            Vous ne pouvez pas changer de statut pendant une course.
          </Text>
        </View>
      )}

      {isOnline && (
        <View style={sc.infoBox}>
          <AppIcon name="checkmark-circle" size={18} color="#10B981" />
          <Text style={sc.infoText}>
            Vous recevrez les courses qui vous sont attribuées
          </Text>
        </View>
      )}

      {!isOnline && !canGoOnline && !isOnTrip && (
        <View style={[sc.infoBox, sc.infoBoxWarn]}>
          <AppIcon name="alert-circle-outline" size={18} color="#92400E" />
          <Text style={[sc.infoText, { color: '#92400E' }]}>
            Votre profil doit être validé pour passer en ligne
          </Text>
        </View>
      )}

      {!isOnline && canGoOnline && (
        <View style={[sc.infoBox, sc.infoBoxGrey]}>
          <AppIcon name="moon-outline" size={18} color={Colors.textSecondary} />
          <Text style={[sc.infoText, sc.infoTextGrey]}>
            Activez le statut pour recevoir des courses
          </Text>
        </View>
      )}
    </View>
  );
}

// ── Statistiques du jour ──────────────────────────────────────────────────────
function StatsCard({ stats }: { stats: DayStats }) {
  return (
    <View style={st.card}>
      <Text style={st.title}>Statistiques du jour</Text>
      <View style={st.row}>
        <View style={st.stat}>
          <Text style={st.value}>{stats.rides}</Text>
          <Text style={st.label}>Courses</Text>
        </View>
        <View style={st.divider} />
        <View style={st.stat}>
          <Text style={st.value}>{stats.revenue}€</Text>
          <Text style={st.label}>Revenus</Text>
        </View>
        <View style={st.divider} />
        <View style={st.stat}>
          <Text style={st.value}>{stats.rating != null ? stats.rating.toFixed(1) : '—'}</Text>
          <Text style={st.label}>Note</Text>
        </View>
      </View>
    </View>
  );
}

// ── Course attribuée ──────────────────────────────────────────────────────────
interface RideCardProps {
  id:          string;
  ref_number:  string;
  client_name: string;
  client_phone:string;
  origin:      string;
  destination: string;
  date:        string;
  time:        string;
  price:       number;
  status:      string;
  onDetails:   (id: string) => void;
}

function RideCard({
  id, ref_number, client_name, client_phone,
  origin, destination, date, time, price, status, onDetails,
}: RideCardProps) {
  return (
    <TouchableOpacity style={rc.card} onPress={() => onDetails(id)}>
      {/* En-tête référence + badge */}
      <View style={rc.header}>
        <Text style={rc.ref}>{ref_number}</Text>
        <View style={[rc.badge, rc[`badge_${status}` as keyof typeof rc] as any]}>
          <Text style={rc.badgeText}>{STATUS_LABELS[status] ?? status}</Text>
        </View>
      </View>

      {/* Client */}
      <View style={rc.infoRow}>
        <AppIcon name="person-outline" size={16} color={Colors.textSecondary} />
        <View style={rc.infoTexts}>
          <Text style={rc.infoMain}>{client_name}</Text>
          <Text style={rc.infoSub}>{client_phone}</Text>
        </View>
      </View>

      {/* Départ */}
      <View style={rc.infoRow}>
        <AppIcon name="location-outline" size={16} color={Colors.bordeaux} />
        <View style={rc.infoTexts}>
          <Text style={rc.infoLabel}>Départ</Text>
          <Text style={rc.infoMain}>{origin}</Text>
        </View>
      </View>

      {/* Destination */}
      <View style={rc.infoRow}>
        <AppIcon name="location" size={16} color={Colors.bordeauxLight}/>
        <View style={rc.infoTexts}>
          <Text style={rc.infoLabel}>Destination</Text>
          <Text style={rc.infoMain}>{destination}</Text>
        </View>
      </View>

      {/* Date + heure */}
      <View style={[rc.dateRow, {flexDirection: 'row', justifyContent: 'space-between',}]}>
        <View style={rc.dateItem}>
          <AppIcon name="calendar-outline" size={14} color={Colors.textSecondary} />
          <Text style={rc.dateText}>{date}</Text>
        </View>
        <View style={rc.dateItem}>
          <AppIcon name="time-outline" size={14} color={Colors.textSecondary} />
          <Text style={rc.dateText}>{time}</Text>
        </View>
      </View>

      {/* Prix + bouton */}
      <View style={rc.footer}>
        <Text style={rc.price}>{price} €</Text>
        <TouchableOpacity
          style={rc.detailBtn}
          onPress={() => onDetails(id)}
          activeOpacity={0.85}
        >
          <Text style={rc.detailBtnText}>Voir les détails</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const STATUS_LABELS: Record<string, string> = {
  assigned:   'Attribuée',
  pending:    'En attente',
  in_progress:'En cours',
  completed:  'Terminée',
  cancelled:  'Annulée',
};

// ══════════════════════════════════════════════════════════════════════════════
// ÉCRAN PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════════

export default function DriverHomeScreen({ navigation }: any) {
  const { isOnline, status, setOnlineStatus, isLoading: isDriverLoading, getMyRevenues, getMyAverageRating } = useDriver();
  const { driverHomeReservations, fetchDriverHomeReservations, isLoading: isReservationsLoading } = useReservation();
  const { showAlert } = useAlert();

  const [isToggling, setIsToggling]   = useState(false);
  const [stats, setStats] = useState<DayStats>(EMPTY_STATS);

  useEffect(() => {
    const loadData = async () => {
      try {
        await fetchDriverHomeReservations();
      } catch (err) {
        console.error("Failed to fetch driver reservations:", err);
      }
    };
    void loadData();
  }, [fetchDriverHomeReservations]);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [revenues, rating] = await Promise.all([
          getMyRevenues('day'),
          getMyAverageRating(),
        ]);
        setStats({
          rides:   revenues?.total_trips ?? 0,
          revenue: revenues?.total_revenue ?? 0,
          rating,
        });
      } catch (err) {
        console.error("Failed to fetch driver stats:", err);
      }
    };
    void loadStats();
  }, [getMyRevenues, getMyAverageRating]);

  const assignedRides = useMemo(() => {
    return driverHomeReservations
      .map(r => ({
        id:           r.id,
        ref_number:   `BC-${r.id.slice(-6).toUpperCase()}`,
        client_name:  `${r.client?.first_name ?? ''} ${r.client?.last_name ?? 'Client inconnu'}`,
        client_phone: r.client?.phone ?? 'Non communiqué',
        origin:       r.pickup_address,
        destination:  r.dest_address,
        date:         new Date(r.scheduled_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
        time:         new Date(r.scheduled_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        price:        r.price_final ?? r.price_estimated,
        status:       r.status,
      }));
  }, [driverHomeReservations]);

  // ── Toggle disponibilité ──────────────────────────────────────────────────
  const handleToggle = useCallback(async (value: boolean) => {
    if (value && status !== 'active' && status !== 'probationary') {
      showAlert({
        title: 'Profil non validé',
        message: 'Votre profil chauffeur doit être validé par un administrateur avant de pouvoir passer en ligne.',
        buttons: [{ text: 'Compris', style: 'default' }],
      });
      return;
    }

    setIsToggling(true);
    try {
      await setOnlineStatus(value);
    } catch (err: any) {
      showAlert({ title: 'Erreur', message: err?.message ?? 'Impossible de changer le statut.', buttons: [{ text: 'OK' }] });
    } finally {
      setIsToggling(false);
    }
  }, [status, setOnlineStatus]);

  const handleRideDetails = useCallback((id: string) => {
    navigation.navigate('DriverReservations', { screen: 'DriverReservationDetails', params: { reservationId: id } });
  }, [navigation]);

  // ── Rendu ─────────────────────────────────────────────────────────────────
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Statut ─────────────────────────────────────────── */}
      <StatusCard
        isOnline={isOnline}
        isToggling={isToggling || isDriverLoading}
        driverStatus={status}
        onToggle={handleToggle}
      />

      {/* ── Stats du jour ──────────────────────────────────── */}
      <StatsCard stats={stats} />

      {/* ── Courses attribuées ─────────────────────────────── */}
      <Text style={styles.sectionTitle}>Courses attribuées</Text>

      {isReservationsLoading ? (
        <View style={styles.empty}>
          <ActivityIndicator color={Colors.bordeaux} />
        </View>
      ) : assignedRides.length === 0 ? (
        <View style={styles.empty}>
          <AppIcon name="car-outline" size={40} color={Colors.textSecondary} />
          <Text style={styles.emptyText}>Aucune course attribuée pour l'instant</Text>
        </View>
      ) : (
        assignedRides.map(ride => (
          <RideCard
            key={ride.id}
            {...ride}
            onDetails={handleRideDetails}
          />
        ))
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// STYLES
// ══════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background ?? '#F5F5F5',
  },
  content: {
    padding: 16,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 4,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
});

// ── StatusCard ────────────────────────────────────────────────────────────────
const sc = StyleSheet.create({
  card: {
    backgroundColor: Colors.white ?? '#fff',
    borderRadius: 14,
    padding: 16,
    gap: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  subtitleOnline: {
    color: Colors.bordeauxLight,
    fontWeight: '500',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.validatedBackground,
    borderRadius: 8,
    padding: 10,
  },
  infoBoxWarn: {
    backgroundColor: '#FFFBEB',
  },
  infoBoxGrey: {
    backgroundColor: Colors.surface ?? '#F9FAFB',
  },
  infoText: {
    fontSize: 13,
    color: '#065F46',
    flex: 1,
    lineHeight: 18,
  },
  infoTextWarn: {
    color: '#92400E',
  },
  infoTextGrey: {
    color: Colors.textSecondary,
  },
});

// ── StatsCard ─────────────────────────────────────────────────────────────────
const st = StyleSheet.create({
  card: {
    backgroundColor: Colors.bordeaux,
    borderRadius: 14,
    padding: 20,
    gap: 16,
  },
  title: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  value: {
    color: Colors.white,
    fontSize: 24,
    fontWeight: '800',
  },
  label: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    fontWeight: '500',
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
});

// ── RideCard ──────────────────────────────────────────────────────────────────
const rc = StyleSheet.create({
  card: {
    backgroundColor: Colors.white ?? '#fff',
    borderRadius: 14,
    padding: 16,
    gap: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ref: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: 0.3,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
  },
  badge_assigned: {
    backgroundColor: '#DBEAFE',
  },
  badge_pending: {
    backgroundColor: '#FEF3C7',
  },
  badge_in_progress: {
    backgroundColor: '#D1FAE5',
  },
  badge_completed: {
    backgroundColor: '#F3F4F6',
  },
  badge_cancelled: {
    backgroundColor: '#FEE2E2',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  infoTexts: {
    flex: 1,
    gap: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoMain: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  infoSub: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 2,
  },
  dateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dateText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border ?? '#F3F4F6',
  },
  price: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  detailBtn: {
    backgroundColor: Colors.bordeaux,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  detailBtnText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
} as any);