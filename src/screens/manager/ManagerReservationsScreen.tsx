import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  TouchableOpacity, ActivityIndicator, Platform,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/auth.store';
import { usePermissions } from '../../hooks/usePermissions';
import { api } from '../../lib/api';
import { Colors, Spacing, Radius, Fonts } from '../../theme/colors';

interface Reservation {
  id:             string;
  status:         string;
  scheduled_at:   string;
  pickup_address: string;
  dest_address:   string;
  client_first_name?: string;
  client_last_name?:  string;
  driver_first_name?: string;
  driver_last_name?:  string;
}

const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  pending:    { label: 'En attente',    color: '#F57C00', bg: '#FFF3E0' },
  confirmed:  { label: 'Confirmée',     color: '#1976D2', bg: '#E3F2FD' },
  assigned:   { label: 'Attribuée',     color: '#7B1FA2', bg: '#F3E5F5' },
  in_progress:{ label: 'En cours',      color: '#388E3C', bg: '#E8F5E9' },
  completed:  { label: 'Terminée',      color: '#546E7A', bg: '#ECEFF1' },
  cancelled:  { label: 'Annulée',       color: '#C62828', bg: '#FFEBEE' },
};

export default function ManagerReservationsScreen() {
  const navigation  = useNavigation();
  const accessToken = useAuthStore(s => s.accessToken);
  const { hasPermission } = usePermissions();

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading,    setIsLoading]    = useState(true);
  const [error,        setError]        = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get<{ reservations: Reservation[]; total: number }>(
        '/reservations',
        accessToken ?? undefined,
      );
      if (res.ok && res.data) {
        setReservations(res.data.reservations ?? []);
      } else {
        setError(res.message ?? 'Erreur lors du chargement');
      }
    } catch {
      setError('Impossible de contacter le serveur');
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(React.useCallback(() => { load(); }, []));

  if (!hasPermission('view_reservations')) {
    return (
      <View style={styles.center}>
        <Ionicons name="lock-closed-outline" size={48} color={Colors.border} />
        <Text style={styles.permText}>Accès non autorisé</Text>
      </View>
    );
  }

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={Colors.bordeaux} /></View>;
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={40} color={Colors.error} />
        <Text style={styles.permText}>{error}</Text>
        <TouchableOpacity onPress={load} style={styles.retryBtn}>
          <Text style={styles.retryText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => (navigation as any).openDrawer()}>
          <Ionicons name="menu-outline" size={26} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Réservations</Text>
        <View style={styles.headerBtn} />
      </View>

      <FlatList
        data={reservations}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.center}>
            <Ionicons name="car-outline" size={48} color={Colors.border} />
            <Text style={styles.permText}>Aucune réservation</Text>
          </View>
        }
        renderItem={({ item }) => {
          const cfg = STATUS_CFG[item.status] ?? { label: item.status, color: Colors.textSecondary, bg: Colors.background };
          const date = new Date(item.scheduled_at).toLocaleDateString('fr-FR', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
          });
          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
                  <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
                </View>
                <Text style={styles.date}>{date}</Text>
              </View>

              <View style={styles.routeRow}>
                <Ionicons name="navigate-outline" size={14} color={Colors.bordeaux} />
                <Text style={styles.address} numberOfLines={1}>{item.pickup_address}</Text>
              </View>
              <View style={styles.routeRow}>
                <Ionicons name="location-outline" size={14} color={Colors.textSecondary} />
                <Text style={styles.address} numberOfLines={1}>{item.dest_address}</Text>
              </View>

              {(item.client_first_name || item.driver_first_name) && (
                <View style={styles.actorsRow}>
                  {item.client_first_name && (
                    <View style={styles.actor}>
                      <Ionicons name="person-outline" size={12} color={Colors.textMuted} />
                      <Text style={styles.actorText}>{item.client_first_name} {item.client_last_name}</Text>
                    </View>
                  )}
                  {item.driver_first_name && (
                    <View style={styles.actor}>
                      <Ionicons name="car-outline" size={12} color={Colors.textMuted} />
                      <Text style={styles.actorText}>{item.driver_first_name} {item.driver_last_name}</Text>
                    </View>
                  )}
                </View>
              )}

              {hasPermission('assign_reservation') && item.status === 'pending' && (
                <TouchableOpacity style={styles.assignBtn} activeOpacity={0.7}>
                  <Ionicons name="person-add-outline" size={14} color={Colors.white} />
                  <Text style={styles.assignText}>Attribuer un chauffeur</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center:    { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.md },
  permText:  { fontSize: Fonts.size.md, color: Colors.textMuted, textAlign: 'center' },

  header: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    backgroundColor:   Colors.bordeaux,
    paddingTop:        Platform.OS === 'ios' ? 56 : Spacing.xl + 8,
    paddingBottom:     Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  headerBtn:   { padding: Spacing.sm, width: 40 },
  headerTitle: { fontSize: Fonts.size.lg, fontWeight: '600', color: Colors.white },

  list:      { padding: Spacing.md, paddingBottom: Spacing.xl },

  card: {
    backgroundColor: Colors.white, borderRadius: Radius.md,
    padding: Spacing.md, marginBottom: Spacing.sm,
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4,
  },
  cardHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: Radius.full },
  statusText:  { fontSize: Fonts.size.xs, fontWeight: '700' },
  date:        { fontSize: Fonts.size.xs, color: Colors.textMuted },

  routeRow:   { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  address:    { flex: 1, fontSize: Fonts.size.sm, color: Colors.textPrimary },

  actorsRow:  { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.sm, flexWrap: 'wrap' },
  actor:      { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actorText:  { fontSize: Fonts.size.xs, color: Colors.textMuted },

  assignBtn: {
    marginTop: Spacing.sm,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: Colors.bordeaux, borderRadius: Radius.md,
    paddingVertical: Spacing.sm,
  },
  assignText: { fontSize: Fonts.size.sm, fontWeight: '600', color: Colors.white },

  retryBtn:  { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: Radius.md, backgroundColor: Colors.bordeaux },
  retryText: { color: Colors.white, fontWeight: '600' },
});
