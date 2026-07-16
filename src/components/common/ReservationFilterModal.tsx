// components/common/ReservationFilterModal.tsx
// Modal de filtres combinés : date spécifique OU période + tri prix/date
// Réutilisable dans MyReservationsScreen, AdminReservationsScreen, DriverReservationsScreen
import React, { useState, useEffect } from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts, Spacing, Radius } from '../../theme/colors';
import FilterCalendarModal from './FilterCalendarModal';

// ── Types ──────────────────────────────────────────────────────────────────────

export type DateFilterMode = 'none' | 'specific' | 'period';
export type SortField      = 'date' | 'price';
export type SortOrder      = 'asc' | 'desc';

export interface ReservationFilters {
  dateMode:  DateFilterMode;
  dateExact: string | null;   // YYYY-MM-DD — mode 'specific'
  dateFrom:  string | null;   // YYYY-MM-DD — mode 'period'
  dateTo:    string | null;   // YYYY-MM-DD — mode 'period'
  sortField: SortField;
  sortOrder: SortOrder;
}

export const DEFAULT_FILTERS: ReservationFilters = {
  dateMode:  'none',
  dateExact: null,
  dateFrom:  null,
  dateTo:    null,
  sortField: 'date',
  sortOrder: 'desc',
};

interface Props {
  visible: boolean;
  filters: ReservationFilters;
  onApply: (filters: ReservationFilters) => void;
  onClose: () => void;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatDate(iso: string | null): string {
  if (!iso) return 'JJ/MM/AAAA';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function hasActiveFilters(f: ReservationFilters): boolean {
  return (
    f.dateMode !== 'none' ||
    f.sortField !== 'date' ||
    f.sortOrder !== 'desc'
  );
}

// ── Composant ──────────────────────────────────────────────────────────────────

export default function ReservationFilterModal({ visible, filters, onApply, onClose }: Props) {
  const [draft, setDraft] = useState<ReservationFilters>({ ...filters });
  const [calendarTarget, setCalendarTarget] = useState<'exact' | 'from' | 'to' | null>(null);
  const insets = useSafeAreaInsets();

  // Sync le draft à l'ouverture
  useEffect(() => {
    if (visible) setDraft({ ...filters });
  }, [visible]);

  const setMode = (mode: DateFilterMode) => {
    setDraft(prev => ({
      ...prev,
      dateMode:  mode,
      dateExact: mode === 'specific' ? prev.dateExact : null,
      dateFrom:  mode === 'period'   ? prev.dateFrom  : null,
      dateTo:    mode === 'period'   ? prev.dateTo    : null,
    }));
  };

  const handleCalendarConfirm = (date: string) => {
    if (calendarTarget === 'exact') setDraft(prev => ({ ...prev, dateExact: date }));
    if (calendarTarget === 'from')  setDraft(prev => ({ ...prev, dateFrom:  date }));
    if (calendarTarget === 'to')    setDraft(prev => ({ ...prev, dateTo:    date }));
    setCalendarTarget(null);
  };

  const handleReset = () => {
    setDraft({ ...DEFAULT_FILTERS });
  };

  const handleApply = () => {
    onApply(draft);
  };

  const active = hasActiveFilters(draft);

  // Label du calendrier en cours
  const calendarTitle =
    calendarTarget === 'exact' ? 'Date exacte' :
    calendarTarget === 'from'  ? 'Date de début' : 'Date de fin';

  const calendarSelected =
    calendarTarget === 'exact' ? draft.dateExact :
    calendarTarget === 'from'  ? draft.dateFrom  : draft.dateTo;

  return (
    <>
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <View style={s.overlay}>
          <View style={s.sheet}>

            {/* ── Header ── */}
            <View style={s.header}>
              <Text style={s.headerTitle}>Filtres & tri</Text>
              <TouchableOpacity onPress={onClose} style={s.closeBtn}>
                <Ionicons name="close" size={22} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={s.body} showsVerticalScrollIndicator={false}>

              {/* ══ SECTION DATE ══════════════════════════════════════════ */}
              <Text style={s.sectionTitle}>
                <Ionicons name="calendar-outline" size={14} color={Colors.bordeaux} />
                {'  '}Filtrer par date
              </Text>

              {/* Sélecteur de mode */}
              <View style={s.modeRow}>
                {([
                  { key: 'none',     label: 'Aucun'    },
                  { key: 'specific', label: 'Date exacte' },
                  { key: 'period',   label: 'Période'  },
                ] as { key: DateFilterMode; label: string }[]).map(opt => (
                  <TouchableOpacity
                    key={opt.key}
                    style={[s.modeBtn, draft.dateMode === opt.key && s.modeBtnActive]}
                    onPress={() => setMode(opt.key)}
                  >
                    <Text style={[s.modeBtnText, draft.dateMode === opt.key && s.modeBtnTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Date exacte */}
              {draft.dateMode === 'specific' && (
                <TouchableOpacity
                  style={s.dateRow}
                  onPress={() => setCalendarTarget('exact')}
                >
                  <Ionicons name="calendar" size={16} color={Colors.bordeaux} />
                  <Text style={s.dateLabel}>Date</Text>
                  <Text style={[s.dateValue, !!draft.dateExact && s.dateValueSet]}>
                    {formatDate(draft.dateExact)}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
                </TouchableOpacity>
              )}

              {/* Période */}
              {draft.dateMode === 'period' && (
                <View style={s.periodBlock}>
                  <TouchableOpacity
                    style={s.dateRow}
                    onPress={() => setCalendarTarget('from')}
                  >
                    <Ionicons name="calendar-outline" size={16} color={Colors.bordeaux} />
                    <Text style={s.dateLabel}>Du</Text>
                    <Text style={[s.dateValue, !!draft.dateFrom && s.dateValueSet]}>
                      {formatDate(draft.dateFrom)}
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
                  </TouchableOpacity>
                  <View style={s.periodSep} />
                  <TouchableOpacity
                    style={s.dateRow}
                    onPress={() => setCalendarTarget('to')}
                  >
                    <Ionicons name="calendar-outline" size={16} color={Colors.bordeaux} />
                    <Text style={s.dateLabel}>Au</Text>
                    <Text style={[s.dateValue, !!draft.dateTo && s.dateValueSet]}>
                      {formatDate(draft.dateTo)}
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
                  </TouchableOpacity>
                </View>
              )}

              {/* ══ SECTION TRI ════════════════════════════════════════════ */}
              <View style={s.divider} />
              <Text style={s.sectionTitle}>
                <Ionicons name="swap-vertical-outline" size={14} color={Colors.bordeaux} />
                {'  '}Trier par
              </Text>

              {/* Champ de tri */}
              <View style={s.sortRow}>
                {([
                  { key: 'date',  label: 'Date',  icon: 'time-outline'    },
                  { key: 'price', label: 'Prix',  icon: 'pricetag-outline' },
                ] as { key: SortField; label: string; icon: string }[]).map(opt => (
                  <TouchableOpacity
                    key={opt.key}
                    style={[s.sortChip, draft.sortField === opt.key && s.sortChipActive]}
                    onPress={() => setDraft(prev => ({ ...prev, sortField: opt.key }))}
                  >
                    <Ionicons
                      name={opt.icon as any}
                      size={14}
                      color={draft.sortField === opt.key ? Colors.white : Colors.textSecondary}
                    />
                    <Text style={[s.sortChipText, draft.sortField === opt.key && s.sortChipTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Ordre de tri */}
              <View style={s.sortRow}>
                {([
                  { key: 'desc', label: 'Plus récent / Plus cher',  icon: 'arrow-down-outline'  },
                  { key: 'asc',  label: 'Plus ancien / Moins cher', icon: 'arrow-up-outline'    },
                ] as { key: SortOrder; label: string; icon: string }[]).map(opt => (
                  <TouchableOpacity
                    key={opt.key}
                    style={[s.sortChip, s.sortChipWide, draft.sortOrder === opt.key && s.sortChipActive]}
                    onPress={() => setDraft(prev => ({ ...prev, sortOrder: opt.key }))}
                  >
                    <Ionicons
                      name={opt.icon as any}
                      size={14}
                      color={draft.sortOrder === opt.key ? Colors.white : Colors.textSecondary}
                    />
                    <Text style={[s.sortChipText, draft.sortOrder === opt.key && s.sortChipTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

            </ScrollView>

            {/* ── Footer ── */}
            <View style={[s.footer, { paddingBottom: s.footer.paddingBottom + insets.bottom }]}>
              <TouchableOpacity
                style={[s.footerBtn, s.footerBtnReset]}
                onPress={handleReset}
              >
                <Ionicons name="refresh-outline" size={16} color={Colors.textSecondary} />
                <Text style={s.footerBtnResetText}>Réinitialiser</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.footerBtn, s.footerBtnApply]}
                onPress={handleApply}
              >
                <Ionicons name="checkmark-outline" size={16} color={Colors.white} />
                <Text style={s.footerBtnApplyText}>Appliquer</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>

      {/* Calendrier imbriqué */}
      <FilterCalendarModal
        visible={!!calendarTarget}
        title={calendarTitle}
        selectedDate={calendarSelected ?? null}
        onConfirm={handleCalendarConfirm}
        onCancel={() => setCalendarTarget(null)}
      />
    </>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius:  20,
    borderTopRightRadius: 20,
    maxHeight: '88%',
    paddingBottom: 8,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: Fonts.size.lg,
    fontFamily: Fonts.bold, fontWeight: '700',
    color: Colors.textPrimary,
  },
  closeBtn: {
    padding: 4,
    borderRadius: Radius.sm,
    backgroundColor: Colors.background,
  },

  body: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },

  // Sections
  sectionTitle: {
    fontSize: Fonts.size.sm,
    fontFamily: Fonts.bold, fontWeight: '700',
    color: Colors.bordeaux,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
    marginTop: Spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },

  // Mode
  modeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  modeBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 9,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  modeBtnActive: {
    borderColor: Colors.bordeaux,
    backgroundColor: Colors.bordeaux + '12',
  },
  modeBtnText: {
    fontSize: Fonts.size.xs,
    fontFamily: Fonts.semibold, fontWeight: '600',
    color: Colors.textMuted,
  },
  modeBtnTextActive: {
    color: Colors.bordeaux,
  },

  // Date rows
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  dateLabel: {
    fontSize: Fonts.size.sm,
    color: Colors.textSecondary,
    fontFamily: Fonts.semibold, fontWeight: '600',
    minWidth: 28,
  },
  dateValue: {
    flex: 1,
    fontSize: Fonts.size.sm,
    color: Colors.textMuted,
  },
  dateValueSet: {
    color: Colors.textPrimary,
    fontFamily: Fonts.semibold, fontWeight: '600',
  },
  periodBlock: {
    borderRadius: Radius.md,
    overflow: 'hidden',
    gap: 1,
  },
  periodSep: {
    height: 1,
    backgroundColor: Colors.border,
  },

  // Sort
  sortRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
    flexWrap: 'wrap',
  },
  sortChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  sortChipWide: {
    flex: 1,
    justifyContent: 'center',
  },
  sortChipActive: {
    borderColor: Colors.bordeaux,
    backgroundColor: Colors.bordeaux,
  },
  sortChipText: {
    fontSize: Fonts.size.xs,
    fontFamily: Fonts.semibold, fontWeight: '600',
    color: Colors.textSecondary,
  },
  sortChipTextActive: {
    color: Colors.white,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  footerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
  },
  footerBtnReset: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  footerBtnApply: {
    backgroundColor: Colors.bordeaux,
  },
  footerBtnResetText: {
    fontSize: Fonts.size.sm,
    fontFamily: Fonts.semibold, fontWeight: '600',
    color: Colors.textSecondary,
  },
  footerBtnApplyText: {
    fontSize: Fonts.size.sm,
    fontFamily: Fonts.bold, fontWeight: '700',
    color: Colors.white,
  },
});
