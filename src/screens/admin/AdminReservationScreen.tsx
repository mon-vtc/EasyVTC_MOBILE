import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation, RouteProp, NavigationProp } from '@react-navigation/native';
import { Colors, Fonts, Spacing, Radius } from '../../theme/colors';
import { useReservation } from '../../hooks/useReservation';
import { useToast } from '../../hooks/useToast';
import DriverPickerModal from './DriverPickerModal';
import  CancelReservationModal from '../../components/common/CancelReservationModal';
import type { Reservation , AvailableDriverDto} from '../../types/reservations.types';
import { AppIcon } from '../../components/common/AppIcon';

type ScreenRoute = RouteProp<{ AdminReservationDetail: { reservationId: string } }, 'AdminReservationDetail'>;
type ScreenNav = NavigationProp<any>;

type TabKeys = 'details' | 'client' | 'driver' | 'payment';

type StatusConfig = {
  [k in Reservation['status']]: { label: string; color: string; bg: string };
};

const STATUS_MAP: StatusConfig = {
  pending:        { label: 'En attente', color: '#F57F17', bg: '#FFF8E1' },
  assigned:       { label: 'Confirmée',  color: '#2E7D32', bg: '#E8F5E9' },
  driver_arrived: { label: 'Arrivé',     color: '#1976D2', bg: '#E3F2FD' },
  in_progress:    { label: 'En cours',   color: '#2E7D32', bg: '#E8F5E9' },
  completed:      { label: 'Terminée',   color: '#1565C0', bg: '#E3F2FD' },
  cancelled:      { label: 'Annulée',    color: '#757575', bg: '#EEEEEE' },
};

const TABS: { key: TabKeys; label: string }[] = [
  { key: 'details', label: 'Détails' },
  { key: 'client',  label: 'Client' },
  { key: 'driver',  label: 'Chauffeur' },
  { key: 'payment', label: 'Paiement' },
];

/* ── Badge ── */
function Badge({ status }: { status: Reservation['status'] }) {
  const cfg = STATUS_MAP[status];
  return (
    <View style={[S.badge, { backgroundColor: cfg.bg }]}>
      <Text style={[S.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

/* ── DETAILS TAB ── */
function DetailsTab({ reservation }: { reservation: Reservation }) {
  return (
    <>
      <View style={S.card}>
        <View style={[S.card, {flex: 1, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md}]} >
          <Text style={S.itineraryValue}>Véhicule demandé</Text>
          <AppIcon name={reservation.vehicle_type === 'van' ? 'bus-outline' : 'car-outline'} size={20} color={Colors.bordeaux} />
          <Text style={S.itineraryLabel}> {reservation.vehicle_type} </Text>
        </View>
        <View style={S.itineraryRow}>
          <View style={S.track}>
            <View style={[S.dot, { backgroundColor: '#4CAF50' }]} />
            <View style={S.trackLine} />
            <View style={[S.dot, { backgroundColor: Colors.bordeaux }]} />
          </View>
          <View style={S.itineraryAddresses}>
            <View style={S.itineraryBlock}>
              <Text style={S.itineraryLabel}>Départ</Text>
              <Text style={S.itineraryValue}>{reservation.pickup_address}</Text>
              <Text style={S.itineraryDate}>
                {new Date(reservation.scheduled_at).toLocaleString('fr-FR', {
                  day: '2-digit', month: 'long', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
              </Text>
            </View>
            <View style={[S.itineraryBlock, { marginTop: Spacing.md }]}>
              <Text style={S.itineraryLabel}>Arrivée</Text>
              <Text style={S.itineraryValue}>{reservation.dest_address}</Text>
            </View>
          </View>
        </View>
        {reservation.distance_km != null && (
          <View style={S.distanceRow}>
            <Text style={S.distanceLabel}>Distance estimée</Text>
            <Text style={S.distanceValue}>{reservation.distance_km} km</Text>
          </View>
        )}
      </View>

      {reservation.comment ? (
        <View style={[S.card, S.notesCard]}>
          <View style={S.notesHeader}>
            <Ionicons name="information-circle-outline" size={18} color="#F57F17" />
            <Text style={S.notesTitle}>Notes</Text>
          </View>
          <Text style={S.notesText}>{reservation.comment}</Text>
        </View>
      ) : null}

      <View style={S.card}>
        <View style={S.historyHeader}>
          <Ionicons name="time-outline" size={16} color={Colors.textSecondary} />
          <Text style={S.historyTitle}>Historique</Text>
        </View>
        <HistoryItem color="#2196F3" label="Réservation créée" date={reservation.created_at} />
        {['assigned', 'driver_arrived', 'in_progress', 'completed'].includes(reservation.status) && (
          <HistoryItem color="#4CAF50" label="Chauffeur assigné" date={reservation.driver_id ? reservation.updated_at : undefined} />
        )}
        {reservation.status === 'driver_arrived' && (
          <HistoryItem color="#7B1FA2" label="Chauffeur arrivé" date={reservation.driver_arrived_at} />
        )}
        {reservation.status === 'completed' && (
          <HistoryItem color="#9C27B0" label="Course terminée" date={reservation.updated_at} />
        )}
      </View>
    </>
  );
}

function HistoryItem({ color, label, date }: { color: string; label: string; date?: string | null }) {
  return (
    <View style={S.historyItem}>
      <View style={[S.historyDot, { backgroundColor: color }]} />
      <View>
        <Text style={S.historyLabel}>{label}</Text>
        {date ? (
          <Text style={S.historyDate}>
            {new Date(date).toLocaleString('fr-FR', {
              day: '2-digit', month: 'long', year: 'numeric',
              hour: '2-digit', minute: '2-digit',
            })}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

/* ── CLIENT TAB ── */
function ClientTab({ client }: { client: Reservation['client'] }) {
  return (
    <View style={S.card}>
      <View style={S.profileRow}>
        {client?.profile_photo_url ? (
          <Image source={{ uri: client.profile_photo_url }} style={S.avatar} />
        ) : (
          <View style={[S.avatar, S.avatarFallback]}>
            <Ionicons name="person" size={28} color={Colors.textSecondary} />
          </View>
        )}
        <View style={{ flex: 1, marginLeft: Spacing.sm }}>
          <Text style={S.profileName}>{client?.first_name} {client?.last_name}</Text>
          <Text style={[S.profileRole, { color: Colors.bordeaux }]}>Client</Text>
        </View>
      </View>

      <View style={S.contactRow}>
        <View style={S.contactIcon}>
          <Ionicons name="call-outline" size={18} color={Colors.textSecondary} />
        </View>
        <View style={S.contactInfo}>
          <Text style={S.contactLabel}>Téléphone</Text>
          <Text style={S.contactValue}>{client?.phone || 'N/A'}</Text>
        </View>
        <TouchableOpacity
          style={S.contactAction}
          onPress={() => Alert.alert('Appeler', client?.phone || '')}
        >
          <Ionicons name="call" size={18} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {client?.email ? (
        <View style={S.contactRow}>
          <View style={S.contactIcon}>
            <Ionicons name="mail-outline" size={18} color={Colors.textSecondary} />
          </View>
          <View style={S.contactInfo}>
            <Text style={S.contactLabel}>Email</Text>
            <Text style={S.contactValue}>{client.email}</Text>
          </View>
          <TouchableOpacity
            style={S.contactAction}
            onPress={() => Alert.alert('Email', client.email)}
          >
            <Ionicons name="mail" size={18} color={Colors.white} />
          </TouchableOpacity>
        </View>
      ) : null}

      <TouchableOpacity
        style={S.profileBtn}
        onPress={() => Alert.alert('Profil', 'Voir profil client')}
      >
        <Text style={S.profileBtnText}>Voir le profil complet</Text>
      </TouchableOpacity>
    </View>
  );
}

/* ── DRIVER TAB ── */
function DriverTab({
  driver,
  onAssign,
  status,
}: {
  driver: Reservation['driver'] | null;
  onAssign: () => void;
  status: Reservation['status'];
}) {
  if (!driver) {
    return (
      <View style={S.card}>
        <View style={S.noDriverBlock}>
          <View style={S.noDriverIcon}>
            <Ionicons name="person-outline" size={32} color={Colors.textMuted} />
          </View>
          <Text style={S.noDriverTitle}>Aucun chauffeur assigné</Text>
          <Text style={S.noDriverSub}>Cette réservation est en attente d'un chauffeur.</Text>
        </View>
        {status !== 'cancelled' && (
          <TouchableOpacity
            style={[S.primaryBtn, { backgroundColor: Colors.bordeaux }]}
            onPress={onAssign}
          >
            <Ionicons name="person-add-outline" size={18} color={Colors.white} style={{ marginRight: 8 }} />
            <Text style={S.primaryBtnText}>Assigner un chauffeur</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={S.card}>
      <View style={S.profileRow}>
        {driver.user.profile_photo_url ? (
          <Image source={{ uri: driver.user.profile_photo_url }} style={S.avatar} />
        ) : (
          <View style={[S.avatar, S.avatarFallback]}>
            <Ionicons name="person" size={28} color={Colors.textSecondary} />
          </View>
        )}
        <View style={{ flex: 1, marginLeft: Spacing.sm }}>
          <Text style={S.profileName}>{driver.user.first_name} {driver.user.last_name}</Text>
          <View style={S.driverBadgeRow}>
            <Text style={[S.profileRole, { color: Colors.bordeaux }]}>Chauffeur</Text>
            {driver.rating != null && (
              <View style={S.ratingBadge}>
                <Ionicons name="star" size={12} color="#F9A825" />
                <Text style={S.ratingText}>{driver.rating.toFixed(1)}</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <View style={S.contactRow}>
        <View style={S.contactIcon}>
          <Ionicons name="call-outline" size={18} color={Colors.textSecondary} />
        </View>
        <View style={S.contactInfo}>
          <Text style={S.contactLabel}>Téléphone</Text>
          <Text style={S.contactValue}>{driver.user.phone || 'N/A'}</Text>
        </View>
        <TouchableOpacity
          style={S.contactAction}
          onPress={() => Alert.alert('Appeler', driver.user.phone || '')}
        >
          <Ionicons name="call" size={18} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <View style={S.contactRow}>
        <View style={S.contactIcon}>
          <Ionicons name="car-outline" size={18} color={Colors.textSecondary} />
        </View>
        <View style={S.contactInfo}>
          <Text style={S.contactLabel}>Véhicule</Text>
          <Text style={S.contactValue}>
            {[driver.vehicle?.brand, driver.vehicle?.plate_number].filter(Boolean).join(' · ') || 'N/A'}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={S.profileBtn}
        onPress={() => Alert.alert('Profil', 'Voir profil chauffeur')}
      >
        <Text style={S.profileBtnText}>Voir le profil complet</Text>
      </TouchableOpacity>
    </View>
  );
}

/* ── PAYMENT TAB ── */
function PaymentTab({ reservation }: { reservation: Reservation }) {
  const total     = reservation.price_final ?? reservation.price_estimated ?? 0;
  const b         = reservation;
  const isFlatRate = reservation.pricing_type === 'flat_rate';

  return (
    <View style={S.card}>
      <View style={S.paymentHeader}>
        <Ionicons name="receipt-outline" size={18} color={Colors.textSecondary} />
        <Text style={S.paymentTitle}>Détails du paiement</Text>
      </View>

      {isFlatRate ? (
        <View style={S.paymentRow}>
          <Text style={S.paymentLabel}>{b?.price_breakdown.flat_rate_label ?? 'Forfait'}</Text>
          <Text style={S.paymentValue}>{reservation.price_estimated.toFixed(2)} €</Text>
        </View>
      ) : (
        <>
          <View style={S.paymentRow}>
            <Text style={S.paymentLabel}>
              {b?.vehicle_type ? `Prise en charge (${b.vehicle_type})` : 'Prise en charge'}
            </Text>
            <Text style={S.paymentValue}>
              {(b?.price_breakdown.vehicle_base_price ?? b?.price_breakdown.vehicle_base_price ?? 0).toFixed(2)} €
            </Text>
          </View>
          {b?.price_breakdown.km_cost != null && (
            <View style={S.paymentRow}>
              <Text style={S.paymentLabel}>
                Distance{reservation.distance_km != null ? ` (${reservation.distance_km} km)` : ''}
              </Text>
              <Text style={S.paymentValue}>{b.price_breakdown.km_cost.toFixed(2)} €</Text>
            </View>
          )}
          {b?.price_breakdown.min_cost != null && (
            <View style={S.paymentRow}>
              <Text style={S.paymentLabel}>
                Durée{reservation.duration_min != null ? ` (${reservation.duration_min} min)` : ''}
              </Text>
              <Text style={S.paymentValue}>{b.price_breakdown.min_cost.toFixed(2)} €</Text>
            </View>
          )}
          {b?.price_breakdown.minimum_applied && (
            <View style={S.paymentRow}>
              <Text style={[S.paymentLabel, { fontStyle: 'italic', color: Colors.textMuted ?? Colors.textSecondary }]}>
                Minimum tarifaire appliqué
              </Text>
            </View>
          )}
        </>
      )}

      {reservation.price_adjusted != null && (
        <View style={S.paymentRow}>
          <Text style={S.paymentLabel}>Ajustement</Text>
          <Text style={S.paymentValue}>{reservation.price_adjusted.toFixed(2)} €</Text>
        </View>
      )}

      <View style={S.paymentDivider} />

      <View style={S.paymentTotalRow}>
        <Text style={S.paymentTotalLabel}>Total</Text>
        <Text style={S.paymentTotalValue}>{total.toFixed(2)} €</Text>
      </View>
    </View>
  );
}

/* ══════════════════════════════════════
   MAIN SCREEN
══════════════════════════════════════ */
export default function AdminReservationScreen() {
  const route      = useRoute<ScreenRoute>();
  const navigation = useNavigation<ScreenNav>();
  const { reservations, selected, fetchById, assign, isLoading, cancel } = useReservation();
  const { showToast } = useToast();

  const [selectedTab, setSelectedTab]     = useState<TabKeys>('details');
  const [pickerVisible, setPickerVisible] = useState(false);
  const [cancelVisible, setCancelVisible] = useState(false);


  const reservationId = route.params?.reservationId;

  const reservation = useMemo(() => {
    if (!reservationId) return null;
    if (selected?.id === reservationId) return selected;
    return reservations.find(r => r.id === reservationId) || null;
  }, [reservations, selected, reservationId]);

  useEffect(() => {
    if (reservationId && !reservation) {
      fetchById(reservationId).catch(err => console.warn('Unable to load reservation', err));
    }
  }, [reservationId, reservation, fetchById]);

  /* ── Assignation via DriverPickerModal ── */
  const handleAssignConfirm = async (driver: AvailableDriverDto) => {
    if (!reservation) return;
    try {
      await assign(reservation.id, driver.id);
      setPickerVisible(false);
      showToast({ type: 'success', title: 'Succès', message: `${driver.user.first_name} ${driver.user.last_name} assigné avec succès.` });
      fetchById(reservation.id).catch(console.warn);
    } catch (err: any) {
      showToast({ type: 'error', title: 'Erreur', message: err?.message || "Erreur lors de l'assignation." });
      throw err; // laisse le modal ouvert
    }
  };

  /* ── Actions bas d'écran ── */
  const canCancel = reservation && ['pending', 'assigned'].includes(reservation.status);

  const primaryAction = useMemo(() => {
    if (!reservation) return null;
    switch (reservation.status) {
      case 'pending':
        return { label: 'Assigner un chauffeur', cb: () => setPickerVisible(true) };
      // case 'assigned':
      //   return { label: 'Modifier réservation', cb: () => Alert.alert('Action', 'Modifier') };
      case 'cancelled':
        return null; // Pas d'action principale si annulé
      case 'completed':
        return { label: 'Voir facture', cb: () => showToast({ title: 'Action', message: 'Voir Facture' }) };
      default:
        return null;
    }
  }, [reservation]);

  const reservationRef = reservation
    ? `BC-${reservation.id.split('-').pop()?.toUpperCase()}`
    : undefined;

  /* ── Error / loading ── */
  if (!reservationId) {
    return (
      <View style={S.centered}>
        <Text style={S.errorText}>ID de réservation manquant</Text>
        <TouchableOpacity style={S.retryBtn} onPress={() => navigation.goBack()}>
          <Text style={S.retryText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isLoading && !reservation) {
    return (
      <View style={S.centered}>
        <ActivityIndicator size="large" color={Colors.bordeaux} />
        <Text style={S.loadingText}>Chargement...</Text>
      </View>
    );
  }

  if (!reservation) {
    return (
      <View style={S.centered}>
        <Text style={S.emptyText}>Aucune réservation trouvée</Text>
        <TouchableOpacity style={S.retryBtn} onPress={() => navigation.goBack()}>
          <Text style={S.retryText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const hasBottomActions = primaryAction || canCancel;

  const TabContent = () => {
    switch (selectedTab) {
      case 'client':  return <ClientTab client={reservation.client} />;
      case 'driver':  return (
        <DriverTab
          driver={reservation.driver || null}
          onAssign={() => setPickerVisible(true)}
          status={reservation.status}
        />
      );
      case 'payment': return <PaymentTab reservation={reservation} />;
      default:        return <DetailsTab reservation={reservation} />;
    }
  };

  return (
    <View style={S.screen}>
      {/* ── HEADER ── */}
      <View style={S.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={S.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.bordeaux} />
        </TouchableOpacity>
        <View style={S.headerTextContainer}>
          <Text style={S.title}>Réservation n° {reservation.id.slice(-8).toUpperCase()}</Text>
          <Text style={S.subtitle}>
            {new Date(reservation.created_at || new Date()).toLocaleDateString('fr-FR', {
              day: '2-digit', month: 'long', year: 'numeric',
            } as any)}
          </Text>
        </View>
        <Badge status={reservation.status} />
      </View>

      {/* ── TABS ── */}
      <View style={S.tabs}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[S.tabBtn, selectedTab === tab.key && S.tabActive]}
            onPress={() => setSelectedTab(tab.key)}
          >
            <Text style={[S.tabText, selectedTab === tab.key && S.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── CONTENT ── */}
      <ScrollView
        style={S.content}
        contentContainerStyle={{ paddingBottom: hasBottomActions ? 140 : 24 }}
        showsVerticalScrollIndicator={false}
      >
        <TabContent />
      </ScrollView>

      {/* ── BOTTOM ACTIONS ── */}
      {hasBottomActions && (
        <View style={S.bottomActions}>
          {primaryAction && (
            <TouchableOpacity
              style={[S.primaryBtn, { backgroundColor: Colors.bordeaux, marginBottom: Spacing.sm }]}
              onPress={primaryAction.cb}
            >
              <Text style={S.primaryBtnText}>{primaryAction.label}</Text>
            </TouchableOpacity>
          )}
          {canCancel && (
            <TouchableOpacity
              style={S.cancelBtn}
              onPress={() => setCancelVisible(true)} >
              <Text style={S.cancelBtnText}>Annuler la réservation</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* ── DRIVER PICKER MODAL ── */}
      <DriverPickerModal
        visible={pickerVisible}
        reservationRef={reservationRef}
        vehicleType={reservation?.vehicle_type}
        onConfirm={handleAssignConfirm}
        onClose={() => setPickerVisible(false)}
      />

       {/* ── CANCEL MODAL ── */}
      <CancelReservationModal
        visible={cancelVisible}
        reservationRef={reservationRef}
        onConfirm={async (reason) => {
          if (!reservation) return;
          await cancel(reservation.id, reason);
          setCancelVisible(false);
          showToast({ type: 'success', title: 'Réservation annulée', message: 'La réservation a été annulée avec succès.' });
          navigation.goBack();
        }}
        onClose={() => setCancelVisible(false)}
      />
    </View>
  );
}

/* ══════════════════════════════════════
   STYLES
══════════════════════════════════════ */
const S = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  header: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    backgroundColor:   Colors.bordeaux,
    paddingTop:        Platform.OS === 'ios' ? 56 : Spacing.xl + 8,
    paddingBottom:     Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.white,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  headerTextContainer: { flex: 1, marginLeft: Spacing.sm },
  title: { color: Colors.white, fontSize: Fonts.size.lg, fontWeight: '800' },
  subtitle: { color: 'rgba(255,255,255,0.75)', fontSize: Fonts.size.xs, marginTop: 2 },

  badge: { borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 4 },
  badgeText: { fontSize: Fonts.size.xs, fontWeight: '700' },

  tabs: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.md,
    borderRadius: Radius.md,
    overflow: 'hidden',
    marginVertical: Spacing.sm,
  },
  tabBtn: { flex: 1, paddingVertical: 11, alignItems: 'center', justifyContent: 'center' },
  tabActive: { backgroundColor: Colors.bordeaux },
  tabText: { color: Colors.textSecondary, fontSize: Fonts.size.sm, fontWeight: '600' },
  tabTextActive: { color: Colors.white },

  content: { flex: 1, paddingHorizontal: Spacing.md },

  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginVertical: Spacing.xs,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },

  itineraryRow: { flexDirection: 'row' },
  track: { alignItems: 'center', marginRight: Spacing.sm, paddingTop: 2 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  trackLine: { width: 2, flex: 1, backgroundColor: Colors.border, marginVertical: 4, minHeight: 40 },
  itineraryAddresses: { flex: 1 },
  itineraryBlock: {},
  itineraryLabel: { fontSize: Fonts.size.xs, color: Colors.textSecondary, marginBottom: 2 },
  itineraryValue: { fontSize: Fonts.size.md, fontWeight: '700', color: Colors.textPrimary },
  itineraryDate: { fontSize: Fonts.size.xs, color: Colors.textSecondary, marginTop: 2 },
  distanceRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginTop: Spacing.md, paddingTop: Spacing.sm,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  distanceLabel: { fontSize: Fonts.size.sm, color: Colors.textSecondary },
  distanceValue: { fontSize: Fonts.size.sm, fontWeight: '700', color: Colors.textPrimary },

  notesCard: { backgroundColor: '#FFFDE7', borderLeftWidth: 3, borderLeftColor: '#F57F17' },
  notesHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.xs, gap: 6 },
  notesTitle: { fontSize: Fonts.size.sm, fontWeight: '700', color: '#F57F17' },
  notesText: { fontSize: Fonts.size.sm, color: Colors.textPrimary, lineHeight: 20 },

  historyHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.sm },
  historyTitle: { fontSize: Fonts.size.sm, fontWeight: '700', color: Colors.textSecondary },
  historyItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: Spacing.sm },
  historyDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  historyLabel: { fontSize: Fonts.size.sm, fontWeight: '600', color: Colors.textPrimary },
  historyDate: { fontSize: Fonts.size.xs, color: Colors.textSecondary, marginTop: 2 },

  noDriverBlock: { alignItems: 'center', paddingVertical: Spacing.lg, gap: Spacing.sm },
  noDriverIcon: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xs,
  },
  noDriverTitle: { fontSize: Fonts.size.md, fontWeight: '700', color: Colors.textPrimary },
  noDriverSub: { fontSize: Fonts.size.sm, color: Colors.textSecondary, textAlign: 'center' },

  profileRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  avatar: { width: 64, height: 64, borderRadius: 32 },
  avatarFallback: { backgroundColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  profileName: { fontSize: Fonts.size.md, fontWeight: '700', color: Colors.textPrimary },
  profileRole: { fontSize: Fonts.size.sm, fontWeight: '600', marginTop: 2 },
  driverBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  ratingBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#FFF8E1', borderRadius: Radius.full,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  ratingText: { fontSize: Fonts.size.xs, fontWeight: '700', color: '#F9A825' },

  contactRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm, gap: Spacing.sm },
  contactIcon: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center',
  },
  contactInfo: { flex: 1 },
  contactLabel: { fontSize: Fonts.size.xs, color: Colors.textSecondary },
  contactValue: { fontSize: Fonts.size.sm, fontWeight: '600', color: Colors.textPrimary },
  contactAction: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.bordeaux, alignItems: 'center', justifyContent: 'center',
  },

  profileBtn: {
    marginTop: Spacing.sm, backgroundColor: Colors.textPrimary,
    borderRadius: Radius.md, paddingVertical: Spacing.sm + 2, alignItems: 'center',
  },
  profileBtnText: { color: Colors.white, fontWeight: '700', fontSize: Fonts.size.sm },

  paymentHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.md },
  paymentTitle: { fontSize: Fonts.size.sm, fontWeight: '700', color: Colors.textSecondary },
  paymentRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  paymentLabel: { fontSize: Fonts.size.sm, color: Colors.textSecondary },
  paymentValue: { fontSize: Fonts.size.sm, fontWeight: '600', color: Colors.textPrimary },
  paymentDivider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.sm },
  paymentTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  paymentTotalLabel: { fontSize: Fonts.size.md, fontWeight: '700', color: Colors.textPrimary },
  paymentTotalValue: { fontSize: 22, fontWeight: '900', color: Colors.bordeaux },

  bottomActions: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    padding: Spacing.md,
    paddingBottom: Platform.OS === 'ios' ? 32 : Spacing.md,
    backgroundColor: Colors.background,
    borderTopColor: Colors.border, borderTopWidth: 1,
  },
  primaryBtn: {
    width: '100%', borderRadius: Radius.md, paddingVertical: Spacing.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
  },
  primaryBtnText: { color: Colors.white, fontWeight: '800', fontSize: Fonts.size.md },
  cancelBtn: {
    width: '100%', borderRadius: Radius.md, paddingVertical: Spacing.md,
    alignItems: 'center', backgroundColor: '#D32F2F',
  },
  cancelBtnText: { color: Colors.white, fontWeight: '700', fontSize: Fonts.size.md },

  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.md },
  emptyText: { color: Colors.textMuted, fontStyle: 'italic', textAlign: 'center' },
  errorText: { color: '#D32F2F', fontWeight: '700' },
  retryBtn: {
    marginTop: Spacing.sm, backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: Radius.md,
  },
  retryText: { color: Colors.bordeaux, fontWeight: '700' },
  loadingText: { marginTop: Spacing.sm, color: Colors.textSecondary, fontSize: Fonts.size.sm },
});