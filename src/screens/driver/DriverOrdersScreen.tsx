// ══════════════════════════════════════════════════════════════════════════════
// SCREEN — Mes bons de commande (Chauffeur)
// Sprint 4 — EazyVTC
// ══════════════════════════════════════════════════════════════════════════════

import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, Linking, RefreshControl,
} from 'react-native';
import { Ionicons }        from '@expo/vector-icons';
import { useOrdersStore }  from '../../store/orders.store';
import { useAuthStore }    from '../../store/auth.store';
import { ordersApi }       from '../../services/api/orders.api';
import type { Order }      from '../../types/orders.types';
import { Colors, Fonts, Spacing, Radius } from '../../theme/colors';

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

const vehicleLabel: Record<string, string> = { standard: 'Standard', berline: 'Berline', van: 'Van' };

function OrderCard({ order, token }: { order: Order; token: string }) {
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
      <View style={styles.row}>
        <Text style={styles.orderNum}>{order.order_number}</Text>
        <Text style={styles.dateText}>{fmtDate(order.issued_at)}</Text>
      </View>

      <View style={styles.tripInfo}>
        <View style={styles.tripRow}>
          <Ionicons name="person-outline" size={14} color={Colors.textMuted} />
          <Text style={styles.passengerText}>
            {snap.pickup_address.split(',')[0]} → {snap.dest_address.split(',')[0]}
          </Text>
        </View>
        <View style={styles.tripRow}>
          <Ionicons name="time-outline" size={14} color={Colors.textMuted} />
          <Text style={styles.metaText}>{fmtDateTime(snap.scheduled_at)}</Text>
        </View>
        <View style={styles.tripRow}>
          <Ionicons name="car-outline" size={14} color={Colors.textMuted} />
          <Text style={styles.metaText}>{vehicleLabel[snap.vehicle_type] ?? snap.vehicle_type}</Text>
        </View>
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
          : <Ionicons name="document-text-outline" size={15} color={Colors.white} />
        }
        <Text style={styles.pdfBtnText}>{opening ? 'Ouverture…' : 'Bon de commande PDF'}</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function DriverOrdersScreen() {
  const { orders, total, isLoading, error, fetchDriverMine, clearError } = useOrdersStore();
  const token = useAuthStore((s) => s.accessToken) ?? '';

  const load = useCallback(async () => {
    try { await fetchDriverMine(token); } catch { /* handled */ }
  }, [token]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (error) { Alert.alert('Erreur', error); clearError(); } }, [error]);

  if (isLoading && orders.length === 0) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.bordeaux} /></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bons de commande</Text>
        <Text style={styles.headerCount}>{total} document{total > 1 ? 's' : ''}</Text>
      </View>

      <FlatList
        data={orders}
        keyExtractor={(o) => o.id}
        renderItem={({ item }) => <OrderCard order={item} token={token} />}
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
  header: {
    backgroundColor: Colors.bordeaux,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  headerTitle: { fontSize: Fonts.size.xl, fontWeight: '800', color: Colors.white },
  headerCount: { fontSize: Fonts.size.sm, color: Colors.beigeLight, marginTop: 2 },
  list:        { padding: Spacing.md, gap: Spacing.md },
  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.border,
    shadowColor: Colors.black, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  row:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  orderNum:   { fontSize: Fonts.size.md, fontWeight: '700', color: Colors.bordeaux },
  dateText:   { fontSize: Fonts.size.xs, color: Colors.textMuted },
  tripInfo:   { gap: 6 },
  tripRow:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  passengerText: { fontSize: Fonts.size.sm, color: Colors.textPrimary, flex: 1 },
  metaText:   { fontSize: Fonts.size.xs, color: Colors.textMuted },
  priceRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginTop: Spacing.sm, paddingTop: Spacing.sm,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  priceLabel: { fontSize: Fonts.size.sm, color: Colors.textSecondary, fontWeight: '600' },
  priceValue: { fontSize: Fonts.size.sm, fontWeight: '700', color: Colors.bordeaux },
  pdfBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, marginTop: Spacing.md, backgroundColor: Colors.bordeaux,
    paddingVertical: 9, borderRadius: Radius.sm,
  },
  pdfBtnOff:  { backgroundColor: Colors.textMuted },
  pdfBtnText: { fontSize: Fonts.size.sm, fontWeight: '600', color: Colors.white },
  empty:      { alignItems: 'center', paddingTop: Spacing.xxl, gap: Spacing.sm },
  emptyTitle: { fontSize: Fonts.size.lg, fontWeight: '700', color: Colors.textPrimary },
  emptySubtitle: { fontSize: Fonts.size.sm, color: Colors.textMuted, textAlign: 'center', paddingHorizontal: Spacing.lg },
});
