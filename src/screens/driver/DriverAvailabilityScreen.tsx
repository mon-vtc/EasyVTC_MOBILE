import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Switch, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { AppIcon } from '../../components/common/AppIcon';
import { AppHeader } from '../../components/common/AppHeader';
import { Colors, Fonts, Spacing, Radius } from '../../theme/colors';
import { useDriver } from '../../hooks/useDriver';
import type { DayOfWeek, WeeklyScheduleDay, SetScheduleDto } from '../../types';
import { useToast } from '../../hooks/useToast';
import { useBottomInset } from '../../hooks/useSafeAreaPadding';
import CustomTimePickerModal  from '../../components/common/CustomTimePickerModal'


// ── Constants ────────────────────────────────────────────────────────────────
const DAYS_OF_WEEK: DayOfWeek[] = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
];

const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: 'Lundi',
  tuesday: 'Mardi',
  wednesday: 'Mercredi',
  thursday: 'Jeudi',
  friday: 'Vendredi',
  saturday: 'Samedi',
  sunday: 'Dimanche',
};

// ── Composants ────────────────────────────────────────────────────────────────

function DayScheduleCard({
  day,
  schedule,
  onToggle,
  onTimeChange,
}: {
  day: DayOfWeek;
  schedule: WeeklyScheduleDay;
  onToggle: (day: DayOfWeek, isAvailable: boolean) => void;
  onTimeChange: (day: DayOfWeek, field: 'start_time' | 'end_time', time: string) => void;
}) {
  const [showTimePicker, setShowTimePicker] = useState<'start' | 'end' | null>(null);

  const currentTime = showTimePicker === 'start'
    ? schedule.start_time
    : schedule.end_time;

  const handleTimeConfirm = (date: Date) => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    onTimeChange(day, showTimePicker === 'start' ? 'start_time' : 'end_time', `${hours}:${minutes}`);
    setShowTimePicker(null);
  };

  return (
    <View style={dayCardStyles.card}>
      <View style={dayCardStyles.header}>
        <Switch
          value={schedule.is_available}
          onValueChange={(value) => onToggle(day, value)}
          trackColor={{ false: Colors.border, true: Colors.bordeauxLight }}
          thumbColor={Colors.white}
          ios_backgroundColor={Colors.border}
        />
        <Text style={dayCardStyles.dayName}>{DAY_LABELS[day]}</Text>
        {schedule.is_available && (
          <Text style={dayCardStyles.statusText}>Disponible</Text>
        )}
      </View>

      {schedule.is_available && (
        <View style={dayCardStyles.timeRow}>
          <View style={dayCardStyles.timeField}>
            <Text style={dayCardStyles.timeLabel}>Début</Text>
            <TouchableOpacity
              style={dayCardStyles.timeInput}
              onPress={() => setShowTimePicker('start')}
            >
              <Text style={dayCardStyles.timeValue}>{schedule.start_time || '00:00'}</Text>
            </TouchableOpacity>
          </View>

          <View style={dayCardStyles.timeField}>
            <Text style={dayCardStyles.timeLabel}>Fin</Text>
            <TouchableOpacity
              style={dayCardStyles.timeInput}
              onPress={() => setShowTimePicker('end')}
            >
              <Text style={dayCardStyles.timeValue}>{schedule.end_time || '00:00'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <CustomTimePickerModal
        visible={!!showTimePicker}
        selectedTime={currentTime || '00:00'}
        onCancel={() => setShowTimePicker(null)}
        onConfirm={(time) => {
          if (showTimePicker) {
            onTimeChange(day, showTimePicker === 'start' ? 'start_time' : 'end_time', time);
          }
          setShowTimePicker(null);
        }}
      />

    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ÉCRAN PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════════
export default function DriverAvailabilityScreen() {
  const { weeklySchedule, isFetchingSchedule, fetchWeeklySchedule, updateWeeklySchedule, error} = useDriver();
  const [localSchedule, setLocalSchedule] = useState<WeeklyScheduleDay[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const footerBottomInset = useBottomInset(styles.footer.paddingBottom);

  const { showToast } = useToast();

  useEffect(() => {
    fetchWeeklySchedule();
  }, [fetchWeeklySchedule]);

  useEffect(() => {
    if (weeklySchedule) {
      setLocalSchedule(weeklySchedule.schedule);
    } else {
      // Initialize with default (all unavailable) if no schedule fetched yet
      setLocalSchedule(DAYS_OF_WEEK.map(day => ({
        day,
        is_available: false,
        start_time: null,
        end_time: null,
      })));
    }
  }, [weeklySchedule]);

  const handleToggleDay = useCallback((day: DayOfWeek, isAvailable: boolean) => {
    setLocalSchedule(prev => prev.map(item =>
      item.day === day
        ? { ...item, is_available: isAvailable, start_time: isAvailable ? '08:00' : null, end_time: isAvailable ? '20:00' : null }
        : item
    ));
  }, []);

  const handleTimeChange = useCallback((day: DayOfWeek, field: 'start_time' | 'end_time', time: string) => {
    setLocalSchedule(prev => prev.map(item =>
      item.day === day ? { ...item, [field]: time } : item
    ));
  }, []);

  const handleSaveSchedule = useCallback(async () => {
    setIsSaving(true);

    // --- Validation Côté Client ---
    for (const day of localSchedule) {
      if (day.is_available && day.start_time && day.end_time && day.start_time >= day.end_time) {
        showToast({
          title: 'Horaire invalide',
          message: `Pour ${DAY_LABELS[day.day]}, l'heure de fin doit être après l'heure de début.`,
          type: 'error',
        });
        setIsSaving(false);
        return;
      }
    }

    const dto: SetScheduleDto = { schedule: localSchedule };
    console.log(dto);
    const success = await updateWeeklySchedule(dto);
    setIsSaving(false);
    if (success) {
      showToast({title: 'Succès', message: 'Vos horaires ont été enregistrés.', type: 'success'})
    } else {
      showToast({title: 'Erreur', message: error || 'Impossible d\'enregistrer vos horaires. Veuillez réessayer.', type: 'error'});
    }
  }, [localSchedule, updateWeeklySchedule, showToast]);

  if (isFetchingSchedule && !weeklySchedule) {
  return (
    <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.bordeaux} />
        <Text style={styles.loadingText}>Chargement de vos horaires...</Text>
    </View>
  );
}

  return (
    <View style={styles.root}>
      <AppHeader left="menu" title="Disponibilité" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Introduction Card */}
        <LinearGradient
          colors={[Colors.bordeaux, Colors.bordeauxLight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.introCard}
        >
          <View style={styles.introCardHeader}>
            <AppIcon name="calendar-outline" size={24} color={Colors.white} />
            <Text style={styles.introCardTitle}>Planifiez vos horaires</Text>
          </View>
          <Text style={styles.introCardDescription}>
            Définissez vos créneaux de disponibilité pour recevoir des courses
          </Text>
        </LinearGradient>

        {/* List of Days */}
        {localSchedule.map(scheduleItem => (
          <DayScheduleCard
            key={scheduleItem.day}
            day={scheduleItem.day}
            schedule={scheduleItem}
            onToggle={handleToggleDay}
            onTimeChange={handleTimeChange}
          />
        ))}

        {/* Tip Block */}
        <View style={styles.tipCard}>
          <View style={styles.tipHeader}>
            <AppIcon name="information-circle-outline" size={18} color={"#BFDBFE"} />
            <Text style={styles.tipTitle}>Conseil</Text>
          </View>
          <Text style={styles.tipText}>
            Plus vous êtes disponible, plus vous recevez des demandes de courses.
            Pensez à mettre à jour vos horaires régulièrement.
          </Text>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: footerBottomInset }]}>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSaveSchedule}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.saveButtonText}>Enregistrer mes disponibilités</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: { // Used for initial loading state
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: Fonts.size.md,
    color: Colors.textSecondary,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl * 2, // Extra padding for footer
  },

  // Intro Card
  introCard: {
    borderRadius: Radius.xl,
    marginVertical: Spacing.sm,
    padding: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  introCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  introCardTitle: {
    fontSize: Fonts.size.xl,
    fontFamily: Fonts.bold, fontWeight: '700',
    color: Colors.white,
  },
  introCardDescription: {
    fontSize: Fonts.size.md,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 22,
  },

  // Tip Card
  tipCard: {
    backgroundColor: "#EFF6FF", // Assuming a light blue for tip
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: "#BFDBFE", // Assuming a darker blue for border
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  tipTitle: {
    fontSize: Fonts.size.sm,
    fontFamily: Fonts.bold, fontWeight: '700',
    color: "#1E3A8A",
  },
  tipText: {
    fontSize: Fonts.size.sm,
    color: "#1E40AF", // Assuming a darker blue for text
    lineHeight: 20,
  },

  // Footer
  footer: {
    backgroundColor: Colors.white,
    padding: Spacing.md,
    paddingBottom: Platform.OS === 'ios' ? Spacing.xxl : Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 10,
  },
  saveButton: {
    backgroundColor: Colors.bordeaux,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  saveButtonText: {
    color: Colors.white,
    fontSize: Fonts.size.lg,
    fontFamily: Fonts.bold, fontWeight: '700',
  },
});

const dayCardStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  dayName: {
    flex: 1,
    fontSize: Fonts.size.md,
    fontFamily: Fonts.semibold, fontWeight: '600',
    color: Colors.bordeaux,
    marginLeft: Spacing.md,
  },
  statusText: {
    fontSize: Fonts.size.sm,
    color: Colors.success,
    fontFamily: Fonts.medium, fontWeight: '500',
  },
  timeRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  timeField: {
    flex: 1,
  },
  timeLabel: {
    fontSize: Fonts.size.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  timeInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
  },
  timeValue: {
    fontSize: Fonts.size.md,
    color: Colors.textPrimary,
    fontFamily: Fonts.medium, fontWeight: '500',
  },
});
