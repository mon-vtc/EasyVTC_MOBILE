// ══════════════════════════════════════════════════════════════════════════════
// SCREEN — Mes factures (Client)
// Sprint 4 — EazyVTC
// ══════════════════════════════════════════════════════════════════════════════

import React, { useCallback, useEffect, useState } from 'react';
import { useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Linking, RefreshControl, Platform, TextInput
} from 'react-native';
import { RouteProp, useNavigation } from '@react-navigation/native';
import type { NavigationProp }      from '@react-navigation/native';
import { Ionicons }           from '@expo/vector-icons';
import { useInvoicesStore }   from '../../store/invoices.store';
import { useAuthStore }       from '../../store/auth.store';
import { invoicesApi }        from '../../services/api/invoices.api';
import type { Invoice }       from '../../types/invoices.types';
import type { ClientTabParamList, ClientStackParamList } from '../../types/auth.types';
import { Colors, Fonts, Spacing, Radius } from '../../theme/colors';
import { useToast } from '../../hooks/useToast';

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

function InvoiceCard({
  invoice,
  token,
  onPress,
}: {
  invoice: Invoice;
  token: string;
  onPress: () => void;
}) {
  const [openingPdf, setOpeningPdf] = useState(false);

  const currency = invoice.trip_snapshot.country === 'senegal' ? 'XOF' : 'EUR';
  const { showToast } = useToast();

  const handleOpenPdf = async () => {
    setOpeningPdf(true);
    try {
      const res = await invoicesApi.fetchPdfUrl(token, invoice.id);
      if (!res.ok || !res.data?.url) throw new Error(res.message ?? 'URL indisponible');
      await Linking.openURL(res.data.url);
    } catch {
      showToast({ type: 'error', title: 'Erreur', message: 'Impossible d\'ouvrir la facture.' });
    } finally {
      setOpeningPdf(false);
    }
  };

  const snap = invoice.trip_snapshot;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
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

      {/* Actions */}
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.detailBtn} onPress={onPress}>
          <Ionicons name="eye-outline" size={14} color={Colors.bordeaux} />
          <Text style={styles.detailBtnText}>Voir le détail</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.pdfBtn}
          onPress={handleOpenPdf}
          disabled={openingPdf}
        >
          {openingPdf
            ? <ActivityIndicator size="small" color={Colors.white} />
            : <Ionicons name="receipt-outline" size={14} color={Colors.white} />
          }
          <Text style={styles.pdfBtnText}>
            {openingPdf ? 'Ouverture…' : 'PDF'}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function MyInvoicesScreen({
  route
}: {
  route?: RouteProp<ClientTabParamList, 'MyInvoices'>
}) {
  const navigation = useNavigation<NavigationProp<ClientStackParamList>>();
  const { invoices, isLoading, error, fetch, clearError } = useInvoicesStore();
  const token = useAuthStore((s) => s.accessToken) ?? '';
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');

  const load = useCallback(async () => {
    try { await fetch(token); } catch { /* handled in store */ }
  }, [token, fetch]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (error) { showToast({ type: 'error', title: 'Erreur', message: error }); clearError(); }
  }, [error, clearError]);

  const filteredInvoices = useMemo(() => {
    if (!searchQuery) return invoices;
    const query = searchQuery.toLowerCase();
    return invoices.filter(invoice =>
      invoice.invoice_number.toLowerCase().includes(query) ||
      invoice.trip_snapshot.pickup_address.toLowerCase().includes(query) ||
      invoice.trip_snapshot.dest_address.toLowerCase().includes(query) ||
      invoice.client_snapshot.first_name.toLowerCase().includes(query) ||
      invoice.client_snapshot.last_name.toLowerCase().includes(query)
    );
  }, [invoices, searchQuery]);

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
        <Text style={styles.headerTitle}>Mes factures</Text>
        <Text style={styles.headerCount}>
          {filteredInvoices.length} facture{filteredInvoices.length > 1 ? 's' : ''}
        </Text>
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
        data={filteredInvoices}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <InvoiceCard
            invoice={item}
            token={token}
            onPress={() => navigation.navigate('InvoiceDetails', { invoiceId: item.id })}
          />
        )}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={load} tintColor={Colors.bordeaux} />
        }
        ListEmptyComponent={filteredInvoices.length === 0 && !isLoading ? (
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>Aucune facture</Text>
            <Text style={styles.emptySubtitle}>
              Les factures sont générées automatiquement à la clôture de chaque course.
            </Text>
          </View>
        ) : null}
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
  actionsRow: {
    flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md,
  },
  detailBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.xs, borderWidth: 1, borderColor: Colors.bordeaux,
    paddingVertical: 10, borderRadius: Radius.sm, backgroundColor: Colors.white,
  },
  detailBtnText: { fontSize: Fonts.size.sm, fontWeight: '600', color: Colors.bordeaux },
  pdfBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.xs, backgroundColor: Colors.bordeaux,
    paddingVertical: 10, borderRadius: Radius.sm,
  },
  pdfBtnDisabled: { backgroundColor: Colors.textMuted },
  pdfBtnText: { fontSize: Fonts.size.sm, fontWeight: '600', color: Colors.white },
  empty: { alignItems: 'center', paddingTop: Spacing.xxl, gap: Spacing.sm },
  emptyTitle:    { fontSize: Fonts.size.lg, fontWeight: '700', color: Colors.textPrimary },
  emptySubtitle: { fontSize: Fonts.size.sm, color: Colors.textMuted, textAlign: 'center', paddingHorizontal: Spacing.lg },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    marginVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchIcon: { marginRight: Spacing.sm },
  searchInput: { flex: 1, fontSize: Fonts.size.md, color: Colors.textPrimary, padding: 0 },
});
