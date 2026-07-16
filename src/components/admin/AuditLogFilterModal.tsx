import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon } from '../common/AppIcon';
import CustomCalendarModal from '../common/CustomCalendarModal';
import { Colors, Fonts, Radius, Spacing } from '../../theme/colors';
import type { AuditLogFilters } from '../../hooks/useAuditLogFilters';
import { DEFAULT_AUDIT_LOG_FILTERS } from '../../hooks/useAuditLogFilters';

interface Props {
  visible: boolean;
  filters: AuditLogFilters;
  onApply: (filters: AuditLogFilters) => void;
  onClose: () => void;
}

export default function AuditLogFilterModal({ visible, filters, onApply, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [localFilters, setLocalFilters] = useState<AuditLogFilters>(filters);
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [calendarTarget, setCalendarTarget] = useState<'exact' | 'from' | 'to' | null>(null);

  useEffect(() => {
    if (visible) {
      setLocalFilters(filters);
    }
  }, [visible, filters]);

  const setFilter = <K extends keyof AuditLogFilters>(key: K, value: AuditLogFilters[K]) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleDateConfirm = (date: string) => {
    if (calendarTarget === 'exact') {
      setFilter('dateExact', date);
    } else if (calendarTarget === 'from') {
      setFilter('dateFrom', date);
    } else if (calendarTarget === 'to') {
      setFilter('dateTo', date);
    }
    setCalendarVisible(false);
    setCalendarTarget(null);
  };

  const handleReset = () => {
    setLocalFilters(DEFAULT_AUDIT_LOG_FILTERS);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.container, { paddingBottom: styles.container.padding + insets.bottom }]}>
          <View style={styles.header}>
            <Text style={styles.title}>Filtres & Tri</Text>
            <TouchableOpacity onPress={onClose}>
              <AppIcon name="close" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scroll}>
            {/* Filtre par date */}
            <Text style={styles.sectionTitle}>Filtrer par date</Text>
            <View style={styles.toggleRow}>
              <TouchableOpacity
                style={[styles.toggleBtn, localFilters.dateMode === 'none' && styles.toggleBtnActive]}
                onPress={() => setFilter('dateMode', 'none')}
              >
                <Text style={[styles.toggleText, localFilters.dateMode === 'none' && styles.toggleTextActive]}>Aucun</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, localFilters.dateMode === 'specific' && styles.toggleBtnActive]}
                onPress={() => setFilter('dateMode', 'specific')}
              >
                <Text style={[styles.toggleText, localFilters.dateMode === 'specific' && styles.toggleTextActive]}>Date spécifique</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, localFilters.dateMode === 'period' && styles.toggleBtnActive]}
                onPress={() => setFilter('dateMode', 'period')}
              >
                <Text style={[styles.toggleText, localFilters.dateMode === 'period' && styles.toggleTextActive]}>Période</Text>
              </TouchableOpacity>
            </View>

            {localFilters.dateMode === 'specific' && (
              <TouchableOpacity style={styles.dateInput} onPress={() => { setCalendarTarget('exact'); setCalendarVisible(true); }}>
                <Text>{localFilters.dateExact ? localFilters.dateExact.split('-').reverse().join('/') : 'Choisir une date'}</Text>
              </TouchableOpacity>
            )}

            {localFilters.dateMode === 'period' && (
              <View style={styles.periodRow}>
                <TouchableOpacity style={styles.dateInput} onPress={() => { setCalendarTarget('from'); setCalendarVisible(true); }}>
                  <Text>{localFilters.dateFrom ? localFilters.dateFrom.split('-').reverse().join('/') : 'Date de début'}</Text>
                </TouchableOpacity>
                <Text> → </Text>
                <TouchableOpacity style={styles.dateInput} onPress={() => { setCalendarTarget('to'); setCalendarVisible(true); }}>
                  <Text>{localFilters.dateTo ? localFilters.dateTo.split('-').reverse().join('/') : 'Date de fin'}</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Tri */}
            <Text style={styles.sectionTitle}>Trier par</Text>
            <View style={styles.toggleRow}>
              <TouchableOpacity
                style={[styles.toggleBtn, localFilters.sortField === 'created_at' && styles.toggleBtnActive]}
                onPress={() => setFilter('sortField', 'created_at')}
              >
                <Text style={[styles.toggleText, localFilters.sortField === 'created_at' && styles.toggleTextActive]}>Date</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, localFilters.sortField === 'action' && styles.toggleBtnActive]}
                onPress={() => setFilter('sortField', 'action')}
              >
                <Text style={[styles.toggleText, localFilters.sortField === 'action' && styles.toggleTextActive]}>Action</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.toggleRow, { marginTop: Spacing.sm }]}>
              <TouchableOpacity
                style={[styles.toggleBtn, localFilters.sortOrder === 'desc' && styles.toggleBtnActive]}
                onPress={() => setFilter('sortOrder', 'desc')}
              >
                <Text style={[styles.toggleText, localFilters.sortOrder === 'desc' && styles.toggleTextActive]}>Décroissant ↓</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, localFilters.sortOrder === 'asc' && styles.toggleBtnActive]}
                onPress={() => setFilter('sortOrder', 'asc')}
              >
                <Text style={[styles.toggleText, localFilters.sortOrder === 'asc' && styles.toggleTextActive]}>Croissant ↑</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
              <Text style={styles.resetText}>Réinitialiser</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyBtn} onPress={() => onApply(localFilters)}>
              <Text style={styles.applyText}>Appliquer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <CustomCalendarModal
        visible={calendarVisible}
        onConfirm={handleDateConfirm}
        onCancel={() => setCalendarVisible(false)}
        selectedDate={
          calendarTarget === 'exact' ? localFilters.dateExact :
          calendarTarget === 'from' ? localFilters.dateFrom :
          localFilters.dateTo
        }
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    padding: Spacing.md,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: Fonts.size.lg,
    fontFamily: Fonts.bold, fontWeight: '700',
    color: Colors.textPrimary,
  },
  scroll: {
    paddingBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Fonts.size.md,
    fontFamily: Fonts.semibold, fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  toggleBtn: {
    flex: 1,
    padding: Spacing.sm,
    alignItems: 'center',
  },
  toggleBtnActive: {
    backgroundColor: Colors.bordeaux,
  },
  toggleText: {
    fontSize: Fonts.size.sm,
    fontFamily: Fonts.semibold, fontWeight: '600',
    color: Colors.textPrimary,
  },
  toggleTextActive: {
    color: Colors.white,
  },
  dateInput: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  periodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.md,
  },
  resetBtn: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    alignItems: 'center',
  },
  resetText: {
    fontSize: Fonts.size.md,
    fontFamily: Fonts.bold, fontWeight: '700',
    color: Colors.textSecondary,
  },
  applyBtn: {
    flex: 2,
    padding: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.bordeaux,
    alignItems: 'center',
  },
  applyText: {
    fontSize: Fonts.size.md,
    fontFamily: Fonts.bold, fontWeight: '700',
    color: Colors.white,
  },
});