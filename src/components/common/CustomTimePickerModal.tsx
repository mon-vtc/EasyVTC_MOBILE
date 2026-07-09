// components/CustomTimePickerModal.tsx
import React, { useState } from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView,
} from 'react-native';
import { Colors, Fonts } from '../../theme/colors';
import {AppIcon} from './AppIcon';

interface Props {
  visible: boolean;
  selectedTime: string | null; // 'HH:MM'
  onConfirm: (time: string) => void;
  onCancel: () => void;
}

export default function CustomTimePickerModal({ visible, selectedTime, onConfirm, onCancel }: Props) {
  const initH = selectedTime ? parseInt(selectedTime.split(':')[0]) : new Date().getHours();
  const initM = selectedTime ? parseInt(selectedTime.split(':')[1]) : 0;

  const [hour, setHour]     = useState(initH);
  const [minute, setMinute] = useState(initM);

  const HOURS   = Array.from({ length: 24 }, (_, i) => i);
  const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5); // 0,5,10,...,55

  const pad = (n: number) => String(n).padStart(2, '0');

  const handleConfirm = () => {
    onConfirm(`${pad(hour)}:${pad(minute)}`);
  };

  const ColPicker = ({
    values,
    selected,
    onSelect,
  }: {
    values: number[];
    selected: number;
    onSelect: (v: number) => void;
  }) => (
    <ScrollView
      style={s.col}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={s.colContent}
    >
      {values.map(v => (
        <TouchableOpacity
          key={v}
          style={[s.item, v === selected && s.itemSelected]}
          onPress={() => onSelect(v)}
          activeOpacity={0.7}
        >
          <Text style={[s.itemText, v === selected && s.itemTextSelected]}>
            {pad(v)}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={s.overlay}>
        <View style={s.card}>

          {/* ── Header ── */}
          <View style={s.header}>
            <Text style={s.headerTitle}>Choisir une heure</Text>
            <TouchableOpacity onPress={onCancel}>
              <AppIcon name="close-outline" size={22} color={Colors.white} />
            </TouchableOpacity>
          </View>

          {/* ── Preview ── */}
          <View style={s.preview}>
            <Text style={s.previewText}>{pad(hour)} : {pad(minute)}</Text>
          </View>

          {/* ── Colonnes ── */}
          <View style={s.pickerRow}>

            {/* Label + colonne Heures */}
            <View style={s.colWrapper}>
              <Text style={s.colLabel}>Heures</Text>
              <View style={s.colContainer}>
                <ColPicker values={HOURS} selected={hour} onSelect={setHour} />
              </View>
            </View>

            {/* Séparateur */}
            <Text style={s.separator}>:</Text>

            {/* Label + colonne Minutes */}
            <View style={s.colWrapper}>
              <Text style={s.colLabel}>Minutes</Text>
              <View style={s.colContainer}>
                <ColPicker values={MINUTES} selected={minute} onSelect={setMinute} />
              </View>
            </View>

          </View>

          {/* ── Actions ── */}
          <View style={s.actions}>
            <TouchableOpacity style={s.cancelBtn} onPress={onCancel}>
              <Text style={s.cancelText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.confirmBtn} onPress={handleConfirm}>
              <Text style={s.confirmText}>Confirmer</Text>
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
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.bordeaux,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerTitle: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: Fonts.bold, fontWeight: 'bold',
  },
  // Preview heure
  preview: {
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.bordeauxLight + '44',
  },
  previewText: {
    fontSize: 42,
    fontFamily: Fonts.bold, fontWeight: '700',
    color: Colors.bordeaux,
    letterSpacing: 4,
  },
  // Colonnes
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 8,
  },
  colWrapper: {
    alignItems: 'center',
    flex: 1,
  },
  colLabel: {
    fontSize: 12,
    fontFamily: Fonts.semibold, fontWeight: '600',
    color: Colors.bordeauxLight,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  colContainer: {
    height: 180,
    borderWidth: 1.5,
    borderColor: Colors.bordeauxLight + '55',
    borderRadius: 12,
    overflow: 'hidden',
  },
  col: {
    flex: 1,
  },
  colContent: {
    paddingVertical: 4,
  },
  item: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    marginVertical: 2,
    borderRadius: 8,
  },
  itemSelected: {
    backgroundColor: Colors.bordeaux,
  },
  itemText: {
    fontSize: 18,
    color: '#2d4150',
    fontFamily: Fonts.medium, fontWeight: '500',
  },
  itemTextSelected: {
    color: Colors.white,
    fontFamily: Fonts.bold, fontWeight: '700',
  },
  // Actions
  actions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Colors.bordeauxLight + '44',
  },
  cancelBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRightWidth: 1,
    borderRightColor: Colors.bordeauxLight + '44',
  },
  cancelText: {
    color: Colors.bordeauxLight,
    fontSize: 15,
    fontFamily: Fonts.semibold, fontWeight: '600',
  },
  confirmBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    backgroundColor: Colors.bordeaux + '11',
  },
  confirmText: {
    color: Colors.bordeaux,
    fontSize: 15,
    fontFamily: Fonts.bold, fontWeight: '700',
  },
  separator: {
    fontSize: 24,
    fontFamily: Fonts.bold, fontWeight: '700',
    color: Colors.bordeaux,
    marginHorizontal: 8,
  },
});