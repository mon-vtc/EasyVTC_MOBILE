import React, { useCallback, useEffect, useState, useRef } from 'react';
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
  Keyboard,
  Animated,
  KeyboardEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Radius, Spacing } from '../../theme/colors';
import { useReservation } from '../../hooks/useReservation';
import type { AvailableDriverDto } from '../../types';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Props {
  visible: boolean;
  reservationRef?: string;
  onConfirm: (driver: AvailableDriverDto) => void;
  onClose: () => void;
}

// ─── DriverUserRow ────────────────────────────────────────────────────────────
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

  return (
    <TouchableOpacity
      style={[row.wrapper, selected && row.wrapperSelected]}
      onPress={onSelect}
      activeOpacity={0.75}
    >
      {driver.user?.profile_photo_url ? (
        <Image source={{ uri: driver.user.profile_photo_url }} style={row.avatar} />
      ) : (
        <View style={[row.avatar, row.avatarFallback]}>
          <Ionicons name="person" size={22} color={Colors.textSecondary} />
        </View>
      )}

      <View style={row.info}>
        <Text style={row.name} numberOfLines={1}>{name}</Text>
        <View style={row.metaLine}>
          <Ionicons name="car-outline" size={12} color={Colors.textMuted} />
          <Text style={row.meta} numberOfLines={1}>{vehicleLabel}</Text>
        </View>
      </View>

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
  avatar: { width: 48, height: 48, borderRadius: 24 },
  avatarFallback: {
    backgroundColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1, gap: 3 },
  name: { fontSize: Fonts.size.sm, fontWeight: '700', color: Colors.textPrimary },
  metaLine: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  meta: { fontSize: Fonts.size.xs, color: Colors.textMuted },
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
  checkActive: { backgroundColor: Colors.bordeaux, borderColor: Colors.bordeaux },
});

// ─── Modal principal ──────────────────────────────────────────────────────────
export default function DriverUserPickerModal({
  visible,
  reservationRef,
  onConfirm,
  onClose,
}: Props) {
  const { fetchDriverUserActive } = useReservation();

  const [drivers, setDriverUsers]   = useState<AvailableDriverDto[]>([]);
  const [loading, setLoading]       = useState(false);
  const [search, setSearch]         = useState('');
  const [selected, setSelected]     = useState<AvailableDriverDto | null>(null);
  const [confirming, setConfirming] = useState(false);

  /*
   * sheetPadding est un Animated.Value qui représente le paddingBottom
   * du sheet. On l'incrémente de la hauteur du clavier quand il s'ouvre,
   * et on le remet à 0 quand il se ferme.
   *
   * Pourquoi pas KeyboardAvoidingView ?
   * Sur Android avec statusBarTranslucent={true}, KAV calcule mal
   * l'offset et ne remonte pas du tout le contenu. L'écoute manuelle
   * via Keyboard.addListener est la seule solution fiable dans ce contexte.
   */
  const sheetPadding = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      sheetPadding.setValue(0);
      return;
    }

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = (e: KeyboardEvent) => {
      Animated.timing(sheetPadding, {
        toValue: e.endCoordinates.height,
        duration: Platform.OS === 'ios' ? e.duration ?? 250 : 200,
        useNativeDriver: false,
      }).start();
    };

    const onHide = (e: KeyboardEvent) => {
      Animated.timing(sheetPadding, {
        toValue: 0,
        duration: Platform.OS === 'ios' ? e.duration ?? 250 : 200,
        useNativeDriver: false,
      }).start();
    };

    const subShow = Keyboard.addListener(showEvent, onShow);
    const subHide = Keyboard.addListener(hideEvent, onHide);

    return () => {
      subShow.remove();
      subHide.remove();
    };
  }, [visible]);

  // Chargement des chauffeurs à l'ouverture
  useEffect(() => {
    if (!visible) return;
    setSelected(null);
    setSearch('');
    setLoading(true);
    fetchDriverUserActive()
      .then((list: AvailableDriverDto[]) => setDriverUsers(list ?? []))
      .catch(console.warn)
      .finally(() => setLoading(false));
  }, [visible]);

  const filtered = search.trim()
    ? drivers.filter(d => {
        const q = search.toLowerCase();
        const name = `${d.user?.first_name} ${d.user?.last_name}`.toLowerCase();
        const plate = (d.vehicle?.plate_number ?? '').toLowerCase();
        const model = (d.vehicle?.model ?? '').toLowerCase();
        return name.includes(q) || plate.includes(q) || model.includes(q);
      })
    : drivers;

  const handleConfirm = useCallback(async () => {
    if (!selected) return;
    Keyboard.dismiss();
    setConfirming(true);
    try {
      await onConfirm(selected);
    } finally {
      setConfirming(false);
    }
  }, [selected, onConfirm]);

  const handleClose = useCallback(() => {
    Keyboard.dismiss();
    onClose();
  }, [onClose]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={M.overlay}>
        {/* Tap en dehors du sheet → ferme */}
        <TouchableOpacity style={M.backdrop} activeOpacity={1} onPress={handleClose} />

        {/*
          Le sheet est un Animated.View.
          paddingBottom = hauteur du clavier → le contenu remonte
          exactement de ce qu'il faut, sans aucun calcul approximatif.
        */}
        <Animated.View style={[M.sheet, { paddingBottom: sheetPadding }]}>
          <FlatList
            data={loading ? [] : filtered}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <DriverUserRow
                driver={item}
                selected={selected?.id === item.id}
                onSelect={() => setSelected(item)}
              />
            )}
            contentContainerStyle={M.list}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            ListHeaderComponent={
              <>
                {/* Handle bar */}
                <View style={M.handle} />

                {/* En-tête */}
                <View style={M.header}>
                  <View style={M.headerText}>
                    <Text style={M.title}>Assigner un chauffeur</Text>
                    {reservationRef && (
                      <Text style={M.subtitle}>Réservation {reservationRef}</Text>
                    )}
                  </View>
                  <TouchableOpacity onPress={handleClose} style={M.closeBtn}>
                    <Ionicons name="close" size={20} color={Colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                {/* Barre de recherche */}
                <View style={M.searchBar}>
                  <Ionicons name="search" size={16} color={Colors.textMuted} />
                  <TextInput
                    style={M.searchInput}
                    placeholder="Nom, plaque, véhicule…"
                    placeholderTextColor={Colors.textMuted}
                    value={search}
                    onChangeText={setSearch}
                    autoCorrect={false}
                    returnKeyType="search"
                  />
                  {search.length > 0 && (
                    <TouchableOpacity onPress={() => setSearch('')}>
                      <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
                    </TouchableOpacity>
                  )}
                </View>
              </>
            }
            ListEmptyComponent={
              loading ? (
                <View style={M.centered}>
                  <ActivityIndicator size="large" color={Colors.bordeaux} />
                  <Text style={M.loadingText}>Chargement des chauffeurs…</Text>
                </View>
              ) : (
                <View style={M.centered}>
                  <Ionicons name="person-outline" size={36} color={Colors.textMuted} />
                  <Text style={M.emptyText}>
                    {search ? 'Aucun chauffeur trouvé' : 'Aucun chauffeur actif'}
                  </Text>
                </View>
              )
            }
            ListFooterComponent={
              <View style={M.actions}>
                <TouchableOpacity style={M.cancelBtn} onPress={handleClose}>
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
            }
          />
        </Animated.View>
      </View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const M = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  backdrop: {
    flex: 1,
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xs,
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
  list: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: Spacing.sm,
  },
  loadingText: { color: Colors.textSecondary, fontSize: Fonts.size.sm },
  emptyText: { color: Colors.textMuted, fontSize: Fonts.size.sm, fontStyle: 'italic' },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
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
  cancelText: { color: Colors.textSecondary, fontWeight: '600', fontSize: Fonts.size.sm },
  confirmBtn: {
    flex: 2,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.bordeaux,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnDisabled: { backgroundColor: Colors.border },
  confirmText: { color: Colors.white, fontWeight: '800', fontSize: Fonts.size.sm },
});