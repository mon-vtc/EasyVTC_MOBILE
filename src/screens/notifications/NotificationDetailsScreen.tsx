// ══════════════════════════════════════════════════════════════════════════════
// Screen — NotificationDetailsScreen
// Affiche les détails d'une notification selon son type et le rôle utilisateur.
//
// Règle de navigation :
//   • support_reply / new_message → redirigent directement (pas via cet écran)
//   • Tous les autres             → ouvrent cet écran ; les boutons dédiés
//                                   permettent d'appeler, voir la résa ou écrire
//
// Types gérés :
//   • reservation_confirmed  → Hero vert  + infos résa + chauffeur + itinéraire + prix
//   • trip_reminder          → Hero orange + alerte dynamique (1h/5min) + infos + chauffeur + itinéraire
//   • driver_arrived         → Hero beige + alerte + infos chauffeur + point RDV + footer ETA
//   • invoice_available      → Hero beige clair + infos facture + bouton téléchargement
//   • reservation_cancelled  → Hero rouge + motif + infos résa + itinéraire
//   • trip_assigned          → Hero bordeaux + infos course (vue chauffeur ou client)
//   • document_expiry        → Hero ambre + détails document
//   • new_reservation_admin  → Hero bordeaux + infos résa + itinéraire + CTA assignation
//   • support_reply          → (redirigé directement — ne passe pas par cet écran)
//   • new_message            → (redirigé directement — ne passe pas par cet écran)
//   • fallback               → Header générique + corps de notification
// ══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Platform,
  Image,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO, differenceInMinutes } from 'date-fns';
import { fr } from 'date-fns/locale';

import { Colors, Spacing, Radius } from '../../theme/colors';
import { useReservation } from '../../hooks/useReservation';
import { useAuthStore } from '../../store/auth.store';
import { useToast } from '../../hooks/useToast';
import type { Notification, NotificationIconConfig } from '../../types';
import type { Reservation } from '../../types/reservations.types';
import { AuthUser } from '../../types/auth.types';

// ── Config icône / couleur par type ──────────────────────────────────────────
interface NotifStyle {
  icon:        string;
  iconColor:   string;
  iconBg:      string;
  heroBg:      string;
  accentColor: string;
}

const NOTIF_STYLES: Record<string, NotifStyle> = {
  reservation_confirmed: {
    icon: 'checkmark-circle', iconColor: Colors.success, iconBg: Colors.successLight,
    heroBg: '#F0FBF4', accentColor: Colors.success,
  },
  trip_reminder: {
    icon: 'alarm', iconColor: Colors.warning, iconBg: Colors.warningLight,
    heroBg: '#FFFBEB', accentColor: Colors.warning,
  },
  driver_arrived: {
    icon: 'car', iconColor: Colors.beige, iconBg: Colors.beigeLight,
    heroBg: '#FEF7EE', accentColor: Colors.beige,
  },
  invoice_available: {
    icon: 'document-text', iconColor: Colors.textMuted, iconBg: Colors.beigeLight,
    heroBg: Colors.background, accentColor: Colors.textMuted,
  },
  reservation_cancelled: {
    icon: 'close-circle', iconColor: Colors.error, iconBg: Colors.errorLight,
    heroBg: '#FEF5F5', accentColor: Colors.error,
  },
  trip_assigned: {
    icon: 'car-sport', iconColor: Colors.bordeauxLight, iconBg: Colors.iconBg,
    heroBg: '#FDF8F8', accentColor: Colors.bordeauxLight,
  },
  document_expiry: {
    icon: 'warning', iconColor: Colors.warning, iconBg: Colors.warningLight,
    heroBg: '#FFFBEB', accentColor: Colors.warning,
  },
  new_reservation_admin: {
    icon: 'layers', iconColor: Colors.bordeauxLight, iconBg: Colors.iconBg,
    heroBg: '#FDF8F8', accentColor: Colors.bordeauxLight,
  },
};

const FALLBACK_STYLE: NotifStyle = {
  icon: 'notifications-outline', iconColor: Colors.textMuted, iconBg: Colors.beigeLight,
  heroBg: Colors.background, accentColor: Colors.bordeauxLight,
};

// ── Types de route params ─────────────────────────────────────────────────────
type NotifDetailsParams = {
  NotificationDetails: { notification: Notification };
};

// ── Helpers de formatage ──────────────────────────────────────────────────────
const formatDate = (iso: string) => {
  try { return format(parseISO(iso), 'd MMMM yyyy', { locale: fr }); }
  catch { return iso; }
};
const formatTime = (iso: string) => {
  try { return format(parseISO(iso), 'HH:mm'); }
  catch { return iso; }
};
const formatDateTime = (iso: string) => {
  try { return format(parseISO(iso), "d MMMM yyyy 'à' HH:mm", { locale: fr }); }
  catch { return iso; }
};
const formatPrice = (price: number | null | undefined): string =>
  price == null ? '—' : `${price.toFixed(2).replace('.', ',')} €`;

/** Formate un N° de réservation en RES-YYYY-NNN si possible, sinon fallback court */
const formatResaNumber = (reservation: Reservation): string => {
  if ((reservation as any).formatted_number) return (reservation as any).formatted_number;
  // fallback : RES-XXXX sur les 4 premiers chars de l'UUID
  return `RES-${reservation.id.slice(0, 4).toUpperCase()}`;
};

/** Détecte si le rappel est à 5 minutes ou à 1 heure */
const getReminderWindow = (
  notification: Notification,
  reservation: Reservation | null,
): '5min' | '1h' => {
  if (notification.data?.reminder_type === '5min') return '5min';
  if (notification.data?.reminder_type === '1h')   return '1h';
  if (reservation?.scheduled_at) {
    const diffMin = differenceInMinutes(
      parseISO(reservation.scheduled_at),
      parseISO(notification.created_at),
    );
    if (diffMin <= 10) return '5min';
  }
  return '1h';
};

// ─────────────────────────────────────────────────────────────────────────────
// Composants partagés
// ─────────────────────────────────────────────────────────────────────────────

/** Bandeau héro : icône ronde + titre + date/heure */
const HeroBanner: React.FC<{ title: string; iso: string; style: NotifStyle }> = ({
  title, iso, style,
}) => (
  <View style={[heroBannerSt.wrapper, { backgroundColor: style.heroBg }]}>
    <View style={[heroBannerSt.iconCircle, { backgroundColor: style.iconBg }]}>
      <Ionicons name={style.icon as NotificationIconConfig['icon']} size={28} color={style.iconColor} />
    </View>
    <Text style={heroBannerSt.title}>{title}</Text>
    <View style={heroBannerSt.dateRow}>
      <Ionicons name="calendar-outline" size={13} color={Colors.textPlaceholder} />
      <Text style={heroBannerSt.dateText}>{formatDate(iso)}</Text>
      <Text style={heroBannerSt.dot}> · </Text>
      <Ionicons name="time-outline" size={13} color={Colors.textPlaceholder} />
      <Text style={heroBannerSt.dateText}>{formatTime(iso)}</Text>
    </View>
  </View>
);
const heroBannerSt = StyleSheet.create({
  wrapper:    { marginHorizontal: Spacing.md, marginTop: Spacing.md, borderRadius: Radius.lg, padding: Spacing.lg, alignItems: 'flex-start' },
  iconCircle: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.sm },
  title:      { fontSize: 20, fontWeight: '700', color: Colors.bordeauxDark, marginBottom: Spacing.sm },
  dateRow:    { flexDirection: 'row', alignItems: 'center' },
  dateText:   { fontSize: 12, color: Colors.textPlaceholder, marginLeft: 4 },
  dot:        { color: Colors.border },
});

/** Bannière d'alerte colorée */
const AlertBanner: React.FC<{
  icon: string; iconColor: string; borderColor: string; bg: string;
  title: string; body: string;
}> = ({ icon, iconColor, borderColor, bg, title, body }) => (
  <View style={[alertSt.wrapper, { backgroundColor: bg, borderColor }]}>
    <Ionicons name={icon as NotificationIconConfig['icon']} size={18} color={iconColor} style={{ marginTop: 2 }} />
    <View style={{ flex: 1, marginLeft: Spacing.sm }}>
      <Text style={[alertSt.title, { color: iconColor }]}>{title}</Text>
      <Text style={[alertSt.body, { color: iconColor }]}>{body}</Text>
    </View>
  </View>
);
const alertSt = StyleSheet.create({
  wrapper: { flexDirection: 'row', alignItems: 'flex-start', marginHorizontal: Spacing.md, marginTop: Spacing.md, borderRadius: Radius.md, borderWidth: 1.5, padding: Spacing.md },
  title:   { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  body:    { fontSize: 13, lineHeight: 19 },
});

/** Section carte blanche avec titre */
const Section: React.FC<{ title: string; accentColor?: string; children: React.ReactNode }> = ({
  title, accentColor, children,
}) => (
  <View style={sectionSt.wrapper}>
    <Text style={[sectionSt.title, accentColor ? { color: accentColor } : {}]}>{title}</Text>
    {children}
  </View>
);
const sectionSt = StyleSheet.create({
  wrapper: { backgroundColor: Colors.surface, marginHorizontal: Spacing.md, marginTop: Spacing.md, borderRadius: Radius.lg, padding: Spacing.md, elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 1 }, shadowRadius: 3 },
  title:   { fontSize: 15, fontWeight: '700', color: Colors.bordeauxLight, marginBottom: Spacing.sm },
});

/** Ligne label / valeur avec séparateur */
const InfoRow: React.FC<{
  label: string; value: string; bold?: boolean; accent?: string;
}> = ({ label, value, bold, accent }) => (
  <View style={infoSt.row}>
    <Text style={infoSt.label}>{label}</Text>
    <Text style={[infoSt.value, bold && infoSt.bold, accent ? { color: accent } : {}]}>{value}</Text>
  </View>
);
const infoSt = StyleSheet.create({
  row:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.beigeLight },
  label: { fontSize: 14, color: Colors.textMuted },
  value: { fontSize: 14, color: Colors.textPrimary },
  bold:  { fontWeight: '700' },
});

/**
 * Bloc chauffeur (Figma-conforme) :
 *   - Avatar + nom + rating + total_trips (si dispo)
 *   - Téléphone cliquable (couleur accentColor)
 *   - Véhicule + plaque
 * NB : le bouton "Appeler" est dans les CTAs bas d'écran — ici le tel est
 * juste affiché et tappable pour cohérence avec la maquette Image 2/3.
 */
const DriverCard: React.FC<{
  reservation: Reservation;
  accentColor?: string;
}> = ({ reservation, accentColor }) => {
  const driver = reservation.driver;
  if (!driver) return null;

  const name   = `${driver.user.first_name} ${driver.user.last_name}`;
  const { vehicle } = driver;
  const accent = accentColor ?? Colors.bordeauxLight;

  const callDriver = useCallback(() => {
    if (driver.user.phone) Linking.openURL(`tel:${driver.user.phone}`);
  }, [driver.user.phone]);

  return (
    <Section title="Votre chauffeur" accentColor={accent}>
      {/* En-tête : avatar + nom + rating */}
      <View style={driverSt.header}>
        <View style={driverSt.avatar}>
          {driver.user.profile_photo_url ? (
            <Image
              source={{ uri: driver.user.profile_photo_url }}
              style={{ width: 40, height: 40, borderRadius: 20 }}
            />
          ) : (
            <Ionicons name="person-outline" size={26} color={Colors.iconPrimary} />
          )}
        </View>
        <View>
          <Text style={driverSt.name}>{name}</Text>
          {driver.rating != null && (
            <View style={driverSt.ratingRow}>
              <Ionicons name="star" size={13} color={Colors.beige} />
              <Text style={driverSt.rating}>{driver.rating.toFixed(1)}</Text>
              {/* total_trips affiché si l'API le renvoie — ex : "(342 courses)" */}
              {(driver as any).total_trips != null && (
                <Text style={driverSt.trips}>({(driver as any).total_trips} courses)</Text>
              )}
            </View>
          )}
        </View>
      </View>

      {/* Téléphone */}
      {driver.user.phone && (
        <TouchableOpacity style={driverSt.line} onPress={callDriver} activeOpacity={0.7}>
          <Ionicons name="call-outline" size={15} color={accent} />
          <Text style={[driverSt.lineText, { color: accent }]}>{driver.user.phone}</Text>
        </TouchableOpacity>
      )}

      {/* Véhicule */}
      {vehicle && (
        <>
          <View style={driverSt.line}>
            <Ionicons name="car-outline" size={15} color={Colors.textMuted} />
            <Text style={driverSt.lineText}>
              {vehicle.brand} {vehicle.model}{vehicle.color ? ` ${vehicle.color}` : ''}
            </Text>
          </View>
          <View style={driverSt.line}>
            <Ionicons name="id-card-outline" size={15} color={Colors.textMuted} />
            <Text style={driverSt.lineText}>Plaque : {vehicle.plate_number}</Text>
          </View>
        </>
      )}
    </Section>
  );
};
const driverSt = StyleSheet.create({
  header:    { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  avatar:    { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.beigeLight, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.sm },
  name:      { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  rating:    { fontSize: 13, color: Colors.textMuted, marginLeft: 3 },
  trips:     { fontSize: 12, color: Colors.textPlaceholder, marginLeft: 4 },
  line:      { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.xs },
  lineText:  { fontSize: 14, color: Colors.textSecondary, marginLeft: Spacing.xs },
});

/**
 * Bloc itinéraire avec pointillés.
 * Prop `showMetrics` : false pour trip_reminder (la maquette n'affiche pas
 * distance/durée dans l'itinéraire — elles sont dans la section infos course).
 */
const ItineraryCard: React.FC<{
  reservation: Reservation;
  accentColor?: string;
  showMetrics?: boolean;
}> = ({ reservation, accentColor, showMetrics = true }) => (
  <Section title="Itinéraire" accentColor={accentColor}>
    <View style={itiSt.stop}>
      <View style={[itiSt.dot, { backgroundColor: Colors.success }]}>
        <Ionicons name="location-outline" size={13} color={Colors.white} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={itiSt.label}>Départ</Text>
        <Text style={itiSt.addr}>{reservation.pickup_address}</Text>
      </View>
    </View>
    <View style={itiSt.dashes}>
      {[0, 1, 2, 3].map(i => <View key={i} style={itiSt.dash} />)}
    </View>
    <View style={itiSt.stop}>
      <View style={[itiSt.dot, { backgroundColor: Colors.error }]}>
        <Ionicons name="location" size={13} color={Colors.white} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={itiSt.label}>Destination</Text>
        <Text style={itiSt.addr}>{reservation.dest_address}</Text>
      </View>
    </View>

    {showMetrics && (reservation.distance_km != null || reservation.duration_min != null) && (
      <View style={itiSt.metrics}>
        {reservation.distance_km != null && (
          <View style={itiSt.metric}>
            <Text style={itiSt.metricLabel}>Distance</Text>
            <Text style={itiSt.metricValue}>{reservation.distance_km} km</Text>
          </View>
        )}
        {reservation.duration_min != null && (
          <View style={itiSt.metric}>
            <Ionicons name="time-outline" size={13} color={Colors.textPlaceholder} style={{ marginBottom: 2 }} />
            <Text style={itiSt.metricLabel}>Durée estimée</Text>
            <Text style={itiSt.metricValue}>{reservation.duration_min} min</Text>
          </View>
        )}
      </View>
    )}
  </Section>
);
const itiSt = StyleSheet.create({
  stop:        { flexDirection: 'row', alignItems: 'flex-start' },
  dot:         { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.sm, marginTop: 2 },
  label:       { fontSize: 11, color: Colors.textPlaceholder, marginBottom: 1 },
  addr:        { fontSize: 14, color: Colors.textPrimary, fontWeight: '500' },
  dashes:      { marginLeft: 14, marginVertical: 4 },
  dash:        { width: 2, height: 5, backgroundColor: Colors.border, marginVertical: 2, borderRadius: 1 },
  metrics:     { flexDirection: 'row', gap: Spacing.lg, marginTop: Spacing.md, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.beigeLight },
  metric:      { alignItems: 'flex-start' },
  metricLabel: { fontSize: 11, color: Colors.textPlaceholder, marginBottom: 2 },
  metricValue: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
});

/** Footer prix total bordeaux */
const PriceFooter: React.FC<{ price: number | null | undefined; bg?: string }> = ({
  price, bg,
}) => (
  <View style={[priceSt.wrapper, bg ? { backgroundColor: bg } : {}]}>
    <View>
      <Text style={priceSt.label}>Prix total</Text>
      <Text style={priceSt.value}>{formatPrice(price)}</Text>
    </View>
    <View style={priceSt.circle}>
      <Ionicons name="logo-euro" size={22} color={Colors.white} />
    </View>
  </View>
);
const priceSt = StyleSheet.create({
  wrapper: { marginHorizontal: Spacing.md, marginTop: Spacing.md, backgroundColor: Colors.bordeauxLight, borderRadius: Radius.lg, padding: Spacing.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label:   { fontSize: 13, color: 'rgba(255,255,255,0.65)', marginBottom: 4 },
  value:   { fontSize: 26, fontWeight: '800', color: Colors.white },
  circle:  { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center' },
});

/** Styles partagés des CTAs */
const ctaSt = StyleSheet.create({
  btn:       { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginHorizontal: Spacing.md, marginTop: Spacing.md, backgroundColor: Colors.bordeauxLight, borderRadius: Radius.lg, paddingVertical: 15 },
  btnGreen:  { backgroundColor: Colors.success },
  btnWarm:   { backgroundColor: Colors.bordeaux },
  btnText:   { color: Colors.white, fontWeight: '700', fontSize: 15 },
  row:       { flexDirection: 'row', gap: Spacing.sm, marginHorizontal: Spacing.md, marginTop: Spacing.md },
});

// ─────────────────────────────────────────────────────────────────────────────
// Rendus spécifiques par type
// ─────────────────────────────────────────────────────────────────────────────

// ── reservation_confirmed ────────────────────────────────────────────────────
// Figma Image 2 :
//   N° format RES-YYYY-NNN · date+heure · type véhicule (pas passagers)
//   DriverCard avec total_trips · Itinéraire avec métriques · PriceFooter
//   Bouton "Voir la réservation complète"
const ReservationConfirmedDetails: React.FC<{
  notification: Notification; reservation: Reservation; onNavigate: () => void;
}> = ({ reservation, onNavigate }) => (
  <>
    <Section title="Informations de réservation">
      <InfoRow
        label="N° de réservation"
        value={formatResaNumber(reservation)}
        accent={Colors.bordeauxLight}
      />
      <InfoRow label="Date et heure"    value={formatDateTime(reservation.scheduled_at)} bold />
      <InfoRow label="Type de véhicule" value={reservation.vehicle_type}                bold />
    </Section>

    {reservation.driver && <DriverCard reservation={reservation} />}
    <ItineraryCard reservation={reservation} showMetrics />
    <PriceFooter price={reservation.price_final ?? reservation.price_estimated} />

    <TouchableOpacity style={ctaSt.btn} onPress={onNavigate} activeOpacity={0.8}>
      <Text style={ctaSt.btnText}>Voir la réservation complète</Text>
    </TouchableOpacity>
  </>
);

// ── trip_reminder ─────────────────────────────────────────────────────────────
// Figma Image 3 :
//   Alerte dynamique "1 heure" ou "5 minutes"
//   Infos course : heure de prise en charge · distance · prix (pas passagers)
//   DriverCard · Itinéraire SANS métriques (elles sont déjà dans infos course)
//   Boutons : Appeler (vert) + Voir la course (bordeaux)
const TripReminderDetails: React.FC<{
  notification: Notification; reservation: Reservation;
  onCall: () => void; onNavigate: () => void;
}> = ({ notification, reservation, onCall, onNavigate }) => {
  const win   = getReminderWindow(notification, reservation);
  const is5min = win === '5min';

  return (
    <>
      <AlertBanner
        icon="alarm-outline" iconColor={Colors.warning}
        borderColor={Colors.warningLight} bg="#FFFBEB"
        title={is5min ? 'Votre course commence dans 5 minutes' : 'Votre course commence dans 1 heure'}
        body={
          is5min
            ? "Votre chauffeur arrive très prochainement. Soyez devant l'entrée principale."
            : "Préparez vos bagages et soyez prêt à l'heure indiquée. Votre chauffeur vous attendra 5 minutes maximum."
        }
      />

      <Section title="Informations de la course">
        <InfoRow label="Heure de prise en charge" value={formatTime(reservation.scheduled_at)} bold />
        {reservation.distance_km != null && (
          <InfoRow label="Distance" value={`${reservation.distance_km} km`} bold />
        )}
        <InfoRow
          label="Prix"
          value={formatPrice(reservation.price_final ?? reservation.price_estimated)}
          bold accent={Colors.bordeauxLight}
        />
      </Section>

      {reservation.driver && <DriverCard reservation={reservation} />}

      {/* Itinéraire sans métriques : distance/durée déjà affichées ci-dessus */}
      <ItineraryCard reservation={reservation} showMetrics={false} />

      <View style={ctaSt.row}>
        {reservation.driver?.user.phone && (
          <TouchableOpacity
            style={[ctaSt.btn, ctaSt.btnGreen, { flex: 1 }]}
            onPress={onCall}
            activeOpacity={0.8}
          >
            <Ionicons name="call-outline" size={17} color={Colors.white} style={{ marginRight: 6 }} />
            <Text style={ctaSt.btnText}>Appeler</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[ctaSt.btn, { flex: 1 }]}
          onPress={onNavigate}
          activeOpacity={0.8}
        >
          <Text style={ctaSt.btnText}>Voir la course</Text>
        </TouchableOpacity>
      </View>
    </>
  );
};

// ── driver_arrived ────────────────────────────────────────────────────────────
// Figma Image 1 :
//   Hero titre "Chauffeur en approche"
//   Alerte beige : position actuelle + description véhicule + consigne
//   Section "Informations du chauffeur" (DriverCard)
//   Section "Point de rendez-vous" : adresse en grand + sous-texte
//   Footer bordeaux foncé : ETA en grand + sous-texte "Soyez prêt..."
//   Boutons : Appeler (vert) + Message (bordeaux → ouvre messagerie in-app)
const DriverArrivedDetails: React.FC<{
  notification: Notification; reservation: Reservation;
  onCall: () => void; onMessage: () => void;
}> = ({ notification, reservation, onCall, onMessage }) => {
  const currentPos = notification.data?.driver_current_position as string | undefined;
  const etaMin     = notification.data?.eta_minutes             as number | undefined;
  const driver     = reservation.driver;
  const vehicle    = driver?.vehicle;

  // Corps de l'alerte : position + véhicule + consigne
  const alertBody = [
    currentPos ? `Position actuelle : ${currentPos}` : null,
    vehicle
      ? `Le chauffeur vous attend devant l'entrée principale. Véhicule : ${vehicle.brand} ${vehicle.model}${vehicle.color ? ` ${vehicle.color}` : ''}, plaque ${vehicle.plate_number}.`
      : "Le chauffeur vous attend devant l'entrée principale.",
  ].filter(Boolean).join('\n');

  return (
    <>
      {/* Alerte beige enrichie */}
      <AlertBanner
        icon="car-outline" iconColor={Colors.beige}
        borderColor={Colors.beigeLight} bg="#FEF7EE"
        title="Votre chauffeur arrive dans 5 minutes"
        body={alertBody}
      />

      {/* Informations du chauffeur */}
      {driver && <DriverCard reservation={reservation} accentColor={Colors.beige} />}

      {/* Point de rendez-vous */}
      <Section title="Point de rendez-vous" accentColor={Colors.beige}>
        <View style={arrivedSt.rdvRow}>
          <View style={arrivedSt.rdvDot}>
            <Ionicons name="location" size={18} color={Colors.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={arrivedSt.rdvAddr}>{reservation.pickup_address}</Text>
            <Text style={arrivedSt.rdvSub}>Le chauffeur vous attend à cette adresse</Text>
          </View>
        </View>
      </Section>

      {/* Footer ETA bordeaux — toujours affiché (ETA depuis data ou valeur par défaut 5) */}
      <View style={arrivedSt.etaFooter}>
        <View style={{ flex: 1 }}>
          <Text style={arrivedSt.etaLabel}>Temps d'arrivée estimé</Text>
          <Text style={arrivedSt.etaValue}>
            {etaMin ?? 5} minute{(etaMin ?? 5) > 1 ? 's' : ''}
          </Text>
          <Text style={arrivedSt.etaSub}>Soyez prêt, votre chauffeur arrive bientôt !</Text>
        </View>
        <View style={arrivedSt.etaCircle}>
          <Ionicons name="time-outline" size={28} color={Colors.white} />
        </View>
      </View>

      {/* CTAs : Appeler + Message */}
      <View style={ctaSt.row}>
        {driver?.user.phone && (
          <TouchableOpacity
            style={[ctaSt.btn, ctaSt.btnGreen, { flex: 1 }]}
            onPress={onCall}
            activeOpacity={0.8}
          >
            <Ionicons name="call-outline" size={17} color={Colors.white} style={{ marginRight: 6 }} />
            <Text style={ctaSt.btnText}>Appeler</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[ctaSt.btn, { flex: 1 }]}
          onPress={onMessage}
          activeOpacity={0.8}
        >
          <Ionicons name="chatbubble-outline" size={17} color={Colors.white} style={{ marginRight: 6 }} />
          <Text style={ctaSt.btnText}>Message</Text>
        </TouchableOpacity>
      </View>
    </>
  );
};
const arrivedSt = StyleSheet.create({
  rdvRow:     { flexDirection: 'row', alignItems: 'flex-start' },
  rdvDot:     { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.beige, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.sm },
  rdvAddr:    { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  rdvSub:     { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  // Footer ETA (bloc bordeaux en bas)
  etaFooter:  { marginHorizontal: Spacing.md, marginTop: Spacing.md, backgroundColor: Colors.bordeaux, borderRadius: Radius.lg, padding: Spacing.lg, flexDirection: 'row', alignItems: 'center' },
  etaLabel:   { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 2 },
  etaValue:   { fontSize: 28, fontWeight: '800', color: Colors.white },
  etaSub:     { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  etaCircle:  { width: 52, height: 52, borderRadius: 26, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center' },
});

// ── reservation_cancelled ────────────────────────────────────────────────────
const CancelledDetails: React.FC<{
  notification: Notification; reservation: Reservation;
}> = ({ notification, reservation }) => (
  <>
    <AlertBanner
      icon="close-circle-outline" iconColor={Colors.error}
      borderColor={Colors.errorLight} bg="#FEF5F5"
      title="Réservation annulée"
      body={reservation.comment ?? notification.body}
    />
    <Section title="Informations de réservation">
      <InfoRow label="N° de réservation" value={formatResaNumber(reservation)} />
      <InfoRow label="Date prévue"       value={formatDateTime(reservation.scheduled_at)} />
      <InfoRow label="Type de véhicule"  value={reservation.vehicle_type} />
    </Section>
    <ItineraryCard reservation={reservation} showMetrics={false} />
  </>
);

// ── invoice_available ─────────────────────────────────────────────────────────
const InvoiceDetails: React.FC<{ notification: Notification }> = ({ notification }) => {
  const { showToast } = useToast();
  return (
    <>
      <AlertBanner
        icon="document-text-outline" iconColor={Colors.textMuted}
        borderColor={Colors.border} bg={Colors.background}
        title="Votre facture est disponible"
        body={notification.body}
      />
      <Section title="Détails de la facture">
        {notification.data?.invoice_id && (
          <InfoRow
            label="N° facture"
            value={String(notification.data.invoice_id)}
            bold accent={Colors.bordeauxLight}
          />
        )}
        {notification.data?.amount && (
          <InfoRow label="Montant" value={formatPrice(Number(notification.data.amount))} bold />
        )}
        <InfoRow label="Statut" value="Disponible" bold />
      </Section>
      <TouchableOpacity
        style={ctaSt.btn}
        onPress={() =>
          showToast({ type: 'info', title: 'Téléchargement', message: "Fonctionnalité à brancher sur l'API factures." })
        }
        activeOpacity={0.8}
      >
        <Ionicons name="download-outline" size={17} color={Colors.white} style={{ marginRight: 6 }} />
        <Text style={ctaSt.btnText}>Télécharger la facture</Text>
      </TouchableOpacity>
    </>
  );
};

// ── trip_assigned ─────────────────────────────────────────────────────────────
// Texte et contenu différents selon le rôle :
//   chauffeur → alerte "Nouvelle course assignée" + infos course (pas de DriverCard)
//   client    → alerte "Chauffeur assigné" + infos course + DriverCard
const TripAssignedDetails: React.FC<{
  notification: Notification; user: AuthUser | null;
  reservation: Reservation; onNavigate: () => void;
}> = ({ user, reservation, onNavigate }) => {
  const isDriver = user?.role === 'driver';
  return (
    <>
      <AlertBanner
        icon="car-sport-outline" iconColor={Colors.bordeauxLight}
        borderColor={Colors.iconBg} bg="#FDF8F8"
        title={isDriver ? 'Nouvelle course assignée' : 'Chauffeur assigné'}
        body={
          isDriver
            ? 'Une nouvelle course vous a été attribuée. Consultez les détails ci-dessous.'
            : 'Un chauffeur a été assigné à votre course. Consultez les détails ci-dessous.'
        }
      />
      <Section title="Informations de la course">
        <InfoRow label="Heure de prise en charge" value={formatDateTime(reservation.scheduled_at)} bold />
        <InfoRow label="Passagers"                value={`${reservation.nb_passengers} personne${reservation.nb_passengers > 1 ? 's' : ''}`} />
        <InfoRow label="Type de véhicule"         value={reservation.vehicle_type} />
        {reservation.distance_km != null && (
          <InfoRow label="Distance estimée" value={`${reservation.distance_km} km`} />
        )}
        <InfoRow
          label="Prix estimé"
          value={formatPrice(reservation.price_estimated)}
          bold accent={Colors.bordeauxLight}
        />
      </Section>
      {!isDriver && reservation.driver && <DriverCard reservation={reservation} />}
      <ItineraryCard reservation={reservation} showMetrics={false} />
      <TouchableOpacity style={ctaSt.btn} onPress={onNavigate} activeOpacity={0.8}>
        <Text style={ctaSt.btnText}>Voir la course</Text>
      </TouchableOpacity>
    </>
  );
};

// ── document_expiry ───────────────────────────────────────────────────────────
const DocumentExpiryDetails: React.FC<{
  notification: Notification; onNavigate: () => void;
}> = ({ notification, onNavigate }) => (
  <>
    <AlertBanner
      icon="warning-outline" iconColor={Colors.warning}
      borderColor={Colors.warningLight} bg="#FFFBEB"
      title="Document expirant bientôt"
      body={notification.body}
    />
    {notification.data?.document_type && (
      <Section title="Détails du document" accentColor={Colors.warning}>
        <InfoRow label="Type" value={String(notification.data.document_type)} bold />
        {notification.data?.expiry_date && (
          <InfoRow
            label="Date d'expiration"
            value={formatDate(String(notification.data.expiry_date))}
            bold accent={Colors.warning}
          />
        )}
      </Section>
    )}
    <TouchableOpacity
      style={[ctaSt.btn, { backgroundColor: Colors.warning }]}
      onPress={onNavigate}
      activeOpacity={0.8}
    >
      <Ionicons name="document-text-outline" size={17} color={Colors.white} style={{ marginRight: 6 }} />
      <Text style={ctaSt.btnText}>Gérer mes documents</Text>
    </TouchableOpacity>
  </>
);

// ── new_reservation_admin ─────────────────────────────────────────────────────
const NewReservationAdminDetails: React.FC<{
  notification: Notification; reservation: Reservation; onNavigate: () => void;
}> = ({ reservation, onNavigate }) => (
  <>
    <AlertBanner
      icon="layers-outline" iconColor={Colors.bordeauxLight}
      borderColor={Colors.iconBg} bg="#FDF8F8"
      title="Nouvelle réservation en attente"
      body="Une réservation vient d'être créée. Assignez un chauffeur dès que possible."
    />
    <Section title="Informations de la réservation" accentColor={Colors.bordeauxLight}>
      <InfoRow label="N° de réservation" value={formatResaNumber(reservation)} accent={Colors.bordeauxLight} />
      <InfoRow label="Date et heure"     value={formatDateTime(reservation.scheduled_at)} bold />
      <InfoRow label="Type de véhicule"  value={reservation.vehicle_type} />
      <InfoRow
        label="Passagers"
        value={`${reservation.nb_passengers} personne${reservation.nb_passengers > 1 ? 's' : ''}`}
      />
      <InfoRow label="Prix estimé" value={formatPrice(reservation.price_estimated)} bold accent={Colors.bordeauxLight} />
    </Section>
    <ItineraryCard reservation={reservation} accentColor={Colors.bordeauxLight} showMetrics />
    <TouchableOpacity style={[ctaSt.btn, ctaSt.btnWarm]} onPress={onNavigate} activeOpacity={0.8}>
      <Ionicons name="person-add-outline" size={17} color={Colors.white} style={{ marginRight: 6 }} />
      <Text style={ctaSt.btnText}>Assigner un chauffeur</Text>
    </TouchableOpacity>
  </>
);

// ── Fallback ──────────────────────────────────────────────────────────────────
const GenericDetails: React.FC<{ notification: Notification }> = ({ notification }) => (
  <Section title="Détails">
    <Text style={{ fontSize: 14, color: Colors.textSecondary, lineHeight: 21 }}>{notification.body}</Text>
  </Section>
);

// ─────────────────────────────────────────────────────────────────────────────
// Screen principal
// ─────────────────────────────────────────────────────────────────────────────

const TYPES_NEEDING_RESERVATION = new Set([
  'reservation_confirmed',
  'trip_reminder',
  'driver_arrived',
  'reservation_cancelled',
  'trip_assigned',
  'new_reservation_admin',
]);

const NotificationDetailsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route      = useRoute<RouteProp<NotifDetailsParams, 'NotificationDetails'>>();
  const { notification } = route.params;

  const { user }                                  = useAuthStore();
  const { fetchById, selected, isLoading, error } = useReservation();

  const reservationId: string | undefined = notification.data?.reservation_id;
  const needsReservation = TYPES_NEEDING_RESERVATION.has(notification.type);
  const notifStyle       = NOTIF_STYLES[notification.type] ?? FALLBACK_STYLE;

  useEffect(() => {
    if (needsReservation && reservationId) {
      fetchById(reservationId);
    }
  }, [reservationId, needsReservation, fetchById]);

  // ── Retour vers la liste des notifications (avec fallback si pas d'historique) ──
  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    switch (user?.role) {
      case 'driver':  navigation.navigate('DriverNotificationList' as any);   break;
      case 'admin':   navigation.navigate('AdminNotificationList' as any);     break;
      case 'manager': navigation.navigate('ManagerNotificationList' as any);   break;
      default:        navigation.navigate('Notifications' as any);
    }
  }, [navigation, user?.role]);

  // ── Navigation selon le rôle ──────────────────────────────────────────────
  const navigateToReservation = useCallback(() => {
    if (!reservationId) return;
    switch (user?.role) {
      case 'driver':
        navigation.navigate('DriverReservations' as any, {
          screen: 'DriverReservationDetails',
          params: { reservationId },
        });
        break;
      case 'admin':
        navigation.navigate('AdminReservations' as any, {
          screen: 'AdminReservationDetail',
          params: { reservationId },
        });
        break;
      case 'manager':
        navigation.navigate('ManagerReservations' as any, {
          screen: 'ManagerReservationDetail',
          params: { reservationId },
        });
        break;
      case 'client':
      default:
        navigation.navigate('ReservationDetails', { reservationId });
    }
  }, [reservationId, user?.role, navigation]);

  // Appel téléphonique du chauffeur
  const callDriver = useCallback(() => {
    const phone = selected?.driver?.user.phone;
    if (phone) Linking.openURL(`tel:${phone}`);
  }, [selected?.driver?.user.phone]);

  // Messagerie in-app vers le chauffeur (driver_arrived)
  const openMessage = useCallback(() => {
    const driverId = selected?.driver?.id;
    navigation.navigate('Messages', driverId ? { driverId } : undefined);
  }, [selected?.driver?.id, navigation]);

  // ── Corps dynamique ───────────────────────────────────────────────────────
  const renderBody = () => {
    if (needsReservation) {
      if (isLoading || (!selected && !error)) {
        return (
          <View style={screenSt.centered}>
            <ActivityIndicator size="large" color={notifStyle.accentColor} />
            <Text style={[screenSt.loadingText, { color: notifStyle.accentColor }]}>
              Chargement de la course...
            </Text>
          </View>
        );
      }
      if (error || !selected) {
        return (
          <View style={screenSt.centered}>
            <Ionicons name="alert-circle-outline" size={40} color={Colors.error} />
            <Text style={screenSt.errorText}>
              {typeof error === 'string' ? error : 'Impossible de charger les détails.'}
            </Text>
          </View>
        );
      }
    }

    switch (notification.type) {
      case 'reservation_confirmed':
        return (
          <ReservationConfirmedDetails
            notification={notification}
            reservation={selected!}
            onNavigate={navigateToReservation}
          />
        );
      case 'trip_reminder':
        return (
          <TripReminderDetails
            notification={notification}
            reservation={selected!}
            onCall={callDriver}
            onNavigate={navigateToReservation}
          />
        );
      case 'driver_arrived':
        return (
          <DriverArrivedDetails
            notification={notification}
            reservation={selected!}
            onCall={callDriver}
            onMessage={openMessage}
          />
        );
      case 'reservation_cancelled':
        return (
          <CancelledDetails
            notification={notification}
            reservation={selected!}
          />
        );
      case 'trip_assigned':
        return (
          <TripAssignedDetails
            notification={notification}
            user={user}
            reservation={selected!}
            onNavigate={navigateToReservation}
          />
        );
      case 'invoice_available':
        return <InvoiceDetails notification={notification} />;
      case 'document_expiry':
        return (
          <DocumentExpiryDetails
            notification={notification}
            onNavigate={() => navigation.navigate('DriverDocuments')}
          />
        );
      case 'new_reservation_admin':
        return (
          <NewReservationAdminDetails
            notification={notification}
            reservation={selected!}
            onNavigate={navigateToReservation}
          />
        );
      // support_reply et new_message ne passent pas par cet écran :
      // la liste de notifications les redirige directement.
      default:
        return <GenericDetails notification={notification} />;
    }
  };

  return (
    <View style={[
      screenSt.container, { marginTop: Spacing.xl },
    ]}>
      {/* Barre de navigation */}
      <View style={screenSt.navBar}>
        <TouchableOpacity
          onPress={handleBack}
          style={screenSt.backBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.bordeauxDark} />
        </TouchableOpacity>
        <Text style={screenSt.navTitle}>Notification</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={screenSt.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero dynamique toujours visible */}
        <HeroBanner
          title={notification.title}
          iso={notification.created_at}
          style={notifStyle}
        />

        {/* Corps spécifique au type */}
        {renderBody()}

        <View style={{ height: Spacing.xl * 2 }} />
      </ScrollView>
    </View>
  );
};

const screenSt = StyleSheet.create({
  container:   { flex: 1, backgroundColor: Colors.background },
  navBar:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingTop: Platform.OS === 'ios' ? 52 : Spacing.lg, paddingBottom: Spacing.sm, backgroundColor: Colors.background },
  backBtn:     { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.beigeLight, justifyContent: 'center', alignItems: 'center' },
  navTitle:    { fontSize: 17, fontWeight: '700', color: Colors.bordeauxDark },
  scroll:      { paddingBottom: Spacing.xl },
  centered:    { marginTop: 60, alignItems: 'center', paddingHorizontal: Spacing.lg },
  loadingText: { marginTop: Spacing.sm, fontSize: 14 },
  errorText:   { marginTop: Spacing.sm, color: Colors.error, textAlign: 'center', fontSize: 14 },
});

export default NotificationDetailsScreen;
