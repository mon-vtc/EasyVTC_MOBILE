// ══════════════════════════════════════════════════════════════════════════════
// SCREEN — Factures (Admin) — avec ajustement de prix
// Sprint 4 — EasyVTC
// ══════════════════════════════════════════════════════════════════════════════

import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Modal, TextInput,
  StyleSheet, ActivityIndicator, Alert, Linking, RefreshControl, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { Ionicons }         from '@expo/vector-icons';
import { useInvoicesStore } from '../../../store/invoices.store';
import { useAuthStore }     from '../../../store/auth.store';
import { invoicesApi }      from '../../../services/api/invoices.api';
import type { Invoice }     from '../../../types/invoices.types';
import { Colors, Fonts, Spacing, Radius } from '../../../theme/colors';
import { useToast } from '../../../hooks/useToast';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtAmount(n: number) {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ── Modal ajustement de prix ──────────────────────────────────────────────────

function AdjustPriceModal({ invoice, token, onClose }: {
  invoice: Invoice;
  token:   string;
  onClose: () => void;
}) {
  const { adjustPrice, isAdjusting } = useInvoicesStore();
  const { showToast } = useToast();
  const currency = invoice.trip_snapshot.country === 'senegal' ? 'XOF' : 'EUR';
  const [newAmount, setNewAmount] = useState(String(invoice.amount_ttc));
  const [reason,    setReason]    = useState('');

  const handleSubmit = async () => {
    const parsed = parseFloat(newAmount.replace(',', '.'));
    if (isNaN(parsed) || parsed <= 0) {
      showToast({ type: 'error', message: 'Montant invalide. Saisissez un montant positif.' });
      return;
    }
    if (!reason.trim()) {
      showToast({ type: 'error', message: 'Motif requis. Le motif d\'ajustement est obligatoire.' });
      return;
    }
    try {
      await adjustPrice(token, invoice.id, { new_amount_ttc: parsed, reason: reason.trim() });
      showToast({ type: 'success', message: 'Prix ajusté et facture régénérée.' });
      onClose();
    } catch (err: unknown) {
      showToast({ type: 'error', message: err instanceof Error ? err.message : 'Erreur lors de l\'ajustement' });
    }
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.modalSheet}>
          {/* En-tête modal */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Ajuster le prix</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.modalSubtitle}>{invoice.invoice_number}</Text>

          {/* Prix actuel */}
          <View style={styles.currentPrice}>
            <Text style={styles.currentPriceLabel}>Prix actuel (TTC)</Text>
            <Text style={styles.currentPriceValue}>
              {fmtAmount(invoice.amount_ttc)} {currency}
            </Text>
          </View>

          {/* Nouveau montant */}
          <Text style={styles.fieldLabel}>Nouveau montant TTC ({currency})</Text>
          <TextInput
            style={styles.input}
            value={newAmount}
            onChangeText={setNewAmount}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor={Colors.textPlaceholder}
          />

          {/* Motif */}
          <Text style={styles.fieldLabel}>Motif de l'ajustement *</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            value={reason}
            onChangeText={setReason}
            placeholder="Geste commercial, correction de prix…"
            placeholderTextColor={Colors.textPlaceholder}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          {/* Historique ajustements */}
          {invoice.adjustments.length > 0 && (
            <View style={styles.historyBox}>
              <Text style={styles.historyTitle}>Historique ({invoice.adjustments.length})</Text>
              {invoice.adjustments.map((adj, i) => (
                <Text key={i} style={styles.historyItem}>
                  {fmtDate(adj.adjusted_at)} — {adj.adjusted_by_name} :
                  {' '}{fmtAmount(adj.old_amount_ttc)} → {fmtAmount(adj.new_amount_ttc)} {currency}
                  {'\n'}Motif : {adj.reason}
                </Text>
              ))}
            </View>
          )}

          {/* Bouton valider */}
          <TouchableOpacity
            style={[styles.submitBtn, isAdjusting && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={isAdjusting}
          >
            {isAdjusting
              ? <ActivityIndicator size="small" color={Colors.white} />
              : <Text style={styles.submitBtnText}>Valider l'ajustement</Text>
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Carte facture ─────────────────────────────────────────────────────────────

function InvoiceRow({ invoice, token, onAdjust, onPress }: {
  invoice:  Invoice;
  token:    string;
  onAdjust: (inv: Invoice) => void;
  onPress: (inv: Invoice) => void;
}) {
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
      <View style={styles.rowBetween}>
        <Text style={styles.invNum}>{invoice.invoice_number}</Text>
        <View style={styles.rowGap}>
          {invoice.adjustments.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Ajustée</Text>
            </View>
          )}
          <Text style={styles.dateSmall}>{fmtDate(invoice.issued_at)}</Text>
        </View>
      </View>

      {/* Identités */}
      <View style={styles.infoRow}>
        <Ionicons name="person-circle-outline" size={14} color={Colors.bordeaux} />
        <Text style={styles.infoText}>
          {invoice.client_snapshot.first_name} {invoice.client_snapshot.last_name}
        </Text>
        <Ionicons name="car-outline" size={14} color={Colors.textMuted} style={{ marginLeft: 8 }} />
        <Text style={styles.infoText}>
          {invoice.driver_billing.first_name} {invoice.driver_billing.last_name}
        </Text>
      </View>

      {/* Trajet */}
      <View style={styles.infoRow}>
        <Ionicons name="navigate-outline" size={14} color={Colors.textMuted} />
        <Text style={styles.infoText} numberOfLines={1}>
          {snap.pickup_address.split(',')[0]} → {snap.dest_address.split(',')[0]}
        </Text>
      </View>

      {/* Montant */}
      <View style={styles.rowBetween}>
        <Text style={styles.amtLabel}>Total TTC</Text>
        <Text style={styles.amtTtc}>{fmtAmount(invoice.amount_ttc)} {currency}</Text>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={openPdf}
          disabled={opening}
        >
          {opening
            ? <ActivityIndicator size="small" color={Colors.white} />
            : <Ionicons name="receipt-outline" size={14} color={Colors.white} />
          }
          <Text style={styles.actionBtnText}>PDF</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnAdjust]}
          onPress={() => onAdjust(invoice)}
        >
          <Ionicons name="pencil-outline" size={14} color={Colors.white} />
          <Text style={styles.actionBtnText}>Ajuster</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function AdminInvoicesScreen() {
  const navigation = useNavigation<NavigationProp<any>>();
  const { invoices, total, page, totalPages, isLoading, isFetchingNextPage, error, fetch, clearError } = useInvoicesStore();
  const token = useAuthStore((s) => s.accessToken) ?? '';
  const [adjustTarget, setAdjustTarget] = useState<Invoice | null>(null);
  const [search, setSearch] = useState('');
  const { showToast } = useToast();

  const load = useCallback(async () => {
    try { await fetch(token); } catch { /* handled */ }
  }, [token]);

  const loadMore = useCallback(() => {
    if (isLoading || isFetchingNextPage || page >= totalPages) return;
    fetch(token, { page: page + 1 }).catch(() => {});
  }, [isLoading, isFetchingNextPage, page, totalPages, token, fetch]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (error) { showToast({ type: 'error', message: error }); clearError(); } }, [error]);

  const filtered = search.trim()
    ? invoices.filter(inv =>
        inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
        `${inv.client_snapshot.first_name} ${inv.client_snapshot.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
        `${inv.driver_billing.first_name} ${inv.driver_billing.last_name}`.toLowerCase().includes(search.toLowerCase())
      )
    : invoices;

  const handleViewInvoice = (invoice: Invoice) => {
    navigation.navigate('InvoiceDetails', { invoiceId: invoice.id });
  };

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
          <Text style={styles.headerTitle}>Factures</Text>
          <Text style={styles.headerCount}>{total} facture{total > 1 ? 's' : ''}</Text>
        </View>
        <View style={styles.headerBtn} />
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={18} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="N° facture, client, chauffeur…"
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
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <InvoiceRow invoice={item} token={token} onAdjust={setAdjustTarget} onPress={handleViewInvoice} />
        )}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={load} tintColor={Colors.bordeaux} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={isFetchingNextPage ? <ActivityIndicator size="small" color={Colors.bordeaux} style={{ padding: 16 }} /> : null}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>Aucune facture</Text>
          </View>
        }
      />

      {/* Modal ajustement */}
      {adjustTarget && (
        <AdjustPriceModal
          invoice={adjustTarget}
          token={token}
          onClose={() => setAdjustTarget(null)}
        />
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: Colors.background },
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
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 1, gap: 6,
  },
  rowBetween:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowGap:      { flexDirection: 'row', alignItems: 'center', gap: 6 },
  invNum:      { fontSize: Fonts.size.md, fontWeight: '700', color: Colors.bordeaux },
  dateSmall:   { fontSize: Fonts.size.xs, color: Colors.textMuted },
  badge: {
    backgroundColor: Colors.warningLight, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4,
  },
  badgeText:   { fontSize: Fonts.size.xs, color: Colors.warning, fontWeight: '600' },
  infoRow:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  infoText:    { fontSize: Fonts.size.xs, color: Colors.textPrimary, flex: 1 },
  amtLabel:    { fontSize: Fonts.size.sm, color: Colors.textSecondary, fontWeight: '600' },
  amtTtc:      { fontSize: Fonts.size.md, fontWeight: '800', color: Colors.bordeaux },
  actions:     { flexDirection: 'row', gap: Spacing.sm, marginTop: 4 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 4, backgroundColor: Colors.bordeaux, paddingVertical: 8, borderRadius: Radius.sm,
  },
  actionBtnOff:    { backgroundColor: Colors.textMuted },
  actionBtnAdjust: { backgroundColor: Colors.beigeDark },
  actionBtnText:   { fontSize: Fonts.size.sm, fontWeight: '600', color: Colors.white },
  headerBtn: { width: 40 },
  empty:      { alignItems: 'center', paddingTop: Spacing.xxl, gap: Spacing.sm },
  emptyTitle: { fontSize: Fonts.size.lg, fontWeight: '700', color: Colors.textPrimary },

  // ── Modal ──────────────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalSheet: {
    backgroundColor: Colors.surface, borderTopLeftRadius: Radius.lg, borderTopRightRadius: Radius.lg,
    padding: Spacing.lg, gap: Spacing.sm, maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 4,
  },
  modalTitle:    { fontSize: Fonts.size.lg, fontWeight: '800', color: Colors.textPrimary },
  modalSubtitle: { fontSize: Fonts.size.sm, color: Colors.textMuted, marginBottom: Spacing.sm },
  currentPrice: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.beigeLight, padding: Spacing.sm, borderRadius: Radius.sm,
  },
  currentPriceLabel: { fontSize: Fonts.size.sm, color: Colors.textSecondary },
  currentPriceValue: { fontSize: Fonts.size.md, fontWeight: '700', color: Colors.bordeaux },
  fieldLabel:    { fontSize: Fonts.size.sm, fontWeight: '600', color: Colors.textSecondary, marginTop: Spacing.xs },
  input: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm, paddingVertical: 10,
    fontSize: Fonts.size.sm, color: Colors.textPrimary, backgroundColor: Colors.placeHolder,
  },
  inputMultiline: { minHeight: 72, paddingTop: 10 },
  historyBox: {
    backgroundColor: Colors.background, borderRadius: Radius.sm,
    padding: Spacing.sm, gap: 4,
  },
  historyTitle:  { fontSize: Fonts.size.sm, fontWeight: '700', color: Colors.textSecondary, marginBottom: 4 },
  historyItem:   { fontSize: Fonts.size.xs, color: Colors.textMuted, lineHeight: 18 },
  submitBtn: {
    backgroundColor: Colors.bordeaux, borderRadius: Radius.md,
    paddingVertical: 14, alignItems: 'center', marginTop: Spacing.sm,
  },
  submitBtnDisabled: { backgroundColor: Colors.textMuted },
  submitBtnText: { fontSize: Fonts.size.md, fontWeight: '700', color: Colors.white },
});
