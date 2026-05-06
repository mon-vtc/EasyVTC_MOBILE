// ══════════════════════════════════════════════════════════════════════════════
// SCREEN — Mes bons de commande (Chauffeur)
// Sprint 4 — EazyVTC
// ══════════════════════════════════════════════════════════════════════════════

import React, { useCallback, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Image,
  StyleSheet, ActivityIndicator, Alert, RefreshControl, Platform,
} from 'react-native';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Logo }    from '../../../constants/logo';
import { useOrdersStore } from '../../../store/orders.store';
import { useAuthStore } from '../../../store/auth.store';
import type { Order } from '../../../types/orders.types';
import type { DriverOrdersStackParamList } from '../../../types/auth.types';
import { Colors, Fonts, Spacing, Radius } from '../../../theme/colors';
import { OrderCard } from '../../../components/common/OrderCard';

export default function DriverOrdersScreen() {
  const navigation = useNavigation<NavigationProp<DriverOrdersStackParamList>>();
  const { orders, total, isLoading, error, fetchDriverMine, clearError } = useOrdersStore();
  const token = useAuthStore((s) => s.accessToken) ?? '';

  const load = useCallback(async () => {
    try { await fetchDriverMine(token); } catch { /* handled */ }
  }, [token]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (error) { Alert.alert('Erreur', error); clearError(); } }, [error]);

  const handleViewOrder = (order: Order) => {
    navigation.navigate('DriverOrderDetails', { orderId: order.id });
  };

  if (isLoading && orders.length === 0) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.bordeaux} /></View>;
  }

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

      <FlatList
        data={orders}
        keyExtractor={(o) => o.id}
        renderItem={({ item }) => (
          <OrderCard order={item} token={token} role="driver" onPress={handleViewOrder} />
        )}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={load} tintColor={Colors.bordeaux} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="document-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>Aucun bon de commande</Text>
            <Text style={styles.emptySubtitle}>Les bons apparaissent ici après attribution d'une course.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: Colors.background },
  centered:   { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
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
  headerTitle: { fontSize: Fonts.size.xl, fontWeight: '800', color: Colors.white, textAlign: 'center' },
  headerCount: { fontSize: Fonts.size.sm, color: Colors.beigeLight, marginTop: 2,  },
  headerBtn: { width: 40 },
  list:        { padding: Spacing.md, gap: Spacing.md },
  empty:      { alignItems: 'center', paddingTop: Spacing.xxl, gap: Spacing.sm },
  emptyTitle: { fontSize: Fonts.size.lg, fontWeight: '700', color: Colors.textPrimary },
  emptySubtitle: { fontSize: Fonts.size.sm, color: Colors.textMuted, textAlign: 'center', paddingHorizontal: Spacing.lg },
});
