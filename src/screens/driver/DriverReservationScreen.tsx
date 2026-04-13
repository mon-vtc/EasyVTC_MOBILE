import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  Linking,
   Platform,
   Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useReservation } from '../../hooks/useReservation';
import { Colors, Fonts, Spacing, Radius } from '../../theme/colors';
import type { Reservation, ReservationStatus } from '../../types/reservations.types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { DriverReservationsStackParamList } from '../../types/auth.types';
import { Logo } from '../../constants/logo';

type DriverReservationProps = NativeStackScreenProps<DriverReservationsStackParamList, 'DriverReservationDetail'>;

const STATUS_CONFIG: Record<ReservationStatus, { label: string; bg: string; color: string }> = {
  pending:      { label: 'En attente', color: '#F57F17', bg: '#FFF8E1' },
  assigned:     { label: 'Assignée',  color: '#1976D2', bg: '#E3F2FD' },
  driver_arrived:{ label: 'Arrivé',   color: '#7B1FA2', bg: '#F3E5F5' },
  in_progress:  { label: 'En cours',  color: '#2E7D32', bg: '#E8F5E9' },
  completed:    { label: 'Terminée',  color: '#2E7D32', bg: '#E8F5E9' },
  cancelled:    { label: 'Annulée',   color: '#C62828', bg: '#FFEBEE' },
};

export default function DriverReservationScreen({ navigation, route }: DriverReservationProps) {
  const { reservationId } = route.params;
  const { selected, fetchById, start, complete, cancel } = useReservation();
  const [isLoading, setIsLoading] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);

  const reservation = selected;

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      await fetchById(reservationId);
    } finally {
      setIsLoading(false);
    }
  }, [fetchById, reservationId]);

  useEffect(() => { void refresh(); }, [refresh]);

  const status = reservation?.status;
  const statusCfg = status ? STATUS_CONFIG[status] : null;

  const heroValues = useMemo(() => {
    if (!reservation) return { distance: '—', duration: '—', amount: '—' };
    return {
      distance: reservation.distance_km !== null ? `${reservation.distance_km.toFixed(1)} km` : '—',
      duration: reservation.duration_min !== null ? `${reservation.duration_min.toFixed(0)} min` : '—',
      amount:   reservation.price_final !== null ? `${reservation.price_final.toFixed(2)} €` : `${reservation.price_estimated.toFixed(2)} €`,
    };
  }, [reservation]);

  const handleOpenMaps = () => {
    if (!reservation) return;
    const query = `${reservation.pickup_address} to ${reservation.dest_address}`;
    const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(reservation.pickup_address)}&destination=${encodeURIComponent(reservation.dest_address)}`;
    Linking.openURL(url).catch(() => Alert.alert('Erreur', 'Impossible d’ouvrir Maps.'));
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!reservation) return;
    try {
      setIsLoading(true);
      await complete(reservation.id);
      await refresh();
      setConfirmModalVisible(false);
      Alert.alert('Succès', 'Course terminée.');
    } catch (err: any) {
      Alert.alert('Erreur', err?.message || 'Impossible de terminer la course.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!reservation) return;
    Alert.alert(
      'Annuler la course',
      'Voulez-vous vraiment annuler cette course ?',
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              await cancel(reservation.id, 'Annulé par le chauffeur');
              await refresh();
              Alert.alert('Succès', 'Course annulée.');
            } catch (err: any) {
              Alert.alert('Erreur', err?.message || 'Impossible d’annuler la course.');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ],
    );
  };

  if (isLoading || !reservation) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.bordeaux} />
      </View>
    );
  }

  const refNumber = `BC-${reservation.id.slice(-6).toUpperCase()}`;

  return (
    <ScrollView style={styles.flex}>
        
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={Colors.white} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Image source={Logo.LogoEasyVTC} style={{ width: 36, height: 36 }} />
        </View>
        <View style={{ width: 40 }} />
      </View>

      {statusCfg && (
        <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}> 
          <Text style={[styles.statusText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
        </View>
      )}

      <View style={styles.heroCard}>
        <Text style={styles.heroLabel}>Statut</Text>
        <Text style={styles.heroValue}>{statusCfg?.label ?? status}</Text>

        <View style={styles.heroRow}>
          <View style={styles.heroBlock}>
            <Text style={styles.heroSub}>Distance</Text>
            <Text style={styles.heroSubValue}>{heroValues.distance}</Text>
          </View>
          <View style={styles.heroBlock}>
            <Text style={styles.heroSub}>Durée</Text>
            <Text style={styles.heroSubValue}>{heroValues.duration}</Text>
          </View>
          <View style={styles.heroBlock}>
            <Text style={styles.heroSub}>Montant</Text>
            <Text style={styles.heroSubValue}>{heroValues.amount}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Client</Text>
        <View style={styles.cardRow}>
          <Ionicons name="person-outline" size={20} color={Colors.textSecondary} />
          <View style={{ marginLeft: Spacing.sm }}>
            <Text style={styles.sectionText}>{reservation.client ? `${reservation.client.first_name} ${reservation.client.last_name}` : 'Client inconnu'}</Text>
            <Text style={styles.sectionSub}>{reservation.client?.phone ?? 'Téléphone non disponible'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Itinéraire</Text>
        <Text style={styles.sectionText}>{reservation.pickup_address}</Text>
        <Text style={styles.sectionText}>{reservation.dest_address}</Text>
        <TouchableOpacity onPress={handleOpenMaps} style={styles.mapBtn}>
          <Text style={styles.mapBtnText}>Ouvrir dans Maps</Text>
        </TouchableOpacity>
      </View>

      {reservation.comment ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <Text style={styles.sectionText}>{reservation.comment}</Text>
        </View>
      ) : null}

      <View style={styles.actions}> 
        {status === 'assigned' && (
          <TouchableOpacity style={styles.primaryBtn} onPress={handleStart}>
            <Text style={styles.primaryBtnText}>Démarrer la course</Text>
          </TouchableOpacity>
        )}
        {status === 'in_progress' && (
          <TouchableOpacity style={styles.primaryBtn} onPress={() => setConfirmModalVisible(true)}>
            <Text style={styles.primaryBtnText}>Terminer la course</Text>
          </TouchableOpacity>
        )}

        {status !== 'completed' && status !== 'cancelled' && (
          <TouchableOpacity style={styles.secondaryBtn} onPress={handleCancel}>
            <Text style={styles.secondaryBtnText}>Annuler la course</Text>
          </TouchableOpacity>
        )}
      </View>

      <Modal transparent visible={confirmModalVisible} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Terminer la course ?</Text>
            <Text style={styles.modalMessage}>Le client a bien été déposé ?</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalBtn, styles.modalCancel]} onPress={() => setConfirmModalVisible(false)}>
                <Text style={styles.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.modalConfirm]} onPress={handleComplete}>
                <Text style={styles.modalConfirmText}>Confirmer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex:   { flex: 1, backgroundColor: Colors.background },
    scroll: { padding: Spacing.lg, paddingTop: Spacing.md },
    
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      backgroundColor: Colors.bordeaux,
      paddingTop: Platform.OS === 'ios' ? 56 : Spacing.xxl,
      paddingBottom: Spacing.md, paddingHorizontal: Spacing.md,
    },
    headerBtn:    { padding: Spacing.sm, width: 40 },
    headerCenter: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  statusBadge: { marginVertical: Spacing.xs, borderRadius: Radius.full, paddingVertical: 4, paddingHorizontal: Spacing.sm, alignSelf: 'flex-start' },
  statusText: { fontSize: Fonts.size.xs, fontWeight: '700' },
  heroCard: { backgroundColor: '#E8F5E9', borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.md },
  heroLabel: { fontSize: Fonts.size.xs, color: Colors.textSecondary },
  heroValue: { fontSize: Fonts.size.lg, fontWeight: '800', color: Colors.bordeaux, marginBottom: Spacing.sm },
  heroRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.sm },
  heroBlock: { flex: 1, alignItems: 'center' },
  heroSub: { fontSize: Fonts.size.xs, color: Colors.textSecondary },
  heroSubValue: { fontSize: Fonts.size.sm, fontWeight: '700' },
  section: { marginBottom: Spacing.md, backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md },
  sectionTitle: { fontSize: Fonts.size.sm, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  sectionText: { fontSize: Fonts.size.sm, color: Colors.textSecondary, marginBottom: 2 },
  sectionSub: { fontSize: Fonts.size.sm, color: Colors.textPrimary, fontWeight: '700' },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  mapBtn: { marginTop: Spacing.sm, backgroundColor: Colors.bordeaux, borderRadius: Radius.sm, paddingVertical: 10, alignItems: 'center' },
  mapBtnText: { color: Colors.white, fontWeight: '700' },
  actions: { marginTop: Spacing.md, gap: Spacing.sm },
  primaryBtn: { backgroundColor: Colors.bordeaux, borderRadius: Radius.md, paddingVertical: Spacing.lg, alignItems: 'center' },
  primaryBtnText: { color: Colors.white, fontWeight: '800' },
  secondaryBtn: { marginTop: Spacing.sm, backgroundColor: Colors.surface, borderRadius: Radius.md, paddingVertical: Spacing.lg, alignItems: 'center', borderWidth: 1, borderColor: Colors.bordeaux },
  secondaryBtnText: { color: Colors.bordeaux, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { width: '85%', backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.lg },
  modalTitle: { fontSize: Fonts.size.lg, fontWeight: '800', marginBottom: Spacing.sm, textAlign: 'center' },
  modalMessage: { fontSize: Fonts.size.sm, color: Colors.textSecondary, marginBottom: Spacing.md, textAlign: 'center' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.sm },
  modalBtn: { flex: 1, paddingVertical: Spacing.sm, borderRadius: Radius.md, alignItems: 'center' },
  modalCancel: { backgroundColor: Colors.surface },
  modalConfirm: { backgroundColor: Colors.bordeaux },
  modalCancelText: { color: Colors.bordeaux, fontWeight: '700' },
  modalConfirmText: { color: Colors.white, fontWeight: '700' },
});