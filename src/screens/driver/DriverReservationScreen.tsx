import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Modal, Linking, Image, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useReservation } from '../../hooks/useReservation';
import { Colors, Fonts, Spacing, Radius } from '../../theme/colors';
import type { Reservation, ReservationStatus } from '../../types/reservations.types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { DriverNotificationsStackParamList, DriverReservationsStackParamList } from '../../types/auth.types';
import { AppIcon } from '../../components/common/AppIcon';
import type { DriverInvoicesStackParamList } from '../../types/auth.types';
import {
  useNavigation,
  type NavigationProp,
} from '@react-navigation/native';
import { useAuthStore }   from '../../store/auth.store';
import { invoicesApi }    from '../../services/api/invoices.api';
import { Logo } from '../../constants/logo';
import { useAlert } from '../../hooks/useAlert';
import { useToast } from '../../hooks/useToast';
import { AppHeader } from '../../components/common/AppHeader';

type Props = NativeStackScreenProps<DriverReservationsStackParamList, 'DriverReservationDetails'>;

// ── Statuts ─────────────────────────────────────────────────────
const STATUS_CONFIG: Record<ReservationStatus, { label: string; bg: string; color: string }> = {
  pending:        { label: 'En attente',  color: '#F57F17', bg: '#F57F17' },
  assigned:       { label: 'Assignée',    color: '#1976D2', bg: '#1976D2' },
  driver_arrived: { label: 'Arrivé',      color: '#7B1FA2', bg: '#7B1FA2' },
  in_progress:    { label: 'En cours',    color: '#FFFFFF', bg: '#2E7D32' },
  completed:      { label: 'Terminée',    color: '#FFFFFF', bg: '#2E7D32' },
  cancelled:      { label: 'Annulée',     color: '#FFFFFF', bg: '#C62828' },
};

// ── Icône selon statut ───────────────────────────────────────────
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
  const [isLoading, setIsLoading]       = useState(false);
  const [confirmModal, setConfirmModal] = useState(false);
  const [actualDistanceKm, setActualDistanceKm] = useState('');

  // Map choice modal state
  const [mapChoiceModalVisible, setMapChoiceModalVisible]     = useState(false);
  const [mapOriginAddress, setMapOriginAddress]               = useState('');
  const [mapDestinationAddress, setMapDestinationAddress]     = useState('');
  const [mapDestinationLat, setMapDestinationLat]             = useState<number | null | undefined>(null);
  const [mapDestinationLng, setMapDestinationLng]             = useState<number | null | undefined>(null);
  const { showToast } = useToast();
  const { showAlert } = useAlert();

  type ConfirmationNav = NavigationProp<any>;

  const reservation  = selected;
  const accessToken  = useAuthStore(s => s.accessToken);
  const nav          = useNavigation<ConfirmationNav>();

  const refresh = useCallback(async () => {
    try { setIsLoading(true); await fetchById(reservationId); }
    finally { setIsLoading(false); }
  }, [fetchById, reservationId]);

  useEffect(() => { void refresh(); }, [refresh]);

  const status     = reservation?.status;
  const statusCfg  = status ? STATUS_CONFIG[status] : null;
  const statusIcon = status ? (STATUS_ICON[status] ?? 'car-outline') : 'car-outline';

  const heroValues = useMemo(() => {
    if (!reservation) return { distance: '—', duration: '—', amount: '—' };
    const isCompleted = reservation.status === 'completed';
    return {
      distance: reservation.distance_km != null
        ? `${Number(reservation.distance_km).toFixed(0)} km`
        : isCompleted ? 'N/A' : '—',
      duration: reservation.duration_min != null
        ? `${Number(reservation.duration_min).toFixed(0)} min`
        : '—',
      amount: reservation.price_final != null
        ? `${reservation.price_final.toFixed(0)} €`
        : `${reservation.price_estimated.toFixed(0)} €`,
    };
  }, [reservation]);

  // ── Map helpers ──────────────────────────────────────────────────
  const handleOpenMaps = (
    originAddress: string,
    destinationAddress: string,
    destinationLat: number | null | undefined,
    destinationLng: number | null | undefined,
  ) => {
    setMapOriginAddress(originAddress);
    setMapDestinationAddress(destinationAddress);
    setMapDestinationLat(destinationLat);
    setMapDestinationLng(destinationLng);
    setMapChoiceModalVisible(true);
  };

  const openGoogleMaps = () => {
    const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(mapOriginAddress)}&destination=${encodeURIComponent(mapDestinationAddress)}`;
    Linking.openURL(url).catch(() => {
      showToast({ type: 'error', title: 'Erreur', message: "Impossible d'ouvrir Google Maps." });
    });
    setMapChoiceModalVisible(false);
  };

  const openWaze = () => {
    if (mapDestinationLat != null && mapDestinationLng != null) {
      const wazeUrl = `waze://?ll=${mapDestinationLat},${mapDestinationLng}&navigate=yes`;
      Linking.openURL(wazeUrl).catch(() => {
        showToast({ type: 'error', title: 'Erreur', message: "Impossible d'ouvrir Waze. Assurez-vous que l'application est installée." });
      });
    } else {
      showToast({ type: 'error', title: 'Erreur', message: 'Coordonnées de destination non disponibles pour Waze.' });
    }
    setMapChoiceModalVisible(false);
  };

  // ── Actions ──────────────────────────────────────────────────────
  const handleStart = async () => {
    if (!reservation) return;
    try {
      setIsLoading(true);
      await start(reservation.id);
      await refresh();
      showToast({ type: 'success', title: 'Succès', message: 'Course démarrée.' });
    } catch (err: any) {
      showToast({ type: 'error', title: 'Erreur', message: err?.message || 'Impossible de démarrer la course.' });
    } finally { setIsLoading(false); }
  };

  const handleComplete = async () => {
    if (!reservation) return;
    try {
      setIsLoading(true);
      const parsedKm = actualDistanceKm.trim() ? parseFloat(actualDistanceKm) : undefined;
      await complete(reservation.id, {
        actual_distance_km: parsedKm,
        // actual_duration_min est auto-calculée côté API depuis started_at → ended_at
      });
      setActualDistanceKm('');
      await refresh();
      setConfirmModal(false);
      showToast({ type: 'success', title: 'Succès', message: 'Course terminée.' });
    } catch (err: any) {
      showToast({ type: 'error', title: 'Erreur', message: err?.message || 'Impossible de terminer la course.' });
    } finally { setIsLoading(false); }
  };

  const handleCancel = () => {
    if (!reservation) return;
    showAlert({title: 'Annuler la course', message: 'Voulez-vous vraiment annuler cette course ?', buttons: [
      { text: 'Non', style: 'cancel' },
      {
        text: 'Oui', style: 'destructive',
        onPress: async () => {
          try {
            setIsLoading(true);
            await cancel(reservation.id, 'Annulé par le chauffeur');
            await refresh();
            showToast({ type: 'success', title: 'Succès', message: 'Course annulée.' });
          } catch (err: any) {
            showToast({ type: 'error', title: 'Erreur', message: err?.message || "Impossible d'annuler la course." });
          } finally { setIsLoading(false); }
        },
      },
    ]});
  };

  const handleSupport = () => {
    
    navigation.navigate('SupportList');
  };

  const handleViewInvoice = useCallback(async () => {
    if (!reservation?.id || !accessToken) return;
    try {
      const res = await invoicesApi.fetchByReservationId(accessToken, reservation.id);
      if (res.ok && res.data) {
        // Le screen `DriverInvoiceDetails` vit dans la pile `DriverInvoices`
        // qui est soeur de la pile `DriverReservations` sous le Drawer.
        // On remonte au parent (Drawer) et on navigue vers la pile imbriquée.
        navigation.navigate(
          'DriverInvoiceDetails', { invoiceId: res.data.id },
        );
      } else {
        showToast({
          type: 'warning',
          title: 'Facture indisponible',
          message: res.message ?? "La facture n'est pas encore disponible pour cette course.",
        });
      }
    } catch {
      showToast({ type: 'error', title: 'Erreur', message: 'Impossible de récupérer la facture. Veuillez réessayer.' });
    }
  }, [reservation?.id, accessToken, nav]);

  if (isLoading || !reservation) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.bordeaux} />
      </View>
    );
  }

  const refNumber  = `BC-${reservation.id.slice(-8).toUpperCase()}`;
  const clientName = reservation.client
    ? `${reservation.client.first_name} ${reservation.client.last_name}`
    : 'Client inconnu';
  const departTime  = formatTime(reservation.scheduled_at);
  const arrivalTime = reservation.duration_min && reservation.scheduled_at
    ? formatTime(new Date(new Date(reservation.scheduled_at).getTime() + reservation.duration_min * 60000).toISOString())
    : '—';

  return (
    <View style={styles.flex}>

      {/* ── Header ─────────────────────────────────────────── */}
      <AppHeader left="back" title={`Course ${refNumber}`} />

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
            <TouchableOpacity
              style={styles.messageBtn}
              onPress={() => nav.navigate('ChatScreen', { reservationId: reservation.id })}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={18} color={Colors.white} />
            </TouchableOpacity>
          </View>

          {reservation.nb_passengers > 0 && (
            <View style={styles.clientMeta}>
              <View style={styles.metaItem}>
                <Ionicons name="people-outline" size={15} color={Colors.textSecondary} />
                <Text style={styles.metaText}>
                  {reservation.nb_passengers} passager{reservation.nb_passengers > 1 ? 's' : ''}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* ── Itinéraire ───────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Itinéraire</Text>
          {/* ── Date de passage ────────────────────────────── */}
          <View style={styles.clientMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={15} color={Colors.textSecondary} />
              <Text >Date de passage</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={15} color={Colors.textSecondary} />
                <Text style={styles.metaText}>{format(new Date(reservation.scheduled_at), "dd MMM yyyy, HH:mm")}</Text> 
            </View>
          </View>
          <View style={styles.routeRow}>
            <View style={styles.routeDotCol}>
              <View style={[styles.routeDot, { backgroundColor: '#22C55E' }]} />
              <View style={styles.routeLine} />
            </View>
            <View style={styles.routeContent}>
              <Text style={styles.routeTime}>Départ · {departTime}</Text>
              <Text style={styles.routeAddress}>{reservation.pickup_address}</Text>
            </View>
          </View>

          <View style={styles.routeRow}>
            <View style={styles.routeDotCol}>
              <View style={[styles.routeDot, { backgroundColor: '#EF4444' }]} />
            </View>
            <View style={styles.routeContent}>
              <Text style={styles.routeTime}>Arrivée · {arrivalTime}</Text>
              <Text style={styles.routeAddress}>{reservation.dest_address}</Text>
            </View>
          </View>
          {/* ── Bouton Ouvrir l'itinéraire ───────────────────── */}
          <TouchableOpacity
            style={styles.openMapsButton}
            onPress={() => handleOpenMaps(
              reservation.pickup_address,
              reservation.dest_address,
              reservation.dest_lat,
              reservation.dest_lng,
            )}
          >
            <Ionicons name="navigate-outline" size={20} color={Colors.white} />
            <Text style={styles.openMapsButtonText}>Ouvrir l'itinéraire</Text>
          </TouchableOpacity>
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
          {/* FIX: driver_arrived also needs a start button to allow transitioning to in_progress */}
          {(status === 'assigned' || status === 'driver_arrived') && (
            <TouchableOpacity style={styles.primaryBtn} onPress={handleStart} disabled={isLoading}>
              <Ionicons name="play" size={18} color={Colors.white} />
              <Text style={styles.primaryBtnText}>Démarrer la course</Text>
            </TouchableOpacity>
          )}

          {status === 'in_progress' && (
            <TouchableOpacity style={styles.primaryBtn} onPress={() => setConfirmModal(true)} disabled={isLoading}>
              <Ionicons name="checkmark" size={20} color={Colors.white} />
              <Text style={styles.primaryBtnText}>Terminer la course</Text>
            </TouchableOpacity>
          )}

          {status !== 'completed' && status !== 'cancelled' && (
            <TouchableOpacity style={styles.secondaryBtn} onPress={handleCancel} disabled={isLoading}>
              <Text style={styles.secondaryBtnText}>Annuler la course</Text>
            </TouchableOpacity>
          )}

          {status === 'completed' && (
            <TouchableOpacity
              style={styles.btnSecondary}
              activeOpacity={0.85}
              onPress={handleViewInvoice}
            >
              <AppIcon name="document-text-outline" size={18} color={Colors.white} />
              <Text style={styles.btnSecondaryText}>Voir la facture</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.supportBtn} onPress={handleSupport}>
            <Ionicons name="headset-outline" size={18} color={Colors.textSecondary} />
            <Text style={styles.supportBtnText}>Contacter le support</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* ── Modal confirmation terminer ──────────────────── */}
      <Modal transparent visible={confirmModal} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Terminer la course ?</Text>
            <Text style={styles.modalMessage}>Le client a bien été déposé ?</Text>

            <View style={styles.modalInputBlock}>
              <Text style={styles.modalInputLabel}>
                Distance parcourue (km)
                {reservation?.pricing_type === 'formula' ? ' *' : ''}
              </Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Ex : 23"
                placeholderTextColor={Colors.textSecondary}
                keyboardType="numeric"
                value={actualDistanceKm}
                onChangeText={setActualDistanceKm}
                maxLength={6}
              />
              <Text style={styles.modalInputHint}>
                {reservation?.pricing_type === 'formula'
                  ? 'Recommandé — permet de recalculer le prix final'
                  : 'Optionnel — à titre informatif (forfait fixe)'}
              </Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalCancel]}
                onPress={() => { setConfirmModal(false); setActualDistanceKm(''); }}
              >
                <Text style={styles.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalConfirm]}
                onPress={handleComplete}
                disabled={isLoading}
              >
                {isLoading
                  ? <ActivityIndicator color={Colors.white} size="small" />
                  : <Text style={styles.modalConfirmText}>Confirmer</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Modal choix de navigation ────────────────────── */}
      {/* FIX: was declared in state and handlers but never rendered */}
      <Modal
        transparent
        visible={mapChoiceModalVisible}
        animationType="fade"
        onRequestClose={() => setMapChoiceModalVisible(false)}
      >
        <View style={styles.mapChoiceOverlay}>
          <View style={styles.mapChoiceBox}>
            <Text style={styles.mapChoiceTitle}>Ouvrir avec</Text>
            <Text style={styles.mapChoiceSubtitle}>Choisissez votre application de navigation</Text>
            <View style={styles.mapChoiceButtonsRow}>
              <TouchableOpacity style={styles.mapChoiceAppButton} onPress={openGoogleMaps}>
                <Image source={Logo.LogoGoogleMaps} style={styles.mapChoiceAppIcon} />
                <Text style={styles.mapChoiceAppButtonText}>Google Maps</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.mapChoiceAppButton} onPress={openWaze}>
                <Image source={Logo.LogoWaze} style={styles.mapChoiceAppIcon} />
                <Text style={styles.mapChoiceAppButtonText}>Waze</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.mapChoiceCancelButton}
              onPress={() => setMapChoiceModalVisible(false)}
            >
              <Text style={styles.mapChoiceCancelButtonText}>Annuler</Text>
            </TouchableOpacity>
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

  scroll: { padding: Spacing.md, gap: Spacing.sm },

  // Hero
  heroCard: {
    borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.xs,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 3,
  },
  heroTop:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  heroLabel:      { fontSize: Fonts.size.xs, color: 'rgba(255,255,255,0.75)', marginBottom: 2 },
  heroValue:      { fontSize: 26, fontFamily: Fonts.bold, fontWeight: '800', color: Colors.white },
  heroIconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center' },
  heroDivider:    { height: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: Spacing.sm },
  heroRow:        { flexDirection: 'row', alignItems: 'center' },
  heroBlock:      { flex: 1, alignItems: 'center' },
  heroSub:        { fontSize: Fonts.size.xs, color: 'rgba(255,255,255,0.7)', marginBottom: 2 },
  heroSubValue:   { fontSize: Fonts.size.md, fontFamily: Fonts.bold, fontWeight: '800', color: Colors.white },
  heroSeparator:  { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.2)' },

  // Card générique
  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: Spacing.md, marginBottom: Spacing.xs,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  cardTitle: { fontSize: Fonts.size.sm, fontFamily: Fonts.bold, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.sm },

  // Client
  clientRow:    { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  clientAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.border },
  clientInfo:   { flex: 1, gap: 3 },
  clientName:   { fontSize: Fonts.size.md, fontFamily: Fonts.bold, fontWeight: '700', color: Colors.textPrimary },
  ratingRow:    { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingText:   { fontSize: Fonts.size.sm, color: Colors.textSecondary, fontFamily: Fonts.semibold, fontWeight: '600' },
  phoneBtn:     { width: 40, height: 40, borderRadius: 20, backgroundColor: '#22C55E', alignItems: 'center', justifyContent: 'center' },
  messageBtn:   { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center' },
  clientMeta:   { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.sm, marginBottom: Spacing.sm, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border },
  metaItem:     { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText:     { fontSize: Fonts.size.sm, color: Colors.textSecondary },

  // Itinéraire
  routeRow:     { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  routeDotCol:  { alignItems: 'center', width: 16, paddingTop: 4 },
  routeDot:     { width: 12, height: 12, borderRadius: 6 },
  routeLine:    { flex: 1, width: 2, backgroundColor: Colors.border, marginTop: 4, marginBottom: -4 },
  routeContent: { flex: 1, paddingBottom: Spacing.sm },
  routeTime:    { fontSize: Fonts.size.xs, color: Colors.textSecondary, marginBottom: 2 },
  routeAddress: { fontSize: Fonts.size.sm, fontFamily: Fonts.semibold, fontWeight: '600', color: Colors.textPrimary, marginBottom: 4 },
  mapsLink:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  mapsLinkText: { fontSize: Fonts.size.xs, color: Colors.bordeaux, fontFamily: Fonts.semibold, fontWeight: '600' },

  // Notes
  notesCard: {
    backgroundColor: '#EFF6FF', borderRadius: Radius.lg,
    padding: Spacing.md, marginBottom: Spacing.xs,
    borderLeftWidth: 3, borderLeftColor: '#1D4ED8',
  },
  notesHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.xs },
  notesTitle:  { fontSize: Fonts.size.sm, fontFamily: Fonts.bold, fontWeight: '700', color: '#1D4ED8' },
  notesText:   { fontSize: Fonts.size.sm, color: '#1E3A8A', lineHeight: 20 },

  // Actions
  actions:          { gap: Spacing.sm, marginTop: Spacing.xs },
  primaryBtn:       { backgroundColor: Colors.bordeaux, borderRadius: Radius.md, paddingVertical: Spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs },
  primaryBtnText:   { color: Colors.white, fontFamily: Fonts.bold, fontWeight: '800', fontSize: Fonts.size.md },
  secondaryBtn:     { borderRadius: Radius.md, paddingVertical: Spacing.md, alignItems: 'center', borderWidth: 1.5, borderColor: Colors.bordeaux },
  secondaryBtnText: { color: Colors.bordeaux, fontFamily: Fonts.bold, fontWeight: '700', fontSize: Fonts.size.md },
  supportBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs, paddingVertical: Spacing.sm },
  supportBtnText:   { color: Colors.textSecondary, fontSize: Fonts.size.sm, fontFamily: Fonts.semibold, fontWeight: '600' },
  btnSecondary:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs, paddingVertical: Spacing.sm, borderWidth: 1, borderColor: Colors.bordeaux, borderRadius: Radius.md, backgroundColor: Colors.bordeaux },
  btnSecondaryText: { color: Colors.white, fontSize: Fonts.size.sm, fontFamily: Fonts.semibold, fontWeight: '600' },

  // Modal confirmation
  modalOverlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalBox:        { width: '85%', backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.lg },
  modalTitle:      { fontSize: Fonts.size.lg, fontFamily: Fonts.bold, fontWeight: '800', marginBottom: Spacing.xs, textAlign: 'center' },
  modalMessage:    { fontSize: Fonts.size.sm, color: Colors.textSecondary, marginBottom: Spacing.md, textAlign: 'center' },
  modalInputBlock: { marginBottom: Spacing.md },
  modalInputLabel: { fontSize: Fonts.size.sm, fontFamily: Fonts.semibold, fontWeight: '600', color: Colors.textPrimary, marginBottom: Spacing.xs },
  modalInput: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs,
    fontSize: Fonts.size.md, color: Colors.textPrimary,
  },
  modalInputHint:  { fontSize: Fonts.size.xs, color: Colors.textSecondary, marginTop: 4 },
  modalButtons:    { flexDirection: 'row', gap: Spacing.sm },
  modalBtn:        { flex: 1, paddingVertical: Spacing.sm, borderRadius: Radius.md, alignItems: 'center' },
  modalCancel:     { backgroundColor: Colors.surface },
  modalConfirm:    { backgroundColor: Colors.bordeaux },
  modalCancelText:   { color: Colors.bordeaux, fontFamily: Fonts.bold, fontWeight: '700' },
  modalConfirmText:  { color: Colors.white, fontFamily: Fonts.bold, fontWeight: '700' },

  // Bouton ouvrir dans maps
  openMapsButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.textLight, borderRadius: Radius.md,
    paddingVertical: Spacing.sm, marginTop: Spacing.md, gap: Spacing.xs,
  },
  openMapsButtonText: { color: Colors.white, fontSize: Fonts.size.md, fontFamily: Fonts.medium, fontWeight: '500' },

  // Modal choix de navigation
  mapChoiceOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center', alignItems: 'center',
  },
  mapChoiceBox: {
    backgroundColor: Colors.white, borderRadius: Radius.lg,
    padding: Spacing.lg, width: '85%', alignItems: 'center',
  },
  mapChoiceTitle:      { fontSize: Fonts.size.lg, fontFamily: Fonts.bold, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.xs, textAlign: 'center' },
  mapChoiceSubtitle:   { fontSize: Fonts.size.sm, color: Colors.textSecondary, marginBottom: Spacing.md, textAlign: 'center' },
  mapChoiceButtonsRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginBottom: Spacing.md },
  mapChoiceAppButton:  {
    alignItems: 'center', paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md,
    borderRadius: Radius.md, backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border, minWidth: 120,
  },
  mapChoiceAppButtonText:    { fontSize: Fonts.size.sm, fontFamily: Fonts.semibold, fontWeight: '600', color: Colors.textPrimary, marginTop: Spacing.xs },
  mapChoiceCancelButton:     { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md },
  mapChoiceCancelButtonText: { fontSize: Fonts.size.md, fontFamily: Fonts.semibold, fontWeight: '600', color: Colors.textSecondary },
  mapChoiceAppIcon:          { width: 40, height: 40, marginBottom: Spacing.xs },
});