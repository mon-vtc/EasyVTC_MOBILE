// ══════════════════════════════════════════════════════════════════════════════
// SCREEN — Gestion des évaluations (Admin)
// Sprint 6 — EazyVTC
// Liste toutes les évaluations avec possibilité de suppression.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useCallback, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  TouchableOpacity, RefreshControl, Alert, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, Radius } from '../../theme/colors';
import { useAuthStore }    from '../../store/auth.store';
import { useRatingsStore } from '../../store/ratings.store';
import type { RatingAdmin } from '../../types/ratings.types';

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function StarRow({ note }: { note: number }) {
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map(i => (
        <Ionicons
          key={i}
          name={i <= note ? 'star' : 'star-outline'}
          size={12}
          color={i <= note ? '#F59E0B' : Colors.border}
        />
      ))}
    </View>
  );
}

// ── Carte d'une évaluation ────────────────────────────────────────────────────
function RatingCard({
  rating,
  onDelete,
  isDeleting,
}: {
  rating:     RatingAdmin;
  onDelete:   (id: string) => void;
  isDeleting: boolean;
}) {
  const clientName = [rating.client_first_name, rating.client_last_name]
    .filter(Boolean).join(' ') || 'Client inconnu';
  const driverName = [rating.driver_first_name, rating.driver_last_name]
    .filter(Boolean).join(' ') || 'Chauffeur inconnu';

  const handleDelete = () => {
    Alert.alert(
      'Supprimer l\'évaluation',
      `Êtes-vous sûr de vouloir supprimer cette évaluation de ${clientName} (${rating.note}/5) ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: () => onDelete(rating.id) },
      ],
    );
  };

  return (
    <View style={styles.card}>
      {/* Ligne principale */}
      <View style={styles.cardHeader}>
        <View style={styles.noteBadge}>
          <Ionicons name="star" size={13} color="#F59E0B" />
          <Text style={styles.noteText}>{rating.note}/5</Text>
        </View>
        <Text style={styles.dateText}>{formatDate(rating.created_at)}</Text>
        <TouchableOpacity
          onPress={handleDelete}
          disabled={isDeleting}
          style={styles.deleteBtn}
          activeOpacity={0.7}
        >
          {isDeleting ? (
            <ActivityIndicator size="small" color={Colors.error} />
          ) : (
            <Ionicons name="trash-outline" size={18} color={Colors.error} />
          )}
        </TouchableOpacity>
      </View>

      <StarRow note={rating.note} />

      {/* Participants */}
      <View style={styles.row}>
        <Ionicons name="person-outline" size={13} color={Colors.textMuted} />
        <Text style={styles.label}>Client :</Text>
        <Text style={styles.value}>{clientName}</Text>
      </View>
      <View style={styles.row}>
        <Ionicons name="car-outline" size={13} color={Colors.textMuted} />
        <Text style={styles.label}>Chauffeur :</Text>
        <Text style={styles.value}>{driverName}</Text>
      </View>
      {rating.reservation_scheduled_at && (
        <View style={styles.row}>
          <Ionicons name="calendar-outline" size={13} color={Colors.textMuted} />
          <Text style={styles.label}>Course du :</Text>
          <Text style={styles.value}>{formatDate(rating.reservation_scheduled_at)}</Text>
        </View>
      )}
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ÉCRAN PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════════
export default function AdminReviewsScreen() {
  const accessToken  = useAuthStore(s => s.accessToken);
  const allRatings   = useRatingsStore(s => s.allRatings);
  const allTotal     = useRatingsStore(s => s.allTotal);
  const allPage      = useRatingsStore(s => s.allPage);
  const allTotalPages = useRatingsStore(s => s.allTotalPages);
  const isLoading    = useRatingsStore(s => s.isLoading);
  const listAll      = useRatingsStore(s => s.listAll);
  const deleteRating = useRatingsStore(s => s.deleteRating);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async (page = 1) => {
    if (!accessToken) return;
    try { await listAll(accessToken, page); } catch { /* géré dans le store */ }
  }, [accessToken, listAll]);

  useEffect(() => { load(1); }, [load]);

  const handleLoadMore = () => {
    if (!isLoading && allPage < allTotalPages) load(allPage + 1);
  };

  const handleDelete = async (ratingId: string) => {
    if (!accessToken) return;
    setDeletingId(ratingId);
    try {
      await deleteRating(accessToken, ratingId);
    } catch (err: unknown) {
      Alert.alert('Erreur', err instanceof Error ? err.message : 'Impossible de supprimer cette évaluation');
    } finally {
      setDeletingId(null);
    }
  };

  const renderItem = ({ item }: { item: RatingAdmin }) => (
    <RatingCard
      rating={item}
      onDelete={handleDelete}
      isDeleting={deletingId === item.id}
    />
  );

  const renderEmpty = () => {
    if (isLoading) return null;
    return (
      <View style={styles.emptyState}>
        <Ionicons name="star-outline" size={48} color={Colors.border} />
        <Text style={styles.emptyTitle}>Aucune évaluation</Text>
        <Text style={styles.emptyText}>Les évaluations apparaîtront ici{'\n'}une fois soumises par les clients.</Text>
      </View>
    );
  };

  const renderFooter = () => {
    if (!isLoading || allRatings.length === 0) return null;
    return (
      <ActivityIndicator size="small" color={Colors.bordeaux} style={{ marginVertical: Spacing.md }} />
    );
  };

  return (
    <View style={styles.root}>
      {/* Bandeau en-tête */}
      <View style={styles.topBar}>
        <Text style={styles.topTitle}>Évaluations</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{allTotal}</Text>
        </View>
      </View>

      {isLoading && allRatings.length === 0 ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={Colors.bordeaux} />
        </View>
      ) : (
        <FlatList
          data={allRatings}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          refreshControl={
            <RefreshControl
              refreshing={isLoading && allPage === 1}
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

  topBar: {
    backgroundColor: Colors.bordeaux,
    paddingTop: Platform.OS === 'ios' ? 0 : Spacing.md,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  topTitle: { fontSize: Fonts.size.lg, fontWeight: '700', color: Colors.white, flex: 1 },
  countBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  countText: { fontSize: Fonts.size.sm, fontWeight: '700', color: Colors.white },

  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  list: { padding: Spacing.md, paddingBottom: Spacing.xxl },

  // ── Carte ─────────────────────────────────────────────────────────────────
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  noteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  noteText: { fontSize: Fonts.size.xs, fontWeight: '700', color: '#92400E' },
  dateText: { flex: 1, fontSize: Fonts.size.xs, color: Colors.textMuted },
  deleteBtn: { padding: Spacing.xs },

  starRow: { flexDirection: 'row', gap: 2, marginBottom: Spacing.sm },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  label: { fontSize: Fonts.size.xs, color: Colors.textMuted, width: 72 },
  value: { flex: 1, fontSize: Fonts.size.sm, fontWeight: '500', color: Colors.textPrimary },

  // ── État vide ─────────────────────────────────────────────────────────────
  emptyState: { alignItems: 'center', paddingTop: Spacing.xxl },
  emptyTitle: { fontSize: Fonts.size.lg, fontWeight: '700', color: Colors.textSecondary, marginTop: Spacing.md },
  emptyText:  { fontSize: Fonts.size.sm, color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.sm, lineHeight: 20 },
});
