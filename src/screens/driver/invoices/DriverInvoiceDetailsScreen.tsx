// ══════════════════════════════════════════════════════════════════════════════
// SCREEN — InvoiceDetailsScreen
// Sprint 4 — EazyVTC
// Affiche le détail d'une facture avec rendu fidèle au document PDF,
// et permet de télécharger / partager le PDF.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Alert,
  Linking,
  Share,
  Image,
} from 'react-native';
import {
  useNavigation,
  useRoute,
  type RouteProp,
  type NavigationProp,
} from '@react-navigation/native';
import { Ionicons }               from '@expo/vector-icons';
import { Colors, Fonts, Spacing, Radius } from '../../../theme/colors';
import { useInvoicesStore }       from '../../../store/invoices.store';
import { useAuthStore }           from '../../../store/auth.store';
import { invoicesApi }            from '../../../services/api/invoices.api';
import type { DriverInvoicesStackParamList } from '../../../types/auth.types';
import type { InvoiceAdjustment } from '../../../types/invoices.types';
import { Logo }                   from '../../../constants/logo';

// ── Types navigation ───────────────────────────────────────────────────────────
type NavRoute = RouteProp<DriverInvoicesStackParamList, 'DriverInvoiceDetails'>;
type NavProp  = NavigationProp<DriverInvoicesStackParamList, 'DriverInvoiceDetails'>;

// ── Helpers ────────────────────────────────────────────────────────────────────
function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function fmtAmount(n: number): string {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const vehicleLabel: Record<string, string> = {
  standard: 'Standard',
  berline:  'Berline',
  van:      'Van',
};

// ── Composant principal ────────────────────────────────────────────────────────
export default function InvoiceDetailsScreen() {
  const navigation = useNavigation<NavProp>();
  const route      = useRoute<NavRoute>();
  const { invoiceId } = route.params;

  const token                             = useAuthStore(s => s.accessToken) ?? '';
  const { invoices, fetchById, isLoading } = useInvoicesStore();

  const invoice = invoices.find(inv => inv.id === invoiceId)
    ?? useInvoicesStore.getState().selected ?? null;

  const [openingPdf, setOpeningPdf] = useState(false);

  useEffect(() => {
    if (!invoice || invoice.id !== invoiceId) {
      fetchById(token, invoiceId);
    }
  }, [invoiceId]);

  // ── Actions ──────────────────────────────────────────────────────────────────

  const handleOpenPdf = async () => {
    setOpeningPdf(true);
    try {
      const res = await invoicesApi.fetchPdfUrl(token, invoiceId);
      if (!res.ok || !res.data?.url) throw new Error(res.message ?? 'URL indisponible');
      await Linking.openURL(res.data.url);
    } catch {
      Alert.alert('Erreur', 'Impossible d\'ouvrir la facture PDF.');
    } finally {
      setOpeningPdf(false);
    }
  };

  const handleShare = async () => {
    if (!invoice) return;
    try {
      const res = await invoicesApi.fetchPdfUrl(token, invoiceId);
      const pdfUrl = res.ok && res.data?.url ? res.data.url : null;
      await Share.share({
        title:   `Facture ${invoice.invoice_number}`,
        message: pdfUrl
          ? `Facture EazyVTC — ${invoice.invoice_number}\n${pdfUrl}`
          : `Facture EazyVTC — ${invoice.invoice_number}`,
        url: pdfUrl ?? undefined,
      });
    } catch {
      // Annulation silencieuse
    }
  };

  // ── États de chargement / erreur ─────────────────────────────────────────────

  if (isLoading && !invoice) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.bordeaux} />
      </View>
    );
  }

  if (!invoice) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Facture introuvable.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.linkText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const snap     = invoice.trip_snapshot;
  const driver   = invoice.driver_billing;
  const client   = invoice.client_snapshot;
  const currency = snap.country === 'senegal' ? 'XOF' : 'EUR';
  const tvaAmount = invoice.tva_rate > 0
    ? Math.round((invoice.amount_ttc - invoice.amount_ht) * 100) / 100
    : 0;

  // ── Rendu ────────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      {/* ── Header barre de navigation ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Facture</Text>
        <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
          <Ionicons name="share-social-outline" size={22} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* ════════════════════════════════════════════════════════════════════
            DOCUMENT — FACTURE
        ════════════════════════════════════════════════════════════════════ */}
        <View style={styles.document}>

          {/* ── En-tête document (fond bordeaux) ── */}
          <View style={styles.docHeader}>
            <View style={styles.docHeaderLeft}>
              <Text style={styles.docTitle}>FACTURE</Text>
              <Text style={styles.docInvoiceNumber}>n° {invoice.invoice_number}</Text>
              <Text style={styles.docDate}>Date :  {fmtDate(invoice.issued_at)}</Text>
            </View>
            <View style={styles.docLogoContainer}>
              <View style={styles.docLogoCircle}>
                <Image source={Logo.LogoVTCMarron} style={styles.docLogoImage} />
              </View>
            </View>
          </View>

          {/* ── Identités : À l'attention de | Chauffeur ── */}
          <View style={styles.identityRow}>
            {/* Client (gauche) */}
            <View style={styles.identityBlock}>
              <Text style={styles.identityLabel}>À l'attention de</Text>
              <Text style={styles.identityName}>{client.first_name} {client.last_name}</Text>
              {client.phone ? (
                <Text style={styles.identityDetail}>Téléphone : {client.phone}</Text>
              ) : null}
              {client.email ? (
                <Text style={styles.identityDetail}>Email : {client.email}</Text>
              ) : null}
            </View>

            <View style={styles.identityDivider} />

            {/* Chauffeur (droite) */}
            <View style={styles.identityBlock}>
              <Text style={styles.identityLabel}>Chauffeur</Text>
              <Text style={styles.identityName}>{driver.first_name} {driver.last_name}</Text>
              {driver.phone ? (
                <Text style={styles.identityDetail}>Téléphone : {driver.phone}</Text>
              ) : null}
              {driver.email ? (
                <Text style={styles.identityDetail}>Email : {driver.email}</Text>
              ) : null}
              {driver.siret ? (
                <Text style={styles.identityDetail}>SIRET : {driver.siret}</Text>
              ) : null}
            </View>
          </View>

          <View style={styles.divider} />

          {/* ── Objet ── */}
          <View style={styles.objetRow}>
            <Text style={styles.objetText}>Objet : Transport avec chauffeur</Text>
          </View>

          <View style={styles.divider} />

          {/* ── Trajet ── */}
          <View style={styles.tripSection}>
            {/* Prise en charge */}
            <View style={styles.addressRow}>
              <View style={[styles.pinDot, styles.pinDotBordeaux]} />
              <View style={styles.addressContent}>
                <Text style={styles.addressLabel}>Lieu de prise en charge</Text>
                <Text style={styles.addressText}>{snap.pickup_address}</Text>
              </View>
            </View>

            {/* Destination */}
            <View style={styles.addressRow}>
              <View style={[styles.pinDot, styles.pinDotGray]} />
              <View style={styles.addressContent}>
                <Text style={styles.addressLabel}>Destination</Text>
                <Text style={styles.addressText}>{snap.dest_address}</Text>
              </View>
            </View>

            {/* Date + Heure */}
            <View style={styles.tripMetaRow}>
              <View style={styles.tripMetaItem}>
                <Ionicons name="calendar-outline" size={14} color={Colors.textMuted} />
                <Text style={styles.tripMetaText}>{fmtDate(snap.scheduled_at)}</Text>
              </View>
              <View style={styles.tripMetaItem}>
                <Ionicons name="time-outline" size={14} color={Colors.textMuted} />
                <Text style={styles.tripMetaText}>{fmtTime(snap.scheduled_at)}</Text>
              </View>
            </View>

            {/* Véhicule + Chauffeur */}
            <View style={styles.tripMetaItem}>
              <Ionicons name="car-outline" size={14} color={Colors.textMuted} />
              <Text style={styles.tripMetaText}>
                Votre chauffeur était : {vehicleLabel[snap.vehicle_type] ?? snap.vehicle_type} - {driver.first_name} {driver.last_name}
              </Text>
            </View>
          </View>

          {/* ── Tableau des prestations ── */}
          <View style={styles.tableSection}>
            {/* En-tête tableau */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.cellDesig]}>Désignation</Text>
              <Text style={[styles.tableHeaderCell, styles.cellQty]}>Quantité</Text>
              <Text style={[styles.tableHeaderCell, styles.cellAmt]}>Montant HT</Text>
            </View>
            {/* Ligne transport */}
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.cellDesig]}>Transport de voyage (Course VTC)</Text>
              <Text style={[styles.tableCell, styles.cellQty, { textAlign: 'center' }]}>1</Text>
              <Text style={[styles.tableCell, styles.cellAmt, { textAlign: 'right' }]}>{fmtAmount(invoice.amount_ht)} {currency}</Text>
            </View>
          </View>

          {/* ── Totaux ── */}
          <View style={styles.totalsSection}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total HT</Text>
              <Text style={styles.totalValue}>{fmtAmount(invoice.amount_ht)} {currency}</Text>
            </View>

            {invoice.tva_rate > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>TVA ({invoice.tva_rate} %)</Text>
                <Text style={styles.totalValue}>{fmtAmount(tvaAmount)} {currency}</Text>
              </View>
            )}

            {invoice.tva_rate === 0 && (
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { fontStyle: 'italic', fontSize: Fonts.size.xs }]}>
                  TVA non applicable (art. 293 B CGI)
                </Text>
              </View>
            )}

            {/* Total TTC box bordeaux */}
            <View style={styles.totalTtcBox}>
              <Text style={styles.totalTtcLabel}>Total TTC</Text>
              <Text style={styles.totalTtcValue}>{fmtAmount(invoice.amount_ttc)} {currency}</Text>
            </View>
          </View>

          {/* ── Paiement (fond gris) ── */}
          <View style={styles.paymentBox}>
            <Text style={styles.paymentMention}>Réglé hors application</Text>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Mode de paiement :</Text>
              <Text style={styles.paymentValue}>Espèces / CB fin de course</Text>
            </View>
          </View>

          {/* ── Pied légal ── */}
          {driver.siret ? (
            <View style={styles.legalFooter}>
              <Text style={styles.legalText}>
                SIRET : {driver.siret}
                {driver.tva_rate === 0
                  ? ' — Auto-entrepreneur/Micro-entrepreneur, exonéré d\'immatriculation au RCS et au RM'
                  : ''}
              </Text>
            </View>
          ) : null}

          {/* ── Badge ajustement (si applicable) ── */}
          {invoice.adjustments.length > 0 && (
            <View style={styles.adjustedBanner}>
              <Ionicons name="information-circle-outline" size={14} color={Colors.warning} />
              <Text style={styles.adjustedBannerText}>
                Prix ajusté ({invoice.adjustments.length} modification{invoice.adjustments.length > 1 ? 's' : ''})
              </Text>
            </View>
          )}

          {/* ── Historique des ajustements ── */}
          {invoice.adjustments.length > 0 && (
            <>
              <View style={styles.divider} />
              <View style={styles.adjSection}>
                <Text style={styles.adjSectionTitle}>Historique des modifications</Text>
                {invoice.adjustments.map((adj: InvoiceAdjustment, idx: number) => (
                  <View key={idx} style={styles.adjItem}>
                    <Text style={styles.adjDate}>{fmtDate(adj.adjusted_at)}</Text>
                    <Text style={styles.adjDetail}>
                      Par {adj.adjusted_by_name} :{' '}
                      {fmtAmount(adj.old_amount_ttc)} {currency} →{' '}
                      {fmtAmount(adj.new_amount_ttc)} {currency}
                    </Text>
                    <Text style={styles.adjReason}>Motif : {adj.reason}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

        </View>
        {/* FIN DOCUMENT */}

        {/* ── Bouton télécharger PDF ── */}
        <TouchableOpacity
          style={styles.pdfBtn}
          onPress={handleOpenPdf}
          disabled={openingPdf}
          activeOpacity={0.85}
        >
          {openingPdf ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Ionicons name="download-outline" size={20} color={Colors.white} />
          )}
          <Text style={styles.pdfBtnText}>
            {openingPdf ? 'Téléchargement...' : 'Télécharger en PDF'}
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered:  { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.lg },
  errorText: { fontSize: Fonts.size.md, color: Colors.error, textAlign: 'center', marginBottom: Spacing.md },
  linkText:  { fontSize: Fonts.size.md, color: Colors.bordeaux, fontWeight: '600' },

  // Header navigation
  header: {
    backgroundColor:   Colors.bordeaux,
    paddingTop:        Platform.OS === 'ios' ? 60 : Spacing.xl,
    paddingBottom:     Spacing.md,
    paddingHorizontal: Spacing.md,
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
  },
  backBtn:     { padding: Spacing.xs },
  shareBtn:    { padding: Spacing.xs },
  headerTitle: {
    fontSize:   Fonts.size.md,
    fontWeight: '700',
    color:      Colors.white,
    textAlign:  'center',
    flex:       1,
  },

  scrollContent: { padding: Spacing.md, paddingBottom: Spacing.xl * 2 },

  // ── Carte document ──
  document: {
    backgroundColor: Colors.white,
    borderRadius:    Radius.md,
    borderWidth:     1,
    borderColor:     Colors.border,
    overflow:        'hidden',
    marginBottom:    Spacing.lg,
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 2 },
    shadowOpacity:   0.08,
    shadowRadius:    8,
    elevation:       3,
  },

  // En-tête document bordeaux
  docHeader: {
    backgroundColor: Colors.bordeaux,
    padding:         Spacing.lg,
    flexDirection:   'row',
    justifyContent:  'space-between',
    alignItems:      'flex-start',
  },
  docHeaderLeft: { flex: 1 },
  docTitle: {
    fontSize:      26,
    fontWeight:    '900',
    color:         Colors.white,
    letterSpacing: 1,
  },
  docInvoiceNumber: {
    fontSize:   Fonts.size.sm,
    color:      'rgba(255,255,255,0.85)',
    marginTop:  Spacing.sm,
    fontWeight: '500',
  },
  docDate: {
    fontSize:  Fonts.size.sm,
    color:     'rgba(255,255,255,0.70)',
    marginTop: 4,
  },
  docLogoContainer: {
    marginLeft:     Spacing.md,
    justifyContent: 'center',
    alignItems:     'center',
  },
  docLogoCircle: {
    width:           60,
    height:          60,
    borderRadius:    30,
    backgroundColor: Colors.white,
    justifyContent:  'center',
    alignItems:      'center',
  },
  docLogoImage: {
    width:      38,
    height:     38,
    resizeMode: 'contain',
  },

  divider: {
    height:           1,
    backgroundColor:  Colors.border,
    marginHorizontal: Spacing.md,
  },

  // Blocs identités
  identityRow: {
    flexDirection: 'row',
    padding:       Spacing.md,
    gap:           Spacing.md,
  },
  identityBlock:   { flex: 1 },
  identityDivider: { width: 1, backgroundColor: Colors.border },
  identityLabel: {
    fontSize:     Fonts.size.xs,
    fontWeight:   '700',
    color:        Colors.bordeaux,
    marginBottom: Spacing.xs,
  },
  identityName: {
    fontSize:     Fonts.size.sm,
    fontWeight:   '700',
    color:        Colors.textPrimary,
    marginBottom: 3,
  },
  identityDetail: {
    fontSize:   Fonts.size.xs,
    color:      Colors.textSecondary,
    lineHeight: 18,
  },

  // Objet
  objetRow: {
    paddingHorizontal: Spacing.md,
    paddingVertical:   Spacing.sm,
  },
  objetText: {
    fontSize:   Fonts.size.sm,
    fontWeight: '700',
    color:      Colors.bordeaux,
  },

  // Trajet
  tripSection: {
    padding: Spacing.md,
    gap:     Spacing.sm,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems:    'flex-start',
    gap:           Spacing.sm,
  },
  pinDot: {
    width:        10,
    height:       10,
    borderRadius: 5,
    marginTop:    4,
    flexShrink:   0,
  },
  pinDotBordeaux: { backgroundColor: Colors.bordeaux },
  pinDotGray:     { backgroundColor: Colors.textMuted },
  addressContent: { flex: 1 },
  addressLabel: {
    fontSize:     Fonts.size.xs,
    color:        Colors.textMuted,
    marginBottom: 2,
  },
  addressText: {
    fontSize:   Fonts.size.sm,
    color:      Colors.textPrimary,
    fontWeight: '600',
    lineHeight: 18,
  },
  tripMetaRow: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           Spacing.lg,
    marginTop:     Spacing.xs,
  },
  tripMetaItem: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           4,
  },
  tripMetaText: {
    fontSize:   Fonts.size.sm,
    color:      Colors.textSecondary,
    fontWeight: '500',
    flexShrink: 1,
  },

  // Tableau des prestations
  tableSection: {
    marginHorizontal: Spacing.md,
    marginTop:        Spacing.md,
    borderRadius:     Radius.sm,
    overflow:         'hidden',
    borderWidth:      1,
    borderColor:      Colors.border,
  },
  tableHeader: {
    flexDirection:   'row',
    backgroundColor: Colors.bordeaux,
    paddingVertical: 10,
  },
  tableHeaderCell: {
    fontSize:   Fonts.size.xs,
    fontWeight: '700',
    color:      Colors.white,
    paddingHorizontal: Spacing.sm,
  },
  tableRow: {
    flexDirection:     'row',
    backgroundColor:   Colors.white,
    paddingVertical:   10,
    borderTopWidth:    1,
    borderTopColor:    Colors.border,
  },
  tableCell: {
    fontSize:          Fonts.size.xs,
    color:             Colors.textPrimary,
    paddingHorizontal: Spacing.sm,
    lineHeight:        18,
  },
  cellDesig: { flex: 3 },
  cellQty:   { flex: 1, textAlign: 'center' },
  cellAmt:   { flex: 2, textAlign: 'right' },

  // Totaux
  totalsSection: {
    padding:  Spacing.md,
    paddingTop: Spacing.sm,
  },
  totalRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    paddingVertical: 6,
  },
  totalLabel: {
    fontSize: Fonts.size.sm,
    color:    Colors.textSecondary,
  },
  totalValue: {
    fontSize:   Fonts.size.sm,
    fontWeight: '600',
    color:      Colors.textPrimary,
  },
  totalTtcBox: {
    flexDirection:     'row',
    justifyContent:    'space-between',
    alignItems:        'center',
    backgroundColor:   Colors.bordeaux,
    borderRadius:      Radius.sm,
    paddingVertical:   14,
    paddingHorizontal: Spacing.md,
    marginTop:         Spacing.sm,
  },
  totalTtcLabel: {
    fontSize:   Fonts.size.md,
    fontWeight: '700',
    color:      Colors.white,
  },
  totalTtcValue: {
    fontSize:   Fonts.size.lg,
    fontWeight: '800',
    color:      Colors.white,
  },

  // Paiement (fond gris)
  paymentBox: {
    margin:          Spacing.md,
    padding:         Spacing.md,
    backgroundColor: '#F2F2F2',
    borderRadius:    Radius.sm,
  },
  paymentMention: {
    fontSize:     Fonts.size.xs,
    color:        Colors.textMuted,
    fontStyle:    'italic',
    marginBottom: Spacing.xs,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           4,
  },
  paymentLabel: {
    fontSize:   Fonts.size.sm,
    color:      Colors.textSecondary,
    fontWeight: '600',
  },
  paymentValue: {
    fontSize: Fonts.size.sm,
    color:    Colors.textPrimary,
  },

  // Pied légal
  legalFooter: {
    marginHorizontal: Spacing.md,
    marginBottom:     Spacing.md,
    paddingTop:       Spacing.sm,
    borderTopWidth:   1,
    borderTopColor:   Colors.border,
  },
  legalText: {
    fontSize:   Fonts.size.xs,
    color:      Colors.textMuted,
    lineHeight: 16,
  },

  // Badge ajustement
  adjustedBanner: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               Spacing.xs,
    backgroundColor:   Colors.warningLight,
    paddingHorizontal: Spacing.md,
    paddingVertical:   Spacing.xs,
    marginHorizontal:  Spacing.md,
    borderRadius:      Radius.sm,
    marginBottom:      Spacing.sm,
  },
  adjustedBannerText: {
    fontSize:   Fonts.size.xs,
    color:      Colors.warning,
    fontWeight: '600',
  },

  // Section ajustements
  adjSection: { padding: Spacing.md },
  adjSectionTitle: {
    fontSize:     Fonts.size.sm,
    fontWeight:   '700',
    color:        Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  adjItem: {
    padding:         Spacing.sm,
    borderRadius:    Radius.sm,
    backgroundColor: '#FFFBF0',
    borderWidth:     1,
    borderColor:     '#FFE0A0',
    marginBottom:    Spacing.xs,
  },
  adjDate: {
    fontSize:     Fonts.size.xs,
    color:        Colors.textMuted,
    marginBottom: 2,
  },
  adjDetail: {
    fontSize:   Fonts.size.sm,
    color:      Colors.textPrimary,
    fontWeight: '500',
  },
  adjReason: {
    fontSize:   Fonts.size.xs,
    color:      Colors.textSecondary,
    fontStyle:  'italic',
    marginTop:  2,
  },

  // Bouton PDF
  pdfBtn: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    gap:             Spacing.sm,
    backgroundColor: Colors.bordeaux,
    paddingVertical: 16,
    borderRadius:    Radius.md,
    shadowColor:     Colors.bordeaux,
    shadowOffset:    { width: 0, height: 4 },
    shadowOpacity:   0.3,
    shadowRadius:    8,
    elevation:       5,
  },
  pdfBtnText: {
    fontSize:   Fonts.size.md,
    fontWeight: '700',
    color:      Colors.white,
  },
});
