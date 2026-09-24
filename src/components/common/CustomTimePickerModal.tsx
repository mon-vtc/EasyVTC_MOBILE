// components/CustomTimePickerModal.tsx
import React, { useRef, useState } from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView,
  NativeSyntheticEvent, NativeScrollEvent, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts } from '../../theme/colors';
import { AppIcon } from './AppIcon';

interface Props {
  visible: boolean;
  selectedTime: string | null; // 'HH:MM'
  onConfirm: (time: string) => void;
  onCancel: () => void;
}

const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;
const PADDING = ITEM_HEIGHT * Math.floor(VISIBLE_ITEMS / 2);

const pad = (n: number) => String(n).padStart(2, '0');

// ── Colonne à défilement, façon roue (snap au centre) ──────────────────────
function WheelColumn({
  values,
  selected,
  onSelect,
}: {
  values: number[];
  selected: number;
  onSelect: (v: number) => void;
}) {
  const scrollRef = useRef<ScrollView>(null);
  const initialIndex = Math.max(0, values.indexOf(selected));

  const snapToIndex = (index: number, animated = true) => {
    const clamped = Math.min(Math.max(index, 0), values.length - 1);
    scrollRef.current?.scrollTo({ y: clamped * ITEM_HEIGHT, animated });
    onSelect(values[clamped]);
  };

  const handleSettle = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
    snapToIndex(index, false);
  };

  return (
    <View style={s.colContainer}>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        contentContainerStyle={{ paddingVertical: PADDING }}
        contentOffset={{ x: 0, y: initialIndex * ITEM_HEIGHT }}
        onMomentumScrollEnd={handleSettle}
        onScrollEndDrag={(e) => {
          // Android : un petit glissé sans inertie ne déclenche pas onMomentumScrollEnd.
          if (Platform.OS === 'android') handleSettle(e);
        }}
      >
        {values.map((v) => {
          const isSelected = v === selected;
          return (
            <TouchableOpacity
              key={v}
              style={s.item}
              onPress={() => snapToIndex(values.indexOf(v))}
              activeOpacity={0.6}
            >
              <Text style={[s.itemText, isSelected && s.itemTextSelected]}>{pad(v)}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Bande de sélection centrale, sous le contenu défilant */}
      <View style={s.selectionBand} pointerEvents="none" />

      {/* Fondus haut/bas pour signaler que la colonne défile */}
      <LinearGradient
        colors={[Colors.white, Colors.white + '00']}
        style={[s.fade, { top: 0 }]}
        pointerEvents="none"
      />
      <LinearGradient
        colors={[Colors.white + '00', Colors.white]}
        style={[s.fade, { bottom: 0 }]}
        pointerEvents="none"
      />
    </View>
  );
}

export default function CustomTimePickerModal({ visible, selectedTime, onConfirm, onCancel }: Props) {
  const initH = selectedTime ? parseInt(selectedTime.split(':')[0]) : new Date().getHours();
  const initM = selectedTime ? parseInt(selectedTime.split(':')[1]) : 0;

  const [hour, setHour]     = useState(initH);
  const [minute, setMinute] = useState(initM - (initM % 5));

  const HOURS   = Array.from({ length: 24 }, (_, i) => i);
  const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);

  const handleConfirm = () => onConfirm(`${pad(hour)}:${pad(minute)}`);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <View style={s.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onCancel} />
        <View style={s.sheet}>
          <View style={s.handle} />

          {/* ── En-tête ── */}
          <View style={s.header}>
            <View style={s.headerIcon}>
              <AppIcon name="time-outline" size={20} color={Colors.white} />
            </View>
            <Text style={s.headerTitle}>Choisir une heure</Text>
            <TouchableOpacity onPress={onCancel} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <AppIcon name="close-outline" size={22} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* ── Roues Heures / Minutes ── */}
          <View style={s.pickerRow}>
            <View style={s.colWrapper}>
              <Text style={s.colLabel}>Heures</Text>
              <WheelColumn values={HOURS} selected={hour} onSelect={setHour} />
            </View>

            <Text style={s.separator}>:</Text>

            <View style={s.colWrapper}>
              <Text style={s.colLabel}>Minutes</Text>
              <WheelColumn values={MINUTES} selected={minute} onSelect={setMinute} />
            </View>
          </View>

          {/* ── Actions ── */}
          <View style={s.actions}>
            <TouchableOpacity style={[s.actionBtn, s.cancelBtn]} onPress={onCancel} activeOpacity={0.85}>
              <Text style={s.cancelText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.actionBtn, s.confirmBtn]} onPress={handleConfirm} activeOpacity={0.85}>
              <Text style={s.confirmText}>Confirmer {pad(hour)}:{pad(minute)}</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    elevation: 20,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
  },
  handle: {
    alignSelf: 'center',
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: Colors.border ?? '#D1D5DB',
    marginTop: 10, marginBottom: 6,
  },
  // En-tête
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
  },
  headerIcon: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: Colors.bordeaux,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontFamily: Fonts.bold, fontWeight: '700',
    color: Colors.textPrimary,
  },
  // Roues
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 4,
  },
  colWrapper: { alignItems: 'center', flex: 1 },
  colLabel: {
    fontSize: 12,
    fontFamily: Fonts.semibold, fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  colContainer: {
    height: PICKER_HEIGHT,
    width: '100%',
  },
  selectionBand: {
    position: 'absolute',
    left: 8, right: 8,
    top: PADDING, height: ITEM_HEIGHT,
    borderRadius: 10,
    backgroundColor: Colors.bordeaux + '14',
    borderTopWidth: 1, borderBottomWidth: 1,
    borderColor: Colors.bordeaux + '33',
  },
  fade: {
    position: 'absolute', left: 0, right: 0, height: PADDING,
  },
  item: {
    height: ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemText: {
    fontSize: 19,
    color: Colors.textSecondary,
    fontFamily: Fonts.medium, fontWeight: '500',
  },
  itemTextSelected: {
    color: Colors.bordeaux,
    fontFamily: Fonts.bold, fontWeight: '700',
    fontSize: 21,
  },
  separator: {
    fontSize: 22,
    fontFamily: Fonts.bold, fontWeight: '700',
    color: Colors.bordeaux,
    marginTop: 8 + PADDING - 12,
  },
  // Actions
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
  },
  cancelBtn: {
    backgroundColor: Colors.surface ?? '#F5F5F5',
  },
  cancelText: {
    color: Colors.textSecondary,
    fontSize: 15,
    fontFamily: Fonts.semibold, fontWeight: '600',
  },
  confirmBtn: {
    backgroundColor: Colors.bordeaux,
  },
  confirmText: {
    color: Colors.white,
    fontSize: 15,
    fontFamily: Fonts.bold, fontWeight: '700',
  },
});
