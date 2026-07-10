// ══════════════════════════════════════════════════════════════════════════════
// SCREEN — DriverOrderDetailsScreen
// Sprint 4 — EasyVTC
// Affiche le détail d'un bon de commande (vue chauffeur) avec rendu fidèle
// au document et possibilité de télécharger / partager le PDF.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
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
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, Radius } from '../../../theme/colors';
import { useOrdersStore } from '../../../store/orders.store';
import { useAuthStore } from '../../../store/auth.store';
import { ordersApi } from '../../../services/api/orders.api';
import { useToast } from '../../../hooks/useToast';
import type { DriverOrdersStackParamList } from '../../../types/auth.types';
import { Logo } from '../../../constants/logo';
import { AppHeader } from '../../../components/common/AppHeader';

type DetailsNavRoute = RouteProp<DriverOrdersStackParamList, 'DriverOrderDetails'>;
type DetailsNavProp  = NavigationProp<DriverOrdersStackParamList, 'DriverOrderDetails'>;

function fmtDate(iso: string, long = false): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: long ? 'long' : 'short',
    year: 'numeric',
  });
}

function fmtDateLong(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function fmtPrice(amount: number, currency: string): string {
  return `${amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} ${currency}`;
}

const vehicleLabel: Record<string, string> = {
  standard: 'Standard',
  berline: 'Berline',
  van: 'Van',
};

export default function DriverOrderDetailsScreen() {
  const navigation = useNavigation<DetailsNavProp>();
  const route      = useRoute<DetailsNavRoute>();
  const { orderId } = route.params;

  const token                                      = useAuthStore(s => s.accessToken) ?? '';
  const { orders, fetchDriverMine, isLoading }     = useOrdersStore();
  const order                                      = orders.find(o => o.id === orderId);

  const { showToast } = useToast();
  const [openingPdf, setOpeningPdf] = useState(false);

  useEffect(() => {
    if (!order) fetchDriverMine(token);
  }, [order, fetchDriverMine, token]);

  const handleOpenPdf = async () => {
    setOpeningPdf(true);
    try {
      const res = await ordersApi.fetchPdfUrl(token, order!.id);
      if (!res.ok || !res.data?.url) throw new Error(res.message ?? 'URL indisponible');
      await Linking.openURL(res.data.url);
    } catch {
      showToast({ type: 'error', title: 'Erreur', message: 'Impossible d\'ouvrir le document PDF.' });
    } finally {
      setOpeningPdf(false);
    }
  };

  const handleShare = async () => {
    if (!order) return;
    try {
      const res = await ordersApi.fetchPdfUrl(token, order.id);
      const pdfUrl = res.ok && res.data?.url ? res.data.url : null;
      await Share.share({
        title: `Bon de commande ${order.order_number}`,
        message: pdfUrl
          ? `Bon de commande EasyVTC — ${order.order_number}\n${pdfUrl}`
          : `Bon de commande EasyVTC — ${order.order_number}`,
        url: pdfUrl ?? undefined,
      });
    } catch {
      // Annulation silencieuse
    }
  };

  if (isLoading && !order) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.bordeaux} />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Bon de commande introuvable.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.linkText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const snap      = order.trip_snapshot;
  const passenger = order.passenger_snapshot;
  const driver    = order.driver_snapshot;
  const isFlatRate = snap.pricing_type === 'flat_rate';
  const isPerKm   = snap.pricing_type === 'formula';

  return (
    <View style={styles.container}>
      {/* ── Header barre de navigation ── */}
      <AppHeader
        left="back"
        title="Bon de commande"
        rightIcon={{ name: 'share-social-outline', onPress: handleShare }}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* ══════════════════════════════════════════════════════════════════════
            DOCUMENT — BON DE COMMANDE
        ══════════════════════════════════════════════════════════════════════ */}
        <View style={styles.document}>

          {/* ── En-tête du document ── */}
          <View style={styles.docHeader}>
            <View style={styles.docHeaderLeft}>
              <Text style={styles.docTitle}>BON DE{'\n'}COMMANDE</Text>
              <Text style={styles.docOrderNumber}>n° {order.order_number}</Text>
              <Text style={styles.docDate}>Date : {fmtDateLong(order.created_at)}</Text>
            </View>
            <View style={styles.docLogoContainer}>
              <View style={styles.docLogoFallback}>
                <Image source={Logo.LogoVTCMarron} style={styles.docLogoImage} />
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          {/* ── Bloc Client ── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Client</Text>
            <Text style={styles.clientName}>
              {passenger.first_name} {passenger.last_name}
            </Text>
            {snap.pickup_address ? (
              <Text style={styles.clientInfo}>{snap.pickup_address}</Text>
            ) : null}
            {passenger.phone ? (
              <Text style={styles.clientInfo}>{passenger.phone}</Text>
            ) : null}
          </View>

          <View style={styles.divider} />

          {/* ── Objet ── */}
          <View style={styles.section}>
            <Text style={styles.objetLabel}>
              OBJET : Transport avec chauffeur
            </Text>
            <Text style={styles.objetDetail}>
              Désignation Transport de voyageurs{'\n'}
              Date : {fmtDateLong(snap.scheduled_at)}
            </Text>
          </View>

          {/* ── Détails trajet ── */}
          <View style={styles.tripBlock}>
            <View style={styles.tripRow}>
              <View style={styles.tripIconCol}>
                <Ionicons name="location" size={18} color={Colors.bordeaux} />
              </View>
              <View style={styles.tripTextCol}>
                <Text style={styles.tripAddressLabel}>Lieu de prise en charge</Text>
                <Text style={styles.tripAddress}>{snap.pickup_address}</Text>
              </View>
            </View>

            <View style={styles.tripRow}>
              <View style={styles.tripIconCol}>
                <Ionicons name="location-outline" size={18} color={Colors.textMuted} />
              </View>
              <View style={styles.tripTextCol}>
                <Text style={styles.tripAddressLabel}>Destination</Text>
                <Text style={styles.tripAddress}>{snap.dest_address}</Text>
              </View>
            </View>

            <View style={styles.tripMeta}>
              <View style={styles.tripMetaItem}>
                <Ionicons name="calendar-outline" size={14} color={Colors.textMuted} />
                <Text style={styles.tripMetaText}>{fmtDate(snap.scheduled_at, true)}</Text>
              </View>
              <View style={styles.tripMetaItem}>
                <Ionicons name="time-outline" size={14} color={Colors.textMuted} />
                <Text style={styles.tripMetaText}>{fmtTime(snap.scheduled_at)}</Text>
              </View>
              <View style={styles.tripMetaItem}>
                <Ionicons name="car-outline" size={14} color={Colors.textMuted} />
                <Text style={styles.tripMetaText}>
                  {vehicleLabel[snap.vehicle_type] ?? snap.vehicle_type}
                </Text>
              </View>
            </View>

            {snap.nb_passengers > 0 && (
              <View style={styles.tripMeta}>
                <View style={styles.tripMetaItem}>
                  <Ionicons name="people-outline" size={14} color={Colors.textMuted} />
                  <Text style={styles.tripMetaText}>
                    {snap.nb_passengers} passager{snap.nb_passengers > 1 ? 's' : ''}
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.driverRow}>
              <Ionicons name="person-circle-outline" size={14} color={Colors.textMuted} />
              <Text style={styles.driverText}>
                Chauffeur : {driver.first_name} {driver.last_name}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* ── Tableau de tarification ── */}
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Désignation</Text>
              <Text style={[styles.tableHeaderCell, styles.tableHeaderCellCenter]}>
                Quantité
              </Text>
              <Text style={[styles.tableHeaderCell, styles.tableHeaderCellRight]}>
                Montant TTC
              </Text>
            </View>

            {/* Ligne principale — toujours affichée ; le montant ne l'est que pour un forfait (CDC p.26) */}
            <View style={styles.tableRow}>
              <View style={{ flex: 2 }}>
                <Text style={styles.tableCell}>Transport de voyageurs</Text>
                <Text style={styles.tableCellSub}>De : {snap.pickup_address}</Text>
                <Text style={styles.tableCellSub}>À : {snap.dest_address}</Text>
              </View>

              <View style={styles.tableCellCenterCol}>
                {isPerKm && snap.distance_km != null ? (
                  <Text style={styles.tableCell}>{snap.distance_km} km</Text>
                ) : isFlatRate ? (
                  <Text style={styles.tableCell}>1</Text>
                ) : (
                  <Text style={styles.tableCell}>—</Text>
                )}
              </View>

              <View style={styles.tableCellRightCol}>
                {snap.final_price != null ? (
                  <Text style={styles.tableCellPrice}>
                    {fmtPrice(snap.final_price, snap.currency)}
                  </Text>
                ) : (
                  <Text style={styles.tableCellPriceNote}>Selon compteur</Text>
                )}
              </View>
            </View>

            <View style={styles.tableTotal}>
              <Text style={styles.tableTotalLabel}>Total TTC</Text>
              {snap.final_price != null ? (
                <Text style={styles.tableTotalValue}>
                  {fmtPrice(snap.final_price, snap.currency)}
                </Text>
              ) : (
                <Text style={styles.tableTotalNote}>Calculé après la course</Text>
              )}
            </View>
          </View>

          {/* ── Note de bas de document ── */}
          <View style={styles.docFooterNote}>
            <Text style={styles.docFooterNoteText}>
              Ce bon de commande confirme votre mission. La facture sera générée après la course.
            </Text>
          </View>

        </View>

        {/* ── Bouton télécharger ── */}
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

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: Colors.background },
  centered:    { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.lg },
  errorText:   { fontSize: Fonts.size.md, color: Colors.error, textAlign: 'center', marginBottom: Spacing.md },
  linkText:    { fontSize: Fonts.size.md, color: Colors.bordeaux, fontFamily: Fonts.semibold, fontWeight: '600' },

  scrollContent: { padding: Spacing.md, paddingBottom: Spacing.xl * 2 },

  document: {
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },

  docHeader: {
    backgroundColor: Colors.bordeaux,
    padding: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  docHeaderLeft: { flex: 1 },
  docTitle: {
    fontSize: 24,
    fontFamily: Fonts.bold, fontWeight: '900',
    color: Colors.white,
    lineHeight: 28,
    letterSpacing: 0.5,
  },
  docOrderNumber: {
    fontSize: Fonts.size.sm,
    color: 'rgba(255,255,255,0.85)',
    marginTop: Spacing.md,
    fontFamily: Fonts.medium, fontWeight: '500',
  },
  docDate: {
    fontSize: Fonts.size.sm,
    color: 'rgba(255,255,255,0.75)',
    marginTop: Spacing.md / 2,
  },
  docLogoContainer: { marginLeft: Spacing.md, justifyContent: 'center', alignItems: 'center' },
  docLogoFallback: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  docLogoImage: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },

  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.md,
  },

  section: {
    padding: Spacing.md,
    paddingVertical: Spacing.md,
  },
  sectionLabel: {
    fontSize: Fonts.size.xs,
    fontFamily: Fonts.bold, fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing.xs,
  },
  clientName: {
    fontSize: Fonts.size.md,
    fontFamily: Fonts.bold, fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  clientInfo: {
    fontSize: Fonts.size.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },

  objetLabel: {
    fontSize: Fonts.size.sm,
    fontFamily: Fonts.bold, fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  objetDetail: {
    fontSize: Fonts.size.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },

  tripBlock: {
    padding: Spacing.md,
    gap: Spacing.sm,
    backgroundColor: '#FAFAFA',
  },
  tripRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  tripIconCol:      { width: 24, alignItems: 'center', paddingTop: 2 },
  tripTextCol:      { flex: 1 },
  tripAddressLabel: {
    fontSize: Fonts.size.xs,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  tripAddress: {
    fontSize: Fonts.size.sm,
    color: Colors.textPrimary,
    fontFamily: Fonts.medium, fontWeight: '500',
    lineHeight: 18,
  },
  tripMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.lg,
    marginTop: Spacing.xs,
  },
  tripMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tripMetaText: {
    fontSize: Fonts.size.sm,
    color: Colors.textSecondary,
    fontFamily: Fonts.medium, fontWeight: '500',
  },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  driverText: {
    fontSize: Fonts.size.xs,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },

  table: {
    margin: Spacing.md,
    borderRadius: Radius.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: Colors.bordeaux,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  tableHeaderCell: {
    fontSize: 8,
    fontFamily: Fonts.bold, fontWeight: '900',
    color: Colors.white,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flex: 1,
  },
  tableHeaderCellCenter: { textAlign: 'center' },
  tableHeaderCellRight:  { textAlign: 'right' },
  tableRow: {
    flexDirection: 'row',
    padding: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
    alignItems: 'flex-start',
  },
  tableCell: {
    fontSize: Fonts.size.sm,
    color: Colors.textPrimary,
    fontFamily: Fonts.medium, fontWeight: '500',
  },
  tableCellSub: {
    fontSize: Fonts.size.xs,
    color: Colors.textMuted,
    lineHeight: 16,
    marginTop: 2,
  },
  tableCellCenterCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 2,
  },
  tableCellRightCol: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    paddingTop: 2,
  },
  tableCellPrice: {
    fontSize: Fonts.size.sm,
    color: Colors.textPrimary,
    fontFamily: Fonts.semibold, fontWeight: '600',
  },
  tableCellPriceNote: {
    fontSize: Fonts.size.xs,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  tableTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  tableTotalLabel: {
    fontSize: Fonts.size.sm,
    fontFamily: Fonts.bold, fontWeight: '700',
    color: Colors.textPrimary,
  },
  tableTotalValue: {
    fontSize: Fonts.size.md,
    fontFamily: Fonts.bold, fontWeight: '800',
    color: Colors.bordeaux,
  },
  tableTotalNote: {
    fontSize: Fonts.size.xs,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },

  docFooterNote: {
    margin: Spacing.md,
    padding: Spacing.sm,
    backgroundColor: '#FFF8F8',
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: '#F0E0E0',
  },
  docFooterNoteText: {
    fontSize: Fonts.size.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
    fontStyle: 'italic',
  },

  pdfBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.bordeaux,
    paddingVertical: 16,
    borderRadius: Radius.md,
    shadowColor: Colors.bordeaux,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  pdfBtnText: {
    fontSize: Fonts.size.md,
    fontFamily: Fonts.bold, fontWeight: '700',
    color: Colors.white,
  },
});
