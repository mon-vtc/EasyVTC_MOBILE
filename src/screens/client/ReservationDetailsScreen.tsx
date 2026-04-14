// ══════════════════════════════════════════════════════════════════════════════
// SCREEN — ReservationDetailsScreen
// Sprint 3 — EasyVTC
// Affiché après submitBooking() réussi.
// Reçoit { reservationId } en route params, charge la réservation depuis
// le store (déjà insérée par submitBooking) ou via fetchById en fallback.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Animated, Platform, Easing,
} from 'react-native';
import {
  useNavigation, useRoute,
  type RouteProp, type NavigationProp,
} from '@react-navigation/native';
import { AppIcon }             from '../../components/common/AppIcon';
import { Colors }              from '../../theme/colors';
import { useReservationStore } from '../../store/reservation.store';
import { useAuthStore }        from '../../store/auth.store';
import type { ClientStackParamList } from '../../types/auth.types';

// ── Types navigation typés ──────────────────────────────────────────────────
type ConfirmationNav   = NavigationProp<ClientStackParamList, 'ReservationDetails'>;
type ConfirmationRoute = RouteProp<ClientStackParamList, 'ReservationDetails'>;

// ── Helpers ─────────────────────────────────────────────────────────────────
function formatPrice(price: number | null | undefined): string {
  if (price == null) return '—';
  return `${price.toFixed(0)} €`;
}
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}
function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}
function getVehicleLabel(type: string | undefined): string {
  const labels: Record<string, string> = { standard: 'Berline Standard', berline: 'Berline', van: 'Van / Minibus' };
  return labels[type ?? ''] ?? type ?? '—';
}

// ══════════════════════════════════════════════════════════════════════════════
// ANIMATED CHECK
// ══════════════════════════════════════════════════════════════════════════════
function AnimatedCheck() {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(200),
      Animated.parallel([
        Animated.spring(scale,   { toValue: 1, tension: 60, friction: 6, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]),
      Animated.delay(100),
      Animated.parallel([
        Animated.timing(ring1, { toValue: 1, duration: 600, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(ring2, { toValue: 1, duration: 800, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const ringStyle = (anim: Animated.Value, maxScale: number) => ({
    transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, maxScale] }) }],
    opacity:   anim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.6, 0.3, 0] }),
  });

  return (
    <View style={check.container}>
      <Animated.View style={[check.ring, ringStyle(ring2, 2.6)]} />
      <Animated.View style={[check.ring, ringStyle(ring1, 1.9)]} />
      <Animated.View style={[check.circle, { transform: [{ scale }], opacity }]}>
        <AppIcon name="checkmark" size={38} color={Colors.white} />
      </Animated.View>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ROW DÉTAIL
// ══════════════════════════════════════════════════════════════════════════════
function DetailRow({ icon, label, value, delay = 0 }: { icon: string; label: string; value: string; delay?: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 400, delay: 600 + delay, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  }, []);
  return (
    <Animated.View style={[row.container, { opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }]}>
      <View style={row.iconWrap}>
        <AppIcon name={icon} size={15} color={Colors.bordeaux} />
      </View>
      <View style={row.texts}>
        <Text style={row.label}>{label}</Text>
        <Text style={row.value}>{value}</Text>
      </View>
    </Animated.View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// NEXT STEP
// ══════════════════════════════════════════════════════════════════════════════
function NextStep({ icon, text, delay }: { icon: string; text: string; delay: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 350, delay: 1000 + delay, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  }, []);
  return (
    <Animated.View style={[ns.row, { opacity: anim, transform: [{ translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }) }] }]}>
      <View style={ns.dot}>
        <AppIcon name={icon} size={13} color={Colors.bordeaux} />
      </View>
      <Text style={ns.text}>{text}</Text>
    </Animated.View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ÉCRAN PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════════
export default function ReservationDetailsScreen() {
  const nav   = useNavigation<ConfirmationNav>();
  const route = useRoute<ConfirmationRoute>();

  const reservationId = route.params?.reservationId;

  if (!reservationId) {
    return <View style={styles.root}><Text style={styles.subtitle}>ID de réservation manquant.</Text></View>;
  }

  const accessToken  = useAuthStore(s => s.accessToken);
  const reservations = useReservationStore(s => s.reservations);
  const fetchById    = useReservationStore(s => s.fetchById);

  const reservation = reservations.find(r => r.id === reservationId) ?? null;

  useEffect(() => {
    if (!reservation && accessToken) fetchById(accessToken, reservationId);
  }, [reservationId, reservation, accessToken, fetchById]);

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

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} bounces={false}>

        {/* ── Header ── */}
        <Animated.View style={[styles.header, slideUp(headerAnim, 30)]}>
          <AnimatedCheck />
          <Text style={styles.title}>Réservation envoyée !</Text>
          <Text style={styles.subtitle}>Votre demande est en cours de{'\n'}validation par notre équipe</Text>
        </Animated.View>

        {/* ── Badge N° réservation ── */}
        {r?.id && (
          <Animated.View style={[styles.refBadge, slideUp(headerAnim)]}>
            <Text style={styles.refLabel}>N° de réservation</Text>
            <Text style={styles.refValue} numberOfLines={1} ellipsizeMode="middle">{r.id}</Text>
          </Animated.View>
        )}

        {/* ── Carte trajet ── */}
        <Animated.View style={[styles.card, slideUp(cardAnim)]}>
          <Text style={styles.cardTitle}>Détails du trajet</Text>

          <View style={styles.routeBlock}>
            <View style={styles.routeRow}>
              <View style={[styles.routeDot, { backgroundColor: '#10B981' }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.routeTag}>Départ</Text>
                <Text style={styles.routeAddr}>{r?.pickup_address ?? '—'}</Text>
              </View>
            </View>
            <View style={styles.routeLine} />
            <View style={styles.routeRow}>
              <View style={[styles.routeDot, { backgroundColor: Colors.bordeaux }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.routeTag}>Destination</Text>
                <Text style={styles.routeAddr}>{r?.dest_address ?? '—'}</Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          <DetailRow icon="calendar-outline"      label="Date"      value={r?.scheduled_at ? formatDate(r.scheduled_at) : '—'} delay={0}   />
          <DetailRow icon="time-outline"          label="Heure"     value={r?.scheduled_at ? formatTime(r.scheduled_at) : '—'} delay={60}  />
          <DetailRow icon="car-outline"           label="Véhicule"  value={getVehicleLabel(r?.vehicle_type)}                    delay={120} />
          <DetailRow
            icon="person-outline"
            label="Passagers"
            value={r?.nb_passengers != null ? `${r.nb_passengers} passager${r.nb_passengers > 1 ? 's' : ''}` : '—'}
            delay={180}
          />
          {r?.driver ? (
            <DetailRow icon="shield-checkmark-outline" label="Chauffeur" value={`${r.driver?.user?.first_name} ${r.driver?.user?.last_name}`} delay={240} />
          ) : (
            <DetailRow icon="person-circle-outline"    label="Chauffeur" value="En attente d'attribution"                       delay={240} />
          )}
        </Animated.View>

        {/* ── Prix estimé ── */}
        <Animated.View style={[styles.priceCard, slideUp(priceAnim)]}>
          <View>
            <Text style={styles.priceLabel}>Prix estimé</Text>
            <Text style={styles.priceNote}>Paiement directement auprès du chauffeur</Text>
          </View>
          <Text style={styles.priceValue}>{formatPrice(r?.price_estimated)}</Text>
        </Animated.View>

        {/* ── Prochaines étapes ── */}
        <Animated.View style={[styles.nextCard, slideUp(priceAnim)]}>
          <View style={styles.nextHeader}>
            <AppIcon name="information-circle-outline" size={16} color={Colors.bordeaux} />
            <Text style={styles.nextTitle}>Prochaines étapes</Text>
          </View>
          <NextStep icon="checkmark-circle-outline" text="Validation de votre réservation par notre équipe"  delay={0}   />
          <NextStep icon="car-outline"              text="Attribution d'un chauffeur disponible"              delay={80}  />
          <NextStep icon="mail-outline"             text="Notification de confirmation avec les détails"      delay={160} />
          <NextStep icon="notifications-outline"   text="Rappel 1h avant le départ"                          delay={240} />
        </Animated.View>

        {/* ── CTAs ── */}
        <Animated.View style={[styles.ctas, slideUp(ctaAnim)]}>
          <TouchableOpacity
            style={styles.btnPrimary}
            activeOpacity={0.85}
            onPress={() => nav.navigate('CreateReservation')}
          >
            <AppIcon name="document-text-outline" size={18} color={Colors.white} />
            <Text style={styles.btnPrimaryText}>Voir le bon de commande</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnSecondary}
            activeOpacity={0.85}
            onPress={() => nav.navigate('ClientTabs', { screen: 'MyReservations' })}
          >
            <Text style={styles.btnSecondaryText}>Voir mes réservations</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnGhost}
            activeOpacity={0.75}
            onPress={() => nav.navigate('CreateReservation')}
          >
            <Text style={styles.btnGhostText}>Nouvelle réservation</Text>
          </TouchableOpacity>
        </Animated.View>

      </ScrollView>
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

  header:   { alignItems: 'center', marginBottom: 20 },
  title:    { fontSize: 26, fontWeight: '800', color: WHITE, marginTop: 20, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.75)', marginTop: 8, textAlign: 'center', lineHeight: 20 },

  refBadge: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 10,
    paddingHorizontal: 16, paddingVertical: 10, marginBottom: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },
  refLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
  refValue: { flexShrink: 1, fontSize: 14, color: WHITE, fontWeight: '700', letterSpacing: 0.5, textAlign: 'right' },

  card: {
    backgroundColor: WHITE, borderRadius: 18, padding: 20, marginBottom: 12,
    shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 3,
  },
  cardTitle:  { fontSize: 15, fontWeight: '700', color: TEXT_P, marginBottom: 16 },
  routeBlock: { gap: 0 },
  routeRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  routeDot:   { width: 10, height: 10, borderRadius: 5, marginTop: 5 },
  routeLine:  { width: 1, height: 14, backgroundColor: BORDER, marginLeft: 4, marginVertical: 3 },
  routeTag:   { fontSize: 10, color: TEXT_S, textTransform: 'uppercase', letterSpacing: 0.5 },
  routeAddr:  { fontSize: 14, fontWeight: '500', color: TEXT_P, marginTop: 2, lineHeight: 20 },
  divider:    { height: 1, backgroundColor: '#F3F4F6', marginVertical: 16 },

  priceCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: BORDEAUX, borderRadius: 16, padding: 20, marginBottom: 12,
    shadowColor: BORDEAUX, shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 4,
  },
  priceLabel: { fontSize: 15, fontWeight: '600', color: WHITE },
  priceNote:  { fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 3, maxWidth: 180 },
  priceValue: { fontSize: 32, fontWeight: '900', color: WHITE, letterSpacing: -1 },

  nextCard: {
    backgroundColor: '#FDF4F4', borderRadius: 16, padding: 18, marginBottom: 24,
    borderWidth: 1, borderColor: '#F5DDE0',
  },
  nextHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 },
  nextTitle:  { fontSize: 13, fontWeight: '700', color: BORDEAUX },

  ctas:           { gap: 10 },
  btnPrimary: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: BORDEAUX, borderRadius: 14, height: 52,
    shadowColor: BORDEAUX, shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 3,
  },
  btnPrimaryText:   { color: WHITE, fontSize: 15, fontWeight: '700' },
  btnSecondary: {
    alignItems: 'center', justifyContent: 'center', height: 52,
    borderRadius: 14, borderWidth: 1.5, borderColor: BORDEAUX, backgroundColor: WHITE,
  },
  btnSecondaryText: { color: BORDEAUX, fontSize: 15, fontWeight: '700' },
  btnGhost:         { alignItems: 'center', justifyContent: 'center', height: 44 },
  btnGhostText:     { color: TEXT_S, fontSize: 14, fontWeight: '500', textDecorationLine: 'underline' },
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

const row = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  iconWrap:  { width: 32, height: 32, borderRadius: 8, backgroundColor: '#FDF4F4', alignItems: 'center', justifyContent: 'center' },
  texts:     { flex: 1 },
  label:     { fontSize: 11, color: TEXT_S, textTransform: 'uppercase', letterSpacing: 0.4 },
  value:     { fontSize: 14, fontWeight: '600', color: TEXT_P, marginTop: 1 },
});

const ns = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  dot: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(123,31,46,0.08)', alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  text: { flex: 1, fontSize: 13, color: TEXT_P, lineHeight: 19 },
});
