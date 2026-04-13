// screens/client/BookingConfirmationScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, Platform,
} from 'react-native';
import { Ionicons }       from '@expo/vector-icons';
import { Colors, Fonts, Spacing, Radius } from '../../theme/colors';
import { useAuthStore }   from '../../store/auth.store';
import { reservationApi } from '../../services/api/reservation.api';
import type { BottomTabScreenProps }  from '@react-navigation/bottom-tabs';
import type { ClientTabParamList }    from '../../types/auth.types';
import type { Reservation }           from '../../types/reservation.types';
import { RESERVATION_STATUS_LABELS }  from '../../types/reservation.types';

type Props = BottomTabScreenProps<ClientTabParamList, 'BookingConfirmation'>;

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={s.infoRow}>
      <Ionicons name={icon as any} size={18} color={Colors.bordeaux} style={s.infoIcon} />
      <View style={s.infoTexts}>
        <Text style={s.infoLabel}>{label}</Text>
        <Text style={s.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

export default function BookingConfirmationScreen({ route, navigation }: Props) {
  const { reservationId } = route.params;
  const token = useAuthStore(s => s.accessToken) ?? '';

  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await reservationApi.getById(token, reservationId);
        if (res.ok && res.data) setReservation(res.data);
        else setError(res.message ?? 'Impossible de charger la réservation');
      } catch {
        setError('Erreur de chargement');
      } finally {
        setLoading(false);
      }
    })();
  }, [reservationId, token]);

  const handleGoHome = () => {
    navigation.reset({ index: 0, routes: [{ name: 'ClientHome' }] });
  };

  const handleGoReservations = () => {
    navigation.navigate('MyReservations');
  };

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={Colors.bordeaux} />
      </View>
    );
  }

  if (error || !reservation) {
    return (
      <View style={s.center}>
        <Ionicons name="alert-circle-outline" size={48} color={Colors.error} />
        <Text style={s.errorText}>{error ?? 'Réservation introuvable'}</Text>
        <TouchableOpacity style={s.btnPrimary} onPress={handleGoHome}>
          <Text style={s.btnPrimaryText}>Retour à l'accueil</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const scheduled = new Date(reservation.scheduled_at);
  const dateStr = scheduled.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const timeStr = scheduled.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  const VEHICLE_LABELS: Record<string, string> = { standard: 'Standard', berline: 'Berline', van: 'Van' };

  return (
    <View style={s.container}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Icône succès */}
        <View style={s.successBanner}>
          <View style={s.successCircle}>
            <Ionicons name="checkmark" size={40} color={Colors.white} />
          </View>
          <Text style={s.successTitle}>Réservation confirmée !</Text>
          <Text style={s.successSub}>
            Votre demande a bien été enregistrée.{'\n'}
            Un gestionnaire vous assignera un chauffeur.
          </Text>
        </View>

        {/* Référence */}
        <View style={s.refCard}>
          <Text style={s.refLabel}>Référence</Text>
          <Text style={s.refValue}>{reservation.ref_number}</Text>
          <View style={s.statusBadge}>
            <Text style={s.statusText}>{RESERVATION_STATUS_LABELS[reservation.status]}</Text>
          </View>
        </View>

        {/* Détails trajet */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Détails du trajet</Text>

          <View style={s.routeBlock}>
            <View style={s.routeRow}>
              <View style={[s.routeDot, { backgroundColor: '#10B981' }]} />
              <View style={s.routeTexts}>
                <Text style={s.routeLabel}>Départ</Text>
                <Text style={s.routeValue}>{reservation.origin_address}</Text>
              </View>
            </View>
            <View style={s.routeConnector} />
            <View style={s.routeRow}>
              <View style={[s.routeDot, { backgroundColor: Colors.bordeaux }]} />
              <View style={s.routeTexts}>
                <Text style={s.routeLabel}>Destination</Text>
                <Text style={s.routeValue}>{reservation.destination_address}</Text>
              </View>
            </View>
          </View>

          <View style={s.divider} />

          <InfoRow icon="calendar-outline"   label="Date"     value={dateStr} />
          <InfoRow icon="time-outline"        label="Heure"    value={timeStr} />
          <InfoRow icon="car-outline"         label="Véhicule" value={VEHICLE_LABELS[reservation.vehicle_type] ?? reservation.vehicle_type} />
          {reservation.estimated_price != null && (
            <InfoRow
              icon="pricetag-outline"
              label="Prix estimé"
              value={`${reservation.estimated_price.toFixed(2)} ${reservation.currency ?? '€'}`}
            />
          )}
          {reservation.comment && (
            <InfoRow icon="chatbubble-outline" label="Commentaire" value={reservation.comment} />
          )}
        </View>

        {/* Info paiement */}
        <View style={s.paymentNote}>
          <Ionicons name="information-circle-outline" size={18} color={Colors.bordeaux} />
          <Text style={s.paymentText}>
            Paiement hors application — espèces ou CB directement au chauffeur en fin de course.
          </Text>
        </View>

      </ScrollView>

      {/* Boutons bas */}
      <View style={s.footer}>
        <TouchableOpacity style={s.btnSecondary} onPress={handleGoReservations}>
          <Text style={s.btnSecondaryText}>Mes réservations</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.btnPrimary} onPress={handleGoHome}>
          <Ionicons name="home-outline" size={18} color={Colors.white} />
          <Text style={s.btnPrimaryText}>Accueil</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll:    { padding: Spacing.md, paddingBottom: Spacing.xxl },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, gap: Spacing.md },
  errorText: { fontSize: Fonts.size.md, color: Colors.error, textAlign: 'center' },

  // Bannière succès
  successBanner: { alignItems: 'center', paddingVertical: Spacing.xl },
  successCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#10B981',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.md,
    shadowColor: '#10B981', shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },
  successTitle: { fontSize: Fonts.size.xxl, fontWeight: '800', color: Colors.textPrimary, marginBottom: Spacing.xs },
  successSub:   { fontSize: Fonts.size.sm, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },

  // Référence
  refCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, alignItems: 'center',
    marginBottom: Spacing.md,
  },
  refLabel:    { fontSize: Fonts.size.xs, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  refValue:    { fontSize: Fonts.size.xl, fontWeight: '800', color: Colors.bordeaux, marginVertical: 4 },
  statusBadge: { backgroundColor: '#FFF3E0', borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: 4 },
  statusText:  { fontSize: Fonts.size.sm, fontWeight: '600', color: '#E65100' },

  // Carte détails
  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, marginBottom: Spacing.md,
  },
  cardTitle: { fontSize: Fonts.size.md, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.md },

  // Trajet
  routeBlock:     { gap: 0 },
  routeRow:       { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  routeDot:       { width: 10, height: 10, borderRadius: 5, marginTop: 4, flexShrink: 0 },
  routeTexts:     { flex: 1 },
  routeLabel:     { fontSize: Fonts.size.xs, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.4 },
  routeValue:     { fontSize: Fonts.size.sm, fontWeight: '500', color: Colors.textPrimary, marginTop: 1 },
  routeConnector: { width: 1, height: 14, backgroundColor: Colors.border, marginLeft: 4, marginVertical: 3 },
  divider:        { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.md },

  // Info rows
  infoRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, marginBottom: Spacing.sm },
  infoIcon:  { marginTop: 2 },
  infoTexts: { flex: 1 },
  infoLabel: { fontSize: Fonts.size.xs, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.4 },
  infoValue: { fontSize: Fonts.size.sm, fontWeight: '500', color: Colors.textPrimary, marginTop: 1 },

  // Paiement
  paymentNote: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
    backgroundColor: Colors.overlayLight, borderRadius: Radius.md,
    padding: Spacing.md, marginBottom: Spacing.md,
  },
  paymentText: { flex: 1, fontSize: Fonts.size.sm, color: Colors.bordeaux, lineHeight: 18 },

  // Footer
  footer: {
    flexDirection: 'row', gap: Spacing.sm,
    padding: Spacing.md, paddingBottom: Platform.OS === 'ios' ? 32 : Spacing.md,
    backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.border,
  },
  btnSecondary: {
    flex: 1, height: 50, borderRadius: Radius.md,
    borderWidth: 1.5, borderColor: Colors.bordeaux,
    alignItems: 'center', justifyContent: 'center',
  },
  btnSecondaryText: { color: Colors.bordeaux, fontSize: Fonts.size.md, fontWeight: '700' },
  btnPrimary: {
    flex: 1, height: 50, borderRadius: Radius.md,
    backgroundColor: Colors.bordeaux,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs,
  },
  btnPrimaryText: { color: Colors.white, fontSize: Fonts.size.md, fontWeight: '700' },
});
