// screens/client/MyReservationsScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, RefreshControl, ActivityIndicator,
  Platform, Alert,
} from 'react-native';
import { Ionicons }       from '@expo/vector-icons';
import { Colors, Fonts, Spacing, Radius } from '../../theme/colors';
import { useAuthStore }   from '../../store/auth.store';
import { useReservationStore } from '../../store/reservation.store';
import type { BottomTabScreenProps }  from '@react-navigation/bottom-tabs';
import type { ClientTabParamList }    from '../../types/auth.types';
import type { Reservation, ReservationStatus } from '../../types/reservation.types';
import { RESERVATION_STATUS_LABELS, RESERVATION_STATUS_COLORS } from '../../types/reservation.types';

type Props = BottomTabScreenProps<ClientTabParamList, 'MyReservations'>;

// ── Filtres ─────────────────────────────────────────────────────────────────
type FilterTab = 'all' | ReservationStatus;

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all',        label: 'Toutes'    },
  { key: 'pending',    label: 'En attente' },
  { key: 'assigned',   label: 'Attribuées' },
  { key: 'in_progress',label: 'En cours'  },
  { key: 'completed',  label: 'Terminées' },
  { key: 'cancelled',  label: 'Annulées'  },
];

// ── Card réservation ─────────────────────────────────────────────────────────
function ReservationCard({
  item,
  onPress,
  onCancel,
}: {
  item: Reservation;
  onPress: () => void;
  onCancel: () => void;
}) {
  const scheduled = new Date(item.scheduled_at);
  const dateStr = scheduled.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  const timeStr = scheduled.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const statusColor = RESERVATION_STATUS_COLORS[item.status];
  const canCancel = item.status === 'pending' || item.status === 'assigned';

  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.8}>
      {/* En-tête : ref + status */}
      <View style={s.cardTop}>
        <Text style={s.cardRef}>{item.ref_number}</Text>
        <View style={[s.statusBadge, { backgroundColor: statusColor + '22' }]}>
          <View style={[s.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[s.statusText, { color: statusColor }]}>
            {RESERVATION_STATUS_LABELS[item.status]}
          </Text>
        </View>
      </View>

      {/* Trajet */}
      <View style={s.routeBlock}>
        <View style={s.routeRow}>
          <View style={[s.dot, { backgroundColor: '#10B981' }]} />
          <Text style={s.routeText} numberOfLines={1}>{item.origin_address}</Text>
        </View>
        <View style={s.connector} />
        <View style={s.routeRow}>
          <View style={[s.dot, { backgroundColor: Colors.bordeaux }]} />
          <Text style={s.routeText} numberOfLines={1}>{item.destination_address}</Text>
        </View>
      </View>

      {/* Méta */}
      <View style={s.cardMeta}>
        <View style={s.metaItem}>
          <Ionicons name="calendar-outline" size={13} color={Colors.textMuted} />
          <Text style={s.metaText}>{dateStr} · {timeStr}</Text>
        </View>
        {item.estimated_price != null && (
          <Text style={s.price}>
            {item.estimated_price.toFixed(2)} {item.currency ?? '€'}
          </Text>
        )}
      </View>

      {/* Bouton annuler */}
      {canCancel && (
        <TouchableOpacity style={s.cancelBtn} onPress={onCancel}>
          <Text style={s.cancelBtnText}>Annuler</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

// ── Screen ───────────────────────────────────────────────────────────────────
export default function MyReservationsScreen({ navigation }: Props) {
  const token = useAuthStore(s => s.accessToken) ?? '';
  const { reservations, isLoading, fetchMine, cancel } = useReservationStore();

  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [refreshing,   setRefreshing]   = useState(false);

  const load = useCallback(async () => {
    try {
      await fetchMine(token, {
        status: activeFilter === 'all' ? undefined : activeFilter,
        limit: 50,
      });
    } catch { /* error already in store */ }
  }, [token, activeFilter, fetchMine]);

  useEffect(() => { load(); }, [load]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleCancel = (id: string, ref: string) => {
    Alert.alert(
      'Annuler la réservation',
      `Voulez-vous annuler la course ${ref} ?`,
      [
        { text: 'Non',  style: 'cancel' },
        {
          text: 'Oui, annuler',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancel(token, id);
            } catch (e: any) {
              Alert.alert('Erreur', e?.message ?? "Impossible d'annuler");
            }
          },
        },
      ],
    );
  };

  const filtered = activeFilter === 'all'
    ? reservations
    : reservations.filter(r => r.status === activeFilter);

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>Mes réservations</Text>
      </View>

      {/* Filtres */}
      <FlatList
        horizontal
        data={FILTER_TABS}
        keyExtractor={t => t.key}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.filterBar}
        renderItem={({ item: tab }) => {
          const active = tab.key === activeFilter;
          return (
            <TouchableOpacity
              style={[s.filterChip, active && s.filterChipActive]}
              onPress={() => setActiveFilter(tab.key)}
            >
              <Text style={[s.filterChipText, active && s.filterChipTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      {/* Liste */}
      {isLoading && !refreshing ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={Colors.bordeaux} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={r => r.id}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[Colors.bordeaux]}
              tintColor={Colors.bordeaux}
            />
          }
          ListEmptyComponent={
            <View style={s.empty}>
              <Ionicons name="car-outline" size={48} color={Colors.textMuted} />
              <Text style={s.emptyTitle}>Aucune réservation</Text>
              <Text style={s.emptySub}>
                {activeFilter === 'all'
                  ? 'Vous n\'avez pas encore de réservation.'
                  : `Aucune réservation avec le statut "${RESERVATION_STATUS_LABELS[activeFilter as ReservationStatus]}".`}
              </Text>
              <TouchableOpacity
                style={s.newBtn}
                onPress={() => navigation.navigate('CreateReservation')}
              >
                <Ionicons name="add-circle-outline" size={18} color={Colors.white} />
                <Text style={s.newBtnText}>Nouvelle réservation</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => (
            <ReservationCard
              item={item}
              onPress={() => navigation.navigate('ReservationDetails', { reservationId: item.id })}
              onCancel={() => handleCancel(item.id, item.ref_number)}
            />
          )}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // Header
  header: {
    paddingTop:        Platform.OS === 'ios' ? 56 : Spacing.xl,
    paddingHorizontal: Spacing.lg,
    paddingBottom:     Spacing.md,
    backgroundColor:   Colors.bordeaux,
    borderBottomLeftRadius:  Radius.xl,
    borderBottomRightRadius: Radius.xl,
  },
  headerTitle: { fontSize: Fonts.size.xl, fontWeight: '800', color: Colors.white },

  // Filtres
  filterBar: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, gap: Spacing.xs },
  filterChip: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  filterChipActive: {
    backgroundColor: Colors.bordeaux,
    borderColor: Colors.bordeaux,
  },
  filterChipText:       { fontSize: Fonts.size.sm, fontWeight: '600', color: Colors.textMuted },
  filterChipTextActive: { color: Colors.white },

  // Liste
  listContent: { padding: Spacing.md, paddingBottom: Spacing.xxl },

  // Card
  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, marginBottom: Spacing.md,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
  cardTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: Spacing.sm,
  },
  cardRef:   { fontSize: Fonts.size.sm, fontWeight: '700', color: Colors.bordeaux },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 3,
  },
  statusDot:  { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: Fonts.size.xs, fontWeight: '600' },

  // Trajet
  routeBlock: { marginBottom: Spacing.sm },
  routeRow:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  dot:        { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  connector:  { width: 1, height: 10, backgroundColor: Colors.border, marginLeft: 3.5, marginVertical: 2 },
  routeText:  { flex: 1, fontSize: Fonts.size.sm, color: Colors.textPrimary, fontWeight: '500' },

  // Meta
  cardMeta: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border,
  },
  metaItem:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText:  { fontSize: Fonts.size.xs, color: Colors.textMuted },
  price:     { fontSize: Fonts.size.md, fontWeight: '700', color: Colors.textPrimary },

  // Annuler
  cancelBtn: {
    marginTop: Spacing.sm, paddingVertical: Spacing.xs,
    borderRadius: Radius.md, borderWidth: 1, borderColor: '#EF4444',
    alignItems: 'center',
  },
  cancelBtnText: { fontSize: Fonts.size.sm, fontWeight: '600', color: '#EF4444' },

  // États
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty:  {
    alignItems: 'center', justifyContent: 'center',
    paddingTop: Spacing.xxl * 2, gap: Spacing.sm,
  },
  emptyTitle: { fontSize: Fonts.size.lg, fontWeight: '700', color: Colors.textPrimary },
  emptySub:   { fontSize: Fonts.size.sm, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },
  newBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    backgroundColor: Colors.bordeaux, borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    marginTop: Spacing.md,
  },
  newBtnText: { color: Colors.white, fontSize: Fonts.size.md, fontWeight: '700' },
});
