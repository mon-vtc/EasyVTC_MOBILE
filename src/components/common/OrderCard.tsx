// ══════════════════════════════════════════════════════════════════════════════
// COMPONENT — OrderCard
// Sprint 4 — EasyVTC
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, ComponentType } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Order } from '../../types/orders.types';
import { ordersApi } from '../../services/api/orders.api';
import { Colors, Fonts, Spacing, Radius } from '../../theme/colors';

type Role = 'client' | 'driver' | 'admin';

interface OrderCardProps {
  order: Order;
  token: string;
  role: Role;
  onPress?: (order: Order) => void;
}

const vehicleLabel: Record<string, string> = { standard: 'Standard', berline: 'Berline', van: 'Van' };

function fmtDate(iso: string, long = false) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: long ? 'long' : 'short',
    year: 'numeric',
  });
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export function OrderCard({ order, token, role, onPress }: OrderCardProps) {
  const snap = order.trip_snapshot;

  // Le wrapper n'est plus nécessaire, le bouton gère le clic.
  const handlePress = () => onPress?.(order);

  const CardWrapper: ComponentType<any> = onPress ? TouchableOpacity : View;
  const cardProps = onPress ? { onPress: () => onPress(order), activeOpacity: 0.9 } : {};

  return (
    <CardWrapper style={styles.card} {...cardProps}>
      {/* En-tête: Numéro de bon + Date */}
      <View style={styles.rowBetween}>
        <Text style={styles.orderNum}>{order.order_number}</Text>
        <Text style={styles.dateSmall}>{fmtDate(order.issued_at, role === 'client')}</Text>
      </View>

      {/* Infos spécifiques au rôle */}
      {role === 'admin' && (
        <>
          <View style={styles.infoRow}>
            <Ionicons name="person-circle-outline" size={15} color={Colors.bordeaux} />
            <Text style={styles.infoText}>
              {order.driver_snapshot.first_name} {order.driver_snapshot.last_name}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="people-outline" size={15} color={Colors.textMuted} />
            <Text style={styles.infoText}>
              {order.passenger_snapshot.first_name} {order.passenger_snapshot.last_name}
            </Text>
          </View>
        </>
      )}

      {/* Trajet */}
      <View style={styles.infoRow}>
        <Ionicons name="navigate-outline" size={15} color={Colors.textMuted} />
        <Text style={styles.infoText} numberOfLines={2}>
          {snap.pickup_address.split(',')[0]} → {snap.dest_address.split(',')[0]}
        </Text>
      </View>

      {/* Date course + Véhicule */}
      <View style={styles.rowBetween}>
        <Text style={styles.dateSmall}>{fmtDateTime(snap.scheduled_at)}</Text>
        <Text style={styles.vehicleTag}>{vehicleLabel[snap.vehicle_type] ?? snap.vehicle_type}</Text>
      </View>

      {/* Prix (si forfait) */}
      {snap.pricing_type === 'flat_rate' && snap.final_price !== null && (
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Forfait</Text>
          <Text style={styles.priceValue}>
            {snap.final_price.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {snap.currency}
          </Text>
        </View>
      )}

      {/* Bouton PDF */}
      <TouchableOpacity
        style={styles.pdfBtn}
        onPress={handlePress}
        disabled={!onPress}
      >
        <Ionicons name="eye-outline" size={16} color={Colors.white} />
        <Text style={styles.pdfBtnText}>Voir le bon de commande</Text>
      </TouchableOpacity>
    </CardWrapper>
  );
}

const styles = StyleSheet.create({
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
    gap: 8,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderNum: {
    fontSize: Fonts.size.md,
    fontFamily: Fonts.bold, fontWeight: '700',
    color: Colors.bordeaux,
  },
  dateSmall: {
    fontSize: Fonts.size.xs,
    color: Colors.textMuted,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: Fonts.size.sm,
    color: Colors.textPrimary,
    flex: 1,
  },
  vehicleTag: {
    backgroundColor: Colors.beigeLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    fontSize: Fonts.size.xs,
    color: Colors.bordeaux,
    fontFamily: Fonts.semibold, fontWeight: '600',
    overflow: 'hidden',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  priceLabel: { fontSize: Fonts.size.sm, color: Colors.textSecondary, fontFamily: Fonts.semibold, fontWeight: '600' },
  priceValue: { fontSize: Fonts.size.sm, fontFamily: Fonts.bold, fontWeight: '700', color: Colors.bordeaux },
  pdfBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginTop: 4,
    backgroundColor: Colors.bordeaux,
    paddingVertical: 10,
    borderRadius: Radius.sm,
  },
  pdfBtnOff: { backgroundColor: Colors.textMuted },
  pdfBtnText: { fontSize: Fonts.size.sm, fontFamily: Fonts.semibold, fontWeight: '600', color: Colors.white },
});
