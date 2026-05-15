import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Platform, Alert, Image, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, Radius } from '../../../theme/colors';
import { useAdmin }  from '../../../hooks/useAdmin';
import { useVehicleTypesStore } from '../../../store/vehicleTypes.store';
import type { AuthUser, DriverUser } from '../../../types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { DriversStackParamList }  from '../../../types/auth.types';

type Props = NativeStackScreenProps<DriversStackParamList, 'DriverDetail'>;

type Tab = 'informations' | 'statistiques' | 'historique';

const TABS: { key: Tab; label: string }[] = [
  { key: 'informations',  label: 'Informations'  },
  { key: 'statistiques',  label: 'Statistiques'  },
  { key: 'historique',    label: 'Historique'     },
];

// ── Status badge ────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  active:   { label: 'Actif',       bg: '#E8F5E9', color: '#2E7D32' },
  inactive: { label: 'Inactif',     bg: '#FFF3E0', color: '#E65100' },
  locked:   { label: 'Verrouillé',  bg: '#FCE4EC', color: '#C62828' },
};

const DRIVER_STATUS_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  pending:   { label: 'En attente', bg: '#FFF3E0', color: '#E65100' },
  active:    { label: 'Validé',     bg: '#E8F5E9', color: '#2E7D32' },
  rejected:  { label: 'Rejeté',     bg: '#FCE4EC', color: '#C62828' },
  suspended: { label: 'Suspendu',   bg: '#EDE7F6', color: '#5E35B1' },
  probationary: { label: 'Probationnaire', bg: '#FFF3E0', color: '#E65100' },
};

// ── Ligne info ──────────────────────────────────────────────────
function InfoRow({ icon, value }: { icon: keyof typeof Ionicons.glyphMap; value: string | null}) {
  return (
    <View style={infoStyles.row}>
      <Ionicons name={icon} size={16} color={Colors.textMuted} />
      <Text style={infoStyles.value}>{value}</Text>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  value: { fontSize: Fonts.size.md, color: Colors.textSecondary },
});

// ── Tab Informations ────────────────────────────────────────────
function TabInformations({ driver }: { driver: DriverUser }) {
  const vehicle    = driver.vehicle;
  const allTypes   = useVehicleTypesStore(s => s.allTypes);
  const activeTypes = useVehicleTypesStore(s => s.activeTypes);

  const vehicleTypeCode  = driver.vehicle_type;
  const matchedType      = [...allTypes, ...activeTypes].find(t => t.code === vehicleTypeCode);
  const vehicleTypeLabel = matchedType?.label
    ?? (vehicleTypeCode
      ? vehicleTypeCode.charAt(0).toUpperCase() + vehicleTypeCode.slice(1)
      : '—');

  const vehicleRows = [
    { label: 'Type de véhicule', value: vehicleTypeLabel },
    ...(vehicle ? [
      { label: 'Marque / Modèle', value: [vehicle.brand, vehicle.model].filter(Boolean).join(' ') || '—' },
      { label: 'Immatriculation',  value: vehicle.plate_number },
      { label: 'Couleur',          value: vehicle.color ?? '—' },
      { label: 'Année',            value: vehicle.year ? String(vehicle.year) : '—' },
    ] : []),
  ];

  const docs: { label: string; expiry: string; status: 'valid' | 'expired' }[] = [
    { label: 'Permis de conduire', expiry: '15/03/2028', status: 'valid'   },
    { label: 'Carte VTC',          expiry: '15/03/2026', status: 'valid'   },
    { label: 'Assurance',          expiry: '15/03/2025', status: 'valid'   },
    { label: 'Carte grise',        expiry: '15/03/2025', status: 'valid'   },
  ];

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Véhicule */}
      <View style={tabStyles.card}>
        <Text style={tabStyles.cardTitle}>Véhicule</Text>
        {vehicleRows.map(row => (
          <View key={row.label} style={tabStyles.infoRow}>
            <Text style={tabStyles.infoLabel}>{row.label}</Text>
            <Text style={tabStyles.infoValue}>{row.value}</Text>
          </View>
        ))}
      </View>

      {/* Documents */}
      <View style={tabStyles.card}>
        <Text style={tabStyles.cardTitle}>Documents</Text>
        {docs.map(doc => (
          <View key={doc.label} style={tabStyles.docRow}>
            <View style={tabStyles.docLeft}>
              <Ionicons name="document-outline" size={18} color={Colors.textMuted} />
              <View>
                <Text style={tabStyles.docLabel}>{doc.label}</Text>
                <Text style={tabStyles.docExpiry}>Expire le {doc.expiry}</Text>
              </View>
            </View>
            <View style={[tabStyles.docBadge, { backgroundColor: doc.status === 'valid' ? '#E8F5E9' : '#FCE4EC' }]}>
              <Text style={[tabStyles.docBadgeText, { color: doc.status === 'valid' ? '#2E7D32' : '#C62828' }]}>
                {doc.status === 'valid' ? 'Valide' : 'Expiré'}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

// ── Tab Statistiques ────────────────────────────────────────────
function TabStatistiques({ driver }: { driver: DriverUser }) {
  const thisMonth = { courses: 45, gains: 2340, note: 4.9 };
  const lastMonth = { courses: 52, gains: 2680, note: 4.8 };
  const evolution = (((thisMonth.courses - lastMonth.courses) / lastMonth.courses) * 100).toFixed(1);
  const isPositive = parseFloat(evolution) >= 0;

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Ce mois-ci */}
      <View style={tabStyles.card}>
        <Text style={tabStyles.cardTitle}>Ce mois-ci</Text>
        <View style={statsStyles.row}>
          {[
            { value: thisMonth.courses.toString(), label: 'Courses' },
            { value: `${thisMonth.gains}€`,        label: 'Gains'   },
            { value: thisMonth.note.toFixed(1),    label: 'Note'    },
          ].map(stat => (
            <View key={stat.label} style={statsStyles.statItem}>
              <Text style={statsStyles.statValue}>{stat.value}</Text>
              <Text style={statsStyles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Mois dernier */}
      <View style={tabStyles.card}>
        <Text style={tabStyles.cardTitle}>Mois dernier</Text>
        <View style={statsStyles.row}>
          {[
            { value: lastMonth.courses.toString(), label: 'Courses' },
            { value: `${lastMonth.gains}€`,        label: 'Gains'   },
            { value: lastMonth.note.toFixed(1),    label: 'Note'    },
          ].map(stat => (
            <View key={stat.label} style={statsStyles.statItem}>
              <Text style={statsStyles.statValue}>{stat.value}</Text>
              <Text style={statsStyles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Évolution */}
      <View style={[tabStyles.card, { backgroundColor: Colors.bordeauxLight }]}>
        <View style={statsStyles.evoHeader}>
          <Text style={statsStyles.evoTitle}>Évolution</Text>
          <Ionicons name="trending-up-outline" size={22} color="rgba(255,255,255,0.7)" />
        </View>
        <Text style={[statsStyles.evoValue, { color: isPositive ? '#A5D6A7' : '#EF9A9A' }]}>
          {isPositive ? '+' : ''}{evolution}%
        </Text>
        <Text style={statsStyles.evoSub}>par rapport au mois dernier</Text>
      </View>
    </ScrollView>
  );
}

const statsStyles = StyleSheet.create({
  row:        { flexDirection: 'row', justifyContent: 'space-around', marginTop: Spacing.sm },
  statItem:   { alignItems: 'center' },
  statValue:  { fontSize: Fonts.size.xl, fontWeight: '800', color: Colors.bordeauxLight },
  statLabel:  { fontSize: Fonts.size.sm, color: Colors.textMuted, marginTop: 2 },
  evoHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  evoTitle:   { fontSize: Fonts.size.md, fontWeight: '700', color: Colors.white },
  evoValue:   { fontSize: Fonts.size.xxl, fontWeight: '800' },
  evoSub:     { fontSize: Fonts.size.sm, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
});

// ── Tab Historique ──────────────────────────────────────────────
function TabHistorique() {
  const trips = [
    { id: '1', client: 'Marie Dubois',   date: '15 janvier 2026 à 14:30', from: 'Massy, 91300',  to: 'Aéroport Paris-Orly', rating: 5, price: 65  },
    { id: '2', client: 'Jean Martin',    date: '14 janvier 2026 à 09:15', from: 'Paris 12e',     to: 'Gare de Lyon',         rating: 4, price: 35  },
    { id: '3', client: 'Sophie Bernard', date: '13 janvier 2026 à 18:45', from: 'Versailles',    to: 'Paris 8e',             rating: 5, price: 55  },
  ];

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      {trips.map(trip => (
        <View key={trip.id} style={histStyles.card}>
          {/* Client + Note */}
          <View style={histStyles.top}>
            <Text style={histStyles.client}>{trip.client}</Text>
            <View style={histStyles.ratingRow}>
              <Ionicons name="star" size={14} color="#F5A623" />
              <Text style={histStyles.rating}>{trip.rating}</Text>
            </View>
          </View>
          <Text style={histStyles.date}>{trip.date}</Text>

          {/* Trajet */}
          <View style={histStyles.routeRow}>
            <Ionicons name="radio-button-on" size={12} color="#4CAF50" />
            <Text style={histStyles.routeText}>{trip.from}</Text>
          </View>
          <View style={histStyles.routeRow}>
            <Ionicons name="location" size={12} color={Colors.bordeauxLight} />
            <Text style={histStyles.routeText}>{trip.to}</Text>
          </View>

          {/* Prix */}
          <View style={histStyles.priceRow}>
            <Text style={histStyles.priceLabel}>Prix</Text>
            <Text style={histStyles.price}>{trip.price}€</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const histStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, marginBottom: Spacing.sm,
  },
  top:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  client:    { fontSize: Fonts.size.md, fontWeight: '700', color: Colors.textPrimary },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  rating:    { fontSize: Fonts.size.sm, fontWeight: '700' },
  date:      { fontSize: Fonts.size.xs, color: Colors.textMuted, marginVertical: Spacing.xs },
  routeRow:  { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: 3 },
  routeText: { fontSize: Fonts.size.sm, color: Colors.textSecondary },
  priceRow:  { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.sm, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border },
  priceLabel:{ fontSize: Fonts.size.sm, color: Colors.textMuted },
  price:     { fontSize: Fonts.size.lg, fontWeight: '800', color: Colors.textPrimary },
});

// ── Styles communs aux tabs ─────────────────────────────────────
const tabStyles = StyleSheet.create({
  card:       { backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, marginBottom: Spacing.sm },
  cardTitle:  { fontSize: Fonts.size.md, fontWeight: '800', color: Colors.bordeauxLight, marginBottom: Spacing.md },
  infoRow:    { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.xs, borderBottomWidth: 1, borderBottomColor: Colors.border },
  infoLabel:  { fontSize: Fonts.size.sm, color: Colors.textMuted },
  infoValue:  { fontSize: Fonts.size.sm, fontWeight: '600', color: Colors.textPrimary },
  docRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
  docLeft:    { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  docLabel:   { fontSize: Fonts.size.sm, fontWeight: '600', color: Colors.textPrimary },
  docExpiry:  { fontSize: Fonts.size.xs, color: Colors.textMuted },
  docBadge:   { borderRadius: Radius.full, paddingVertical: 3, paddingHorizontal: Spacing.sm },
  docBadgeText: { fontSize: Fonts.size.xs, fontWeight: '700' },
});

// ── Screen principal ────────────────────────────────────────────
export default function AdminDriverDetailScreen({ navigation, route }: Props) {
  const { driverId } = route.params as { driverId: string };
  const { fetchDriverById, activateUser, deactivateUser, lockUser, changeDriverStatus, isLoading } = useAdmin();

  const [driver,  setDriver]  = useState<AuthUser | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('informations');

  const fetchDriverByIdRef = useRef(fetchDriverById);
  useEffect(() => { fetchDriverByIdRef.current = fetchDriverById; });

  const load = useCallback(async () => {
    const data = await fetchDriverByIdRef.current(driverId);
    if (data) setDriver(data);
  }, [driverId]); // ← driverId seulement, stable

  useEffect(() => { load(); }, [load]);

  const handleStatusChange = () => {
    if (!driver) return;
    const status   = driver.status;
    const isActive = status === 'active';

    Alert.alert(
      isActive ? 'Désactiver ce chauffeur ?' : 'Réactiver ce chauffeur ?',
      isActive
        ? 'Le chauffeur ne pourra plus se connecter.'
        : 'Le chauffeur pourra à nouveau se connecter.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: isActive ? 'Désactiver' : 'Réactiver',
          style: isActive ? 'destructive' : 'default',
          onPress: async () => {
            const reason = isActive
              ? 'Désactivation manuelle par l\'administrateur.'
              : 'Réactivation manuelle par l\'administrateur.';
            try {
              if (isActive) await deactivateUser(driver.id, reason);
              else          await activateUser(driver.id, reason);
              await load();
            } catch (_) {}
          },
        },
      ]
    );
  };

  const handleLock = () => {
    if (!driver) return;
    Alert.alert(
      'Verrouiller ce compte ?',
      'Le chauffeur sera temporairement bloqué.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Verrouiller', style: 'destructive',
          onPress: async () => {
            try {
              await lockUser(driver.id, 'Verrouillage préventif par l\'administrateur.');
              await load();
            } catch (_) {}
          },
        },
      ]
    );
  };

  const handleDriverStatusChange = (status: 'pending' | 'probationary' | 'active' | 'rejected' | 'suspended' ) => {
    if (!driver?.driver) return;

    const labels = {
      pending:      'Remettre en attente',
      probationary: 'Passer en probationnaire',
      active:       'Valider',
      rejected:     'Rejeter',
      suspended:    'Suspendre',
    } as const;

    const messages = {
      pending:      'Le profil du chauffeur sera remis en attente de validation.',
      probationary: 'Le chauffeur pourra se connecter et prendre des courses en attendant la validation complète de son dossier.',
      active:       'Le chauffeur pourra reprendre son activité.',
      rejected:     'Le chauffeur sera refusé et son compte ne pourra pas être activé sans nouvelle validation.',
      suspended:    'Le chauffeur sera temporairement suspendu.',
    } as const;

    Alert.alert(
      `${labels[status]} ce chauffeur ?`,
      messages[status],
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: labels[status],
          style: (status === 'rejected' || status === 'pending') ? 'destructive' : 'default',
          onPress: async () => {
            try {
              await changeDriverStatus(driver.driver!.id, {
                status,
                reason: `Changement de statut par l'administrateur : ${labels[status]}.`,
              });
              Alert.alert('Succès', 'Le statut du chauffeur a été mis à jour.');
              await load();
            } catch (_) {}
          },
        },
      ]
    );
  };

  if (isLoading && !driver) {
    return (
      <View style={[styles.flex, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.bordeauxLight} />
      </View>
    );
  }
  
  if (!driver) {
    return (
      <View style={[styles.flex, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.bordeauxLight} />
      </View>
    );
  }

  const statusConfig = STATUS_CONFIG[driver.status] ?? STATUS_CONFIG.active;
  const driverStatusConfig = DRIVER_STATUS_CONFIG[driver.driver?.status ?? 'pending'] ?? DRIVER_STATUS_CONFIG.pending;
  const initials     = `${driver.first_name?.[0] ?? ''}${driver.last_name?.[0] ?? ''}`.toUpperCase();
  // FIX: driver.rating and driver.trips_count are not directly on AuthUser. They are on DriverUser.
  const rating       = (driver as any).rating     ?? 0;
  const tripsCount   = (driver as any).trips_count ?? 0;
  const createdAt    = new Date(driver.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <View style={styles.flex}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Détails du chauffeur</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.flex} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Profil card ── */}
        <View style={styles.profileCard}>
          <View style={styles.profileTop}>
            {/* Avatar */}
            <View style={styles.avatar}>
              {driver.profile_photo_url ? (
                <Image source={{ uri: driver.profile_photo_url }} style={{ width: '100%', height: '100%' }} />
              ) : (
                <Ionicons name="person-outline" size={32} color={Colors.textMuted} />
              )}
            </View>

            {/* Nom + statut */}
            <View style={styles.profileInfo}>
              <View style={styles.nameStatusRow}>
                <Text style={styles.driverName}>{driver.first_name} {driver.last_name}</Text>
                <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
                  <Text style={[styles.statusText, { color: statusConfig.color }]}>{statusConfig.label}</Text>
                </View>
              </View>

              <View style={styles.ratingRow}>
                <Ionicons name="star" size={14} color="#F5A623" />
                <Text style={styles.rating}>{rating.toFixed(1)}</Text>
                <Text style={styles.tripsCount}>({tripsCount} courses)</Text>
              </View>
            </View>
          </View>

          {/* Contacts */}
          <InfoRow icon="call-outline"     value={driver!.phone}                                  />
          <InfoRow icon="mail-outline"     value={driver.email}                                  />
          <InfoRow icon="calendar-outline" value={`Inscrit le ${createdAt}`}                     />

          {/* Actions admin
          <View style={styles.adminActions}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: driver.status === 'active' ? Colors.errorLight : '#E8F5E9' }]}
              onPress={handleStatusChange}
            >
              <Ionicons
                name={driver.status === 'active' ? 'pause-circle-outline' : 'play-circle-outline'}
                size={16}
                color={driver.status === 'active' ? Colors.error : '#2E7D32'}
              />
              <Text style={[styles.actionBtnText, { color: driver.status === 'active' ? Colors.error : '#2E7D32' }]}>
                {driver.status === 'active' ? 'Désactiver' : 'Réactiver'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#FFF3E0' }]}
              onPress={handleLock}
            >
              <Ionicons name="lock-closed-outline" size={16} color="#E65100" />
              <Text style={[styles.actionBtnText, { color: '#E65100' }]}>Verrouiller</Text>
            </TouchableOpacity>
          </View> */}

          {/* ── Actions pour le statut du chauffeur (pending/probationary/active/rejected/suspended) ── */}
          {/* {driver.driver && (
            <View style={styles.driverStatusActions}>
              {driver.driver.status === 'pending' && (
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: Colors.warningLight }]}
                  onPress={() => handleDriverStatusChange('probationary')}
                >
                  <Ionicons name="hourglass-outline" size={16} color={Colors.warning} />
                  <Text style={[styles.actionBtnText, { color: Colors.warning }]}>
                    Passer en probationnaire
                  </Text>
                </TouchableOpacity>
              )}
              {driver.driver.status === 'probationary' && (
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: '#E3F2FD' }]}
                  onPress={() => handleDriverStatusChange('pending')}
                >
                  <Ionicons name="arrow-back-circle-outline" size={16} color= '#1976D2'/>
                  <Text style={[styles.actionBtnText, { color:'#1976D2' }]}>
                    Retour en attente
                  </Text>
                </TouchableOpacity>
              )}
              {driver.driver.status !== 'active' && driver.driver.status !== 'pending' && driver.driver.status !== 'probationary' && (
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: Colors.successLight }]}
                  onPress={() => handleDriverStatusChange('active')}
                >
                  <Ionicons name="checkmark-circle-outline" size={16} color={Colors.success} />
                  <Text style={[styles.actionBtnText, { color: Colors.success }]}>
                    Valider le profil
                  </Text>
                </TouchableOpacity>
              )}
              {driver.driver.status !== 'rejected' && driver.driver.status !== 'pending' && (
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: Colors.errorLight }]}
                  onPress={() => handleDriverStatusChange('rejected')}
                >
                  <Ionicons name="close-circle-outline" size={16} color={Colors.error} />
                  <Text style={[styles.actionBtnText, { color: Colors.error }]}>
                    Rejeter le profil
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )} */}
          {/* Actions de gestion */}
          <View style={styles.actionsContainer}>
            {/* Gestion du compte utilisateur */}
            <View style={styles.actionGroup}>
              <Text style={styles.actionGroupTitle}>Gestion du compte utilisateur</Text>
              <View style={styles.adminActions}>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: driver.status === 'active' ? Colors.errorLight : '#E8F5E9' }]}
                  onPress={handleStatusChange}
                >
                  <Ionicons
                    name={driver.status === 'active' ? 'pause-circle-outline' : 'play-circle-outline'}
                    size={16}
                    color={driver.status === 'active' ? Colors.error : '#2E7D32'}
                  />
                  <Text style={[styles.actionBtnText, { color: driver.status === 'active' ? Colors.error : '#2E7D32' }]}>
                    {driver.status === 'active' ? 'Désactiver' : 'Réactiver'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: '#FFF3E0' }]}
                  onPress={handleLock}
                >
                  <Ionicons name="lock-closed-outline" size={16} color="#E65100" />
                  <Text style={[styles.actionBtnText, { color: '#E65100' }]}>Verrouiller</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Gestion du profil chauffeur */}
            {driver.driver && (
              <View style={styles.actionGroup}>
                <Text style={styles.actionGroupTitle}>Gestion du profil chauffeur</Text>
                <View style={styles.driverStatusActions}>
                  {driver.driver.status === 'pending' && (
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: Colors.warningLight }]}
                      onPress={() => handleDriverStatusChange('probationary')}
                    >
                      <Ionicons name="hourglass-outline" size={16} color={Colors.warning} />
                      <Text style={[styles.actionBtnText, { color: Colors.warning }]}>
                        Probationnaire
                      </Text>
                    </TouchableOpacity>
                  )}
                  {driver.driver.status === 'probationary' && (
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: '#E3F2FD' }]}
                      onPress={() => handleDriverStatusChange('pending')}
                    >
                      <Ionicons name="arrow-back-circle-outline" size={16} color='#1976D2' />
                      <Text style={[styles.actionBtnText, { color: '#1976D2' }]}>
                        Retour en attente
                      </Text>
                    </TouchableOpacity>
                  )}
                  {driver.driver.status !== 'active' && (
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: Colors.successLight }]}
                      onPress={() => handleDriverStatusChange('active')}
                    >
                      <Ionicons name="checkmark-circle-outline" size={16} color={Colors.success} />
                      <Text style={[styles.actionBtnText, { color: Colors.success }]}>
                        Valider le profil
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
          </View>
        </View>

        {/* ── Tabs ── */}
        <View style={styles.tabBar}>
          {TABS.map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>


        {/* ── Contenu du tab ── */}
        <View style={styles.tabContent}>
          {activeTab === 'informations' && <TabInformations driver={driver as DriverUser} />}
          {activeTab === 'statistiques' && <TabStatistiques driver={driver as DriverUser} />}
          {activeTab === 'historique'   && <TabHistorique />}
        </View>

      </ScrollView>
    </View>
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
  headerBtn:   { padding: Spacing.sm, width: 40 },
  headerTitle: { color: Colors.white, fontWeight: '800', fontSize: Fonts.size.lg },

  profileCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, marginBottom: Spacing.md,
  },
  profileTop:    { flexDirection: 'row', alignItems: 'flex-start', marginBottom: Spacing.md },
  avatar: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: Colors.beigeLight ?? '#F0EAE8',
    alignItems: 'center', justifyContent: 'center',
    marginRight: Spacing.md, overflow: 'hidden',
  },
  profileInfo:   { flex: 1 },
  nameStatusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.xs },
  driverName:    { fontSize: Fonts.size.lg, fontWeight: '800', color: Colors.textPrimary, flex: 1 },
  statusBadge:   { borderRadius: Radius.full, paddingVertical: 3, paddingHorizontal: Spacing.sm, marginLeft: Spacing.xs },
  statusText:    { fontSize: Fonts.size.xs, fontWeight: '700' },
  driverStatusRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginTop: Spacing.xs },
  driverStatusLabel: { fontSize: Fonts.size.xs, color: Colors.textSecondary, fontWeight: '600' },
  driverStatusBadge: { borderRadius: Radius.full, paddingVertical: 3, paddingHorizontal: Spacing.sm, marginLeft: Spacing.xs },
  driverStatusText: { fontSize: Fonts.size.xs, fontWeight: '700' },
  ratingRow:     { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  rating:        { fontSize: Fonts.size.md, fontWeight: '700', color: Colors.textPrimary },
  tripsCount:    { fontSize: Fonts.size.sm, color: Colors.textMuted },

  actionsContainer: { gap: Spacing.md, marginVertical: Spacing.md },
  actionGroup: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
    gap: Spacing.md,
    elevation: 2,
    shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }
  },
  actionGroupTitle: { fontSize: Fonts.size.md, fontWeight: '400', color: Colors.textSecondary },
  driverStatusActions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginTop: Spacing.xs },
  adminActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xs },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.xs, paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    minWidth: '48%', // Pour s'assurer que les boutons ne deviennent pas trop petits
  },
  actionBtnText: { fontSize: Fonts.size.sm, fontWeight: '600' },

  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border,
    marginBottom: Spacing.md, padding: 3,
  },
  tab:           { flex: 1, paddingVertical: Spacing.md, borderRadius: Radius.sm, alignItems: 'center' },
  tabActive:     { backgroundColor: Colors.bordeauxLight, padding : Spacing.md, borderRadius: Radius.lg},
  tabText:       { fontSize: Fonts.size.sm, fontWeight: '600', color: Colors.textSecondary },
  tabTextActive: { color: Colors.white },
  tabContent:    { flex: 1, },
});