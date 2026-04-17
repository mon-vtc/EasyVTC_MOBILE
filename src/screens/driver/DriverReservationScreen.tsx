import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Modal, Linking, Platform, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useReservation } from '../../hooks/useReservation';
import { Colors, Fonts, Spacing, Radius } from '../../theme/colors';
import type { Reservation, ReservationStatus } from '../../types/reservations.types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { DriverReservationsStackParamList } from '../../types/auth.types';
import { Logo } from '../../constants/logo';

type Props = NativeStackScreenProps<DriverReservationsStackParamList, 'DriverReservationDetail'>;

// ── Statuts ─────────────────────────────────────────────────────
const STATUS_CONFIG: Record<ReservationStatus, { label: string; bg: string; color: string }> = {
  pending:        { label: 'En attente',  color: '#F57F17', bg: '#F57F17' },
  assigned:       { label: 'Assignée',    color: '#1976D2', bg: '#1976D2' },
  driver_arrived: { label: 'Arrivé',      color: '#7B1FA2', bg: '#7B1FA2' },
  in_progress:    { label: 'En cours',    color: '#FFFFFF', bg: '#2E7D32' },
  completed:      { label: 'Terminée',    color: '#FFFFFF', bg: '#2E7D32' },
  cancelled:      { label: 'Annulée',     color: '#FFFFFF', bg: '#C62828' },
};

// ── Icône steering wheel selon statut ───────────────────────────
const STATUS_ICON: Partial<Record<ReservationStatus, string>> = {
  in_progress:    'car-sport-outline',
  assigned:       'time-outline',
  driver_arrived: 'location-outline',
  completed:      'checkmark-circle-outline',
  cancelled:      'close-circle-outline',
};

// ── Format heure ─────────────────────────────────────────────────
function formatTime(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}h${String(d.getMinutes()).padStart(2, '0')}`;
}

// ══════════════════════════════════════════════════════════════════
// SCREEN
// ══════════════════════════════════════════════════════════════════
export default function DriverReservationScreen({ navigation, route }: Props) {
  const { reservationId } = route.params;
  const { selected, fetchById, start, complete, cancel } = useReservation();
  const [isLoading, setIsLoading]                       = useState(false);
  const [confirmModal, setConfirmModal]                 = useState(false);

  const reservation = selected;

  const refresh = useCallback(async () => {
    try { setIsLoading(true); await fetchById(reservationId); }
    finally { setIsLoading(false); }
  }, [fetchById, reservationId]);

  useEffect(() => { void refresh(); }, [refresh]);

  const status    = reservation?.status;
  const statusCfg = status ? STATUS_CONFIG[status] : null;
  const statusIcon = status ? (STATUS_ICON[status] ?? 'car-outline') : 'car-outline';

  const heroValues = useMemo(() => {
    if (!reservation) return { distance: '—', duration: '—', amount: '—' };
    return {
      distance: reservation.distance_km  != null ? `${reservation.distance_km.toFixed(0)} km`   : '—',
      duration: reservation.duration_min != null ? `${reservation.duration_min.toFixed(0)} min`  : '—',
      amount:   reservation.price_final  != null
        ? `${reservation.price_final.toFixed(0)} €`
        : `${reservation.price_estimated.toFixed(0)} €`,
    };
  }, [reservation]);

  // ── Actions ──────────────────────────────────────────────────────
  const handleOpenMaps = (origin: string, destination: string) => {
    const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`;
    Linking.openURL(url).catch(() => Alert.alert('Erreur', 'Impossible d\'ouvrir Maps.'));
  };

  const handleStart = async () => {
    if (!reservation) return;
    try {
      setIsLoading(true);
      await start(reservation.id);
      await refresh();
      Alert.alert('Succès', 'Course démarrée.');
    } catch (err: any) {
      Alert.alert('Erreur', err?.message || 'Impossible de démarrer la course.');
    } finally { setIsLoading(false); }
  };

  const handleComplete = async () => {
    if (!reservation) return;
    try {
      setIsLoading(true);
      await complete(reservation.id);
      await refresh();
      setConfirmModal(false);
      Alert.alert('Succès', 'Course terminée.');
    } catch (err: any) {
      Alert.alert('Erreur', err?.message || 'Impossible de terminer la course.');
    } finally { setIsLoading(false); }
  };

  const handleCancel = () => {
    if (!reservation) return;
    Alert.alert('Annuler la course', 'Voulez-vous vraiment annuler cette course ?', [
      { text: 'Non', style: 'cancel' },
      {
        text: 'Oui', style: 'destructive',
        onPress: async () => {
          try {
            setIsLoading(true);
            await cancel(reservation.id, 'Annulé par le chauffeur');
            await refresh();
            Alert.alert('Succès', 'Course annulée.');
          } catch (err: any) {
            Alert.alert('Erreur', err?.message || 'Impossible d\'annuler la course.');
          } finally { setIsLoading(false); }
        },
      },
    ]);
  };

  const handleSupport = () => {
    Linking.openURL('tel:+33900000000').catch(() =>
      Alert.alert('Support', 'Contactez le support au +33 9 00 00 00 00')
    );
  };

  if (isLoading || !reservation) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.bordeaux} />
      </View>
    );
  }

  const refNumber   = `BC-${reservation.id.slice(-8).toUpperCase()}`;
  const clientName  = reservation.client
    ? `${reservation.client.first_name} ${reservation.client.last_name}`
    : 'Client inconnu';
  const departTime  = formatTime(reservation.scheduled_at);
  // Arrivée estimée = départ + durée (si disponible)
  const arrivalTime = reservation.duration_min && reservation.scheduled_at
    ? formatTime(new Date(new Date(reservation.scheduled_at).getTime() + reservation.duration_min * 60000).toISOString())
    : '—';

  return (
    <View style={styles.flex}>
      {/* ── Header ─────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cours  {refNumber}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Hero card ───────────────────────────────────── */}
        <View style={[styles.heroCard, { backgroundColor: statusCfg?.bg ?? Colors.bordeaux }]}>
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroLabel}>Statut</Text>
              <Text style={styles.heroValue}>{statusCfg?.label ?? status}</Text>
            </View>
            <View style={styles.heroIconCircle}>
              <Ionicons name={statusIcon as any} size={24} color={statusCfg?.bg ?? Colors.bordeaux} />
            </View>
          </View>
          <View style={styles.heroDivider} />
          <View style={styles.heroRow}>
            <View style={styles.heroBlock}>
              <Text style={styles.heroSub}>Distance</Text>
              <Text style={styles.heroSubValue}>{heroValues.distance}</Text>
            </View>
            <View style={styles.heroSeparator} />
            <View style={styles.heroBlock}>
              <Text style={styles.heroSub}>Durée</Text>
              <Text style={styles.heroSubValue}>{heroValues.duration}</Text>
            </View>
            <View style={styles.heroSeparator} />
            <View style={styles.heroBlock}>
              <Text style={styles.heroSub}>Montant</Text>
              <Text style={styles.heroSubValue}>{heroValues.amount}</Text>
            </View>
          </View>
        </View>

        {/* ── Informations client ──────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Informations client</Text>
          <View style={styles.clientRow}>
            {reservation.client?.profile_photo_url ? (
              <Image
                source={{ uri: reservation.client.profile_photo_url }}
                style={styles.clientAvatar}
              />
            ) : (
              <Ionicons name="person-circle-outline" size={52} color={Colors.border} style={styles.clientAvatar} />
            )}
            <View style={styles.clientInfo}>
              <Text style={styles.clientName}>{clientName}</Text>
              {(reservation.client as any)?.rating && (
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={14} color="#F59E0B" />
                  <Text style={styles.ratingText}>{(reservation.client as any).rating.toFixed(1)}</Text>
                </View>
              )}
            </View>
            {reservation.client?.phone && (
              <TouchableOpacity
                style={styles.phoneBtn}
                onPress={() => Linking.openURL(`tel:${reservation.client!.phone}`)}
              >
                <Ionicons name="call" size={18} color={Colors.white} />
              </TouchableOpacity>
            )}
          </View>

          {/* Passagers & bagages */}
          <View style={styles.clientMeta}>
            {(reservation as any).passengers_count != null && (
              <View style={styles.metaItem}>
                <Ionicons name="people-outline" size={15} color={Colors.textSecondary} />
                <Text style={styles.metaText}>{(reservation as any).passengers_count} passager{(reservation as any).passengers_count > 1 ? 's' : ''}</Text>
              </View>
            )}
            {(reservation as any).luggage_count != null && (
              <View style={styles.metaItem}>
                <Ionicons name="briefcase-outline" size={15} color={Colors.textSecondary} />
                <Text style={styles.metaText}>{(reservation as any).luggage_count} bagage{(reservation as any).luggage_count > 1 ? 's' : ''}</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Itinéraire ───────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Itinéraire</Text>

          {/* Départ */}
          <View style={styles.routeRow}>
            <View style={styles.routeDotCol}>
              <View style={[styles.routeDot, { backgroundColor: '#22C55E' }]} />
              <View style={styles.routeLine} />
            </View>
            <View style={styles.routeContent}>
              <Text style={styles.routeTime}>Départ · {departTime}</Text>
              <Text style={styles.routeAddress}>{reservation.pickup_address}</Text>
              <TouchableOpacity
                onPress={() => handleOpenMaps(reservation.pickup_address, reservation.dest_address)}
                style={styles.mapsLink}
              >
                <Ionicons name="navigate-outline" size={13} color={Colors.bordeaux} />
                <Text style={styles.mapsLinkText}>Ouvrir dans Maps</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Arrivée */}
          <View style={styles.routeRow}>
            <View style={styles.routeDotCol}>
              <View style={[styles.routeDot, { backgroundColor: '#EF4444' }]} />
            </View>
            <View style={styles.routeContent}>
              <Text style={styles.routeTime}>Arrivée · {arrivalTime}</Text>
              <Text style={styles.routeAddress}>{reservation.dest_address}</Text>
              <TouchableOpacity
                onPress={() => handleOpenMaps(reservation.pickup_address, reservation.dest_address)}
                style={styles.mapsLink}
              >
                <Ionicons name="navigate-outline" size={13} color={Colors.bordeaux} />
                <Text style={styles.mapsLinkText}>Ouvrir dans Maps</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ── Notes importantes ────────────────────────────── */}
        {reservation.comment ? (
          <View style={styles.notesCard}>
            <View style={styles.notesHeader}>
              <Ionicons name="information-circle-outline" size={18} color="#1D4ED8" />
              <Text style={styles.notesTitle}>Notes importantes</Text>
            </View>
            <Text style={styles.notesText}>{reservation.comment}</Text>
          </View>
        ) : null}

        {/* ── Actions ──────────────────────────────────────── */}
        <View style={styles.actions}>
          {status === 'assigned' && (
            <TouchableOpacity style={styles.primaryBtn} onPress={handleStart} disabled={isLoading}>
              <Ionicons name="play" size={18} color={Colors.white} />
              <Text style={styles.primaryBtnText}>Démarrer la course</Text>
            </TouchableOpacity>
          )}

          {status === 'in_progress' && (
            <TouchableOpacity style={styles.primaryBtn} onPress={() => setConfirmModal(true)} disabled={isLoading}>
              <Ionicons name="checkmark" size={20} color={Colors.white} />
              <Text style={styles.primaryBtnText}>Terminer le cours</Text>
            </TouchableOpacity>
          )}

          {status !== 'completed' && status !== 'cancelled' && (
            <TouchableOpacity style={styles.secondaryBtn} onPress={handleCancel} disabled={isLoading}>
              <Text style={styles.secondaryBtnText}>Annuler le cours</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.supportBtn} onPress={handleSupport}>
            <Ionicons name="headset-outline" size={18} color={Colors.textSecondary} />
            <Text style={styles.supportBtnText}>Contacter le support</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* ── Modal confirmation terminer ─────────────────── */}
      <Modal transparent visible={confirmModal} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Terminer la course ?</Text>
            <Text style={styles.modalMessage}>Le client a bien été déposé ?</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalBtn, styles.modalCancel]}
                onPress={() => setConfirmModal(false)}>
                <Text style={styles.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.modalConfirm]}
                onPress={handleComplete} disabled={isLoading}>
                {isLoading
                  ? <ActivityIndicator color={Colors.white} size="small" />
                  : <Text style={styles.modalConfirmText}>Confirmer</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════
// STYLES
// ══════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  flex:   { flex: 1, backgroundColor: Colors.background },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.bordeaux,
    paddingTop: Platform.OS === 'ios' ? 56 : Spacing.xxl,
    paddingBottom: Spacing.md, paddingHorizontal: Spacing.md,
  },
  headerBtn:   { padding: Spacing.sm, width: 40 },
  headerTitle: { color: Colors.white, fontSize: Fonts.size.lg, fontWeight: '800' },

  scroll: { padding: Spacing.md, gap: Spacing.sm },

  // Hero
  heroCard: {
    borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.xs,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 3,
  },
  heroTop:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  heroLabel:      { fontSize: Fonts.size.xs, color: 'rgba(255,255,255,0.75)', marginBottom: 2 },
  heroValue:      { fontSize: 26, fontWeight: '800', color: Colors.white },
  heroIconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center' },
  heroDivider:    { height: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: Spacing.sm },
  heroRow:        { flexDirection: 'row', alignItems: 'center' },
  heroBlock:      { flex: 1, alignItems: 'center' },
  heroSub:        { fontSize: Fonts.size.xs, color: 'rgba(255,255,255,0.7)', marginBottom: 2 },
  heroSubValue:   { fontSize: Fonts.size.md, fontWeight: '800', color: Colors.white },
  heroSeparator:  { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.2)' },

  // Card générique
  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: Spacing.md, marginBottom: Spacing.xs,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  cardTitle: { fontSize: Fonts.size.sm, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.sm },

  // Client
  clientRow:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  clientAvatar:{ width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.border },
  clientInfo:  { flex: 1, gap: 3 },
  clientName:  { fontSize: Fonts.size.md, fontWeight: '700', color: Colors.textPrimary },
  ratingRow:   { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingText:  { fontSize: Fonts.size.sm, color: Colors.textSecondary, fontWeight: '600' },
  phoneBtn:    { width: 40, height: 40, borderRadius: 20, backgroundColor: '#22C55E', alignItems: 'center', justifyContent: 'center' },
  clientMeta:  { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.sm, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border },
  metaItem:    { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText:    { fontSize: Fonts.size.sm, color: Colors.textSecondary },

  // Itinéraire
  routeRow:     { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  routeDotCol:  { alignItems: 'center', width: 16, paddingTop: 4 },
  routeDot:     { width: 12, height: 12, borderRadius: 6 },
  routeLine:    { flex: 1, width: 2, backgroundColor: Colors.border, marginTop: 4, marginBottom: -4 },
  routeContent: { flex: 1, paddingBottom: Spacing.sm },
  routeTime:    { fontSize: Fonts.size.xs, color: Colors.textSecondary, marginBottom: 2 },
  routeAddress: { fontSize: Fonts.size.sm, fontWeight: '600', color: Colors.textPrimary, marginBottom: 4 },
  mapsLink:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  mapsLinkText: { fontSize: Fonts.size.xs, color: Colors.bordeaux, fontWeight: '600' },

  // Notes
  notesCard: {
    backgroundColor: '#EFF6FF', borderRadius: Radius.lg,
    padding: Spacing.md, marginBottom: Spacing.xs,
    borderLeftWidth: 3, borderLeftColor: '#1D4ED8',
  },
  notesHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.xs },
  notesTitle:  { fontSize: Fonts.size.sm, fontWeight: '700', color: '#1D4ED8' },
  notesText:   { fontSize: Fonts.size.sm, color: '#1E3A8A', lineHeight: 20 },

  // Actions
  actions:       { gap: Spacing.sm, marginTop: Spacing.xs },
  primaryBtn:    { backgroundColor: Colors.bordeaux, borderRadius: Radius.md, paddingVertical: Spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs },
  primaryBtnText:{ color: Colors.white, fontWeight: '800', fontSize: Fonts.size.md },
  secondaryBtn:  { borderRadius: Radius.md, paddingVertical: Spacing.md, alignItems: 'center', borderWidth: 1.5, borderColor: Colors.bordeaux },
  secondaryBtnText: { color: Colors.bordeaux, fontWeight: '700', fontSize: Fonts.size.md },
  supportBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs, paddingVertical: Spacing.sm },
  supportBtnText:{ color: Colors.textSecondary, fontSize: Fonts.size.sm, fontWeight: '600' },

  // Modal
  modalOverlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalBox:       { width: '85%', backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.lg },
  modalTitle:     { fontSize: Fonts.size.lg, fontWeight: '800', marginBottom: Spacing.xs, textAlign: 'center' },
  modalMessage:   { fontSize: Fonts.size.sm, color: Colors.textSecondary, marginBottom: Spacing.md, textAlign: 'center' },
  modalButtons:   { flexDirection: 'row', gap: Spacing.sm },
  modalBtn:       { flex: 1, paddingVertical: Spacing.sm, borderRadius: Radius.md, alignItems: 'center' },
  modalCancel:    { backgroundColor: Colors.surface },
  modalConfirm:   { backgroundColor: Colors.bordeaux },
  modalCancelText:  { color: Colors.bordeaux, fontWeight: '700' },
  modalConfirmText: { color: Colors.white, fontWeight: '700' },
});