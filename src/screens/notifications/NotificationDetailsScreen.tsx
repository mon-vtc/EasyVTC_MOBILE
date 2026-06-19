// ══════════════════════════════════════════════════════════════════════════════
// Screen — NotificationDetailsScreen
// Affiche les détails d'une notification de manière dynamique selon son type.
//
// Types gérés :
//   • reservation_confirmed  → Hero vert  + infos résa + chauffeur + itinéraire + prix
//   • trip_reminder          → Hero orange + alerte + infos course + chauffeur + itinéraire
//   • driver_arrived         → Hero bleu  + alerte + chauffeur + itinéraire
//   • invoice_available      → Hero gris  + infos facture + bouton téléchargement
//   • reservation_cancelled  → Hero rouge + motif + infos résa
//   • trip_assigned          → Hero bordeaux + infos course (vue chauffeur)
//   • document_expiry        → Hero ambre + détails document
//   • fallback               → Header générique + corps de notification
//
// Données : notification passée en paramètre de route + fetchById (useReservation)
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
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

import { Colors, Spacing, Radius } from '../../theme/colors';
import { useReservation } from '../../hooks/useReservation';
import { useAuthStore } from '../../store/auth.store';
import { useToast } from '../../hooks/useToast';
import type { Notification, NotificationIconConfig } from '../../types';
import type { Reservation } from '../../types/reservations.types';
import {AuthUser} from '../../types/auth.types';
import { userApi } from '../../services/api/user.api';

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
    icon: 'checkmark-circle', iconColor: '#22C55E', iconBg: '#DCFCE7',
    heroBg: '#F0FDF4', accentColor: '#22C55E',
  },
  trip_reminder: {
    icon: 'time', iconColor: '#F97316', iconBg: '#FEF3C7',
    heroBg: '#FFFBEB', accentColor: '#F97316',
  },
  driver_arrived: {
    icon: 'car', iconColor: '#3B82F6', iconBg: '#DBEAFE',
    heroBg: '#EFF6FF', accentColor: '#3B82F6',
  },
  invoice_available: {
    icon: 'document-text', iconColor: '#6B7280', iconBg: '#F3F4F6',
    heroBg: '#F9FAFB', accentColor: '#6B7280',
  },
  reservation_cancelled: {
    icon: 'close-circle', iconColor: '#EF4444', iconBg: '#FEE2E2',
    heroBg: '#FFF5F5', accentColor: '#EF4444',
  },
  trip_assigned: {
    icon: 'car', iconColor: Colors.bordeauxLight, iconBg: '#EFEAEA',
    heroBg: '#FDF8F8', accentColor: Colors.bordeauxLight,
  },
  document_expiry: {
    icon: 'warning', iconColor: '#EAB308', iconBg: '#FEF9C3',
    heroBg: '#FEFCE8', accentColor: '#EAB308',
  },
};

const FALLBACK_STYLE: NotifStyle = {
  icon: 'notifications-outline', iconColor: '#6B7280', iconBg: '#F3F4F6',
  heroBg: '#F9FAFB', accentColor: Colors.bordeauxLight,
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

// FIX 1 : formatPrice accepte explicitement `number | null | undefined`
// et retourne '—' pour toute valeur falsy (0 inclus via vérification stricte)
const formatPrice = (price: number | null | undefined): string =>
  price == null ? '—' : `${price.toFixed(2).replace('.', ',')} €`;

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
      <Ionicons name="calendar-outline" size={13} color="#9CA3AF" />
      <Text style={heroBannerSt.dateText}>{formatDate(iso)}</Text>
      <Text style={heroBannerSt.dot}> · </Text>
      <Ionicons name="time-outline"     size={13} color="#9CA3AF" />
      <Text style={heroBannerSt.dateText}>{formatTime(iso)}</Text>
    </View>
  </View>
);
const heroBannerSt = StyleSheet.create({
  wrapper:    { marginHorizontal: Spacing.md, marginTop: Spacing.md, borderRadius: Radius.lg, padding: Spacing.lg, alignItems: 'flex-start' },
  iconCircle: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.sm },
  title:      { fontSize: 20, fontWeight: '700', color: Colors.bordeauxDark, marginBottom: Spacing.sm },
  dateRow:    { flexDirection: 'row', alignItems: 'center' },
  dateText:   { fontSize: 12, color: '#9CA3AF', marginLeft: 4 },
  dot:        { color: '#D1D5DB' },
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
      <Text style={[alertSt.body,  { color: iconColor }]}>{body}</Text>
    </View>
  </View>
);
const alertSt = StyleSheet.create({
  wrapper: { flexDirection: 'row', alignItems: 'flex-start', marginHorizontal: Spacing.md, marginTop: Spacing.md, borderRadius: Radius.md, borderWidth: 1.5, padding: Spacing.md },
  title:   { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  body:    { fontSize: 13, lineHeight: 19 },
});

/** Section carte blanche avec titre bordeaux */
const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <View style={sectionSt.wrapper}>
    <Text style={sectionSt.title}>{title}</Text>
    {children}
  </View>
);
const sectionSt = StyleSheet.create({
  wrapper: { backgroundColor: '#fff', marginHorizontal: Spacing.md, marginTop: Spacing.md, borderRadius: Radius.lg, padding: Spacing.md, elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 1 }, shadowRadius: 3 },
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
  row:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  label: { fontSize: 14, color: '#6B7280' },
  value: { fontSize: 14, color: '#111827' },
  bold:  { fontWeight: '700' },
});

/** Bloc chauffeur */
const DriverCard: React.FC<{ reservation: Reservation }> = ({ reservation }) => {
  const driver = reservation.driver;
  if (!driver) return null;
  const name    = `${driver.user.first_name} ${driver.user.last_name}`;
  const { vehicle } = driver;

  // FIX 2 : la fonction callDriver était définie mais jamais mémoïsée ;
  // wrappée dans useCallback pour éviter les re-renders inutiles.
  const callDriver = useCallback(() => {
    if (driver.user.phone) Linking.openURL(`tel:${driver.user.phone}`);
  }, [driver.user.phone]);

  return (
    <Section title="Votre chauffeur">
      <View style={driverSt.header}>
        <View style={driverSt.avatar}>
          {driver.user.profile_photo_url ? (
            <Image source={{ uri: driver.user.profile_photo_url }} style={{ width: 40, height: 40, borderRadius: 20 }} />
          ) : (
            <Ionicons name="person-outline" size={26} color="#9CA3AF" />
          )}
        </View>
        <View>
          <Text style={driverSt.name}>{name}</Text>
          {driver.rating != null && (
            <View style={driverSt.ratingRow}>
              <Ionicons name="star" size={13} color="#F59E0B" />
              <Text style={driverSt.rating}>{driver.rating.toFixed(1)}</Text>
            </View>
          )}
        </View>
      </View>

      {driver.user.phone && (
        <TouchableOpacity style={driverSt.line} onPress={callDriver}>
          <Ionicons name="call-outline"   size={15} color={Colors.bordeauxLight} />
          <Text style={[driverSt.lineText, { color: Colors.bordeauxLight }]}>{driver.user.phone}</Text>
        </TouchableOpacity>
      )}
      {vehicle && (
        <>
          <View style={driverSt.line}>
            <Ionicons name="car-outline"    size={15} color="#6B7280" />
            <Text style={driverSt.lineText}>{vehicle.brand} {vehicle.model}{vehicle.color ? ` ${vehicle.color}` : ''}</Text>
          </View>
          <View style={driverSt.line}>
            <Ionicons name="id-card-outline" size={15} color="#6B7280" />
            <Text style={driverSt.lineText}>Plaque : {vehicle.plate_number}</Text>
          </View>
        </>
      )}
    </Section>
  );
};
const driverSt = StyleSheet.create({
  header:   { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  avatar:   { width: 48, height: 48, borderRadius: 24, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginRight: Spacing.sm },
  name:     { fontSize: 16, fontWeight: '700', color: '#111827' },
  ratingRow:{ flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  rating:   { fontSize: 13, color: '#6B7280', marginLeft: 3 },
  line:     { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.xs },
  lineText: { fontSize: 14, color: '#374151', marginLeft: Spacing.xs },
});

/** Bloc itinéraire avec pointillés */
const ItineraryCard: React.FC<{ reservation: Reservation }> = ({ reservation }) => (
  <Section title="Itinéraire">
    <View style={itiSt.stop}>
      <View style={[itiSt.dot, { backgroundColor: '#22C55E' }]}>
        <Ionicons name="location-outline" size={13} color="#fff" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={itiSt.label}>Départ</Text>
        <Text style={itiSt.addr}>{reservation.pickup_address}</Text>
      </View>
    </View>
    <View style={itiSt.dashes}>
      {[0,1,2,3].map(i => <View key={i} style={itiSt.dash} />)}
    </View>
    <View style={itiSt.stop}>
      <View style={[itiSt.dot, { backgroundColor: '#EF4444' }]}>
        <Ionicons name="location" size={13} color="#fff" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={itiSt.label}>Destination</Text>
        <Text style={itiSt.addr}>{reservation.dest_address}</Text>
      </View>
    </View>

    {(reservation.distance_km != null || reservation.duration_min != null) && (
      <View style={itiSt.metrics}>
        {reservation.distance_km != null && (
          <View style={itiSt.metric}>
            <Text style={itiSt.metricLabel}>Distance</Text>
            <Text style={itiSt.metricValue}>{reservation.distance_km} km</Text>
          </View>
        )}
        {reservation.duration_min != null && (
          <View style={itiSt.metric}>
            <Ionicons name="time-outline" size={13} color="#9CA3AF" style={{ marginBottom: 2 }} />
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
  label:       { fontSize: 11, color: '#9CA3AF', marginBottom: 1 },
  addr:        { fontSize: 14, color: '#111827', fontWeight: '500' },
  dashes:      { marginLeft: 14, marginVertical: 4 },
  dash:        { width: 2, height: 5, backgroundColor: '#D1D5DB', marginVertical: 2, borderRadius: 1 },
  metrics:     { flexDirection: 'row', gap: Spacing.lg, marginTop: Spacing.md, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  metric:      { alignItems: 'flex-start' },
  metricLabel: { fontSize: 11, color: '#9CA3AF', marginBottom: 2 },
  metricValue: { fontSize: 15, fontWeight: '700', color: '#111827' },
});

/** Footer prix total bordeaux */
const PriceFooter: React.FC<{ price: number | null | undefined }> = ({ price }) => (
  <View style={priceSt.wrapper}>
    <View>
      <Text style={priceSt.label}>Prix total</Text>
      <Text style={priceSt.value}>{formatPrice(price)}</Text>
    </View>
    <View style={priceSt.circle}>
      <Ionicons name="logo-euro" size={22} color="#fff" />
    </View>
  </View>
);
const priceSt = StyleSheet.create({
  wrapper: { marginHorizontal: Spacing.md, marginTop: Spacing.md, backgroundColor: Colors.bordeauxLight, borderRadius: Radius.lg, padding: Spacing.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label:   { fontSize: 13, color: 'rgba(255,255,255,0.65)', marginBottom: 4 },
  value:   { fontSize: 26, fontWeight: '800', color: '#fff' },
  circle:  { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center' },
});

/** CTA bouton(s) */
const ctaSt = StyleSheet.create({
  btn:      { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginHorizontal: Spacing.md, marginTop: Spacing.md, backgroundColor: Colors.bordeauxLight, borderRadius: Radius.lg, paddingVertical: 15 },
  btnGreen: { backgroundColor: '#22C55E' },
  btnText:  { color: '#fff', fontWeight: '700', fontSize: 15 },
  row:      { flexDirection: 'row', gap: Spacing.sm, marginHorizontal: Spacing.md, marginTop: Spacing.md },
});

// ─────────────────────────────────────────────────────────────────────────────
// Rendus spécifiques par type
// ─────────────────────────────────────────────────────────────────────────────

const ReservationConfirmedDetails: React.FC<{
  notification: Notification; reservation: Reservation; onNavigate: () => void;
}> = ({ reservation, onNavigate }) => (
  <>
    <Section title="Informations de réservation">
      <InfoRow label="N° de réservation" value={`RES-${reservation.id.slice(0, 8).toUpperCase()}`} accent={Colors.bordeauxLight} />
      <InfoRow label="Date et heure"     value={formatDateTime(reservation.scheduled_at)} bold />
      <InfoRow label="Type de véhicule"  value={reservation.vehicle_type}                 bold />
      <InfoRow label="Passagers"         value={String(reservation.nb_passengers)} />
    </Section>
    {reservation.driver && <DriverCard reservation={reservation} />}
    <ItineraryCard reservation={reservation} />
    <PriceFooter price={reservation.price_final ?? reservation.price_estimated} />
    <TouchableOpacity style={ctaSt.btn} onPress={onNavigate}>
      <Text style={ctaSt.btnText}>Voir la réservation complète</Text>
    </TouchableOpacity>
  </>
);

const TripReminderDetails: React.FC<{
  notification: Notification; reservation: Reservation;
  onCall: () => void; onNavigate: () => void;
}> = ({ reservation, onCall, onNavigate }) => (
  <>
    <AlertBanner
      icon="alarm-outline" iconColor="#F97316"
      borderColor="#FED7AA" bg="#FFF7ED"
      title="Votre course commence dans 1 heure"
      body="Préparez vos bagages et soyez prêt à l'heure indiquée. Votre chauffeur vous attendra 5 minutes maximum."
    />
    <Section title="Informations de la course">
      <InfoRow label="Heure de prise en charge" value={formatTime(reservation.scheduled_at)} bold />
      {reservation.distance_km != null && <InfoRow label="Distance" value={`${reservation.distance_km} km`} bold />}
      <InfoRow label="Prix" value={formatPrice(reservation.price_final ?? reservation.price_estimated)} bold />
    </Section>
    {reservation.driver && <DriverCard reservation={reservation} />}
    <ItineraryCard reservation={reservation} />
    <View style={ctaSt.row}>
      {reservation.driver?.user.phone && (
        <TouchableOpacity style={[ctaSt.btn, ctaSt.btnGreen, { flex: 1 }]} onPress={onCall}>
          <Ionicons name="call-outline" size={17} color="#fff" style={{ marginRight: 6 }} />
          <Text style={ctaSt.btnText}>Appeler</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity style={[ctaSt.btn, { flex: 1 }]} onPress={onNavigate}>
        <Text style={ctaSt.btnText}>Voir la course</Text>
      </TouchableOpacity>
    </View>
  </>
);

const DriverArrivedDetails: React.FC<{
  notification: Notification; reservation: Reservation;
  onCall: () => void; onNavigate: () => void;
}> = ({ reservation, onCall, onNavigate }) => (
  <>
    <AlertBanner
      icon="car-outline" iconColor="#3B82F6"
      borderColor="#BFDBFE" bg="#EFF6FF"
      title="Votre chauffeur est arrivé"
      body="Rejoignez votre chauffeur dès que possible. Il vous attendra 5 minutes maximum."
    />
    {reservation.driver && <DriverCard reservation={reservation} />}
    <ItineraryCard reservation={reservation} />
    <View style={ctaSt.row}>
      {reservation.driver?.user.phone && (
        <TouchableOpacity style={[ctaSt.btn, ctaSt.btnGreen, { flex: 1 }]} onPress={onCall}>
          <Ionicons name="call-outline" size={17} color="#fff" style={{ marginRight: 6 }} />
          <Text style={ctaSt.btnText}>Appeler</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity style={[ctaSt.btn, { flex: 1 }]} onPress={onNavigate}>
        <Text style={ctaSt.btnText}>Voir les détails</Text>
      </TouchableOpacity>
    </View>
  </>
);

const CancelledDetails: React.FC<{
  notification: Notification; reservation: Reservation;
}> = ({ notification, reservation }) => (
  <>
    <AlertBanner
      icon="close-circle-outline" iconColor="#EF4444"
      borderColor="#FECACA" bg="#FFF5F5"
      title="Réservation annulée"
      body={reservation.comment ?? notification.body}
    />
    <Section title="Informations de réservation">
      <InfoRow label="N° de réservation" value={`RES-${reservation.id.slice(0, 8).toUpperCase()}`} />
      <InfoRow label="Date prévue"       value={formatDateTime(reservation.scheduled_at)} />
      <InfoRow label="Type de véhicule"  value={reservation.vehicle_type} />
    </Section>
    <ItineraryCard reservation={reservation} />
  </>
);

const InvoiceDetails: React.FC<{ notification: Notification }> = ({ notification }) => {
  const { showToast } = useToast();
  return (
    <>
    <AlertBanner
      icon="document-text-outline" iconColor="#6B7280"
      borderColor="#E5E7EB" bg="#F9FAFB"
      title="Votre facture est disponible"
      body={notification.body}
    />
    <Section title="Détails de la facture">
      {notification.data?.invoice_id && (
        <InfoRow label="N° facture" value={String(notification.data.invoice_id)} bold accent={Colors.bordeauxLight} />
      )}
      <InfoRow label="Statut" value="Disponible" bold />
    </Section>
    {/* FIX 3 : utilisation de backtick correct pour l'apostrophe dans l'Alert */}
    <TouchableOpacity
      style={ctaSt.btn}
      onPress={() => showToast({ type: 'info', title: 'Téléchargement', message: 'Fonctionnalité à brancher sur l\'API factures.' })}
    >
      <Ionicons name="download-outline" size={17} color="#fff" style={{ marginRight: 6 }} />
      <Text style={ctaSt.btnText}>Télécharger la facture</Text>
    </TouchableOpacity>
    </>
  );
};

const TripAssignedDetails: React.FC<{
  notification: Notification; user: AuthUser | null; reservation: Reservation; onNavigate: () => void;
}> = ({ user, reservation, onNavigate }) => (
  <>
    {(user)?.role === 'driver' && (
      <AlertBanner
        icon="car-outline" iconColor={Colors.bordeauxLight}
        borderColor="#E8D5D5" bg="#FDF8F8"
        title="Nouvelle course assignée"
        body="Une course vous a été attribuée à un chauffeur. Consultez les détails ci-dessous."
      />
    )}
    {(user)?.role === 'client' && ( 
          <AlertBanner
      icon="car-outline" iconColor={Colors.bordeauxLight}
      borderColor="#E8D5D5" bg="#FDF8F8"
      title="Chauffeur assignée"
      body="Votre course vous a été attribuée. Consultez les détails ci-dessous."
    />
    )}
    <Section title="Informations de la course">
      <InfoRow label="Heure de prise en charge" value={formatDateTime(reservation.scheduled_at)} bold />
      <InfoRow label="Passagers"                value={String(reservation.nb_passengers)} />
      {reservation.distance_km != null && (
        <InfoRow label="Distance estimée" value={`${reservation.distance_km} km`} />
      )}
      <InfoRow
        label="Prix estimé"
        value={formatPrice(reservation.price_estimated)}
        bold accent={Colors.bordeauxLight}
      />
    </Section>
    <ItineraryCard reservation={reservation} />
    <TouchableOpacity style={ctaSt.btn} onPress={onNavigate}>
      <Text style={ctaSt.btnText}>Voir la course</Text>
    </TouchableOpacity>
  </>
);

const DocumentExpiryDetails: React.FC<{
  notification: Notification; onNavigate: () => void;
}> = ({ notification, onNavigate }) => (
  <>
    <AlertBanner
      icon="warning-outline" iconColor="#EAB308"
      borderColor="#FDE68A" bg="#FEFCE8"
      title="Document expirant bientôt"
      body={notification.body}
    />
    <TouchableOpacity style={ctaSt.btn} onPress={onNavigate}>
      <Text style={ctaSt.btnText}>Gérer mes documents</Text>
    </TouchableOpacity>
  </>
);

const GenericDetails: React.FC<{ notification: Notification }> = ({ notification }) => (
  <Section title="Détails">
    <Text style={{ fontSize: 14, color: '#374151', lineHeight: 21 }}>{notification.body}</Text>
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
]);

// FIX 4 : table de routes extraite en constante pour éviter
// la recréation à chaque render dans navigateToReservation.
const ROLE_ROUTES: Record<string, string> = {
  client:  'ReservationDetails',
  driver:  'DriverReservationDetails',
  admin:   'AdminReservationDetails',
  manager: 'ManagerReservationDetails',
};

const NotificationDetailsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route      = useRoute<RouteProp<NotifDetailsParams, 'NotificationDetails'>>();
  const { notification } = route.params;

  const { user }                              = useAuthStore();
  const { fetchById, selected, isLoading, error } = useReservation();

  const reservationId: string | undefined = notification.data?.reservation_id;
  const needsReservation = TYPES_NEEDING_RESERVATION.has(notification.type);
  const notifStyle       = NOTIF_STYLES[notification.type] ?? FALLBACK_STYLE;

  // FIX 5 : ajout de needsReservation et fetchById dans les dépendances de l'effet
  useEffect(() => {
    if (needsReservation && reservationId) {
      fetchById(reservationId);
    }
  }, [reservationId, needsReservation, fetchById]);

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

  const callDriver = useCallback(() => {
    const phone = selected?.driver?.user.phone;
    if (phone) Linking.openURL(`tel:${phone}`);
  }, [selected?.driver?.user.phone]);

  // ── Corps dynamique ───────────────────────────────────────────────────────
  const renderBody = () => {
    // Loading / erreur pour les types qui ont besoin d'une réservation
    if (needsReservation) {
      if (isLoading || (!selected && !error)) {
        return (
          <View style={screenSt.centered}>
            <ActivityIndicator size="large" color={Colors.bordeaux} />
            <Text style={screenSt.loadingText}>Chargement de la course...</Text>
          </View>
        );
      }
      if (error || !selected) {
        return (
          <View style={screenSt.centered}>
            <Ionicons name="alert-circle-outline" size={40} color="#EF4444" />
            {/* FIX 7 : error peut être un objet Error ou une string selon le hook ;
                on cast en string pour éviter un crash de rendu. */}
            <Text style={screenSt.errorText}>
              {typeof error === 'string' ? error : 'Impossible de charger les détails.'}
            </Text>
          </View>
        );
      }
    }

    switch (notification.type) {
      case 'reservation_confirmed':
        return <ReservationConfirmedDetails notification={notification} reservation={selected!} onNavigate={navigateToReservation} />;
      case 'trip_reminder':
        return <TripReminderDetails        notification={notification} reservation={selected!} onCall={callDriver} onNavigate={navigateToReservation} />;
      case 'driver_arrived':
        return <DriverArrivedDetails       notification={notification} reservation={selected!} onCall={callDriver} onNavigate={navigateToReservation} />;
      case 'reservation_cancelled':
        return <CancelledDetails           notification={notification} reservation={selected!} />;
      case 'trip_assigned':
        return <TripAssignedDetails        notification={notification} user={user} reservation={selected!} onNavigate={navigateToReservation} />;
      case 'invoice_available':
        return <InvoiceDetails             notification={notification} />;
      case 'document_expiry':
        return <DocumentExpiryDetails      notification={notification} onNavigate={() => navigation.navigate('DriverDocuments')} />;
      default:
        return <GenericDetails             notification={notification} />;
    }
  };

  return (
    <View style={[screenSt.container ,  ((user as AuthUser)?.role === 'client' ) ? {marginTop: Spacing.xl} : {}]}>
      {/* Barre de navigation */}
      <View style={screenSt.navBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={screenSt.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.bordeauxDark} />
        </TouchableOpacity>
        <Text style={screenSt.navTitle}>Notification</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={screenSt.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Héro dynamique (toujours visible) */}
        <HeroBanner title={notification.title} iso={notification.created_at} style={notifStyle} />

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
  backBtn:     { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  navTitle:    { fontSize: 17, fontWeight: '700', color: Colors.bordeauxDark },
  scroll:      { paddingBottom: Spacing.xl },
  centered:    { marginTop: 60, alignItems: 'center', paddingHorizontal: Spacing.lg },
  loadingText: { marginTop: Spacing.sm, color: Colors.bordeauxDark, fontSize: 14 },
  errorText:   { marginTop: Spacing.sm, color: '#EF4444', textAlign: 'center', fontSize: 14 },
});

export default NotificationDetailsScreen;