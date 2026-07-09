// ══════════════════════════════════════════════════════════════════════════════
// SCREEN — Bons de commande (Admin / Manager)
// Sprint 4 — EasyVTC
// ══════════════════════════════════════════════════════════════════════════════

import React, { useCallback, useEffect, useState } from 'react'; 
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, Linking, RefreshControl, TextInput, Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useOrdersStore }  from '../../../store/orders.store';
import { useAuthStore } from '../../../store/auth.store';
import type { Order } from '../../../types/orders.types';
import { DrawerActions } from '@react-navigation/native';
import { Colors, Fonts, Spacing, Radius } from '../../../theme/colors';
import { OrderCard } from '../../../components/common/OrderCard';
import { useToast } from '../../../hooks/useToast';

export default function AdminOrdersScreen() {
  const navigation = useNavigation<NavigationProp<any>>();
  const { showToast } = useToast();

  const { orders, total, page, totalPages, isLoading, isFetchingNextPage, error, fetchAll, clearError } = useOrdersStore();
  const token = useAuthStore((s) => s.accessToken) ?? '';
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    try { await fetchAll(token); } catch { /* handled */ }
  }, [token]);

  const loadMore = useCallback(() => {
    if (isLoading || isFetchingNextPage || page >= totalPages) return;
    fetchAll(token, { page: page + 1 }).catch(() => {});
  }, [isLoading, isFetchingNextPage, page, totalPages, token, fetchAll]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (error) { 
    showToast({ title: 'Erreur', message: error, type: 'error' });
    clearError();
  } }, [error]);

  const filtered = search.trim()
    ? orders.filter(o =>
        o.order_number.toLowerCase().includes(search.toLowerCase()) ||
        `${o.driver_snapshot.first_name} ${o.driver_snapshot.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
        `${o.passenger_snapshot.first_name} ${o.passenger_snapshot.last_name}`.toLowerCase().includes(search.toLowerCase())
      )
    : orders;

  const handleViewOrder = (order: Order) => {
    navigation.navigate('OrderDetails', { orderId: order.id });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
        >
          <Ionicons name="menu-outline" size={26} color={Colors.white} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Bons de commande</Text>
          <Text style={styles.headerCount}>{total} document{total > 1 ? 's' : ''}</Text>
        </View>
        <View style={styles.headerBtn} />
      </View>

      {/* Recherche */}
      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={18} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="N° bon, chauffeur, passager…"
          placeholderTextColor={Colors.textPlaceholder}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(o) => o.id}
        renderItem={({ item }) => <OrderCard order={item} token={token} role="admin" onPress={handleViewOrder} />}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={load} tintColor={Colors.bordeaux} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={isFetchingNextPage ? <ActivityIndicator size="small" color={Colors.bordeaux} style={{ padding: 16 }} /> : null}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="document-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>Aucun bon de commande</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: Colors.background },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.bordeaux,
    paddingHorizontal: Spacing.md,
    paddingTop: Platform.OS === 'ios' ? 56 : Spacing.xl + 8,
    paddingBottom: Spacing.md,
  },
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontSize: Fonts.size.xl, fontFamily: Fonts.bold, fontWeight: '800', color: Colors.white, textAlign: 'center' },
  headerCount: { fontSize: Fonts.size.sm, color: Colors.beigeLight, marginTop: 2,  },
  headerBtn: { width: 40 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.surface, margin: Spacing.md, borderRadius: Radius.md,
    paddingHorizontal: Spacing.sm, paddingVertical: 10,
    borderWidth: 1, borderColor: Colors.border,
  },
  searchInput: { flex: 1, fontSize: Fonts.size.sm, color: Colors.textPrimary },
  list:        { paddingHorizontal: Spacing.md, paddingBottom: Spacing.md, gap: Spacing.sm },
  empty:      { alignItems: 'center', paddingTop: Spacing.xxl, gap: Spacing.sm },
  emptyTitle: { fontSize: Fonts.size.lg, fontFamily: Fonts.bold, fontWeight: '700', color: Colors.textPrimary },
});
