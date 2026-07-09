// screens/admin/managers/ManagersListScreen.tsx
import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  TextInput, TouchableOpacity, RefreshControl, Platform,
} from 'react-native';
import { useNavigation, useFocusEffect, DrawerActions } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAdmin } from '../../../hooks/useAdmin';
import type { ManagersStackParamList, UserProfile } from '../../../types';
import ManagerListItem from './ManagerListItem';
import { Colors, Spacing, Radius, Fonts } from '../../../theme/colors';

type Nav = NativeStackNavigationProp<ManagersStackParamList, 'ManagersList'>;

type FilterTab = 'all' | 'active';

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all',    label: 'Tous' },
  { key: 'active', label: 'En service' },
];

export default function ManagersListScreen() {
  const navigation = useNavigation<Nav>();
  const {
    managers, isManagersLoading, isFetchingNextManagersPage,
    managersPage, managersPageTotal,
    fetchManagers, clearManagersError,
  } = useAdmin();

  const [search,    setSearch]    = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [refreshing, setRefreshing] = useState(false);

  const debounceRef      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fetchManagersRef = useRef(fetchManagers);
  fetchManagersRef.current = fetchManagers;

  const loadData = useCallback(async (q?: string) => {
    try {
      await fetchManagersRef.current({ search: q || undefined });
    } catch (_) {}
  }, []);

  const loadMore = useCallback(() => {
    if (isManagersLoading || isFetchingNextManagersPage || managersPage >= managersPageTotal) return;
    fetchManagersRef.current({ search: search || undefined, page: managersPage + 1 }).catch(() => {});
  }, [isManagersLoading, isFetchingNextManagersPage, managersPage, managersPageTotal, search]);

  useFocusEffect(
    useCallback(() => {
      loadData();
      return () => clearManagersError();
    }, [])
  );

  const handleSearch = (text: string) => {
    setSearch(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => loadData(text), 400);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData(search).catch(() => null);
    setRefreshing(false);
  };

  const onDutyCount = managers.filter((m) => m.status === 'active').length;

  const filtered =
    activeTab === 'active'
      ? managers.filter((m) => m.status === 'active')
      : managers;

  const renderItem = ({ item }: { item: UserProfile }) => (
    <ManagerListItem
      manager={item}
      onPress={() => { setSearch(''); navigation.navigate('ManagerDetail',      { managerId: item.id })}}
      onEdit={()  => { setSearch(''); navigation.navigate('EditManager',        { managerId: item.id })}}
      onView={() => { setSearch(''); navigation.navigate('ManagerDetail',       { managerId: item.id })}}
      onPermissions={() => { setSearch(''); navigation.navigate('ManagerPermissions', { managerId: item.id })}}
    />
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
        >
          <Ionicons name="menu-outline" size={26} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gestionnaires</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Carte stats */}
      <View style={styles.statsCard}>
        <View style={styles.statBlock}>
          <Text style={styles.statNumber}>{managers.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBlock}>
          <Text style={[styles.statNumber, { color: Colors.beige }]}>{onDutyCount}</Text>
          <Text style={styles.statLabel}>En service</Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${managers.length ? (onDutyCount / managers.length) * 100 : 0}%` },
              ]}
            />
          </View>
        </View>
      </View>

      {/* Barre de recherche */}
      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={18} color={Colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={handleSearch}
          placeholder="Nom, email, téléphone…"
          placeholderTextColor={Colors.textPlaceholder}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      {/* Onglets */}
      <View style={styles.tabRow}>
        {FILTER_TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label} ({tab.key === 'active' ? onDutyCount : managers.length})
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Total */}
      {!isManagersLoading && (
        <Text style={styles.countText}>
          {filtered.length} gestionnaire{filtered.length > 1 ? 's' : ''}
        </Text>
      )}

      {/* Liste */}
      <FlatList
        data={filtered}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.bordeaux}
            colors={[Colors.bordeaux]}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={isFetchingNextManagersPage ? <ActivityIndicator size="small" color={Colors.bordeaux} style={{ padding: 16 }} /> : null}
        ListEmptyComponent={
          <View style={styles.center}>
            {isManagersLoading ? (
              <ActivityIndicator size="large" color={Colors.bordeaux} />
            ) : (
              <>
                <Ionicons name="people-outline" size={48} color={Colors.border} />
                <Text style={styles.emptyText}>Aucun gestionnaire trouvé</Text>
              </>
            )}
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateManager')}
        activeOpacity={0.8}
      >
        <Ionicons name="person-add-outline" size={24} color={Colors.white} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

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
  headerTitle: { fontSize: Fonts.size.lg, fontFamily: Fonts.bold, fontWeight: '700', color: Colors.white },

  statsCard: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: Colors.bordeaux,
    marginHorizontal: Spacing.md,
    marginTop:        Spacing.md,
    borderRadius:     Radius.md,
    padding:          Spacing.md,
    gap:              Spacing.lg,
  },
  statBlock:  { flex: 1 },
  statNumber: { fontSize: 28, fontFamily: Fonts.bold, fontWeight: '800', color: Colors.white },
  statLabel:  { fontSize: Fonts.size.xs, color: Colors.beigeLight, marginTop: 2 },
  statDivider: { width: 1, height: 50, backgroundColor: 'rgba(255,255,255,0.15)' },
  progressBar: {
    height: 4, backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2, marginTop: 6, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: Colors.beige, borderRadius: 2 },

  searchRow: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: Colors.surface,
    margin:           Spacing.md,
    marginBottom:     Spacing.sm,
    borderRadius:     Radius.md,
    borderWidth:      1,
    borderColor:      Colors.border,
    paddingHorizontal: Spacing.sm,
  },
  searchIcon:  { marginRight: Spacing.xs },
  searchInput: {
    flex: 1, paddingVertical: Spacing.sm,
    fontSize: Fonts.size.sm, color: Colors.textPrimary,
  },

  tabRow: {
    flexDirection:    'row',
    marginHorizontal: Spacing.md,
    marginBottom:     Spacing.sm,
    backgroundColor:  Colors.surface,
    borderRadius:     Radius.md,
    borderWidth:      1,
    borderColor:      Colors.border,
    padding:          3,
  },
  tab: {
    flex: 1, paddingVertical: Spacing.xs,
    borderRadius: Radius.sm - 1,
    alignItems:   'center',
  },
  tabActive:     { backgroundColor: Colors.bordeaux },
  tabText:       { fontSize: Fonts.size.xs, color: Colors.textMuted,  fontFamily: Fonts.semibold, fontWeight: '600' },
  tabTextActive: { fontSize: Fonts.size.xs, color: Colors.white,      fontFamily: Fonts.bold, fontWeight: '700' },

  countText: {
    fontSize:         Fonts.size.xs,
    color:            Colors.textMuted,
    marginHorizontal: Spacing.lg,
    marginBottom:     Spacing.xs,
  },
  listContent: { paddingTop: Spacing.xs, paddingBottom: 100 },

  center:    { alignItems: 'center', paddingTop: 60, gap: Spacing.md },
  emptyText: { fontSize: Fonts.size.md, color: Colors.textMuted },

  fab: {
    position:        'absolute',
    bottom:          30,
    right:           20,
    width:           56,
    height:          56,
    borderRadius:    28,
    backgroundColor: Colors.bordeaux,
    justifyContent:  'center',
    alignItems:      'center',
    elevation:       8,
    shadowColor:     Colors.bordeauxDark,
    shadowOffset:    { width: 0, height: 4 },
    shadowOpacity:   0.35,
    shadowRadius:    6,
  },
});
