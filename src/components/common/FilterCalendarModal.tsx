// components/common/FilterCalendarModal.tsx
// Copie de CustomCalendarModal adaptée aux filtres :
//   - Toutes les dates sont sélectionnables (passées et futures)
//   - Pas de notion de "today" bloquante
import React, { useState, useEffect } from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts } from '../../theme/colors';

const DAYS_SHORT = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

interface Props {
  visible: boolean;
  selectedDate: string | null; // 'YYYY-MM-DD'
  onConfirm: (date: string) => void;
  onCancel: () => void;
  title?: string;
}

export default function FilterCalendarModal({
  visible,
  selectedDate,
  onConfirm,
  onCancel,
  title = 'Choisir une date',
}: Props) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const initDate = selectedDate ? new Date(selectedDate + 'T00:00:00') : new Date(today);
  const [viewYear, setViewYear]   = useState(initDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initDate.getMonth());

  // Réinitialise la vue quand le modal s'ouvre
  useEffect(() => {
    if (visible) {
      const d = selectedDate ? new Date(selectedDate + 'T00:00:00') : new Date(today);
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    }
  }, [visible, selectedDate]);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const buildCells = (): (number | null)[] => {
    const firstDay    = new Date(viewYear, viewMonth, 1).getDay();
    const offset      = firstDay === 0 ? 6 : firstDay - 1; // lundi = 0
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells: (number | null)[] = [
      ...Array(offset).fill(null),
      ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  };

  const toISO = (day: number) =>
    `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const isTodayCell  = (day: number) => toISO(day) === today.toISOString().split('T')[0];
  const isSelected   = (day: number) => toISO(day) === selectedDate;

  const cells = buildCells();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={s.overlay}>
        <View style={s.card}>

          {/* Header */}
          <View style={s.header}>
            <Text style={s.headerTitle}>{title}</Text>
            <TouchableOpacity onPress={onCancel}>
              <Ionicons name="close-outline" size={22} color={Colors.white} />
            </TouchableOpacity>
          </View>

          {/* Navigation mois */}
          <View style={s.nav}>
            <TouchableOpacity onPress={prevMonth} style={s.navBtn}>
              <Ionicons name="chevron-back-outline" size={20} color={Colors.bordeaux} />
            </TouchableOpacity>
            <Text style={s.navTitle}>{MONTHS[viewMonth]} {viewYear}</Text>
            <TouchableOpacity onPress={nextMonth} style={s.navBtn}>
              <Ionicons name="chevron-forward-outline" size={20} color={Colors.bordeaux} />
            </TouchableOpacity>
          </View>

          {/* Jours de la semaine */}
          <View style={s.weekRow}>
            {DAYS_SHORT.map(d => (
              <Text key={d} style={s.weekDay}>{d}</Text>
            ))}
          </View>

          {/* Grille */}
          <View style={s.grid}>
            {cells.map((day, idx) => {
              if (!day) return <View key={`empty-${idx}`} style={s.cell} />;
              const todayCell = isTodayCell(day);
              const selected  = isSelected(day);
              return (
                <TouchableOpacity
                  key={`day-${day}`}
                  style={[
                    s.cell,
                    selected   && s.cellSelected,
                    todayCell  && !selected && s.cellToday,
                  ]}
                  onPress={() => onConfirm(toISO(day))}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    s.cellText,
                    todayCell  && !selected && s.cellTextToday,
                    selected   && s.cellTextSelected,
                  ]}>
                    {day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Bouton Annuler */}
          <TouchableOpacity style={s.cancelBtn} onPress={onCancel}>
            <Text style={s.cancelText}>Annuler</Text>
          </TouchableOpacity>

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
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  navBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: Colors.bordeauxLight + '22',
  },
  navTitle: {
    fontSize: 15,
    fontFamily: Fonts.bold, fontWeight: '700',
    color: Colors.bordeaux,
  },
  weekRow: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.bordeauxLight + '44',
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontFamily: Fonts.semibold, fontWeight: '600',
    color: Colors.bordeauxLight,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 100,
  },
  cellSelected: {
    backgroundColor: Colors.bordeaux,
  },
  cellToday: {
    borderWidth: 1.5,
    borderColor: Colors.bordeaux,
  },
  cellText: {
    fontSize: 14,
    color: '#2d4150',
  },
  cellTextToday: {
    color: Colors.bordeaux,
    fontFamily: Fonts.bold, fontWeight: '700',
  },
  cellTextSelected: {
    color: Colors.white,
    fontFamily: Fonts.bold, fontWeight: '700',
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.bordeauxLight + '44',
  },
  cancelText: {
    color: Colors.bordeauxLight,
    fontSize: 15,
    fontFamily: Fonts.semibold, fontWeight: '600',
  },
});
