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
import { Ionicons }          from '@expo/vector-icons';
import { useOrdersStore }    from '../../store/orders.store';
import { useAuthStore }      from '../../store/auth.store';
import { ordersApi }         from '../../services/api/orders.api';
import type { Order }        from '../../types/orders.types';
import { Colors, Fonts, Spacing, Radius } from '../../theme/colors';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
}

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

const vehicleLabel: Record<string, string> = {
  standard: 'Standard',
  berline:  'Berline',
  van:      'Van',
};

// ── Carte bon de commande ─────────────────────────────────────────────────────

function OrderCard({ order, token, onPress }: {
  order:   Order;
  token:   string;
  onPress: (order: Order) => void;
}) {
  const [openingPdf, setOpeningPdf] = useState(false);

  const handleOpenPdf = async () => {
    if (!order.pdf_url) {
      Alert.alert('PDF non disponible', 'Le document PDF n\'est pas encore généré.');
      return;
    }
    setOpeningPdf(true);
    try {
      const url = `${ordersApi.getPdfUrl(token, order.id)}?token=${encodeURIComponent(token)}`;
      await Linking.openURL(url);
    } catch {
      Alert.alert('Erreur', 'Impossible d\'ouvrir le PDF.');
    } finally {
      setOpeningPdf(false);
    }
  };

  const snap = order.trip_snapshot;

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(order)} activeOpacity={0.85}>
      {/* En-tête */}
      <View style={styles.cardHeader}>
        <Text style={styles.orderNumber}>{order.order_number}</Text>
        <Text style={styles.issuedDate}>{fmtDate(order.issued_at)}</Text>
      </View>

      {/* Trajet */}
      <View style={styles.tripRow}>
        <Ionicons name="location-outline" size={16} color={Colors.bordeaux} />
        <Text style={styles.tripText} numberOfLines={1}>{snap.pickup_address}</Text>
      </View>
      <View style={[styles.tripRow, { marginTop: 4 }]}>
        <Ionicons name="flag-outline" size={16} color={Colors.beigeDark} />
        <Text style={styles.tripText} numberOfLines={1}>{snap.dest_address}</Text>
      </View>

      {/* Détails */}
      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Ionicons name="car-outline" size={14} color={Colors.textMuted} />
          <Text style={styles.metaText}>{vehicleLabel[snap.vehicle_type] ?? snap.vehicle_type}</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="time-outline" size={14} color={Colors.textMuted} />
          <Text style={styles.metaText}>{fmtDateTime(snap.scheduled_at)}</Text>
        </View>
      </View>

      {/* Montant forfait (si applicable) */}
      {snap.pricing_type === 'flat_rate' && snap.final_price !== null && (
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Forfait</Text>
          <Text style={styles.priceValue}>
            {snap.final_price.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {snap.currency}
          </Text>
        </View>
      )}

      {/* Action PDF */}
      <TouchableOpacity
        style={[styles.pdfBtn, !order.pdf_url && styles.pdfBtnDisabled]}
        onPress={handleOpenPdf}
        disabled={openingPdf || !order.pdf_url}
      >
        {openingPdf
          ? <ActivityIndicator size="small" color={Colors.white} />
          : <Ionicons name="document-text-outline" size={16} color={Colors.white} />
        }
        <Text style={styles.pdfBtnText}>
          {openingPdf ? 'Ouverture…' : 'Voir le bon de commande'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function MyOrdersScreen() {
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

  const handleCardPress = (_order: Order) => {
    // Réservé pour un futur écran de détail
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
          <OrderCard order={item} token={token} onPress={handleCardPress} />
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
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  orderNumber: {
    fontSize: Fonts.size.md,
    fontWeight: '700',
    color: Colors.bordeaux,
  },
  issuedDate: {
    fontSize: Fonts.size.xs,
    color: Colors.textMuted,
  },
  tripRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  tripText: {
    flex: 1,
    fontSize: Fonts.size.sm,
    color: Colors.textPrimary,
  },
  metaRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: Fonts.size.xs,
    color: Colors.textMuted,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  priceLabel: {
    fontSize: Fonts.size.sm,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  priceValue: {
    fontSize: Fonts.size.sm,
    fontWeight: '700',
    color: Colors.bordeaux,
  },
  pdfBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.md,
    backgroundColor: Colors.bordeaux,
    paddingVertical: 10,
    borderRadius: Radius.sm,
  },
  pdfBtnDisabled: {
    backgroundColor: Colors.textMuted,
  },
  pdfBtnText: {
    fontSize: Fonts.size.sm,
    fontWeight: '600',
    color: Colors.white,
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
