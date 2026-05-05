// ══════════════════════════════════════════════════════════════════════════════
// SCREEN — Bons de commande (Admin / Manager)
// Sprint 4 — EazyVTC
// ══════════════════════════════════════════════════════════════════════════════

import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, Linking, RefreshControl, TextInput,
} from 'react-native';
import { Ionicons }        from '@expo/vector-icons';
import { useOrdersStore }  from '../../store/orders.store';
import { useAuthStore } from '../../store/auth.store';
import type { Order } from '../../types/orders.types';
import { Colors, Fonts, Spacing, Radius } from '../../theme/colors';
import { OrderCard } from '../../components/common/OrderCard';

export default function AdminOrdersScreen() {
  const { orders, total, isLoading, error, fetchAll, clearError } = useOrdersStore();
  const token = useAuthStore((s) => s.accessToken) ?? '';
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    try { await fetchAll(token); } catch { /* handled */ }
  }, [token]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (error) { Alert.alert('Erreur', error); clearError(); } }, [error]);

  const filtered = search.trim()
    ? orders.filter(o =>
        o.order_number.toLowerCase().includes(search.toLowerCase()) ||
        `${o.driver_snapshot.first_name} ${o.driver_snapshot.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
        `${o.passenger_snapshot.first_name} ${o.passenger_snapshot.last_name}`.toLowerCase().includes(search.toLowerCase())
      )
    : orders;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bons de commande</Text>
        <Text style={styles.headerCount}>{total} document{total > 1 ? 's' : ''}</Text>
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
        renderItem={({ item }) => <OrderCard order={item} token={token} role="admin" />}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={load} tintColor={Colors.bordeaux} />}
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
  header: {
    backgroundColor: Colors.bordeaux,
    paddingHorizontal: Spacing.md, paddingTop: Spacing.xl, paddingBottom: Spacing.md,
  },
  headerTitle: { fontSize: Fonts.size.xl, fontWeight: '800', color: Colors.white },
  headerCount: { fontSize: Fonts.size.sm, color: Colors.beigeLight, marginTop: 2 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.surface, margin: Spacing.md, borderRadius: Radius.md,
    paddingHorizontal: Spacing.sm, paddingVertical: 10,
    borderWidth: 1, borderColor: Colors.border,
  },
  searchInput: { flex: 1, fontSize: Fonts.size.sm, color: Colors.textPrimary },
  list:        { paddingHorizontal: Spacing.md, paddingBottom: Spacing.md, gap: Spacing.sm },
  empty:      { alignItems: 'center', paddingTop: Spacing.xxl, gap: Spacing.sm },
  emptyTitle: { fontSize: Fonts.size.lg, fontWeight: '700', color: Colors.textPrimary },
});
