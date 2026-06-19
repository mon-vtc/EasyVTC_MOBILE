// ══════════════════════════════════════════════════════════════════════════════
// SCREEN — Mes factures (Chauffeur)
// Sprint 4 — EazyVTC
// ══════════════════════════════════════════════════════════════════════════════

import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Linking, RefreshControl, Platform, TextInput
} from 'react-native';
import { Ionicons }         from '@expo/vector-icons';
import { useInvoicesStore } from '../../../store/invoices.store';
import { useAuthStore }     from '../../../store/auth.store';
import { invoicesApi }      from '../../../services/api/invoices.api';
import { useToast } from '../../../hooks/useToast';
import type { Invoice }     from '../../../types/invoices.types';
import { Colors, Fonts, Spacing, Radius } from '../../../theme/colors';

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function fmtAmount(n: number) {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function InvoiceCard({ invoice, token, onPress }: { invoice: Invoice; token: string; onPress: (invoice: Invoice) => void }) {
  const [opening, setOpening] = useState(false);
  const currency = invoice.trip_snapshot.country === 'senegal' ? 'XOF' : 'EUR';
  const snap = invoice.trip_snapshot;
  const { showToast } = useToast();

  const openPdf = async () => {
    setOpening(true);
    try {
      const res = await invoicesApi.fetchPdfUrl(token, invoice.id);
      if (!res.ok || !res.data?.url) throw new Error(res.message ?? 'URL indisponible');
      await Linking.openURL(res.data.url);
    } catch { showToast({ type: 'error', title: 'Erreur', message: 'Impossible d\'ouvrir la facture.' }); }
    finally { setOpening(false); }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(invoice)} activeOpacity={0.8}>
      <View style={styles.row}>
        <Text style={styles.invNum}>{invoice.invoice_number}</Text>
        <Text style={styles.dateText}>Émise le {fmtDate(invoice.issued_at)}</Text>
      </View>

      <View style={styles.tripRow}>
        <Ionicons name="navigate-outline" size={14} color={Colors.bordeaux} />
        <Text style={styles.tripText} numberOfLines={2}>
          {snap.pickup_address.split(',')[0]} → {snap.dest_address.split(',')[0]}
        </Text>
      </View>

      <View style={styles.amountsBox}>
        {invoice.tva_rate > 0 && (
          <>
            <View style={styles.amtRow}>
              <Text style={styles.amtLabel}>HT</Text>
              <Text style={styles.amtValue}>{fmtAmount(invoice.amount_ht)} {currency}</Text>
            </View>
            <View style={styles.amtRow}>
              <Text style={styles.amtLabel}>TVA {invoice.tva_rate}%</Text>
              <Text style={styles.amtValue}>
                {fmtAmount(Math.round((invoice.amount_ttc - invoice.amount_ht) * 100) / 100)} {currency}
              </Text>
            </View>
          </>
        )}
        <View style={[styles.amtRow, styles.ttcRow]}>
          <Text style={styles.ttcLabel}>TTC</Text>
          <Text style={styles.ttcValue}>{fmtAmount(invoice.amount_ttc)} {currency}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.pdfBtn}
        onPress={openPdf}
        disabled={opening}
      >
        {opening
          ? <ActivityIndicator size="small" color={Colors.white} />
          : <Ionicons name="receipt-outline" size={15} color={Colors.white} />
        }
        <Text style={styles.pdfBtnText}>{opening ? 'Ouverture…' : 'Facture PDF'}</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

export default function DriverInvoicesScreen() {
  const navigation = useNavigation<NavigationProp<any>>();
  const { invoices, total, isLoading, error, fetch, clearError } = useInvoicesStore();
  const token = useAuthStore((s) => s.accessToken) ?? '';
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');

  const load = useCallback(async () => {
    try { await fetch(token); } catch { /* handled */ }
  }, [token]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (error) { showToast({ type: 'error', title: 'Erreur', message: error }); clearError(); } }, [error, showToast, clearError]);

  const filteredInvoices = useMemo(() => {
    if (!searchQuery) return invoices;
    const query = searchQuery.toLowerCase();
    return invoices.filter(invoice =>
      invoice.invoice_number.toLowerCase().includes(query) ||
      invoice.trip_snapshot.pickup_address.toLowerCase().includes(query) ||
      invoice.trip_snapshot.dest_address.toLowerCase().includes(query) ||
      invoice.driver_billing.first_name.toLowerCase().includes(query) ||
      invoice.driver_billing.last_name.toLowerCase().includes(query)
    );
  }, [invoices, searchQuery]);
  const handleViewInvoice = (invoice: Invoice) => {
      navigation.navigate('DriverInvoiceDetails', { invoiceId: invoice.id });
  };

  if (isLoading && invoices.length === 0) {
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
          <Text style={styles.headerTitle}>Mes factures</Text>
          <Text style={styles.headerCount}>{total} facture{total > 1 ? 's' : ''}</Text>
        </View>
        <View style={styles.headerBtn} />
      </View>

      {/* Search Bar */}
      <View style={searchAndListStyles.searchContainer}>
        <Ionicons name="search" size={20} color={Colors.textMuted} style={searchAndListStyles.searchIcon} />
        <TextInput
          style={searchAndListStyles.searchInput}
          placeholder="Rechercher par numéro, adresse, client..."
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
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => <InvoiceCard invoice={item} token={token} onPress={handleViewInvoice} />}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={load} tintColor={Colors.bordeaux} />}
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
  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.border,
    shadowColor: Colors.black, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  row:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.xs },
  invNum:   { fontSize: Fonts.size.md, fontWeight: '700', color: Colors.bordeaux },
  dateText: { fontSize: Fonts.size.xs, color: Colors.textMuted },
  tripRow:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.sm },
  tripText: { flex: 1, fontSize: Fonts.size.sm, color: Colors.textPrimary },
  amountsBox: {
    backgroundColor: Colors.beigeLight, borderRadius: Radius.sm,
    padding: Spacing.sm, gap: 4,
  },
  amtRow:   { flexDirection: 'row', justifyContent: 'space-between' },
  amtLabel: { fontSize: Fonts.size.sm, color: Colors.textSecondary },
  amtValue: { fontSize: Fonts.size.sm, color: Colors.textPrimary },
  ttcRow:   { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 4, marginTop: 4 },
  ttcLabel: { fontSize: Fonts.size.sm, fontWeight: '700', color: Colors.textPrimary },
  ttcValue: { fontSize: Fonts.size.md, fontWeight: '800', color: Colors.bordeaux },
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

const searchAndListStyles = StyleSheet.create({
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    borderWidth: 1, borderColor: Colors.border,
  },
  searchIcon: { marginRight: Spacing.sm },
  searchInput: { flex: 1, fontSize: Fonts.size.md, color: Colors.textPrimary, padding: 0 },
  list: { padding: Spacing.md, paddingTop: Spacing.sm },
});
Object.assign(styles, searchAndListStyles);
