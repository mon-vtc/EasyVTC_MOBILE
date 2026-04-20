// ══════════════════════════════════════════════════════════════════════════════
// SCREEN — Mes factures (Client)
// Sprint 4 — EazyVTC
// ══════════════════════════════════════════════════════════════════════════════

import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, Linking,
  RefreshControl,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { Ionicons }           from '@expo/vector-icons';
import { useInvoicesStore }   from '../../store/invoices.store';
import { useAuthStore }       from '../../store/auth.store';
import { invoicesApi }        from '../../services/api/invoices.api';
import type { Invoice }       from '../../types/invoices.types';
import type { ClientTabParamList } from '../../types/auth.types';
import { Colors, Fonts, Spacing, Radius } from '../../theme/colors';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
}

function fmtAmount(n: number): string {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const vehicleLabel: Record<string, string> = {
  standard: 'Standard',
  berline:  'Berline',
  van:      'Van',
};

// ── Carte facture ─────────────────────────────────────────────────────────────

function InvoiceCard({ invoice, token }: { invoice: Invoice; token: string }) {
  const [openingPdf, setOpeningPdf] = useState(false);

  const currency = invoice.trip_snapshot.country === 'senegal' ? 'XOF' : 'EUR';

  const handleOpenPdf = async () => {
    if (!invoice.pdf_url) {
      Alert.alert('PDF non disponible', 'Le document PDF n\'est pas encore généré.');
      return;
    }
    setOpeningPdf(true);
    try {
      const url = `${invoicesApi.getPdfUrl(token, invoice.id)}?token=${encodeURIComponent(token)}`;
      await Linking.openURL(url);
    } catch {
      Alert.alert('Erreur', 'Impossible d\'ouvrir la facture.');
    } finally {
      setOpeningPdf(false);
    }
  };

  const snap = invoice.trip_snapshot;

  return (
    <View style={styles.card}>
      {/* En-tête */}
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.invoiceNumber}>{invoice.invoice_number}</Text>
          <Text style={styles.issuedDate}>Émise le {fmtDate(invoice.issued_at)}</Text>
        </View>
        {/* Badge ajustement */}
        {invoice.adjustments.length > 0 && (
          <View style={styles.adjustedBadge}>
            <Text style={styles.adjustedBadgeText}>Ajustée</Text>
          </View>
        )}
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

      {/* Véhicule + date */}
      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Ionicons name="car-outline" size={14} color={Colors.textMuted} />
          <Text style={styles.metaText}>{vehicleLabel[snap.vehicle_type] ?? snap.vehicle_type}</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="calendar-outline" size={14} color={Colors.textMuted} />
          <Text style={styles.metaText}>{fmtDate(snap.scheduled_at)}</Text>
        </View>
      </View>

      {/* Montants */}
      <View style={styles.amountsBox}>
        {invoice.tva_rate > 0 && (
          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Montant HT</Text>
            <Text style={styles.amountValue}>{fmtAmount(invoice.amount_ht)} {currency}</Text>
          </View>
        )}
        {invoice.tva_rate > 0 && (
          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>TVA {invoice.tva_rate}%</Text>
            <Text style={styles.amountValue}>
              {fmtAmount(Math.round((invoice.amount_ttc - invoice.amount_ht) * 100) / 100)} {currency}
            </Text>
          </View>
        )}
        <View style={[styles.amountRow, styles.amountTtcRow]}>
          <Text style={styles.amountTtcLabel}>Total TTC</Text>
          <Text style={styles.amountTtc}>{fmtAmount(invoice.amount_ttc)} {currency}</Text>
        </View>
        <Text style={styles.paymentMention}>
          Réglé hors application (espèces / CB fin de course)
        </Text>
      </View>

      {/* Bouton PDF */}
      <TouchableOpacity
        style={[styles.pdfBtn, !invoice.pdf_url && styles.pdfBtnDisabled]}
        onPress={handleOpenPdf}
        disabled={openingPdf || !invoice.pdf_url}
      >
        {openingPdf
          ? <ActivityIndicator size="small" color={Colors.white} />
          : <Ionicons name="receipt-outline" size={16} color={Colors.white} />
        }
        <Text style={styles.pdfBtnText}>
          {openingPdf ? 'Ouverture…' : 'Télécharger la facture'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function MyInvoicesScreen({ 
  route 
}: { 
  route?: RouteProp<ClientTabParamList, 'MyInvoices'> 
}) {
  const { invoices, total, isLoading, error, fetch, clearError } = useInvoicesStore();
  const token = useAuthStore((s) => s.accessToken) ?? '';
  const params = route?.params;
  const filteredByReservation = params?.reservationId;

  const load = useCallback(async () => {
    try { await fetch(token); } catch { /* handled in store */ }
  }, [token, fetch]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (error) { Alert.alert('Erreur', error); clearError(); }
  }, [error, clearError]);

  // Filtrer les factures si une réservation est spécifiée
  const displayedInvoices = filteredByReservation
    ? invoices.filter(inv => inv.trip?.reservation_id === filteredByReservation)
    : invoices;

  if (isLoading && invoices.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.bordeaux} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {filteredByReservation ? 'Facture de la course' : 'Mes factures'}
        </Text>
        <Text style={styles.headerCount}>
          {displayedInvoices.length} facture{displayedInvoices.length > 1 ? 's' : ''}
        </Text>
      </View>

      <FlatList
        data={displayedInvoices}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <InvoiceCard invoice={item} token={token} />}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={load} tintColor={Colors.bordeaux} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>Aucune facture</Text>
            <Text style={styles.emptySubtitle}>
              {filteredByReservation 
                ? 'Pas de facture disponible pour cette course.'
                : 'Les factures sont générées automatiquement à la clôture de chaque course.'
              }
            </Text>
          </View>
        }
      />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: Colors.background },
  centered:       { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.bordeaux,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  headerTitle:  { fontSize: Fonts.size.xl, fontWeight: '800', color: Colors.white },
  headerCount:  { fontSize: Fonts.size.sm, color: Colors.beigeLight, marginTop: 2 },
  list:         { padding: Spacing.md, gap: Spacing.md },
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
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  invoiceNumber: { fontSize: Fonts.size.md, fontWeight: '700', color: Colors.bordeaux },
  issuedDate:    { fontSize: Fonts.size.xs, color: Colors.textMuted, marginTop: 2 },
  adjustedBadge: {
    backgroundColor: Colors.warningLight,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  adjustedBadgeText: { fontSize: Fonts.size.xs, color: Colors.warning, fontWeight: '600' },
  tripRow:  { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  tripText: { flex: 1, fontSize: Fonts.size.sm, color: Colors.textPrimary },
  metaRow: {
    flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.sm,
    paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border,
  },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: Fonts.size.xs, color: Colors.textMuted },
  amountsBox: {
    marginTop: Spacing.sm, padding: Spacing.sm,
    backgroundColor: Colors.beigeLight, borderRadius: Radius.sm,
  },
  amountRow:     { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  amountLabel:   { fontSize: Fonts.size.sm, color: Colors.textSecondary },
  amountValue:   { fontSize: Fonts.size.sm, color: Colors.textPrimary },
  amountTtcRow:  { borderTopWidth: 1, borderTopColor: Colors.border, marginTop: 4, paddingTop: 4 },
  amountTtcLabel:{ fontSize: Fonts.size.sm, fontWeight: '700', color: Colors.textPrimary },
  amountTtc:     { fontSize: Fonts.size.md, fontWeight: '800', color: Colors.bordeaux },
  paymentMention:{ fontSize: Fonts.size.xs, color: Colors.textMuted, marginTop: Spacing.xs, fontStyle: 'italic' },
  pdfBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.xs, marginTop: Spacing.md, backgroundColor: Colors.bordeaux,
    paddingVertical: 10, borderRadius: Radius.sm,
  },
  pdfBtnDisabled: { backgroundColor: Colors.textMuted },
  pdfBtnText: { fontSize: Fonts.size.sm, fontWeight: '600', color: Colors.white },
  empty: { alignItems: 'center', paddingTop: Spacing.xxl, gap: Spacing.sm },
  emptyTitle:    { fontSize: Fonts.size.lg, fontWeight: '700', color: Colors.textPrimary },
  emptySubtitle: { fontSize: Fonts.size.sm, color: Colors.textMuted, textAlign: 'center', paddingHorizontal: Spacing.lg },
});
