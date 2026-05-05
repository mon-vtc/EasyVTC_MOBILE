import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Platform, RefreshControl, Image,
} from 'react-native';

import { Ionicons }  from '@expo/vector-icons';
import { Colors, Fonts, Spacing, Radius } from '../../../theme/colors';
import { Logo } from '../../../constants/logo';
import { useAdmin }  from '../../../hooks/useAdmin';
import type { AuthUser } from '../../../types';



import type { CompositeScreenProps }    from '@react-navigation/native';
import type { DrawerScreenProps }       from '@react-navigation/drawer';
import type { NativeStackScreenProps }  from '@react-navigation/native-stack';
import type {
    AdminDrawerParamList,
    DriversStackParamList,
} from '../../../types/auth.types'; // ← une seule source

type Props = CompositeScreenProps<
  NativeStackScreenProps<DriversStackParamList, 'DriversList'>,
  DrawerScreenProps<AdminDrawerParamList>
>;

type FilterTab = 'tous' | 'actifs' | 'inactifs';

const TABS: { key: FilterTab; label: string }[] = [
  { key: 'tous',     label: 'Tous'     },
  { key: 'actifs',   label: 'Actifs'   },
  { key: 'inactifs', label: 'Inactifs' },
];

// ── Carte chauffeur ─────────────────────────────────────────────
function DriverCard({
  driver,
  onPress,
  }: {
    driver:  AuthUser;
    onPress: () => void;
  }) {
  const isOnline   = driver.driver?.is_online ?? false;
  const lastSeen   = (driver as any).last_seen_label ?? (isOnline ? 'En ligne' : 'Hors ligne');
  const rating     = (driver as any).rating ?? 0;
  const trips      = (driver as any).trips_count ?? 0;
  const vehicle    = driver.driver?.vehicle_type;
  const vehicleStr = vehicle;

  const initials = `${driver.first_name?.[0] ?? ''}${driver.last_name?.[0] ?? ''}`.toUpperCase();

  return (
    <TouchableOpacity style={cardStyles.wrapper} onPress={onPress} activeOpacity={0.7}>
      <View style={cardStyles.top}>

        {/* Avatar */}
        <View style={cardStyles.avatar}>
          {driver.profile_photo_url ? (
            <Image source={{ uri: driver.profile_photo_url }} style={cardStyles.avatarImg} />
          ) : (
            <Text style={cardStyles.avatarInitials}>{initials}</Text>
          )}
        </View>

        {/* Infos */}
        <View style={cardStyles.info}>
          <View style={cardStyles.nameRow}>
            <Text style={cardStyles.name}>{driver.first_name} {driver.last_name}</Text>
            <View style={cardStyles.ratingRow}>
              <Ionicons name="star" size={14} color="#F5A623" />
              <Text style={cardStyles.rating}>{rating.toFixed(1)}</Text>
            </View>
          </View>
          <Text style={cardStyles.phone}>{driver.phone}</Text>
        </View>
      </View>

      {/* Détails */}
      <View style={cardStyles.details}>
        <View style={cardStyles.detailRow}>
          <Ionicons name="car-outline" size={14} color={Colors.textMuted} />
          <Text style={cardStyles.detailText}>{vehicleStr}</Text>
        </View>
        <View style={cardStyles.detailRow}>
          <Ionicons name="swap-horizontal-outline" size={14} color={Colors.textMuted} />
          <Text style={cardStyles.detailText}>{trips} courses effectuées</Text>
        </View>
      </View>

      {/* Footer */}
      <View style={cardStyles.footer}>
        <View style={cardStyles.statusRow}>
          <View style={[cardStyles.dot, { backgroundColor: isOnline ? Colors.online : Colors.offline }]} />
          <Text style={[cardStyles.statusText, { color: isOnline ? Colors.online : Colors.offline }]}>
            {lastSeen}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
      </View>
    </TouchableOpacity>
  );
}

const cardStyles = StyleSheet.create({
  wrapper: {
    backgroundColor: Colors.surface,
    borderRadius:    Radius.md,
    borderWidth:     1,
    borderColor:     Colors.border,
    padding:         Spacing.md,
    marginBottom:    Spacing.sm,
  },
  top:      { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: Colors.beigeLight ?? '#F0EAE8',
    alignItems: 'center', justifyContent: 'center',
    marginRight: Spacing.md, overflow: 'hidden',
  },
  avatarImg:      { width: '100%', height: '100%' },
  avatarInitials: { fontSize: Fonts.size.md, fontWeight: '700', color: Colors.bordeaux },
  info:           { flex: 1 },
  nameRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name:           { fontSize: Fonts.size.md, fontWeight: '700', color: Colors.bordeaux },
  phone:          { fontSize: Fonts.size.sm, color: Colors.textMuted, marginTop: 2 },
  ratingRow:      { flexDirection: 'row', alignItems: 'center', gap: 3 },
  rating:         { fontSize: Fonts.size.sm, fontWeight: '700', color: Colors.textPrimary },
  details:        { gap: 4, marginBottom: Spacing.sm },
  detailRow:      { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  detailText:     { fontSize: Fonts.size.sm, color: Colors.textSecondary },
  footer: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border,
  },
  statusRow:  { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  dot:        { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: Fonts.size.sm, fontWeight: '500' },
});

// ── Screen ──────────────────────────────────────────────────────
export default function AdminDriversScreen({ navigation }: Props) {
  const { fetchDrivers, drivers, isDriversLoading, driversError } = useAdmin();

  const [search,     setSearch]     = useState('');
  const [activeTab,  setActiveTab]  = useState<FilterTab>('tous');
  const [refreshing, setRefreshing] = useState(false);

  const fetchDriversRef = useRef(fetchDrivers);
  useEffect(() => { fetchDriversRef.current = fetchDrivers; });

  const load = useCallback(async () => {
    const params = search.trim() ? { search: search.trim() } : undefined;
    try { await fetchDriversRef.current(params); } catch (_) {}
  }, [search]);


  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const filtered = useMemo(() => {
    return drivers
      .filter(d => {
        if (activeTab === 'actifs')   return d.driver?.is_online === true;
        if (activeTab === 'inactifs') return d.driver?.is_online !== true;
        return true;
      })
      .filter(d =>
        search.trim() === '' ||
        `${d.first_name} ${d.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
        d.phone?.includes(search) ||
        d.email?.toLowerCase().includes(search.toLowerCase())
      );
  }, [drivers, search, activeTab]);

  return (
    <View style={styles.flex}>

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

      {/* ── Recherche + Filtres ── */}
      <View style={styles.searchSection}>
        <View style={styles.searchContent} >
          <View style={styles.searchWrapper}>
            <Ionicons name="search-outline" size={18} color={Colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher un chauffeur..."
              placeholderTextColor={Colors.textMuted}
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
          
          <View style={styles.tabs}>
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
        </View>
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.bordeaux]} />}
      >
        {/* Compteur */}
        <Text style={styles.count}>
          {filtered.length} chauffeur{filtered.length > 1 ? 's' : ''}
        </Text>

        {/* Erreur */}
        {driversError && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>⚠️ {driversError}</Text>
          </View>
        )}

        {/* Liste */}
        {filtered.length === 0 && !isDriversLoading ? (
          <View style={styles.empty}>
            <Ionicons name="person-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyText}>Aucun chauffeur trouvé</Text>
          </View>
        ) : (
          filtered.map(driver => (
            <DriverCard
              key={driver.driver?.id ?? driver.id}
              driver={driver}
              //  Utiliser l'ID du driver record nested, pas l'ID utilisateur
              onPress={() => navigation.navigate('DriverDetail', { driverId: driver.driver?.id ?? driver.id })}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex:   { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.lg, paddingTop: Spacing.sm },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.bordeaux,
    
    paddingTop: Platform.OS === 'ios' ? 56 : Spacing.xl + 8,
    paddingBottom: Spacing.md, paddingHorizontal: Spacing.md,
  },
  headerBtn:    { padding: Spacing.sm, width: 40 },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },

  searchSection: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm, gap: Spacing.sm, },
  searchContent : {
    backgroundColor: Colors.surface,
    borderRadius:    Radius.md,
    borderWidth:     1,
    borderColor:     Colors.border,
    padding:         Spacing.md,
    marginBottom:    Spacing.sm,
  },
  searchWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? Spacing.sm : 0,
    marginBottom: Spacing.sm,
  },
  searchInput: {
    flex: 1, marginLeft: Spacing.sm,
    fontSize: Fonts.size.md, color: Colors.textPrimary,
    minHeight: Platform.OS === 'android' ? 60 : undefined,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border,
    padding: 3,
  },
  tab:           { flex: 1, paddingVertical: Spacing.sm, borderRadius: Radius.full, alignItems: 'center' },
  tabActive:     { backgroundColor: Colors.bordeaux },
  tabText:       { fontSize: Fonts.size.sm, fontWeight: '600', color: Colors.textSecondary },
  tabTextActive: { color: Colors.white },

  count:       { fontSize: Fonts.size.sm, color: Colors.textMuted, marginBottom: Spacing.md, fontWeight: '500' },
  errorBanner: { backgroundColor: Colors.errorLight, borderRadius: Radius.sm, borderLeftWidth: 3, borderLeftColor: Colors.error, padding: Spacing.md, marginBottom: Spacing.md },
  errorText:   { color: Colors.error, fontSize: Fonts.size.sm },
  empty:       { alignItems: 'center', paddingVertical: Spacing.xxl, gap: Spacing.md },
  emptyText:   { color: Colors.textMuted, fontSize: Fonts.size.md },
});