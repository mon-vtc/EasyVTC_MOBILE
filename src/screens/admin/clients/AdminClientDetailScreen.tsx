import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, Linking, Platform, Image, Alert, FlatList
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Fonts } from '../../../theme/colors';
import { useClientsStore, useAuthStore } from '../../../store';
import type { ClientWithStats, ClientTripItem, ClientsStackParamList } from '../../../types';
import type { FavoriteAddress, FavoriteAddressType } from '../../../types/favorites.types';
import { favoritesApi } from '../../../services/api/favorites.api';

type Nav = NativeStackNavigationProp<ClientsStackParamList, 'ClientDetail'>;

type Tab = 'informations' | 'historique';

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string; dot: string }> = {
  active:   { label: 'Actif',    bg: '#E6F9F1', color: '#34C77B', dot: '#34C77B' },
  inactive: { label: 'Inactif',  bg: '#FFF3E0', color: '#E65100', dot: '#E65100' },
  locked:   { label: 'Suspendu', bg: '#FDECEA', color: '#E53935', dot: '#E53935' },
};

const ICONS_MAP: Record<FavoriteAddressType, { name: React.ComponentProps<typeof Ionicons>['name'], color: string, bg: string }> = {
  home: { name: 'home', color: '#3B82F6', bg: '#DBEAFE' },
  office: { name: 'briefcase', color: '#8B5CF6', bg: '#EDE9FE' },
  airport: { name: 'airplane', color: '#10B981', bg: '#D1FAE5' },
  station: { name: 'train', color: '#F97316', bg: '#FFEDD5' },
  custom: { name: 'location', color: '#6B7280', bg: '#F3F4F6' },
};


// ── Étoiles de notation ───────────────────────────────────────────────────────
function StarRating({ value }: { value: number | null }) {
  if (value === null) return null;
  const full    = Math.floor(value);
  const hasHalf = value - full >= 0.5;
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Ionicons
          key={i}
          name={i <= full ? 'star' : (i === full + 1 && hasHalf ? 'star-half' : 'star-outline')}
          size={14}
          color="#F59E0B"
        />
      ))}
    </View>
  );
}

// ── Ligne de course (historique) ──────────────────────────────────────────────
function TripRow({ trip }: { trip: ClientTripItem }) {
  const date   = new Date(trip.scheduled_at);
  const dateStr = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  const timeStr = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const price   = trip.price_final ?? trip.price_estimated;
  const driverName = trip.driver_first_name
    ? `${trip.driver_first_name} ${trip.driver_last_name ?? ''}`
    : null;

  return (
    <View style={tripSt.wrapper}>
      <View style={tripSt.header}>
        <View style={tripSt.dateBlock}>
          <Ionicons name="calendar-outline" size={13} color={Colors.textMuted} />
          <Text style={tripSt.dateText}>{dateStr} à {timeStr}</Text>
        </View>
        <Text style={tripSt.price}>{price.toFixed(2)} €</Text>
      </View>

      <View style={tripSt.addrRow}>
        <View style={[tripSt.dot, { backgroundColor: '#34C77B' }]} />
        <Text style={tripSt.addrText} numberOfLines={1}>{trip.pickup_address}</Text>
      </View>
      <View style={[tripSt.addrRow, { marginBottom: 4 }]}>
        <View style={[tripSt.dot, { backgroundColor: Colors.bordeaux }]} />
        <Text style={tripSt.addrText} numberOfLines={1}>{trip.dest_address}</Text>
      </View>

      {driverName && (
        <View style={tripSt.driverRow}>
          <Ionicons name="person-outline" size={13} color={Colors.textMuted} />
          <Text style={tripSt.driverText}>{driverName}</Text>
          {trip.rating !== null && <StarRating value={trip.rating} />}
        </View>
      )}
    </View>
  );
}

const tripSt = StyleSheet.create({
  wrapper: {
    backgroundColor: Colors.surface,
    borderRadius:    Radius.md,
    borderWidth:     1,
    borderColor:     Colors.border,
    padding:         Spacing.md,
    marginBottom:    Spacing.sm,
  },
  header:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  dateBlock: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dateText:  { fontSize: Fonts.size.sm, color: Colors.textSecondary },
  price:     { fontSize: Fonts.size.md, fontFamily: Fonts.bold, fontWeight: '700', color: Colors.textPrimary },
  addrRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  dot:       { width: 8, height: 8, borderRadius: 4 },
  addrText:  { flex: 1, fontSize: Fonts.size.sm, color: Colors.textPrimary },
  driverRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, paddingTop: 8, borderTopWidth: 1, borderTopColor: Colors.border },
  driverText:{ fontSize: Fonts.size.sm, color: Colors.textMuted, flex: 1 },
});

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, iconBg, iconColor }: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string; value: string;
  iconBg: string; iconColor: string;
}) {
  return (
    <View style={statSt.card}>
      <View style={[statSt.iconCircle, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={22} color={iconColor} />
      </View>
      <Text style={statSt.label}>{label}</Text>
      <Text style={statSt.value}>{value}</Text>
    </View>
  );
}

const statSt = StyleSheet.create({
  card: {
    flex: 1, backgroundColor: Colors.white, borderRadius: Radius.md,
    padding: Spacing.md, alignItems: 'center', gap: 4,
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4,
  },
  iconCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  label:      { fontSize: Fonts.size.xs, color: Colors.textSecondary, textAlign: 'center' },
  value:      { fontSize: Fonts.size.lg, fontFamily: Fonts.bold, fontWeight: '800', color: Colors.textPrimary },
});

// ── Écran principal ───────────────────────────────────────────────────────────
export default function AdminClientDetailScreen() {
  const navigation  = useNavigation<Nav>();
  const route       = useRoute<any>();
  const { clientId } = route.params as { clientId: string };
  const accessToken  = useAuthStore(s => s.accessToken);
  const [favorites, setFavorites] = useState<FavoriteAddress[]>([]);

  const { fetchClientById, fetchClientTrips } = useClientsStore();

  const [client,   setClient]   = useState<ClientWithStats | null>(null);
  const [trips,    setTrips]    = useState<ClientTripItem[]>([]);
  const [tripsPage,       setTripsPage]       = useState(1);
  const [tripsTotalPages, setTripsTotalPages] = useState(1);
  const [loading,  setLoading]  = useState(true);
  const [tripsLoading, setTripsLoading] = useState(false);
  const [isFetchingNextTripsPage, setIsFetchingNextTripsPage] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('informations');

  useEffect(() => {
    (async () => {
      try {
        const [clientData, favRes] = await Promise.all([
          fetchClientById(accessToken!, clientId),
          favoritesApi.list(accessToken!, clientId),
        ]);
        setClient(clientData);
        if (favRes.ok && favRes.data) setFavorites(favRes.data);
      } finally {
        setLoading(false);
      }
    })();
  }, [clientId, accessToken, fetchClientById]);

  const loadTrips = async (page = 1) => {
    if (page === 1 && trips.length > 0) return;
    page === 1 ? setTripsLoading(true) : setIsFetchingNextTripsPage(true);
    try {
      const result = await fetchClientTrips(accessToken!, clientId, { page });
      if (result) {
        setTrips(prev => page === 1 ? result.trips : [...prev, ...result.trips]);
        setTripsPage(page);
        setTripsTotalPages(result.totalPages);
      }
    } finally {
      setTripsLoading(false);
      setIsFetchingNextTripsPage(false);
    }
  };

  const loadMoreTrips = useCallback(() => {
    if (tripsLoading || isFetchingNextTripsPage || tripsPage >= tripsTotalPages) return;
    loadTrips(tripsPage + 1);
  }, [tripsLoading, isFetchingNextTripsPage, tripsPage, tripsTotalPages]);

  const getIconForFavorite = (label: string): FavoriteAddressType => {
    const lowerLabel = label.toLowerCase();
    if (lowerLabel.includes('domicile') || lowerLabel.includes('maison')) return 'home';
    if (lowerLabel.includes('bureau') || lowerLabel.includes('travail')) return 'office';
    if (lowerLabel.includes('aéroport') || lowerLabel.includes('airport') || lowerLabel.includes('cdg') || lowerLabel.includes('orly')) return 'airport';
    if (lowerLabel.includes('gare')) return 'station';
    return 'custom';
  };

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    if (tab === 'historique') loadTrips();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.bordeaux} />
      </View>
    );
  }

  if (!client) {
    return (
      <View style={styles.center}>
        <Ionicons name="person-outline" size={48} color={Colors.border} />
        <Text style={styles.errorText}>Client introuvable</Text>
      </View>
    );
  }

  const initials  = `${client.first_name?.[0] ?? ''}${client.last_name?.[0] ?? ''}`.toUpperCase();
  const statusCfg = STATUS_CONFIG[client.status] ?? STATUS_CONFIG.active;
  const memberSince = new Date(client.created_at).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

   const renderCard = (item: FavoriteAddress) => {
      const favoriteType = getIconForFavorite(item.label);
      const iconInfo = ICONS_MAP[favoriteType];
      return (
        <View key={item.id} style={styles.card}>
          <View style={[styles.iconContainer, { backgroundColor: iconInfo.bg }]}>
            <Ionicons name={iconInfo.name} size={24} color={iconInfo.color} />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardLabel}>{item.label}</Text>
            <Text style={styles.cardAddress}>{item.address}</Text>
          </View>
        </View>
      );
    };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Détails client</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Carte identité */}
        <View style={styles.identityCard}>
          <View style={styles.avatarWrapper}>
            {client.profile_photo_url
              ? <Image source={{ uri: client.profile_photo_url }} style={styles.avatar} />
              : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarInitials}>{initials}</Text>
                </View>
              )
            }
          </View>

          <View style={styles.nameRow}>
            <Text style={styles.userName}>{client.first_name} {client.last_name}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
              <View style={[styles.statusDot, { backgroundColor: statusCfg.dot }]} />
              <Text style={[styles.statusText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
            </View>
          </View>

          {client.avg_rating !== null && (
            <View style={styles.ratingRow}>
              <StarRating value={client.avg_rating} />
              <Text style={styles.ratingValue}>{client.avg_rating.toFixed(1)}</Text>
            </View>
          )}

          {/* Infos contact */}
          <TouchableOpacity style={styles.infoRow} onPress={() => Linking.openURL(`mailto:${client.email}`)}>
            <Ionicons name="mail-outline" size={15} color="#5B8DEF" />
            <Text style={styles.infoText}>{client.email}</Text>
          </TouchableOpacity>
          {client.phone && (
            <TouchableOpacity style={styles.infoRow} onPress={() => Linking.openURL(`tel:${client.phone!}`)}>
              <Ionicons name="call-outline" size={15} color="#34C77B" />
              <Text style={styles.infoText}>{client.phone}</Text>
            </TouchableOpacity>
          )}
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={15} color={Colors.textMuted} />
            <Text style={styles.infoText}>Inscrit le {memberSince}</Text>
          </View>
        </View>

        {/* 4 KPIs */}
        <View style={styles.statsGrid}>
          <View style={styles.statsRow}>
            <StatCard
              icon="car-outline"
              label="Total des courses"
              value={String(client.total_trips)}
              iconBg="#E8F0FE"
              iconColor="#4285F4"
            />
            <StatCard
              icon="cash-outline"
              label="Dépenses totales"
              value={`${client.total_spent.toFixed(0)} €`}
              iconBg="#FDF3E6"
              iconColor="#E67E22"
            />
          </View>
          <View style={styles.statsRow}>
            <StatCard
              icon="star-outline"
              label="Note moyenne"
              value={client.avg_rating !== null ? client.avg_rating.toFixed(1) : '—'}
              iconBg="#FFFBEB"
              iconColor="#F59E0B"
            />
            <StatCard
              icon="close-circle-outline"
              label="Annulation du taux"
              value={`${client.cancellation_rate} %`}
              iconBg="#FDECEA"
              iconColor="#E53935"
            />
          </View>
        </View>

        {/* Onglets */}
        <View style={styles.tabs}>
          {(['informations', 'historique'] as Tab[]).map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabItem, activeTab === tab && styles.tabItemActive]}
              onPress={() => handleTabChange(tab)}
            >
              <Text style={[styles.tabLabel, activeTab === tab && styles.tabLabelActive]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Contenu onglet Informations */}
        {activeTab === 'informations' && (
          <View>
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Ionicons name="location-outline" size={18} color={Colors.bordeauxLight} />
                <Text style={styles.sectionTitle}>Adresses favorites</Text>
              </View>
              {favorites.length === 0 ? (
                <View style={styles.emptyFavorites}>
                  <Ionicons name="location-outline" size={32} color={Colors.border} />
                  <Text style={styles.emptyFavoritesText}>
                    Aucune adresse enregistrée
                  </Text>
                  <Text style={styles.emptyFavoritesHint}>
                    Disponible après la première course
                  </Text>
                </View>
              ) : (
                favorites.map(item => renderCard(item))
              )}   
            </View>

            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Ionicons name="information-circle-outline" size={18} color={Colors.bordeauxLight} />
                <Text style={styles.sectionTitle}>Informations</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Statut</Text>
                <Text style={[styles.detailValue, { color: statusCfg.color }]}>{statusCfg.label}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Consentement RGPD</Text>
                <Text style={styles.detailValue}>{client.rgpd_consent ? 'Oui' : 'Non'}</Text>
              </View>
              {client.status_reason && (
                <View style={[styles.detailRow, { flexDirection: 'column', gap: 4 }]}>
                  <Text style={styles.detailLabel}>Motif du statut</Text>
                  <Text style={[styles.detailValue, { textAlign: 'left' }]}>{client.status_reason}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Contenu onglet Historique */}
        {activeTab === 'historique' && (
          <View>
            {tripsLoading ? (
              <View style={styles.center}>
                <ActivityIndicator size="small" color={Colors.bordeaux} />
              </View>
            ) : (
              <FlatList
                data={trips}
                keyExtractor={item => item.id}
                renderItem={({ item }) => <TripRow trip={item} />}
                scrollEnabled={false}
                onEndReached={loadMoreTrips}
                onEndReachedThreshold={0.5}
                ListEmptyComponent={
                  <View style={styles.emptyTrips}>
                    <Ionicons name="car-outline" size={40} color={Colors.border} />
                    <Text style={styles.emptyText}>Aucune course effectuée</Text>
                  </View>
                }
                ListFooterComponent={isFetchingNextTripsPage ? <ActivityIndicator style={{ marginVertical: 12 }} color={Colors.bordeaux} /> : null}
              />
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center:    { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.md, paddingTop: 60 },
  errorText: { fontSize: Fonts.size.md, color: Colors.textMuted },

  header: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    backgroundColor:   Colors.bordeaux,
    paddingTop:        Platform.OS === 'ios' ? 56 : Spacing.xl + 8,
    paddingBottom:     Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  headerBtn:   { padding: Spacing.sm, width: 40 },
  headerTitle: { fontSize: Fonts.size.lg, fontFamily: Fonts.semibold, fontWeight: '600', color: Colors.white },

  scroll:        { flex: 1 },
  scrollContent: { padding: Spacing.md, paddingBottom: Spacing.xl },

  identityCard: {
    backgroundColor: Colors.white, borderRadius: Radius.md,
    padding: Spacing.md, marginBottom: Spacing.sm,
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4,
  },
  avatarWrapper:  { marginBottom: Spacing.sm },
  avatar:         { width: 64, height: 64, borderRadius: 32 },
  avatarFallback: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: Colors.beigeLight,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarInitials: { fontSize: Fonts.size.xl, fontFamily: Fonts.bold, fontWeight: '700', color: Colors.bordeauxLight },
  nameRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 6,
  },
  userName:    { fontSize: Fonts.size.xl, fontFamily: Fonts.bold, fontWeight: '700', color: Colors.textPrimary, flex: 1 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full,
  },
  statusDot:  { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: Fonts.size.sm, fontFamily: Fonts.semibold, fontWeight: '600' },
  ratingRow:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.sm },
  ratingValue:{ fontSize: Fonts.size.sm, fontFamily: Fonts.semibold, fontWeight: '600', color: Colors.textPrimary },
  infoRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  infoText:   { fontSize: Fonts.size.sm, color: Colors.textPrimary },

  statsGrid: { marginBottom: Spacing.sm, gap: Spacing.sm },
  statsRow:  { flexDirection: 'row', gap: Spacing.sm },

  tabs: {
    flexDirection:    'row',
    backgroundColor:  Colors.surface,
    borderRadius:     Radius.md,
    borderWidth:      1,
    borderColor:      Colors.border,
    padding:          3,
    marginBottom:     Spacing.md,
  },
  tabItem:       { flex: 1, paddingVertical: Spacing.sm, borderRadius: Radius.sm - 1, alignItems: 'center' },
  tabItemActive: { backgroundColor: Colors.bordeaux },
  tabLabel:      { fontSize: Fonts.size.sm, fontFamily: Fonts.semibold, fontWeight: '600', color: Colors.textMuted },
  tabLabelActive:{ fontSize: Fonts.size.sm, fontFamily: Fonts.bold, fontWeight: '700', color: Colors.white },

  sectionCard: {
    backgroundColor: Colors.white, borderRadius: Radius.md,
    padding: Spacing.md, marginBottom: Spacing.sm,
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.md },
  sectionTitle:  { fontSize: Fonts.size.md, fontFamily: Fonts.bold, fontWeight: '700', color: Colors.bordeauxDark },

  emptyFavorites: { alignItems: 'center', paddingVertical: Spacing.lg, gap: Spacing.xs },
  emptyFavoritesText: { fontSize: Fonts.size.sm, fontFamily: Fonts.semibold, fontWeight: '600', color: Colors.textSecondary },
  emptyFavoritesHint: { fontSize: Fonts.size.xs, color: Colors.textMuted },

  detailRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  detailLabel: { fontSize: Fonts.size.sm, color: Colors.textSecondary },
  detailValue: { fontSize: Fonts.size.sm, fontFamily: Fonts.semibold, fontWeight: '600', color: Colors.textPrimary, textAlign: 'right', maxWidth: '60%' },

  emptyTrips: { alignItems: 'center', paddingTop: 40, gap: Spacing.md },
  emptyText:  { fontSize: Fonts.size.md, color: Colors.textMuted },

   card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  cardContent: {
    flex: 1,
  },
  cardLabel: {
    fontSize: Fonts.size.md,
    fontFamily: Fonts.bold, fontWeight: '700',
    color: Colors.bordeaux,
  },
  cardAddress: {
    fontSize: Fonts.size.sm,
    color: Colors.textSecondary,
    marginTop: 4,
  },
});
