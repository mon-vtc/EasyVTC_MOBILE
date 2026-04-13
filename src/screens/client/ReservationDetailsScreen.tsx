// screens/client/ReservationDetailsScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, Alert, Platform,
} from 'react-native';
import { Ionicons }       from '@expo/vector-icons';
import { Colors, Fonts, Spacing, Radius } from '../../theme/colors';
import { useAuthStore }   from '../../store/auth.store';
import { useReservationStore } from '../../store/reservation.store';
import { reservationApi } from '../../services/api/reservation.api';
import type { BottomTabScreenProps }  from '@react-navigation/bottom-tabs';
import type { ClientTabParamList }    from '../../types/auth.types';
import type { Reservation }           from '../../types/reservation.types';
import { RESERVATION_STATUS_LABELS, RESERVATION_STATUS_COLORS } from '../../types/reservation.types';

type Props = BottomTabScreenProps<ClientTabParamList, 'ReservationDetails'>;

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={s.infoRow}>
      <Ionicons name={icon as any} size={17} color={Colors.bordeaux} style={s.infoIcon} />
      <View style={s.infoTexts}>
        <Text style={s.infoLabel}>{label}</Text>
        <Text style={s.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

const VEHICLE_LABELS: Record<string, string> = {
  standard: 'Standard',
  berline:  'Berline',
  van:      'Van',
};

export default function ReservationDetailsScreen({ route, navigation }: Props) {
  const { reservationId } = route.params;
  const token   = useAuthStore(s => s.accessToken) ?? '';
  const { cancel } = useReservationStore();

  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [cancelling,  setCancelling]  = useState(false);
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

  const handleCancel = () => {
    if (!reservation) return;
    Alert.alert(
      'Annuler la réservation',
      `Voulez-vous annuler la course ${reservation.ref_number} ?`,
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui, annuler',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            try {
              await cancel(token, reservation.id);
              // Recharger
              const res = await reservationApi.getById(token, reservationId);
              if (res.ok && res.data) setReservation(res.data);
            } catch (e: any) {
              Alert.alert('Erreur', e?.message ?? "Impossible d'annuler");
            } finally {
              setCancelling(false);
            }
          },
        },
      ],
    );
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
        <TouchableOpacity style={s.btnPrimary} onPress={() => navigation.goBack()}>
          <Text style={s.btnPrimaryText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const scheduled = new Date(reservation.scheduled_at);
  const dateStr = scheduled.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const timeStr = scheduled.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  const statusColor = RESERVATION_STATUS_COLORS[reservation.status];
  const canCancel = reservation.status === 'pending' || reservation.status === 'assigned';

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={Colors.white} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Détails</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Référence + Statut */}
        <View style={s.refCard}>
          <Text style={s.refLabel}>Référence</Text>
          <Text style={s.refValue}>{reservation.ref_number}</Text>
          <View style={[s.statusBadge, { backgroundColor: statusColor + '22' }]}>
            <View style={[s.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[s.statusText, { color: statusColor }]}>
              {RESERVATION_STATUS_LABELS[reservation.status]}
            </Text>
          </View>
        </View>

        {/* Trajet */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Trajet</Text>
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
        </View>

        {/* Infos course */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Informations</Text>
          <InfoRow icon="calendar-outline"  label="Date"        value={dateStr} />
          <InfoRow icon="time-outline"       label="Heure"       value={timeStr} />
          <InfoRow icon="car-outline"        label="Véhicule"    value={VEHICLE_LABELS[reservation.vehicle_type] ?? reservation.vehicle_type} />
          <InfoRow icon="people-outline"     label="Passagers"   value={String(reservation.passengers)} />
          <InfoRow icon="briefcase-outline"  label="Bagages"     value={String(reservation.luggage)} />
          {reservation.distance_km > 0 && (
            <InfoRow icon="map-outline"      label="Distance"    value={`${reservation.distance_km.toFixed(1)} km`} />
          )}
          {reservation.estimated_price != null && (
            <InfoRow
              icon="pricetag-outline"
              label="Prix estimé"
              value={`${reservation.estimated_price.toFixed(2)} ${reservation.currency ?? '€'}`}
            />
          )}
          {reservation.final_price != null && (
            <InfoRow
              icon="cash-outline"
              label="Prix final"
              value={`${reservation.final_price.toFixed(2)} ${reservation.currency ?? '€'}`}
            />
          )}
          {reservation.comment && (
            <InfoRow icon="chatbubble-outline" label="Commentaire" value={reservation.comment} />
          )}
        </View>

        {/* Chauffeur assigné */}
        {reservation.driver && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Chauffeur</Text>
            <View style={s.driverRow}>
              <View style={s.driverAvatar}>
                <Ionicons name="person" size={24} color={Colors.bordeaux} />
              </View>
              <View style={s.driverInfo}>
                <Text style={s.driverName}>
                  {reservation.driver.first_name} {reservation.driver.last_name}
                </Text>
                {reservation.driver.phone && (
                  <Text style={s.driverPhone}>{reservation.driver.phone}</Text>
                )}
                {reservation.driver.vehicle && (
                  <Text style={s.driverVehicle}>
                    {reservation.driver.vehicle.brand} {reservation.driver.vehicle.model} · {reservation.driver.vehicle.color} · {reservation.driver.vehicle.plate}
                  </Text>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Info paiement */}
        <View style={s.paymentNote}>
          <Ionicons name="information-circle-outline" size={18} color={Colors.bordeaux} />
          <Text style={s.paymentText}>
            Paiement hors application — espèces ou CB directement au chauffeur en fin de course.
          </Text>
        </View>

        {/* Annulation */}
        {reservation.cancelled_at && reservation.cancellation_reason && (
          <View style={s.cancelledNote}>
            <Ionicons name="close-circle-outline" size={18} color="#EF4444" />
            <View style={{ flex: 1 }}>
              <Text style={s.cancelledTitle}>Réservation annulée</Text>
              <Text style={s.cancelledReason}>{reservation.cancellation_reason}</Text>
            </View>
          </View>
        )}

      </ScrollView>

      {/* Footer */}
      {canCancel && (
        <View style={s.footer}>
          <TouchableOpacity
            style={[s.cancelBtn, cancelling && { opacity: 0.6 }]}
            onPress={handleCancel}
            disabled={cancelling}
          >
            {cancelling
              ? <ActivityIndicator size="small" color="#EF4444" />
              : <Text style={s.cancelBtnText}>Annuler la réservation</Text>
            }
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll:    { padding: Spacing.md, paddingBottom: Spacing.xxl },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, gap: Spacing.md },
  errorText: { fontSize: Fonts.size.md, color: Colors.error, textAlign: 'center' },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 56 : Spacing.xl,
    paddingHorizontal: Spacing.md, paddingBottom: Spacing.md,
    backgroundColor: Colors.bordeaux,
    borderBottomLeftRadius: Radius.xl, borderBottomRightRadius: Radius.xl,
  },
  backBtn:     { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)' },
  headerTitle: { fontSize: Fonts.size.lg, fontWeight: '800', color: Colors.white },

  // Référence
  refCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, alignItems: 'center', marginBottom: Spacing.md, marginTop: Spacing.md,
  },
  refLabel:    { fontSize: Fonts.size.xs, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  refValue:    { fontSize: Fonts.size.xl, fontWeight: '800', color: Colors.bordeaux, marginVertical: 4 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: 4 },
  statusDot:   { width: 6, height: 6, borderRadius: 3 },
  statusText:  { fontSize: Fonts.size.sm, fontWeight: '600' },

  // Carte
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

  // Info rows
  infoRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, marginBottom: Spacing.sm },
  infoIcon:  { marginTop: 2 },
  infoTexts: { flex: 1 },
  infoLabel: { fontSize: Fonts.size.xs, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.4 },
  infoValue: { fontSize: Fonts.size.sm, fontWeight: '500', color: Colors.textPrimary, marginTop: 1 },

  // Chauffeur
  driverRow:    { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  driverAvatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: Colors.overlayLight,
    alignItems: 'center', justifyContent: 'center',
  },
  driverInfo:   { flex: 1 },
  driverName:   { fontSize: Fonts.size.md, fontWeight: '700', color: Colors.textPrimary },
  driverPhone:  { fontSize: Fonts.size.sm, color: Colors.textMuted, marginTop: 2 },
  driverVehicle:{ fontSize: Fonts.size.xs, color: Colors.textMuted, marginTop: 2 },

  // Paiement
  paymentNote: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
    backgroundColor: Colors.overlayLight, borderRadius: Radius.md,
    padding: Spacing.md, marginBottom: Spacing.md,
  },
  paymentText: { flex: 1, fontSize: Fonts.size.sm, color: Colors.bordeaux, lineHeight: 18 },

  // Annulation
  cancelledNote: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
    backgroundColor: '#FEF2F2', borderRadius: Radius.md,
    padding: Spacing.md, marginBottom: Spacing.md,
    borderWidth: 1, borderColor: '#FECACA',
  },
  cancelledTitle:  { fontSize: Fonts.size.sm, fontWeight: '700', color: '#EF4444' },
  cancelledReason: { fontSize: Fonts.size.xs, color: '#B91C1C', marginTop: 2 },

  // Footer
  footer: {
    padding: Spacing.md, paddingBottom: Platform.OS === 'ios' ? 32 : Spacing.md,
    backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.border,
  },
  cancelBtn: {
    height: 50, borderRadius: Radius.md,
    borderWidth: 1.5, borderColor: '#EF4444',
    alignItems: 'center', justifyContent: 'center',
  },
  cancelBtnText: { color: '#EF4444', fontSize: Fonts.size.md, fontWeight: '700' },

  btnPrimary: {
    paddingHorizontal: Spacing.xl, height: 48, borderRadius: Radius.md,
    backgroundColor: Colors.bordeaux, alignItems: 'center', justifyContent: 'center',
  },
  btnPrimaryText: { color: Colors.white, fontSize: Fonts.size.md, fontWeight: '700' },
});
