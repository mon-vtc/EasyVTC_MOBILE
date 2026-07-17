// ══════════════════════════════════════════════════════════════════════════════
// SCREEN — ReservationDetailsScreen
// Sprint 3 — EasyVTC
// Affiché après submitBooking() réussi.
// Reçoit { reservationId } en route params, charge la réservation depuis
// le store (déjà insérée par submitBooking) ou via fetchById en fallback.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useRef, useCallback, useState } from 'react';
import {
  View, Text, Image, ScrollView, TouchableOpacity,
  StyleSheet, Animated, Platform, Easing, ActivityIndicator, Linking
} from 'react-native';
import {
  useNavigation, useRoute,
  type RouteProp, type NavigationProp,
} from '@react-navigation/native';
import { useSafeAreaInsets }   from 'react-native-safe-area-context';
import { AppIcon }             from '../../components/common/AppIcon';
import { Colors, Fonts } from '../../theme/colors';
import { useReservationStore } from '../../store/reservation.store';
import { useReservation }      from '../../hooks/useReservation';
import { useAuthStore }        from '../../store/auth.store';
import { useRatingsStore }     from '../../store/ratings.store';
import { invoicesApi }         from '../../services/api/invoices.api';
import type { SubmitRatingDto } from '../../types/ratings.types';
import type { ClientStackParamList } from '../../types/auth.types';
import { Logo }                      from '../../constants/logo';
import CancelReservationModal from '../../components/common/CancelReservationModal';
import RatingModal            from '../../components/common/RatingModal';
import { useToast }           from '../../hooks/useToast';
import { useAlert } from '../../hooks/useAlert';

// ── Types navigation typés ──────────────────────────────────────────────────
type ConfirmationNav   = NavigationProp<ClientStackParamList, 'ReservationDetails'>;
type ConfirmationRoute = RouteProp<ClientStackParamList, 'ReservationDetails'>;

// ── Helpers ─────────────────────────────────────────────────────────────────
function formatPrice(price: number | null | undefined): string {
  if (price == null) return '—';
  return `${price} €`;
}
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}
function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}
function getVehicleLabel(type: string | null | undefined): string {
  const labels: Record<string, string> = { standard: 'Berline Standard', berline: 'Berline', van: 'Van / Minibus' };
  return labels[type ?? ''] ?? type ?? '—';
}
function getStatusLabel(status: string | undefined): string {
  const labels: Record<string, string> = {
    pending: 'En attente',
    assigned: 'Attribuée',
    driver_arrived: 'Chauffeur arrivé',
    in_progress: 'En cours',
    completed: 'Terminée',
    cancelled: 'Annulée',
  };
  return labels[status ?? ''] ?? '—';
}
function getStatusColor(status: string | undefined): string {
  const colors: Record<string, string> = {
    pending: '#F59E0B',
    assigned: '#3B82F6',
    driver_arrived: '#8B5CF6',
    in_progress: '#10B981',
    completed: '#6B7280',
    cancelled: '#EF4444',
  };
  return colors[status ?? ''] ?? '#9CA3AF';
}


// ══════════════════════════════════════════════════════════════════════════════
// ÉCRAN PRINCIPAL
// ═══════════════════════════════s═══════════════════════════════════════════════
export default function ReservationDetailsScreen() {
  const nav   = useNavigation<ConfirmationNav>();
  const route = useRoute<ConfirmationRoute>();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const { showAlert } = useAlert();

  const reservationId = route.params?.reservationId;

  if (!reservationId) {
    return <View style={styles.root}><Text style={styles.subtitle}>ID de réservation manquant.</Text></View>;
  }

  const accessToken  = useAuthStore(s => s.accessToken);
  // ✅ Lire depuis `selected` que fetchById renseigne
  
  const { fetchById, selected, reservations, cancel } = useReservation();

  const reservation =
    selected?.id === reservationId          // vient de fetchById
      ? selected
      : reservations.find(r => r.id === reservationId) // vient de fetchMine
      ?? null;


  const status = reservation?.status as string | undefined;
  const ref = reservation?.id.split('-').pop()?.toUpperCase() ?? reservation?.id;

  // ── États et logiques contextuelles ───────────────────────────────────────
  const isCancellable = ['pending', 'assigned', 'driver_arrived'].includes(status ?? '');
  const isCompleted = status === 'completed';
  const isActive = ['assigned', 'driver_arrived', 'in_progress'].includes(status ?? '');

  // ── États du modal d'annulation ────────────────────────────────────────────
  const [cancelModalVisible, setCancelModalVisible] = useState(false);

  // ── États du modal de notation ─────────────────────────────────────────────

  const alreadyRated = reservation?.driver?.rating != null;
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const isSubmitting  = useRatingsStore(s => s.isSubmitting);
  const submitRating  = useRatingsStore(s => s.submitRating);

  // Toujours récupérer les données fraîches (driver.rating = note de cette course, ou null si non évalué).
  // Sans ce fetch, `selected` pourrait contenir des données périmées depuis un précédent fetchById.
  useEffect(() => {
    if (accessToken) fetchById(reservationId);
  }, [reservationId, accessToken, fetchById]);

  // ── Handlers d'actions ──────────────────────────────────────────────────────
  const handleCall = useCallback(() => {
    if (reservation?.driver?.user?.phone) {
      // showToast({
      //   title: 'Appel',
      //   message: `Appel au chauffeur: ${reservation.driver.user.phone}`,
      //   type: 'info',
      // });
      // Débloquer ce code en production :
      Linking.openURL(`tel:${reservation.driver.user.phone}`).catch(() => {
        showToast({type:'error', title: 'Erreur', message: 'Impossible d\'appeler ce numéro'});
      });
    } else {
      showToast({ title: 'Non disponible', message: 'Le numéro du chauffeur n\'est pas disponible', type: 'warning' });
    }
  }, [reservation?.driver?.user?.phone, showToast]);

  const handleMessage = useCallback(() => {
    if (reservation?.driver_id) {
      (nav as any).navigate('ChatScreen', { reservationId: reservation.id });
    }
  }, [reservation?.driver_id, nav]);

  const handleViewInvoice = useCallback(async () => {
    if (!reservation?.id || !accessToken) return;
    try {
      const res = await invoicesApi.fetchByReservationId(accessToken, reservation.id);
      if (res.ok && res.data) {
        nav.navigate('InvoiceDetails', { invoiceId: res.data.id });
      } else { showToast({ type: 'warning', title: 'Facture indisponible', message: res.message ?? 'La facture n\'est pas encore disponible pour cette course.' }); }
    } catch {
      showToast({ title: 'Erreur', message: 'Impossible de récupérer la facture. Veuillez réessayer.', type: 'error' });
    }
  }, [reservation?.id, accessToken, nav, showToast]);

  const handleEvaluate = useCallback(() => {
    if (alreadyRated) {
      showToast({ title: 'Déjà évalué', message: 'Vous avez déjà soumis une évaluation pour cette course.', type: 'info' });
      return;
    }
    setRatingModalVisible(true);
  }, [alreadyRated, showToast]);

  const handleRatingSubmit = useCallback(async (dto: SubmitRatingDto) => {
    if (!accessToken || !reservation?.id) return;
    try {
      await submitRating(accessToken, reservation.id, dto);
      setRatingModalVisible(false);
      showToast({ title: 'Merci !', message: `Votre note de ${dto.note}/5 a bien été enregistrée.`, type: 'success' });
      fetchById(reservationId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la soumission';
      setRatingModalVisible(false);
      showToast({ title: 'Erreur', message: msg, type: 'error' });
    }
  }, [accessToken, reservation?.id, submitRating, showToast, fetchById, reservationId]);

  const handleCancel = useCallback(() => {
    setCancelModalVisible(true);
  }, []);

  const handleCancelConfirm = async (reason: string) => {
    try {
      if (reservation?.id) {
        // Faire l'appel API pour annuler
        await cancel(reservation.id, reason); // Cet appel est maintenant correct
        setCancelModalVisible(false);
        showToast({ title: 'Succès', message: 'La réservation a été annulée', type: 'success' });
        // Retourner à l'écran précédent
        nav.goBack();
      }
    } catch (error: any) {
      showToast({ title: 'Erreur', message: error?.message ?? 'Impossible d\'annuler la réservation', type: 'error' });
    }
  };

  // ── Animations page ────────────────────────────────────────────────────────
  const headerAnim = useRef(new Animated.Value(0)).current;
  const cardAnim   = useRef(new Animated.Value(0)).current;
  const priceAnim  = useRef(new Animated.Value(0)).current;
  const ctaAnim    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(150, [
      Animated.timing(headerAnim, { toValue: 1, duration: 500, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(cardAnim,   { toValue: 1, duration: 450, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(priceAnim,  { toValue: 1, duration: 400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(ctaAnim,    { toValue: 1, duration: 400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();
  }, []);

  const slideUp = (anim: Animated.Value, offset = 20) => ({
    opacity:   anim,
    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [offset, 0] }) }],
  });

  const r = reservation;

  return (
    <View style={styles.root}>
      {/* Fond bordeaux arrondi en haut */}
      <View style={styles.bgAccent} />

      {/* Bouton Retour */}
      <TouchableOpacity style={styles.backBtn} onPress={() => nav.goBack()} activeOpacity={0.8}>
        <AppIcon name="arrow-back" size={24} color={Colors.white} />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: styles.scroll.paddingBottom + insets.bottom }]} showsVerticalScrollIndicator={false} bounces={false}>

        {/* ── Header ── */}
        <Animated.View style={[styles.header, slideUp(headerAnim, 30)]}>
          <Image source={Logo.LogoEasyVTC} style={{ width: 64, height: 64, marginBottom: 12 }} resizeMode="contain" />
          <Text style={styles.title}>Détail de la réservation</Text>
          <Text style={styles.subtitle}>Votre demande est en cours de{'\n'}validation par notre équipe</Text>
        </Animated.View>

        {/* ── Badge N° réservation ── */}
        {r?.id && (
          <Animated.View style={[styles.refBadge, slideUp(headerAnim)]}>
            <Text style={styles.refLabel}>N° de réservation</Text>
            <Text style={styles.refValue} numberOfLines={1} ellipsizeMode="middle">RES-{ref}</Text>
          </Animated.View>
        )}

        {/* ── Statut + Carte trajet ── */}
        <Animated.View style={[styles.card, slideUp(cardAnim)]}>
          {/* Statut */}
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>{'Statut' + '  '}</Text>
            <View style={styles.statusBadge}>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor(r?.status) }]} />
              <Text style={styles.statusText}>{getStatusLabel(r?.status)}</Text>
            </View>
          </View>

          {/* Date et heure */}
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <AppIcon name="calendar-outline" size={16} color={BORDEAUX} />
            </View>
            <View style={styles.infoTexts}>
              <Text style={styles.infoLabel}>{'Date et heure' + '  '}</Text>
              <Text style={styles.infoValue}>
                {r?.scheduled_at ? formatDate(r.scheduled_at) : '—'}
                {r?.scheduled_at && <Text style={styles.infoTime}> à {formatTime(r.scheduled_at)}</Text>}
              </Text>
            </View>
          </View>

          {/* Route */}
          <View style={styles.routeBlock}>
            <View style={styles.routeRow}>
              <View style={[styles.routeDot, { backgroundColor: '#10B981' }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.routeTag}>{'Partir' + '  '}</Text>
                <Text style={styles.routeAddr}>{r?.pickup_address ?? '—'}</Text>
              </View>
            </View>
            <View style={styles.routeLine} />
            <View style={styles.routeRow}>
              <View style={[styles.routeDot, { backgroundColor: BORDEAUX }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.routeTag}>{'Destination' + '  '}</Text>
                <Text style={styles.routeAddr}>{r?.dest_address ?? '—'}</Text>
              </View>
            </View>
          </View>

          {/* Stats: distance, durée, passagers */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <View style={styles.statIcon}>
                <AppIcon name="map-outline" size={15} color={BORDEAUX} />
              </View>
              <Text style={styles.statLabel}>{'Distance' + '  '}</Text>
              <Text style={styles.statValue}>{r?.distance_km ? `${r.distance_km} km` : '—'}</Text>
            </View>
            <View style={styles.statItem}>
              <View style={styles.statIcon}>
                <AppIcon name="time-outline" size={15} color={BORDEAUX} />
              </View>
              <Text style={styles.statLabel}>{'Durée' + '  '}</Text>
              <Text style={styles.statValue}>{r?.duration_min ? `${r.duration_min} min` : '—'}</Text>
            </View>
            <View style={styles.statItem}>
              <View style={styles.statIcon}>
                <AppIcon name="person-outline" size={15} color={BORDEAUX} />
              </View>
              <Text style={styles.statLabel}>{'Passagers' + '  '}</Text>
              <Text style={styles.statValue}>{r?.nb_passengers ?? '—'}</Text>
            </View>
          </View>
        </Animated.View>

        {/* ── Chauffeur ── */}
        {r?.driver && (
          <Animated.View style={[styles.card, slideUp(cardAnim, 12)]}>
            <Text style={styles.cardTitle}>Votre chauffeur</Text>
            <View style={styles.driverRow}>
              <View style={[styles.driverAvatar, { backgroundColor: BORDEAUX }]}>
                {r.driver.user?.profile_photo_url ? (
                  <Image source={{ uri: r.driver.user.profile_photo_url }} style={styles.driverAvatarImage} />
                ) : (
                  <Text style={styles.driverAvatarText}>
                    {r.driver.user?.first_name?.[0]}{r.driver.user?.last_name?.[0]}
                  </Text>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.driverName}>{r.driver.user?.first_name} {r.driver.user?.last_name}</Text>
                {r.driver.average_rating != null && (
                  <View style={styles.driverRating}>
                    <Text style={styles.star}>★</Text>
                    <Text style={styles.ratingVal}>{r.driver.average_rating.toFixed(1)}</Text>
                    <Text style={styles.ratingCount}>({r.driver.ratings_count} avis)</Text>
                  </View>
                )}
              </View>
            </View>
            <View style={styles.driverActions}>
              {isActive && (
                <>
                  <TouchableOpacity style={styles.btnCall} activeOpacity={0.75} onPress={handleCall}>
                    <AppIcon name="call-outline" size={14} color={WHITE} />
                    <Text style={styles.btnCallText}>Appeler</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.btnMsg} activeOpacity={0.75} onPress={handleMessage}>
                    <AppIcon name="chatbubble-outline" size={14} color={BORDEAUX} />
                    <Text style={styles.btnMsgText}>Message</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </Animated.View>
        )}

        {/* ── Véhicule ── */}
        {r?.driver && (
          <Animated.View style={[styles.card, slideUp(cardAnim, 8)]}>
            <Text style={styles.cardTitle}>Véhicule</Text>
            <View style={styles.vehicleImageContainer}>
              {r?.driver?.vehicle?.photo_url ? (
                <Image source={{ uri: r.driver.vehicle.photo_url }} style={styles.vehicleImage} />
              ) : (
                <View style={styles.vehicleImage}>
                  <AppIcon name="car-outline" size={32} color={BORDEAUX} />
                </View>
              )}
            </View>
            <View style={styles.vehicleRow}>
              <Text style={styles.vehicleKey}>Type</Text>
              <Text style={styles.vehicleVal}>{getVehicleLabel(r?.driver?.vehicle_type)}</Text>
            </View>
            <View style={styles.vehicleRow}>
              <Text style={styles.vehicleKey}>Modèle</Text>
              <Text style={styles.vehicleVal}>{r?.driver?.vehicle?.model}</Text>
            </View>
            <View style={styles.vehicleRow}>
              <Text style={styles.vehicleKey}>Couleur</Text>
              <Text style={styles.vehicleVal}>{r?.driver?.vehicle?.color}</Text>
            </View>
            <View style={styles.vehicleRow}>
              <Text style={styles.vehicleKey}>Immatriculation</Text>
              <Text style={styles.vehicleVal}>{r?.driver?.vehicle?.plate_number}</Text>
            </View>
          </Animated.View>
        )}

        {/* ── Prix estimé/final ── */}
        <Animated.View style={[styles.priceCard, slideUp(priceAnim)]}>
          <View>
            <Text style={styles.priceLabel}>Total</Text>
            {r?.price_breakdown?.is_airport && (r?.price_breakdown?.airport_supplement_amount ?? 0) > 0 && (
              <Text style={styles.priceNote}>
                {`Inclut le supplément aéroport (+${r!.price_breakdown!.airport_supplement_amount!.toFixed(2)} €)` + '  '}
              </Text>
            )}
            {r?.price_breakdown?.is_night && (r?.price_breakdown?.night_supplement_amount ?? 0) > 0 && (
              <Text style={styles.priceNote}>
                {`Inclut le supplément nocturne (+${r!.price_breakdown!.night_supplement_amount!.toFixed(2)} €)` + '  '}
              </Text>
            )}
          </View>
          <Text style={styles.priceValue}>{formatPrice(r?.price_final ?? r?.price_estimated)}</Text>
        </Animated.View>

        {/* ── CTAs — Actions contextuelles ── */}
        <Animated.View style={[styles.ctas, slideUp(ctaAnim)]}>
          {/* Réservations complétées */}
          {isCompleted && (
  <>
    {/* ✅ Bouton OU étoiles selon rating */}
    {!alreadyRated ? (
      <TouchableOpacity
        style={styles.btnPrimary}
        activeOpacity={0.85}
        onPress={handleEvaluate}
      >
        <AppIcon name="star-outline" size={18} color={WHITE} />
        <Text style={styles.btnPrimaryText}>Évaluer le chauffeur</Text>
      </TouchableOpacity>
    ) : (
      <View style={styles.ratingDisplay}>
        <Text style={styles.ratingDisplayLabel}>Votre évaluation</Text>
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map(star => (
            <AppIcon
              key={star}
              name="star"
              size={24}
              color={star <= (r?.driver?.rating ?? 0) ? '#F59E0B' : '#D1D5DB'}
            />
          ))}
        </View>
      </View>
    )}

    <TouchableOpacity
      style={styles.btnSecondary}
      activeOpacity={0.85}
      onPress={handleViewInvoice}
    >
      <AppIcon name="document-text-outline" size={18} color={BORDEAUX} />
      <Text style={styles.btnSecondaryText}>Voir la facture</Text>
    </TouchableOpacity>
  </>
)}

          {/* Réservations annulables */}
          {isCancellable && (
            <TouchableOpacity
              style={styles.btnDanger}
              activeOpacity={0.85}
              onPress={handleCancel}
            >
              <AppIcon name="close-circle-outline" size={18} color="#C0392B" />
              <Text style={styles.btnDangerText}>Annuler la réservation</Text>
            </TouchableOpacity>
          )}

          {/* Réservations en cours (non annulables) */}
          {!isCancellable && !isCompleted && (
            <TouchableOpacity
              style={styles.btnSecondary}
              activeOpacity={0.85}
              onPress={handleViewInvoice}
            >
              <AppIcon name="document-text-outline" size={18} color={BORDEAUX} />
              <Text style={styles.btnSecondaryText}>Voir la facture</Text>
            </TouchableOpacity>
          )}
        </Animated.View>

      </ScrollView>

      {/* Modal d'annulation */}
      <CancelReservationModal
        visible={cancelModalVisible}
        reservationRef={`RES-${ref}`}
        onConfirm={handleCancelConfirm}
        onClose={() => setCancelModalVisible(false)}
      />

      {/* Modal de notation */}
      <RatingModal
        visible={ratingModalVisible}
        driverName={
          r?.driver?.user
            ? `${r.driver.user.first_name} ${r.driver.user.last_name}`
            : undefined
        }
        isSubmitting={isSubmitting}
        onConfirm={handleRatingSubmit}
        onClose={() => setRatingModalVisible(false)}
      />
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// STYLES
// ══════════════════════════════════════════════════════════════════════════════
const BORDEAUX = Colors.bordeaux      ?? '#7B1F2E';
const WHITE    = Colors.white         ?? '#FFFFFF';
const BG       = Colors.background    ?? '#F7F5F3';
const TEXT_P   = Colors.textPrimary   ?? '#1A1A1A';
const TEXT_S   = Colors.textSecondary ?? '#6B7280';
const BORDER   = Colors.border        ?? '#E5E7EB';

const styles = StyleSheet.create({
  root:     { flex: 1, backgroundColor: BG },
  bgAccent: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 300,
    backgroundColor: BORDEAUX,
    borderBottomLeftRadius: 48, borderBottomRightRadius: 48,
  },
  scroll: { paddingTop: Platform.OS === 'ios' ? 60 : 44, paddingBottom: 48, paddingHorizontal: 20 },
  backBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 58 : 42,
    left: 16,
    zIndex: 10,
    padding: 10,
  },
  ratingDisplay: {
  alignItems: 'center',
  paddingVertical: 12,
  gap: 8,
},
ratingDisplayLabel: {
  fontSize: 13,
  color: TEXT_S,
  fontFamily: Fonts.medium, fontWeight: '500',
},
starsRow: {
  flexDirection: 'row',
  gap: 6,
},

  header:   { alignItems: 'center', marginBottom: 20 },
  title:    { fontSize: 26, fontFamily: Fonts.bold, fontWeight: '800', color: WHITE, marginTop: 20, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.75)', marginTop: 8, textAlign: 'center', lineHeight: 20 },

  refBadge: {
    flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 10,
    paddingHorizontal: 16, paddingVertical: 10, marginBottom: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },
  refLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontFamily: Fonts.medium, fontWeight: '500' },
  refValue: { flexShrink: 1, fontSize: 14, color: WHITE, fontFamily: Fonts.bold, fontWeight: '700', letterSpacing: 0.5, textAlign: 'right' },

  card: {
    backgroundColor: WHITE, borderRadius: 18, padding: 20, marginBottom: 12,
    shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 3,
  },
  cardTitle:  { fontSize: 15, fontFamily: Fonts.bold, fontWeight: '700', color: TEXT_P, marginBottom: 16 },

  // Status row
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  statusLabel: { fontSize: 13, color: TEXT_S, fontFamily: Fonts.semibold, fontWeight: '600' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#F3F4F6' },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 13, fontFamily: Fonts.semibold, fontWeight: '600', color: TEXT_P },

  // Info row (date/time)
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 16 },
  infoIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#FDF4F4', alignItems: 'center', justifyContent: 'center' },
  infoTexts: { flex: 1 },
  infoLabel: { fontSize: 11, color: TEXT_S, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 3 },
  infoValue: { fontSize: 14, fontFamily: Fonts.semibold, fontWeight: '600', color: TEXT_P },
  infoTime: { fontSize: 13, color: TEXT_S, fontFamily: Fonts.regular, fontWeight: '400' },

  // Route
  routeBlock: { gap: 0, marginBottom: 16 },
  routeRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  routeDot:   { width: 10, height: 10, borderRadius: 5, marginTop: 5 },
  routeLine:  { width: 1, height: 14, backgroundColor: BORDER, marginLeft: 4, marginVertical: 3 },
  routeTag:   { fontSize: 10, color: TEXT_S, textTransform: 'uppercase', letterSpacing: 0.5 },
  routeAddr:  { fontSize: 14, fontFamily: Fonts.medium, fontWeight: '500', color: TEXT_P, marginTop: 2, lineHeight: 20 },

  // Stats row (distance, duration, passengers)
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: 12, backgroundColor: '#F9FAFB', borderRadius: 10 },
  statIcon: { marginBottom: 6 },
  statLabel: { fontSize: 11, color: TEXT_S, fontFamily: Fonts.medium, fontWeight: '500', marginBottom: 3 },
  statValue: { fontSize: 14, fontFamily: Fonts.bold, fontWeight: '700', color: TEXT_P },

  // Driver section
  driverRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  driverAvatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  driverAvatarText: { color: WHITE, fontSize: 16, fontFamily: Fonts.bold, fontWeight: '700', backgroundColor: BORDEAUX, },
  driverAvatarImage: { width: 48, height: 48, borderRadius: 24 },
  driverName: { fontSize: 14, fontFamily: Fonts.bold, fontWeight: '700', color: TEXT_P },
  driverRating: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  star: { fontSize: 12, color: '#F59E0B' },
  ratingVal: { fontSize: 13, fontFamily: Fonts.semibold, fontWeight: '600', color: TEXT_P },
  ratingCount: { fontSize: 12, color: TEXT_S },
  driverActions: { flexDirection: 'row', gap: 8 },
  btnCall: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: BORDEAUX, borderRadius: 10, height: 40 },
  btnCallText: { color: WHITE, fontSize: 13, fontFamily: Fonts.semibold, fontWeight: '600' },
  btnMsg: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#F9FAFB', borderRadius: 10, height: 40, borderWidth: 1, borderColor: BORDER },
  btnMsgText: { color: BORDEAUX, fontSize: 13, fontFamily: Fonts.semibold, fontWeight: '600' },

  // Vehicle section
  vehicleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  vehicleKey: { fontSize: 13, color: TEXT_S, fontFamily: Fonts.medium, fontWeight: '500' },
  vehicleVal: { fontSize: 14, fontFamily: Fonts.semibold, fontWeight: '600', color: TEXT_P },
  vehicleImageContainer: { alignItems: 'center', marginBottom: 16 },
  vehicleImage: { width: '100%', height: 200, borderRadius: 12, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  priceCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: BORDEAUX, borderRadius: 16, padding: 20, marginBottom: 12,
    shadowColor: BORDEAUX, shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 4,
  },
  priceLabel: { fontSize: 15, fontFamily: Fonts.semibold, fontWeight: '600', color: WHITE },
  priceNote:  { fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 3, maxWidth: 180 },
  priceValue: { fontSize: 32, fontFamily: Fonts.bold, fontWeight: '900', color: WHITE, letterSpacing: -1 },

  nextCard: {
    backgroundColor: '#FDF4F4', borderRadius: 16, padding: 18, marginBottom: 24,
    borderWidth: 1, borderColor: '#F5DDE0',
  },
  nextHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 },
  nextTitle:  { fontSize: 13, fontFamily: Fonts.bold, fontWeight: '700', color: BORDEAUX },

  ctas:           { gap: 10 },
  btnPrimary: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    height: 50, borderRadius: 14, backgroundColor: BORDEAUX,
  },
  btnPrimaryDone: { backgroundColor: '#6B7280' },
  btnPrimaryText: { color: WHITE, fontSize: 15, fontFamily: Fonts.bold, fontWeight: '700' },
  btnSecondary: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    height: 50, borderRadius: 14, borderWidth: 1.5, borderColor: BORDEAUX, backgroundColor: WHITE,
  },
  btnSecondaryText: { color: BORDEAUX, fontSize: 15, fontFamily: Fonts.bold, fontWeight: '700' },
  btnDanger: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    height: 50, borderRadius: 14, backgroundColor: 'transparent',
  },
  btnDangerText: { color: '#C0392B', fontSize: 15, fontFamily: Fonts.bold, fontWeight: '700' },
});

const check = StyleSheet.create({
  container: { width: 90, height: 90, alignItems: 'center', justifyContent: 'center' },
  ring:      { position: 'absolute', width: 72, height: 72, borderRadius: 36, borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)' },
  circle: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: '#10B981',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#10B981', shadowOpacity: 0.5, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 6,
  },
});
