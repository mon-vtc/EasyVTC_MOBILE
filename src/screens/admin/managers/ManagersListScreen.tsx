// ══════════════════════════════════════════════════════════════════════════════
// SCREEN — Admin / Liste des Gestionnaires
// ══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  Platform,
  Image,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAdmin } from '../../../hooks/useAdmin';
import type { ManagersStackParamList, UserProfile } from '../../../types';
import ManagerListItem  from './ManagerListItem';
import { AppIcon } from '../../../components/common/AppIcon';
import { Colors, Spacing, Radius, Fonts } from '../../../theme/colors';
import { Ionicons } from '@expo/vector-icons';
import {Logo} from '../../../constants/logo';


type Nav = NativeStackNavigationProp<ManagersStackParamList, 'ManagersList'>;

// Onglets de filtre
const FILTER_TABS = [
  { key: 'all', label: 'Tous' },
  { key: 'on_duty', label: 'En service' },
];

export default function ManagersListScreen() {
  const navigation = useNavigation<Nav>();
  const {
    managers,
    isManagersLoading,
    managersError,
    fetchManagers,
    createManager,
    clearManagersError,
  } = useAdmin();

  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'on_duty'>('all');

  // ── Quick-add form state ───────────────────────────────────────────────────
  const [quickFirstName, setQuickFirstName] = useState('');
  const [quickLastName, setQuickLastName] = useState('');
  const [quickEmail, setQuickEmail] = useState('');
  const [quickPhone, setQuickPhone] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!quickFirstName.trim()) newErrors.firstName = 'Le prénom est requis';
    if (!quickLastName.trim()) newErrors.lastName = 'Le nom est requis';
    if (!quickEmail.trim()) {
      newErrors.email = "L'email est requis";
    } else if (!/\S+@\S+\.\S+/.test(quickEmail)) {
      newErrors.email = "L'email est invalide";
    }
    if (!quickPhone.trim()) {
      newErrors.phone = 'Le numéro de téléphone est requis';
    } else if (!/^\+?[1-9]\d{7,14}$/.test(quickPhone)) {
      newErrors.phone = 'Numéro invalide — format attendu (ex : +33612345678)';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const loadData = useCallback(() => {
    fetchManagers({ search: search || undefined });
  }, [search]);
  

  const handleCreateQuick = async () => {
    if (!validate()) return;
    try {
      const manager = await createManager({
        first_name: quickFirstName,
        last_name: quickLastName,
        email: quickEmail,
        phone: quickPhone,
      });
      if (manager) {  
        Alert.alert(
          'Succès',
          `Le gestionnaire ${manager.first_name} a été créé. Un email avec ses identifiants lui a été envoyé.`,
          [{ text: 'OK', onPress: () => navigation.navigate('ManagersList') }]
        );
      }
      setQuickFirstName('');
      setQuickLastName('');
      setQuickEmail('');
      setQuickPhone('');
    } catch (error) {
      console.error('Error creating manager:', error);
    }
  };


  useFocusEffect(
    useCallback(() => {
      loadData();
      return () => { clearManagersError(); };
    }, [loadData])
  );

  // ── Stats dérivées ─────────────────────────────────────────────────────────
  const totalManagers = managers.length;
  const onDutyCount = managers.filter((m) => m.status === 'active').length;

  // ── Filtre local par onglet ────────────────────────────────────────────────
  const filteredManagers =
    activeTab === 'on_duty'
      ? managers.filter((m) => m.status === 'active')
      : managers;

  // ── Render item ────────────────────────────────────────────────────────────
  const renderItem = ({ item }: { item: UserProfile }) => (
    <ManagerListItem
      manager={item}
      onPress={() => navigation.navigate('ManagerDetail', { managerId: item.id })}
      onEdit={() => navigation.navigate('EditManager', { managerId: item.id })} // Ou une future page 'EditManager'
      onView={() => navigation.navigate('ManagerDetail', { managerId: item.id })}
    />
  );

  const { user } = useAdmin();

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={Colors.white} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Gestionnaires</Text>
        </View>
        {user?.role && (
          <View style={styles.RoleContent} >
            <Ionicons style={styles.IconRole} name="person" size={16} color={Colors.white} />
            <Text style={styles.RoleText}>{user?.role === 'admin' ? 'Administrateur' : ''}</Text>
          </View> 
        )}
      </View>
      <FlatList
        data={filteredManagers}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.scrollContent}
        onRefresh={loadData}
        refreshing={isManagersLoading}
        ListHeaderComponent={
          <>
            {/* ── Bloc Quick-add ────────────────────────────────────────────── */}
            <View style={styles.quickAddCard}>
              <Text style={styles.quickAddTitle}>Ajouter un nouveau gestionnaire</Text>
             
              {/* Prénom */}
              <Text style={styles.fieldLabel}>Prénom du gestionnaire</Text>
              <View style={styles.inputWrapper}>
                <AppIcon name="person-outline" size={16} color={Colors.textPlaceholder} />
                <TextInput
                  style={styles.input}
                  placeholder="Ex : Thomas"
                  placeholderTextColor={Colors.textPlaceholder}
                  value={quickFirstName}
                  onChangeText={setQuickFirstName}
                  autoCapitalize="words"
                />
              </View>
              {errors.firstName && <Text style={{ color: Colors.error, fontSize: 11 }}>{errors.firstName}</Text>}

              {/* Nom */}
              <Text style={styles.fieldLabel}>Nom du gestionnaire</Text>
              <View style={styles.inputWrapper}>
                <AppIcon name="person-outline" size={16} color={Colors.textPlaceholder} />
                <TextInput
                  style={styles.input}
                  placeholder="Ex : Dubois"
                  placeholderTextColor={Colors.textPlaceholder}
                  value={quickLastName}
                  onChangeText={setQuickLastName}
                  autoCapitalize="words"
                />
              </View>
              {errors.lastName && <Text style={{ color: Colors.error, fontSize: 11 }}>{errors.lastName}</Text>}

              {/* Email */}
              <Text style={styles.fieldLabel}>Courriel professionnel</Text>
              <View style={styles.inputWrapper}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                  <AppIcon name="mail-outline" size={16} color={Colors.textPlaceholder} />
                  <TextInput
                    style={styles.input}
                    placeholder="Ex : thomas.dubois@easyvtc.fr"
                    placeholderTextColor={Colors.textPlaceholder}
                    value={quickEmail}
                    onChangeText={setQuickEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>
              {errors.email ?  <Text style={{ color: Colors.error, fontSize: 11 }}>{errors.email}</Text> : ''}

                            {/* Téléphone */}
              <Text style={styles.fieldLabel}>Téléphone</Text>
              <View style={styles.inputWrapper}>
                <View>
                  <AppIcon name="call-outline" size={16} color={Colors.textPlaceholder} />
                  <TextInput
                    style={styles.input}
                    placeholder="Ex : +33123456789"
                    placeholderTextColor={Colors.textPlaceholder}
                    value={quickPhone}
                    onChangeText={setQuickPhone}
                    keyboardType="phone-pad"
                    autoCapitalize="none"
                  />
                </View>
              </View>
              {errors.phone && <Text style={{ color: Colors.error, fontSize: 11 }}>{errors.phone}</Text>}

              {/* Zone de couverture */}
              <Text style={styles.fieldLabel}>Zone de couverture</Text>
              <TouchableOpacity style={styles.selectWrapper} activeOpacity={0.7}>
                <AppIcon name="location-outline" size={16} color={Colors.textPlaceholder} />
                <Text style={styles.selectPlaceholder}>Choisir un…</Text>
                <AppIcon name="chevron-down-outline" size={16} color={Colors.textPlaceholder} />
              </TouchableOpacity>

              {/* Boutons actions */}
              <View style={styles.quickAddActions}>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={handleCreateQuick}
                  activeOpacity={0.8}
                >
                  <AppIcon name="add-outline" size={16} color={Colors.white} />
                  <Text style={styles.addButtonLabel}>Ajouter le gestionnaire</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.refreshButton} activeOpacity={0.7} onPress={loadData}>
                  <AppIcon name="refresh-outline" size={20} color={Colors.bordeauxLight} />
                </TouchableOpacity>
              </View>
            </View>

            {/* ── Carte stats ───────────────────────────────────────────────── */}
            <View style={styles.statsCard}>
              <View style={styles.statsMain}>
                <View style={styles.statBlock}>
                  <Text style={styles.statNumber}>{totalManagers}</Text>
                  <Text style={styles.statLabel}>Gestionnaires{'\n'}VTC</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBlock}>
                  <Text style={[styles.statNumber, { color: Colors.success }]}>{onDutyCount}</Text>
                  <Text style={styles.statLabel}>En service{'\n'}actuellement</Text>
                  {/* Barre progression */}
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${totalManagers ? (onDutyCount / totalManagers) * 100 : 0}%` },
                      ]}
                    />
                  </View>
                </View>
                <View style={styles.statIcon}>
                  <AppIcon name="car-outline" size={24} color={Colors.bordeauxLight} />
                </View>
              </View>

              <View style={styles.statsDividerH} />

              <View style={styles.statsSecondary}>
                <View style={styles.statBlockSm}>
                  <AppIcon name="people-outline" size={18} color={Colors.bordeauxLight} />
                  <Text style={styles.statNumberSm}>8</Text>
                  <Text style={styles.statLabelSm}>Principes</Text>
                </View>
                <View style={styles.statBlockSm}>
                  <AppIcon name="person-add-outline" size={18} color={Colors.beige} />
                  <Text style={styles.statNumberSm}>10</Text>
                  <Text style={styles.statLabelSm}>Adjoints</Text>
                </View>
              </View>
            </View>

            {/* ── Titre liste ───────────────────────────────────────────────── */}
            <Text style={styles.listSectionTitle}>Liste des gestionnaires</Text>
            {/* ── Barre recherche + filtres ─────────────────────────────────── */}
            <View style={styles.searchSection}>
              <View style={styles.searchRow}>
                <View style={styles.searchInputWrapper}>
                  <AppIcon name="search-outline" size={18} color={Colors.textPlaceholder} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Rechercher un super..."
                    placeholderTextColor={Colors.textPlaceholder}
                    value={search}
                    onChangeText={setSearch}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
                <TouchableOpacity style={styles.filterChip} activeOpacity={0.7}>
                  <AppIcon name="options-outline" size={16} color={Colors.bordeauxLight} />
                  <Text style={styles.filterChipLabel}>Filtres</Text>
                </TouchableOpacity>
              </View>

              {/* Onglets */}
              <View style={styles.tabsRow}>
                {FILTER_TABS.map((tab) => {
                  const count = tab.key === 'all' ? totalManagers : onDutyCount;
                  const isActive = activeTab === tab.key;
                  return (
                    <TouchableOpacity
                      key={tab.key}
                      style={[styles.tab, isActive && styles.tabActive]}
                      onPress={() => setActiveTab(tab.key as 'all' | 'on_duty')}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                        {tab.label} ({count})
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.center}>
            {isManagersLoading ? (
              <ActivityIndicator size="large" color={Colors.bordeauxLight} />
            ) : managersError ? (
              <>
                <Text style={styles.errorText}>{managersError}</Text>
                <TouchableOpacity onPress={loadData} style={styles.retryButton}>
                  <Text style={styles.retryText}>Réessayer</Text>
                </TouchableOpacity>
              </>
            ) : (
              <Text style={styles.emptyText}>
                {search ? 'Aucun gestionnaire trouvé' : 'Aucun gestionnaire pour le moment'}
              </Text>
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
        <AppIcon name="add-outline" size={28} color={Colors.white} />
      </TouchableOpacity>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.white,
  },
  header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      backgroundColor: Colors.bordeaux,
      
      paddingTop: Platform.OS === 'ios' ? 56 : Spacing.xl + 8,
      paddingBottom: Spacing.md, paddingHorizontal: Spacing.md,
  },
  headerBtn:    { padding: Spacing.sm, width: 40 },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  RoleContent: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: Radius.full,
    padding: Spacing.sm,
  },
  RoleText: { fontSize: 11, color: Colors.white, marginLeft: 4, paddingHorizontal: Spacing.xs, paddingVertical: 2, borderRadius: Radius.sm },
  scroll: {
    flex: 1,
  },
  IconRole: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: Radius.full,
    padding: Spacing.sm,
    shadowOpacity: 0.15, shadowRadius: 16, elevation: 10 
  },
  scrollContent: {
    paddingBottom: 100, // Keep padding for content below the list
  },

  // ── Quick-add card ──────────────────────────────────────────────────────────
  quickAddCard: {
    backgroundColor: Colors.white,
    margin: Spacing.md,
    borderRadius: Radius.md,
    padding: Spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  quickAddTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.bordeauxDark,
    marginBottom: Spacing.md,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 4,
    marginTop: Spacing.sm,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    height: 42,
    backgroundColor: Colors.placeHolder,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  selectWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    height: 42,
    backgroundColor: Colors.placeHolder,
    gap: Spacing.sm,
  },
  selectPlaceholder: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPlaceholder,
  },
  quickAddActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  addButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.bordeauxLight,
    borderRadius: Radius.sm,
    height: 42,
  },
  addButtonLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  refreshButton: {
    width: 42,
    height: 42,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Recherche + filtres ─────────────────────────────────────────────────────
  searchSection: {
    margin: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    elevation: 3,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    height: 38,
    gap: Spacing.xs,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  filterChipLabel: {
    fontSize: 13,
    color: Colors.bordeauxLight,
    fontWeight: '500',
  },
  tabsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  tab: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    borderRadius: Radius.full,
    backgroundColor: Colors.background,
  },
  tabActive: {
    backgroundColor: Colors.bordeauxLight,
  },
  tabLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: Colors.white,
    fontWeight: '600',
  },

  // ── Carte stats ─────────────────────────────────────────────────────────────
  statsCard: {
    backgroundColor: Colors.bordeaux,
    margin: Spacing.md,
    marginTop: Spacing.sm,
    borderRadius: Radius.md,
    padding: Spacing.md,
    elevation: 3,
  },
  statsMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  statBlock: {
    flex: 1,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.white,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.beigeLight,
    lineHeight: 15,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 50,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    marginTop: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.beige,
    borderRadius: 2,
  },
  statsDividerH: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: Spacing.sm,
  },
  statsSecondary: {
    flexDirection: 'row',
    gap: Spacing.xl,
  },
  statBlockSm: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statNumberSm: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.white,
  },
  statLabelSm: {
    fontSize: 12,
    color: Colors.beigeLight,
  },

  // ── Liste ───────────────────────────────────────────────────────────────────
  listSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.bordeauxDark,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    marginTop: Spacing.xs,
  },
  listContent: {
    // paddingHorizontal: Spacing.md, // Now handled by scrollContent
  },

  // ── États ───────────────────────────────────────────────────────────────────
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
    minHeight: 150,
  },
  errorText: {
    fontSize: 14,
    color: Colors.error,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  retryButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.bordeauxLight,
    borderRadius: Radius.sm,
  },
  retryText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: 13,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textMuted,
  },

  // ── FAB ─────────────────────────────────────────────────────────────────────
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.bordeauxLight,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: Colors.bordeauxDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },
});