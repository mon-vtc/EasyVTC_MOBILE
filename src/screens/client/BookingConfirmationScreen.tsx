// ══════════════════════════════════════════════════════════════════════════════
// SCREEN — BookingConfirmationScreen (Fusion ReservationDetailsScreen)
// Sprint 3 — EasyVTC
// Fusion des deux implémentations + fidélité exacte à la capture UI.
// Reçoit { reservationId } en route params, charge depuis le store ou fetchById.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Animated, Platform, Easing, ActivityIndicator,
} from 'react-native';
import {
  useNavigation, useRoute,
  type RouteProp, type NavigationProp,
} from '@react-navigation/native';
import { Ionicons }              from '@expo/vector-icons';
import { Colors, Fonts, Spacing, Radius } from '../../theme/colors';
import { useReservationStore }   from '../../store/reservation.store';
import { useAuthStore }          from '../../store/auth.store';
import { reservationApi }        from '../../services/api/reservation.api';
import { ordersApi }             from '../../services/api/orders.api';
import type { ClientStackParamList } from '../../types/auth.types';
import type { Reservation }          from '../../types/reservations.types';
import { RESERVATION_STATUS_LABELS } from '../../types/reservations.types';

// ── Types navigation ─────────────────────────────────────────────────────────
type ConfirmationNav   = NavigationProp<ClientStackParamList, 'BookingConfirmation'>;
type ConfirmationRoute = RouteProp<ClientStackParamList, 'BookingConfirmation'>;

// ── Constants couleurs ────────────────────────────────────────────────────────
const BORDEAUX = Colors?.bordeaux      ;
const WHITE    = Colors?.white         ;
const BG       = Colors?.background    ;
const TEXT_P   = Colors?.bordeauxLight   ;
const TEXT_S   = Colors?.textSecondary ;
const BORDER   = Colors?.border        ;
const SURFACE  = Colors?.surface       ;

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatPrice(price: number | null | undefined, currency?: string): string {
  if (price == null) return '—';
  return `${price}${currency ?? '€'}`;
}
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
}
function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}
function getVehicleLabel(type: string | undefined): string {
  const labels: Record<string, string> = {
    standard: 'Berline Standard',
    berline:  'Berline',
    van:      'Van / Minibus',
  };
  return labels[type ?? ''] ?? type ?? '—';
}

// ══════════════════════════════════════════════════════════════════════════════
// ANIMATED CHECK — cercle vert + coche blanche + ondes
// ══════════════════════════════════════════════════════════════════════════════
function AnimatedCheck() {
  const scale   = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const ring1   = useRef(new Animated.Value(0)).current;
  const ring2   = useRef(new Animated.Value(0)).current;

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
    opacity:   anim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.5, 0.2, 0] }),
  });

  return (
    <View style={check.container}>
      <Animated.View style={[check.ring, ringStyle(ring2, 2.4)]} />
      <Animated.View style={[check.ring, ringStyle(ring1, 1.8)]} />
      <Animated.View style={[check.circle, { transform: [{ scale }], opacity }]}>
        <Ionicons name="checkmark" size={36} color="#fff" />
      </Animated.View>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// DETAIL ROW — icône bordeaux + label gris + valeur foncée
// ══════════════════════════════════════════════════════════════════════════════
function DetailRow({
  icon, label, value, delay = 0, valueStyle,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
  delay?: number;
  valueStyle?: object;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1, duration: 400, delay: 600 + delay,
      easing: Easing.out(Easing.quad), useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={[
      row.container,
      {
        opacity: anim,
        transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
      },
    ]}>
      <View style={row.iconWrap}>
        <Ionicons name={icon} size={15} color={BORDEAUX} />
      </View>
      <View style={row.texts}>
        <Text style={row.label}>{label}</Text>
        <Text style={[row.value, valueStyle]}>{value}</Text>
      </View>
    </Animated.View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// NEXT STEP ROW — bullet point bordeaux + texte (fidèle capture)
// ══════════════════════════════════════════════════════════════════════════════
function NextStep({ text, delay }: { text: string; delay: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1, duration: 350, delay: 1000 + delay,
      easing: Easing.out(Easing.quad), useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={[
      ns.row,
      {
        opacity: anim,
        transform: [{ translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [-14, 0] }) }],
      },
    ]}>
      <Text style={ns.bullet}>·</Text>
      <Text style={ns.text}>{text}</Text>
    </Animated.View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ÉCRAN PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════════
export default function BookingConfirmationScreen() {
  const nav   = useNavigation<ConfirmationNav>();
  const route = useRoute<ConfirmationRoute>();

  const reservationId = (route.params)?.reservationId as string | undefined;

  const accessToken  = useAuthStore(s => s.accessToken);
  const reservations = useReservationStore(s => s.reservations);
  const fetchById    = useReservationStore(s => s.fetchById);

  const [loading,            setLoading]            = useState(false);
  const [error,              setError]              = useState<string | null>(null);
  const [localReservation,   setLocalReservation]   = useState<Reservation | null>(null);
  const [isLoadingOrder,     setIsLoadingOrder]     = useState(false);

  // Cherche d'abord dans le store (déjà inséré par submitBooking)
  const storeReservation = reservationId
    ? (reservations.find(r => r.id === reservationId) ?? null)
    : null;

  const reservation: Reservation | null = storeReservation ?? localReservation;

  // Fallback API si absent du store
  useEffect(() => {
    if (!reservationId || storeReservation) return;
    setLoading(true);
    (async () => {
      try {
        if (accessToken && fetchById) {
          await fetchById(accessToken, reservationId);
        } else if (accessToken) {
          const res = await reservationApi.getById(accessToken, reservationId);
          if (res.ok && res.data) setLocalReservation(res.data);
          else setError(res.message ?? 'Impossible de charger la réservation');
        }
      } catch {
        setError('Erreur de chargement');
      } finally {
        setLoading(false);
      }
    })();
  }, [reservationId]);

  // ── Navigation vers le bon de commande ───────────────────────────────────
  // Tente de récupérer l'ordre lié à la réservation. L'ordre peut ne pas exister
  // encore (généré après attribution du chauffeur). Si trouvé → OrderDetails
  // directement. Sinon → liste MyOrders.
  const handleViewOrderWithRetry = async (retries = 3, delay = 2500) => {
    if (!reservationId || !accessToken) return;

    for (let i = 0; i < retries; i++) {
      try {
        const res = await ordersApi.getByReservation(accessToken, reservationId);
        if (res.ok && res.data) {
          nav.navigate('OrderDetails', { orderId: res.data.id });
          return; // Succès, on arrête les tentatives
        }
      } catch (e) {
        console.warn(`Attempt ${i + 1} failed:`, e);
      }
      // Attendre avant de réessayer
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    // Si toutes les tentatives échouent, rediriger vers la liste
    nav.navigate('ClientTabs', { screen: 'MyOrders' });
  };

  const handleViewOrder = async () => {
    setIsLoadingOrder(true);
    await handleViewOrderWithRetry();
    setIsLoadingOrder(false);
  };

  // ── Animations entrée page ────────────────────────────────────────────────
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

  // ── Guards ────────────────────────────────────────────────────────────────
  if (!reservationId) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color={BORDEAUX} />
        <Text style={styles.errorText}>ID de réservation manquant.</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={BORDEAUX} />
      </View>
    );
  }

  if (error || (!loading && !reservation)) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color={BORDEAUX} />
        <Text style={styles.errorText}>{error ?? 'Réservation introuvable'}</Text>
        <TouchableOpacity
          style={styles.btnPrimary}
          onPress={() => nav.navigate('ClientTabs', { screen: 'ClientHome' })}
        >
          <Text style={styles.btnPrimaryText}>Retour à l'accueil</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const r = reservation;
  const scheduledAt = r?.scheduled_at ?? '';

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >

        {/* ── Header : check animé + titre + sous-titre ── */}
        <Animated.View style={[styles.header, slideUp(headerAnim, 30)]}>
          <AnimatedCheck />
          <Text style={styles.title}>Réservation envoyée !</Text>
          <Text style={styles.subtitle}>
            Votre demande est en cours de{'\n'}validation par notre équipe
          </Text>
        </Animated.View>

        {/* ── Ligne N° de réservation ── */}
        {r?.id && (
          <Animated.View style={[styles.refRow, slideUp(headerAnim)]}>
            <Text style={styles.refLabel}>N° de réservation</Text>
            <Text style={styles.refValue} numberOfLines={1} ellipsizeMode="middle">
              {r.id}
            </Text>
          </Animated.View>
        )}

        {/* ── Badge statut (si RESERVATION_STATUS_LABELS disponible) ── */}
        {r?.status && RESERVATION_STATUS_LABELS?.[r.status] && (
          <Animated.View style={[styles.statusWrap, slideUp(headerAnim)]}>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{RESERVATION_STATUS_LABELS[r.status]}</Text>
            </View>
          </Animated.View>
        )}

        {/* ── Carte détails trajet ── */}
        <Animated.View style={[styles.card, slideUp(cardAnim)]}>
          <Text style={styles.cardTitle}>Détails du trajet</Text>

          <View style={styles.routeBlock}>
            {/* Départ */}
            <View style={styles.routeRow}>
              <View style={[styles.routeDot, { backgroundColor: '#10B981' }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.routeTag}>Départ</Text>
                <Text style={styles.routeAddr}>{r?.pickup_address ?? '—'}</Text>
              </View>
            </View>
            <View style={styles.routeLine} />
            {/* Destination */}
            <View style={styles.routeRow}>
              <View style={[styles.routeDot, { backgroundColor: BORDEAUX }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.routeTag}>Destination</Text>
                <Text style={styles.routeAddr}>{r?.dest_address ?? '—'}</Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Lignes de détail animées */}
          <DetailRow
            icon="calendar-outline"
            label="Date et heure"
            value={scheduledAt ? `${formatDate(scheduledAt)} à ${formatTime(scheduledAt)}` : '—'}
            delay={0}
          />
          <DetailRow
            icon="car-outline"
            label="Véhicule"
            value={getVehicleLabel(r?.vehicle_type)}
            delay={60}
          />
          {r?.distance_km != null && (
            <DetailRow
              icon="navigate-outline"
              label="Distance estimée"
              value={`${r.distance_km} km`}
              delay={90}
            />
          )}
          {r?.duration_min != null && (
            <DetailRow
              icon="timer-outline"
              label="Durée estimée"
              value={`${r.duration_min} min`}
              delay={120}
            />
          )}
          {r?.nb_passengers != null && (
            <DetailRow
              icon="people-outline"
              label="Passagers"
              value={`${r.nb_passengers} passager${r.nb_passengers > 1 ? 's' : ''}`}
              delay={120}
            />
          )}
          {r?.driver ? (
            <DetailRow
              icon="shield-checkmark-outline"
              label="Chauffeur"
              value={`${r.driver?.user?.first_name ?? ''} ${r.driver?.user?.last_name ?? ''}`.trim()}
              delay={180}
            />
          ) : (
            <DetailRow
              icon="person-circle-outline"
              label="Chauffeur"
              value="En attente d'attribution"
              delay={180}
              valueStyle={{ color: BORDEAUX }}
            />
          )}
          {r?.comment ? (
            <DetailRow
              icon="chatbubble-outline"
              label="Commentaire"
              value={r.comment}
              delay={240}
            />
          ) : null}
        </Animated.View>

        {/* ── Prix estimé ── */}
        {r?.promo_code_id && r.discount_amount != null && r.price_estimated != null ? (
          <Animated.View style={[styles.priceCard, slideUp(priceAnim)]}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.priceFinalLabel}>Prix final estimé</Text>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Prix initial</Text>
                <Text style={styles.priceInitialValue}>{formatPrice(r.price_estimated + r.discount_amount, r.country === 'france' ? '€' : ' CFA')}</Text>
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.priceDiscountLabel}>Réduction</Text>
                <Text style={styles.priceDiscountValue}>- {formatPrice(r.discount_amount, r.country === 'france' ? '€' : ' CFA')}</Text>
              </View>
              <View style={styles.priceDivider} />
              <View style={styles.priceRow}>
                <Text style={styles.priceFinalValueLabel}>Total à régler</Text>
                <Text style={styles.priceValue}>{formatPrice(r.price_estimated, r.country === 'france' ? '€' : ' CFA')}</Text>
              </View>
            </View>
          </Animated.View>
        ) : (
          <Animated.View style={[styles.priceCard, slideUp(priceAnim)]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.priceLabel}>Prix estimé</Text>
              <Text style={styles.priceNote}>Paiement à effectuer directement auprès du chauffeur</Text>
            </View>
            <Text style={styles.priceValue}>{formatPrice(r?.price_estimated, r?.country === 'france' ? '€' : ' CFA')}</Text>
          </Animated.View>
        )}

        {/* ── Prochaines étapes (fond bleu clair — fidèle capture) ── */}
        <Animated.View style={[styles.nextCard, slideUp(priceAnim)]}>
          <View style={styles.nextHeader}>
            <Ionicons name="information-circle-outline" size={16} color={BORDEAUX} />
            <Text style={styles.nextTitle}>Prochaines étapes</Text>
          </View>
          <NextStep text="Validation de votre réservation par notre équipe" delay={0}   />
          <NextStep text="Attribution d'un chauffeur disponible"             delay={80}  />
          <NextStep text="Notification de confirmation avec les détails"     delay={160} />
          <NextStep text="Rappel 1h avant le départ"                         delay={240} />
        </Animated.View>

        {/* ── CTAs — 3 boutons : plein / contour / ghost ── */}
        <Animated.View style={[styles.ctas, slideUp(ctaAnim)]}>
          <TouchableOpacity
            style={styles.btnPrimary}
            activeOpacity={0.85}
            onPress={handleViewOrder}
            disabled={isLoadingOrder}
          >
            {isLoadingOrder
              ? <ActivityIndicator color={WHITE} size="small" />
              : <>
                  <Ionicons name="document-text-outline" size={18} color={WHITE} />
                  <Text style={styles.btnPrimaryText}>Voir le bon de commande</Text>
                </>
            }
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
const styles = StyleSheet.create({
  root:  { flex: 1, backgroundColor: BG },
  scroll: {
    paddingTop: Platform.OS === 'ios' ? 60 : 44,
    paddingBottom: 52,
    paddingHorizontal: 20,
  },
  center: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: 32, gap: 16,
  },
  errorText: { fontSize: 15, color: BORDEAUX, textAlign: 'center' },

  // Header
  header:   { alignItems: 'center', marginBottom: 24 },
  title:    { fontSize: 24, fontWeight: '800', color: TEXT_P, marginTop: 18, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: TEXT_S, marginTop: 8, textAlign: 'center', lineHeight: 20 },

  // N° réservation — ligne avec label à gauche, valeur bold à droite
  refRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: SURFACE,
    borderRadius: 10, borderWidth: 1, borderColor: BORDER,
    paddingHorizontal: 16, paddingVertical: 12,
    marginBottom: 10,
  },
  refLabel: { fontSize: 12, color: TEXT_S, fontWeight: '500' },
  refValue: {
    flexShrink: 1, fontSize: 14, color: TEXT_P,
    fontWeight: '800', letterSpacing: 0.4, textAlign: 'right',
  },

  // Badge statut
  statusWrap:  { alignItems: 'center', marginBottom: 12 },
  statusBadge: {
    backgroundColor: '#FFF3E0', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 5,
  },
  statusText: { fontSize: 13, fontWeight: '600', color: '#E65100' },

  // Carte détails trajet
  card: {
    backgroundColor: SURFACE,  borderTopLeftRadius: 16, borderTopRightRadius: 16,
    padding: 20, paddingBottom: 0,
    shadowColor: '#000', shadowOpacity: 0.05,
    shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 2,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: TEXT_P, marginBottom: 16 },

  routeBlock: { gap: 0 },
  routeRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  routeDot:   { width: 10, height: 10, borderRadius: 5, marginTop: 5, flexShrink: 0 },
  routeLine:  { width: 1, height: 14, backgroundColor: BORDER, marginLeft: 4, marginVertical: 3 },
  routeTag:   { fontSize: 10, color: TEXT_S, textTransform: 'uppercase', letterSpacing: 0.5 },
  routeAddr:  { fontSize: 14, fontWeight: '500', color: TEXT_P, marginTop: 2, lineHeight: 20 },
  divider:    { height: 1, backgroundColor: '#F3F4F6', marginVertical: 16 },

  // Prix estimé — card blanche avec prix en gros à droite
  priceCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: SURFACE,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    padding: 20, marginBottom: 12,
    shadowColor: '#000', shadowOpacity: 0.04,
    shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  priceLabel: { fontSize: 15, fontWeight: '700', color: TEXT_P },
  priceFinalLabel: { fontSize: 18, fontWeight: '800', color: TEXT_P, marginBottom: 8 },
  priceFinalValueLabel: { fontSize: 16, fontWeight: 'bold', color: TEXT_P },
  priceDiscountLabel: { fontSize: 14, fontWeight: '500', color: Colors.success },
  priceNote:  { fontSize: 11, color: TEXT_S, marginTop: 4, maxWidth: 190, lineHeight: 16 },
  priceValue: {
    fontSize: 30, fontWeight: '900', color: TEXT_P,
    letterSpacing: -1, marginLeft: 12,
  },
  priceInitialValue: { fontSize: 18, fontWeight: '600', color: TEXT_S, textDecorationLine: 'line-through' },
  priceDiscountValue: { fontSize: 18, fontWeight: '600', color: Colors.success },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceDivider: {
    height: 1, backgroundColor: BORDER, marginVertical: 8,
  },

  // Prochaines étapes — fond bleu très clair (#EEF4FB) fidèle capture
  nextCard: {
    backgroundColor: '#EEF4FB',
    borderRadius: 14,
    borderWidth: 1, borderColor: '#D0E4F5',
    padding: 16, marginBottom: 24,
  },
  nextHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  nextTitle:  { fontSize: 13, fontWeight: '700', color: BORDEAUX },

  // CTAs
  ctas: { gap: 10 },
  btnPrimary: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: BORDEAUX, borderRadius: 12, height: 52,
    shadowColor: BORDEAUX, shadowOpacity: 0.28,
    shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 3,
  },
  btnPrimaryText:   { color: WHITE, fontSize: 15, fontWeight: '700' },
  btnSecondary: {
    alignItems: 'center', justifyContent: 'center',
    height: 52, borderRadius: 12,
    borderWidth: 1.5, borderColor: BORDEAUX,
    backgroundColor: WHITE,
  },
  btnSecondaryText: { color: BORDEAUX, fontSize: 15, fontWeight: '700' },
  btnGhost:         { alignItems: 'center', justifyContent: 'center', height: 44, backgroundColor: '#EEF4FB', borderRadius: 10 },
  btnGhostText:     { color: Colors.black, fontSize: 15, fontWeight: '500' },
});

// ── Check ─────────────────────────────────────────────────────────────────────
const check = StyleSheet.create({
  container: { width: 88, height: 88, alignItems: 'center', justifyContent: 'center' },
  ring: {
    position: 'absolute', width: 70, height: 70, borderRadius: 35,
    borderWidth: 2, borderColor: 'rgba(16,185,129,0.4)',
  },
  circle: {
    width: 70, height: 70, borderRadius: 35,
    backgroundColor: '#10B981',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#10B981', shadowOpacity: 0.4,
    shadowRadius: 14, shadowOffset: { width: 0, height: 5 }, elevation: 5,
  },
});

// ── Detail row ────────────────────────────────────────────────────────────────
const row = StyleSheet.create({
  container: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 9,
    borderBottomWidth: 1, borderBottomColor: '#F9FAFB',
  },
  iconWrap: {
    width: 30, height: 30, borderRadius: 8,
    backgroundColor: '#FAF0F2',
    alignItems: 'center', justifyContent: 'center',
  },
  texts: { flex: 1 },
  label: { fontSize: 10, color: TEXT_S, textTransform: 'uppercase', letterSpacing: 0.4 },
  value: { fontSize: 14, fontWeight: '600', color: TEXT_P, marginTop: 1 },
});

// ── Next step ─────────────────────────────────────────────────────────────────
const ns = StyleSheet.create({
  row:    { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 6 },
  bullet: { fontSize: 18, color: BORDEAUX, lineHeight: 20, marginTop: -2 },
  text:   { flex: 1, fontSize: 13, color: TEXT_P, lineHeight: 19 },
});