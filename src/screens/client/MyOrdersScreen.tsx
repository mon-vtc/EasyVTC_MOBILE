// ══════════════════════════════════════════════════════════════════════════════
// SCREEN — Mes bons de commande (Client)
// Sprint 4 — EazyVTC
// ══════════════════════════════════════════════════════════════════════════════

import React, { useCallback, useEffect, useState } from 'react';
import { useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Linking, RefreshControl, Platform, TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useOrdersStore } from '../../store/orders.store';
import { useAuthStore } from '../../store/auth.store';
import { useToast } from '../../hooks/useToast';
import type { Order } from '../../types/orders.types';
import { Colors, Fonts, Spacing, Radius } from '../../theme/colors';
import { OrderCard } from '../../components/common/OrderCard';

// ── Screen ────────────────────────────────────────────────────────────────────

export default function MyOrdersScreen({ navigation } : {navigation: any}) {
  const { orders, total, page, totalPages, isLoading, isFetchingNextPage, error, fetchMine, clearError } = useOrdersStore();
  const token = useAuthStore((s) => s.accessToken) ?? '';
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');

  const load = useCallback(async () => {
    try { await fetchMine(token); } catch { /* handled in store */ }
  }, [token]);

  const loadMore = useCallback(() => {
    if (isLoading || isFetchingNextPage || page >= totalPages) return;
    fetchMine(token, { page: page + 1 }).catch(() => {});
  }, [isLoading, isFetchingNextPage, page, totalPages, token, fetchMine]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (error) {
      showToast({ type: 'error', title: 'Erreur', message: error });
      clearError();
    }
  }, [error, showToast, clearError]);

  const filteredOrders = useMemo(() => {
    if (!searchQuery) return orders;
    const query = searchQuery.toLowerCase();
    return orders.filter(order =>
      order.order_number.toLowerCase().includes(query) ||
      order.trip_snapshot.pickup_address.toLowerCase().includes(query) ||
      order.trip_snapshot.dest_address.toLowerCase().includes(query) ||
      order.passenger_snapshot.first_name.toLowerCase().includes(query) ||
      order.passenger_snapshot.last_name.toLowerCase().includes(query)
    );
  }, [orders, searchQuery]);

  const handleCardPress = (order: Order) => {
    navigation.navigate('OrderDetails', { orderId: order.id });
  };

  if (isLoading && orders.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.bordeaux} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mes bons de commande</Text>
        <Text style={styles.headerCount}>{filteredOrders.length} document{filteredOrders.length > 1 ? 's' : ''}</Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={Colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher par n°, adresse, client..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}><Ionicons name="close-circle" size={20} color={Colors.textMuted} /></TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <OrderCard order={item} token={token} role="client" onPress={handleCardPress} />
        )}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={load} tintColor={Colors.bordeaux} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={isFetchingNextPage ? <ActivityIndicator size="small" color={Colors.bordeaux} style={{ padding: 16 }} /> : null}
        ListEmptyComponent={filteredOrders.length === 0 && !isLoading ? (
          <View style={styles.empty}>
            <Ionicons name="document-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>Aucun bon de commande</Text>
            <Text style={styles.emptySubtitle}>
              Les bons sont générés automatiquement après l'attribution d'un chauffeur.
            </Text>
          </View>
        ) : null}
      />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.bordeaux,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: Fonts.size.xl,
    fontWeight: '800',
    color: Colors.white,
  },
  headerCount: {
    fontSize: Fonts.size.sm,
    color: Colors.beigeLight,
    marginTop: 2,
  },
  list: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  empty: {
    alignItems: 'center',
    paddingTop: Spacing.xxl,
    gap: Spacing.sm,
  },
  emptyTitle: {
    fontSize: Fonts.size.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: Fonts.size.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.sm,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchIcon: { marginRight: Spacing.sm },
  searchInput: { flex: 1, fontSize: Fonts.size.md, color: Colors.textPrimary, padding: 0 },
});
