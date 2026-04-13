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
import { useAuthStore }    from '../../store/auth.store';
import { ordersApi }       from '../../services/api/orders.api';
import type { Order }      from '../../types/orders.types';
import { Colors, Fonts, Spacing, Radius } from '../../theme/colors';

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

const vehicleLabel: Record<string, string> = { standard: 'Standard', berline: 'Berline', van: 'Van' };

function OrderRow({ order, token }: { order: Order; token: string }) {
  const [opening, setOpening] = useState(false);
  const snap = order.trip_snapshot;

  const openPdf = async () => {
    if (!order.pdf_url) { Alert.alert('PDF non disponible'); return; }
    setOpening(true);
    try {
      await Linking.openURL(`${ordersApi.getPdfUrl(token, order.id)}?token=${encodeURIComponent(token)}`);
    } catch { Alert.alert('Erreur', 'Impossible d\'ouvrir le PDF.'); }
    finally { setOpening(false); }
  };

  return (
    <View style={styles.card}>
      {/* Numéro + date */}
      <View style={styles.rowBetween}>
        <Text style={styles.orderNum}>{order.order_number}</Text>
        <Text style={styles.dateSmall}>{fmtDate(order.issued_at)}</Text>
      </View>

      {/* Chauffeur */}
      <View style={styles.infoRow}>
        <Ionicons name="person-circle-outline" size={15} color={Colors.bordeaux} />
        <Text style={styles.infoText}>
          {order.driver_snapshot.first_name} {order.driver_snapshot.last_name}
        </Text>
      </View>

      {/* Passager */}
      <View style={styles.infoRow}>
        <Ionicons name="people-outline" size={15} color={Colors.textMuted} />
        <Text style={styles.infoText}>
          {order.passenger_snapshot.first_name} {order.passenger_snapshot.last_name}
        </Text>
      </View>

      {/* Trajet */}
      <View style={styles.infoRow}>
        <Ionicons name="navigate-outline" size={15} color={Colors.textMuted} />
        <Text style={styles.infoText} numberOfLines={1}>
          {snap.pickup_address.split(',')[0]} → {snap.dest_address.split(',')[0]}
        </Text>
      </View>

      {/* Date course + véhicule */}
      <View style={styles.rowBetween}>
        <Text style={styles.dateSmall}>{fmtDateTime(snap.scheduled_at)}</Text>
        <Text style={styles.vehicleTag}>{vehicleLabel[snap.vehicle_type] ?? snap.vehicle_type}</Text>
      </View>

      {snap.pricing_type === 'flat_rate' && snap.final_price !== null && (
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Forfait</Text>
          <Text style={styles.priceValue}>
            {snap.final_price.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {snap.currency}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.pdfBtn, !order.pdf_url && styles.pdfBtnOff]}
        onPress={openPdf}
        disabled={opening || !order.pdf_url}
      >
        {opening
          ? <ActivityIndicator size="small" color={Colors.white} />
          : <Ionicons name="document-text-outline" size={14} color={Colors.white} />
        }
        <Text style={styles.pdfBtnText}>{opening ? 'Ouverture…' : 'Voir le bon PDF'}</Text>
      </TouchableOpacity>
    </View>
  );
}

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
        renderItem={({ item }) => <OrderRow order={item} token={token} />}
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
  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.border,
    shadowColor: Colors.black, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
    gap: 6,
  },
  rowBetween:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderNum:    { fontSize: Fonts.size.md, fontWeight: '700', color: Colors.bordeaux },
  dateSmall:   { fontSize: Fonts.size.xs, color: Colors.textMuted },
  infoRow:     { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoText:    { fontSize: Fonts.size.sm, color: Colors.textPrimary, flex: 1 },
  vehicleTag: {
    backgroundColor: Colors.beigeLight, paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: Radius.sm, fontSize: Fonts.size.xs, color: Colors.bordeaux,
    fontWeight: '600',
  },
  priceRow:  { flexDirection: 'row', justifyContent: 'space-between', paddingTop: Spacing.xs, borderTopWidth: 1, borderTopColor: Colors.border },
  priceLabel:{ fontSize: Fonts.size.sm, color: Colors.textSecondary, fontWeight: '600' },
  priceValue:{ fontSize: Fonts.size.sm, fontWeight: '700', color: Colors.bordeaux },
  pdfBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, marginTop: 4, backgroundColor: Colors.bordeaux,
    paddingVertical: 8, borderRadius: Radius.sm,
  },
  pdfBtnOff:  { backgroundColor: Colors.textMuted },
  pdfBtnText: { fontSize: Fonts.size.sm, fontWeight: '600', color: Colors.white },
  empty:      { alignItems: 'center', paddingTop: Spacing.xxl, gap: Spacing.sm },
  emptyTitle: { fontSize: Fonts.size.lg, fontWeight: '700', color: Colors.textPrimary },
});
