// ══════════════════════════════════════════════════════════════════════════════
// SCREEN — Mes évaluations (Driver)
// Sprint 6 — EasyVTC
// Permet au chauffeur de consulter toutes les notes reçues et sa moyenne.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors, Fonts, Spacing, Radius } from '../../theme/colors';
import { useAuthStore }    from '../../store/auth.store';
import { useRatingsStore } from '../../store/ratings.store';
import { useNotifications } from '../../hooks/useNotifications';
import { AppHeader } from '../../components/common/AppHeader';
import type { RatingWithClient } from '../../types/ratings.types';

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function StarRow({ note }: { note: number }) {
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map(i => (
        <Ionicons
          key={i}
          name={i <= note ? 'star' : 'star-outline'}
          size={14}
          color={i <= note ? '#F59E0B' : Colors.border}
        />
      ))}
    </View>
  );
}

// ── Carte d'une évaluation ────────────────────────────────────────────────────
function RatingCard({ rating }: { rating: RatingWithClient }) {
  const clientName = [rating.client_first_name, rating.client_last_name]
    .filter(Boolean).join(' ') || 'Client anonyme';

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(rating.client_first_name?.[0] ?? '?').toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.clientName}>{clientName}</Text>
          <Text style={styles.dateText}>{formatDate(rating.reservation_scheduled_at ?? rating.created_at)}</Text>
        </View>
        <View style={styles.noteBadge}>
          <Ionicons name="star" size={12} color="#F59E0B" />
          <Text style={styles.noteText}>{rating.note}/5</Text>
        </View>
      </View>
      <StarRow note={rating.note} />
    </View>
  );
}

// ── Résumé en tête ────────────────────────────────────────────────────────────
function AvgHeader({ avg, total }: { avg: number | null; total: number }) {
  return (
    <View style={styles.avgCard}>
      <View style={styles.avgLeft}>
        <Text style={styles.avgNumber}>{avg != null ? avg.toFixed(1) : '—'}</Text>
        <View style={styles.avgStars}>
          {[1, 2, 3, 4, 5].map(i => (
            <Ionicons
              key={i}
              name={avg != null && i <= Math.round(avg) ? 'star' : 'star-outline'}
              size={20}
              color={avg != null && i <= Math.round(avg) ? '#F59E0B' : Colors.border}
            />
          ))}
        </View>
        <Text style={styles.avgSub}>{total} évaluation{total !== 1 ? 's' : ''}</Text>
      </View>
      <View style={styles.avgDivider} />
      <View style={styles.avgRight}>
        <Ionicons name="ribbon-outline" size={32} color={Colors.beige} style={{ marginBottom: 6 }} />
        <Text style={styles.avgRightLabel}>Votre note{'\n'}moyenne</Text>
      </View>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ÉCRAN PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════════
export default function DriverReviewScreen() {
  const navigation = useNavigation();
  const { unreadCount } = useNotifications();
  const accessToken    = useAuthStore(s => s.accessToken);
  const myRatings      = useRatingsStore(s => s.myRatings);
  const myAvgNote      = useRatingsStore(s => s.myAvgNote);
  const myTotal        = useRatingsStore(s => s.myTotal);
  const myPage         = useRatingsStore(s => s.myPage);
  const myTotalPages   = useRatingsStore(s => s.myTotalPages);
  const isLoading      = useRatingsStore(s => s.isLoading);
  const fetchMyRatings = useRatingsStore(s => s.fetchMyRatings);

  const load = useCallback(async (page = 1) => {
    if (!accessToken) return;
    try { await fetchMyRatings(accessToken, page); } catch { /* géré dans le store */ }
  }, [accessToken, fetchMyRatings]);

  useEffect(() => { load(1); }, [load]);

  const handleLoadMore = () => {
    if (!isLoading && myPage < myTotalPages) load(myPage + 1);
  };

  const renderItem = ({ item }: { item: RatingWithClient }) => (
    <RatingCard rating={item} />
  );

  const renderEmpty = () => {
    if (isLoading) return null;
    return (
      <View style={styles.emptyState}>
        <Ionicons name="star-outline" size={48} color={Colors.border} />
        <Text style={styles.emptyTitle}>Aucune évaluation</Text>
        <Text style={styles.emptyText}>Les clients peuvent noter vos courses{'\n'}une fois celles-ci terminées.</Text>
      </View>
    );
  };

  const renderFooter = () => {
    if (!isLoading || myRatings.length === 0) return null;
    return (
      <ActivityIndicator size="small" color={Colors.bordeaux} style={{ marginVertical: Spacing.md }} />
    );
  };

  return (
    <View style={styles.root}>
      <AppHeader
        left="menu"
        title="Mes évaluations"
        rightIcon={{
          name: 'notifications-outline',
          onPress: () => navigation.navigate('DriverNotificationList' as never),
          badge: unreadCount,
        }}
      />

      {isLoading && myRatings.length === 0 ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={Colors.bordeaux} />
        </View>
      ) : (
        <FlatList
          data={myRatings}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          ListHeaderComponent={<AvgHeader avg={myAvgNote} total={myTotal} />}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          refreshControl={
            <RefreshControl
              refreshing={isLoading && myPage === 1}
              onRefresh={() => load(1)}
              tintColor={Colors.bordeaux}
            />
          }
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// STYLES
// ══════════════════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },

  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  list: { padding: Spacing.md, paddingBottom: Spacing.xxl },

  // ── Carte résumé ──────────────────────────────────────────────────────────
  avgCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  avgLeft:   { flex: 1, alignItems: 'center' },
  avgNumber: { fontSize: 52, fontFamily: Fonts.bold, fontWeight: '900', color: Colors.bordeaux, lineHeight: 58 },
  avgStars:  { flexDirection: 'row', gap: 3, marginVertical: Spacing.xs },
  avgSub:    { fontSize: Fonts.size.sm, color: Colors.textMuted, marginTop: 2 },
  avgDivider: { width: 1, height: 80, backgroundColor: Colors.border, marginHorizontal: Spacing.lg },
  avgRight:  { flex: 1, alignItems: 'center' },
  avgRightLabel: { fontSize: Fonts.size.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 18 },

  // ── Carte évaluation ──────────────────────────────────────────────────────
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardTop:    { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.xs },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.bordeaux,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText:  { color: Colors.white, fontSize: Fonts.size.md, fontFamily: Fonts.bold, fontWeight: '700' },
  clientName:  { fontSize: Fonts.size.sm, fontFamily: Fonts.bold, fontWeight: '700', color: Colors.textPrimary },
  dateText:    { fontSize: Fonts.size.xs, color: Colors.textMuted, marginTop: 2 },
  noteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  noteText: { fontSize: Fonts.size.xs, fontFamily: Fonts.bold, fontWeight: '700', color: '#92400E' },
  starRow:  { flexDirection: 'row', gap: 3 },

  // ── État vide ─────────────────────────────────────────────────────────────
  emptyState: { alignItems: 'center', paddingTop: Spacing.xxl },
  emptyTitle: { fontSize: Fonts.size.lg, fontFamily: Fonts.bold, fontWeight: '700', color: Colors.textSecondary, marginTop: Spacing.md },
  emptyText:  { fontSize: Fonts.size.sm, color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.sm, lineHeight: 20 },
});
