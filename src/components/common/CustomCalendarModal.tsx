// components/CustomCalendarModal.tsx
import React, { useState } from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet, Platform,
} from 'react-native';
import { Colors, Fonts } from '../../theme/colors';
import { AppIcon } from './AppIcon';

const DAYS_SHORT = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin',
                'Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

interface Props {
  visible: boolean;
  selectedDate: string | null; // 'YYYY-MM-DD'
  onConfirm: (date: string) => void;
  onCancel: () => void;
}

export default function CustomCalendarModal({ visible, selectedDate, onConfirm, onCancel }: Props) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const initDate = selectedDate ? new Date(selectedDate) : new Date(today);
  const [viewYear, setViewYear]   = useState(initDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initDate.getMonth());

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  // Génère les cellules du calendrier
  const buildCells = () => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay(); // 0=dim
    const offset   = (firstDay === 0 ? 6 : firstDay - 1);      // lundi=0
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

  const isPast = (day: number) => new Date(viewYear, viewMonth, day) < today;
  const isToday = (day: number) => toISO(day) === today.toISOString().split('T')[0];
  const isSelected = (day: number) => toISO(day) === selectedDate;

  const cells = buildCells();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <View style={s.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onCancel} />
        <View style={s.sheet}>
          <View style={s.handle} />

          {/* ── En-tête ── */}
          <View style={s.header}>
            <View style={s.headerIcon}>
              <AppIcon name="calendar-outline" size={20} color={Colors.white} />
            </View>
            <Text style={s.headerTitle}>Choisir une date</Text>
            <TouchableOpacity onPress={onCancel} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <AppIcon name="close-outline" size={22} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* ── Navigation mois ── */}
          <View style={s.nav}>
            <TouchableOpacity onPress={prevMonth} style={s.navBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <AppIcon name="chevron-back-outline" size={20} color={Colors.bordeaux} />
            </TouchableOpacity>
            <Text style={s.navTitle}>{MONTHS[viewMonth]} {viewYear}</Text>
            <TouchableOpacity onPress={nextMonth} style={s.navBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <AppIcon name="chevron-forward-outline" size={20} color={Colors.bordeaux} />
            </TouchableOpacity>
          </View>

          {/* ── Jours de la semaine ── */}
          <View style={s.weekRow}>
            {DAYS_SHORT.map(d => (
              <Text key={d} style={s.weekDay}>{d}</Text>
            ))}
          </View>

          {/* ── Grille ── */}
          <View style={s.grid}>
            {cells.map((day, idx) => {
              if (!day) return <View key={`empty-${idx}`} style={s.cell} />;

              const past     = isPast(day);
              const today_   = isToday(day);
              const selected = isSelected(day);

              return (
                <TouchableOpacity
                  key={`day-${day}`}
                  style={s.cell}
                  onPress={() => !past && onConfirm(toISO(day))}
                  disabled={past}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    s.cellText,
                    past     && s.cellTextPast,
                    today_   && !selected && s.cellTextToday,
                    selected && s.cellTextSelected,
                  ]}>
                    {day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── Annuler ── */}
          <TouchableOpacity style={s.cancelBtn} onPress={onCancel} activeOpacity={0.85}>
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
  // Navigation
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  navBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: Colors.surface ?? '#F5F5F5',
  },
  navTitle: {
    fontSize: 15,
    fontFamily: Fonts.bold, fontWeight: '700',
    color: Colors.textPrimary,
  },
  // Jours semaine
  weekRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border ?? '#EEE',
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontFamily: Fonts.semibold, fontWeight: '600',
    color: Colors.textSecondary,
  },
  // Grille
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingVertical: 8,
  },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellText: {
    fontSize: 15,
    color: Colors.textPrimary,
    width: 36, height: 36, lineHeight: 36, textAlign: 'center', borderRadius: 18,
  },
  cellTextPast: {
    color: Colors.textSecondary,
    opacity: 0.35,
  },
  cellTextToday: {
    color: Colors.bordeaux,
    fontFamily: Fonts.bold, fontWeight: '700',
    borderWidth: 1.5,
    borderColor: Colors.bordeaux,
  },
  cellTextSelected: {
    color: Colors.white,
    fontFamily: Fonts.bold, fontWeight: '700',
    backgroundColor: Colors.bordeaux,
  },
  // Annuler
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 8,
    borderRadius: 12,
    backgroundColor: Colors.surface ?? '#F5F5F5',
  },
  cancelText: {
    color: Colors.textSecondary,
    fontSize: 15,
    fontFamily: Fonts.semibold, fontWeight: '600',
  },
});
