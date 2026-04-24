import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Radius, Spacing } from '../../theme/colors';
import { useReservation } from '../../hooks/useReservation';
import type { AvailableDriverDto } from '../../types'; // ajuste le chemin si besoin

// ─── Types ────────────────────────────────────────────────────────────────────
interface Props {
  visible: boolean;
  reservationRef?: string; // ex: "BC-00A1" — affiché dans le titre
  vehicleType?: string;    // type de véhicule choisi par le client — filtre les chauffeurs
  onConfirm: (driver: AvailableDriverDto) => void;
  onClose: () => void;
}

// ─── AvailableDriverDto row ───────────────────────────────────────────────────────────────
function DriverUserRow({
  driver,
  selected,
  onSelect,
}: {
  driver: AvailableDriverDto;
  selected: boolean;
  onSelect: () => void;
}) {
  const name = `${driver.user?.first_name} ${driver.user?.last_name}`;
  const vehicleLabel =
    [driver.vehicle?.model, driver.vehicle?.plate_number].filter(Boolean).join(' · ') || 'N/A';
  const driverVehicleType = driver.vehicle_type ?? driver.vehicle?.type ?? null;

  return (
    <TouchableOpacity
      style={[row.wrapper, selected && row.wrapperSelected]}
      onPress={onSelect}
      activeOpacity={0.75}
    >
      {/* Avatar */}
      {driver.user?.profile_photo_url ? (
        <Image source={{ uri: driver.user?.profile_photo_url }} style={row.avatar} />
      ) : (
        <View style={[row.avatar, row.avatarFallback]}>
          <Ionicons name="person" size={22} color={Colors.textSecondary} />
        </View>
      )}

      {/* Info */}
      <View style={row.info}>
        <Text style={row.name} numberOfLines={1}>{name}</Text>
        <View style={row.metaLine}>
          <Ionicons name="car-outline" size={12} color={Colors.textMuted} />
          <Text style={row.meta} numberOfLines={1}>{vehicleLabel}</Text>
        </View>
        {driverVehicleType && (
          <View style={row.metaLine}>
            <Ionicons name="pricetag-outline" size={12} color={Colors.textMuted} />
            <Text style={row.meta}>{driverVehicleType}</Text>
          </View>
        )}
      </View>

      {/* Checkmark */}
      <View style={[row.check, selected && row.checkActive]}>
        {selected && <Ionicons name="checkmark" size={14} color={Colors.white} />}
      </View>
    </TouchableOpacity>
  );
}

const row = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: 'transparent',
    backgroundColor: Colors.surface,
    marginBottom: Spacing.xs,
  },
  wrapperSelected: {
    borderColor: Colors.bordeaux,
    backgroundColor: '#FFF5F5',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarFallback: {
    backgroundColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1, gap: 3 },
  name: {
    fontSize: Fonts.size.sm,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  metaLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  meta: {
    fontSize: Fonts.size.xs,
    color: Colors.textMuted,
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  checkActive: {
    backgroundColor: Colors.bordeaux,
    borderColor: Colors.bordeaux,
  },
});

// ─── Modal ────────────────────────────────────────────────────────────────────
export default function DriverUserPickerModal({ visible, reservationRef, vehicleType, onConfirm, onClose }: Props) {
  const { fetchDriverUserActive } = useReservation();

  const [drivers, setDriverUsers]       = useState<AvailableDriverDto[]>([]);
  const [loading, setLoading]       = useState(false);
  const [search, setSearch]         = useState('');
  const [selected, setSelected]     = useState<AvailableDriverDto | null>(null);
  const [confirming, setConfirming] = useState(false);

  // Charge les chauffeurs actifs à l'ouverture
  useEffect(() => {
    if (!visible) return;
    setSelected(null);
    setSearch('');
    setLoading(true);
    fetchDriverUserActive(vehicleType)
      .then((list: AvailableDriverDto[]) => setDriverUsers(list ?? []))
      .catch(console.warn)
      .finally(() => setLoading(false));
  }, [visible]);

  // Filtre 1 — type de véhicule correspondant à la demande du client
  const byType = vehicleType
    ? drivers.filter(d => {
        const driverType = d.vehicle_type ?? d.vehicle?.type ?? null;
        return driverType?.toLowerCase() === vehicleType.toLowerCase();
      })
    : drivers;

  // Filtre 2 — recherche textuelle sur nom / plaque / modèle
  const filtered = search.trim()
    ? byType.filter(d => {
        const q = search.toLowerCase();
        const name = `${d.user?.first_name} ${d.user?.last_name}`.toLowerCase();
        const plate = (d.vehicle?.plate_number ?? '').toLowerCase();
        const model = (d.vehicle?.model ?? '').toLowerCase();
        return name.includes(q) || plate.includes(q) || model.includes(q);
      })
    : byType;

  const handleConfirm = useCallback(async () => {
    if (!selected) return;
    setConfirming(true);
    try {
      await onConfirm(selected);
    } finally {
      setConfirming(false);
    }
  }, [selected, onConfirm]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={M.overlay}>
        <View style={M.sheet}>

          {/* ── En-tête ── */}
          <View style={M.header}>
            <View style={M.headerText}>
              <Text style={M.title}>Assigner un chauffeur</Text>
              {reservationRef ? (
                <Text style={M.subtitle}>Réservation {reservationRef}</Text>
              ) : null}
            </View>
            <TouchableOpacity onPress={onClose} style={M.closeBtn}>
              <Ionicons name="close" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* ── Recherche ── */}
          <View style={M.searchBar}>
            <Ionicons name="search" size={16} color={Colors.textMuted} />
            <TextInput
              style={M.searchInput}
              placeholder="Nom, plaque, véhicule…"
              placeholderTextColor={Colors.textMuted}
              value={search}
              onChangeText={setSearch}
              autoCorrect={false}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* ── Filtre type de véhicule ── */}
          {vehicleType && (
            <View style={M.typeBanner}>
              <Ionicons name="filter-outline" size={14} color={Colors.bordeaux} />
              <Text style={M.typeBannerText}>
                Type demandé : <Text style={M.typeBannerBold}>{vehicleType}</Text>
                {' '}— {byType.length} chauffeur{byType.length > 1 ? 's' : ''} compatible{byType.length > 1 ? 's' : ''}
              </Text>
            </View>
          )}

          {/* ── Liste ── */}
          {loading ? (
            <View style={M.centered}>
              <ActivityIndicator size="large" color={Colors.bordeaux} />
              <Text style={M.loadingText}>Chargement des chauffeurs…</Text>
            </View>
          ) : filtered.length === 0 ? (
            <View style={M.centered}>
              <Ionicons name="person-outline" size={36} color={Colors.textMuted} />
              <Text style={M.emptyText}>
                {search
                  ? 'Aucun chauffeur trouvé'
                  : vehicleType
                  ? `Aucun chauffeur disponible pour le type "${vehicleType}"`
                  : 'Aucun chauffeur actif'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={item  => item.id}
              renderItem={({ item }) => (
                <DriverUserRow
                  driver={item as AvailableDriverDto}
                  selected={selected?.id === item.id}
                  onSelect={() => setSelected(item)}
                />
              )}
              contentContainerStyle={M.list}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            />
          )}

          {/* ── Actions ── */}
          <View style={M.actions}>
            <TouchableOpacity style={M.cancelBtn} onPress={onClose}>
              <Text style={M.cancelText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[M.confirmBtn, !selected && M.confirmBtnDisabled]}
              onPress={handleConfirm}
              disabled={!selected || confirming}
            >
              {confirming ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Text style={M.confirmText}>Assigner</Text>
              )}
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
}

const M = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : Spacing.lg,
    maxHeight: '85%',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerText: { flex: 1 },
  title: {
    fontSize: Fonts.size.md,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: Fonts.size.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.sm,
  },

  // Search
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    margin: Spacing.md,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 10 : 7,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: Fonts.size.sm,
    color: Colors.textPrimary,
    padding: 0,
  },

  // Vehicle type banner
  typeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 7,
    backgroundColor: '#FFF5F5',
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.bordeaux + '40',
  },
  typeBannerText: {
    flex: 1,
    fontSize: Fonts.size.xs,
    color: Colors.textSecondary,
  },
  typeBannerBold: {
    fontWeight: '700',
    color: Colors.bordeaux,
    textTransform: 'capitalize',
  },

  // List
  list: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.sm,
  },

  // States
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: Spacing.sm,
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: Fonts.size.sm,
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: Fonts.size.sm,
    fontStyle: 'italic',
  },

  // Actions
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  cancelText: {
    color: Colors.textSecondary,
    fontWeight: '600',
    fontSize: Fonts.size.sm,
  },
  confirmBtn: {
    flex: 2,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.bordeaux,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnDisabled: {
    backgroundColor: Colors.border,
  },
  confirmText: {
    color: Colors.white,
    fontWeight: '800',
    fontSize: Fonts.size.sm,
  },
});