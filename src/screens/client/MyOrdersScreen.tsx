// ══════════════════════════════════════════════════════════════════════════════
// SCREEN — Mes bons de commande (Client)
// Sprint 4 — EazyVTC
// ══════════════════════════════════════════════════════════════════════════════

import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, Linking,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useOrdersStore } from '../../store/orders.store';
import { useAuthStore } from '../../store/auth.store';
import type { Order } from '../../types/orders.types';
import { Colors, Fonts, Spacing, Radius } from '../../theme/colors';
import { OrderCard } from '../../components/common/OrderCard';

// ── Screen ────────────────────────────────────────────────────────────────────

export default function MyOrdersScreen({ navigation } : {navigation: any}) {
  const { orders, total, isLoading, error, fetchMine, clearError } = useOrdersStore();
  const token = useAuthStore((s) => s.accessToken) ?? '';

  const load = useCallback(async () => {
    try { await fetchMine(token); } catch { /* handled in store */ }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (error) {
      Alert.alert('Erreur', error);
      clearError();
    }
  }, [error]);

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
        <Text style={styles.headerCount}>{total} document{total > 1 ? 's' : ''}</Text>
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <OrderCard order={item} token={token} role="client" onPress={handleCardPress} />
        )}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={load} tintColor={Colors.bordeaux} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="document-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>Aucun bon de commande</Text>
            <Text style={styles.emptySubtitle}>
              Les bons sont générés automatiquement après l'attribution d'un chauffeur.
            </Text>
          </View>
        }
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
});
