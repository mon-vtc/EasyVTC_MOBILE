import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Image, Platform
} from 'react-native';
import { useDriver } from '../../hooks/useDriver';
import { Colors, Fonts, Spacing, Radius } from '../../theme/colors';
import { AppIcon } from '../../components/common/AppIcon';
import type { PlanningReservation } from '../../types/drivers.types';
import { Logo } from '../../constants/logo';
import { DrawerActions } from '@react-navigation/native';
const DAYS_SHORT = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

interface CalendarViewProps {
  onDateSelect: (date: string) => void;
  initialDate: Date;
  onMonthChange: (date: string) => void;
  reservations: PlanningReservation[];
}

const STATUS_PRIORITY: string[] = ['in_progress', 'driver_arrived', 'assigned', 'completed'];

const STATUS_COLORS: Record<string, string> = {
  in_progress: '#2E7D32', // Vert (En cours)
  driver_arrived: '#7B1FA2', // Violet (Arrivé)
  assigned: '#1976D2', // Bleu (Assignée)
  completed: Colors.beige, // Gris (Terminée)
};

function CalendarView({ onDateSelect, initialDate, onMonthChange, reservations }: CalendarViewProps) {
  const [viewDate, setViewDate] = useState(initialDate);
  const [selectedDay, setSelectedDay] = useState(initialDate.toISOString().split('T')[0]);

  const dailyStatusMap = useMemo(() => {
    const map = new Map<string, string>();
    reservations.forEach(r => {
      if (!r.scheduled_at) return;
      const date = r.scheduled_at.split('T')[0];
      const currentStatus = map.get(date);
      const currentPriority = currentStatus ? STATUS_PRIORITY.indexOf(currentStatus) : -1;
      const newPriority = STATUS_PRIORITY.indexOf(r.status);
      
      if (newPriority !== -1) {
        if (currentPriority === -1 || newPriority < currentPriority) {
          map.set(date, r.status);
        }
      } else if (currentPriority === -1 && r.status === 'completed') {
        // 'completed' a la priorité la plus basse, uniquement s'il n'y a pas d'autre statut prioritaire
        if (!map.has(date) || map.get(date) === undefined) {
          map.set(date, r.status);
        }
      }
    });
    return map;
  }, [reservations]);

  const changeMonth = (offset: number) => {
    setViewDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + offset);
      onMonthChange(newDate.toISOString().split('T')[0]);
      return newDate;
    });
  };

  const handleDatePress = (day: number) => {
    if (!viewDate) return;
    const newSelectedDate = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDay(newSelectedDate);
    onDateSelect(newSelectedDate);
  };

  const buildCells = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const offset = (firstDay === 0 ? 6 : firstDay - 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (number | null)[] = [
      ...Array(offset).fill(null),
      ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  };

  const cells = buildCells();

  return (
    <View style={calStyles.card}>
      <View style={calStyles.nav}>
        <TouchableOpacity onPress={() => changeMonth(-1)} style={calStyles.navBtn}>
          <AppIcon name="chevron-back-outline" size={20} color={Colors.bordeaux} />
        </TouchableOpacity>
        <Text style={calStyles.navTitle}>{MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}</Text>
        <TouchableOpacity onPress={() => changeMonth(1)} style={calStyles.navBtn}>
          <AppIcon name="chevron-forward-outline" size={20} color={Colors.bordeaux} />
        </TouchableOpacity>
      </View>

      <View style={calStyles.weekRow}>
        {DAYS_SHORT.map(d => <Text key={d} style={calStyles.weekDay}>{d}</Text>)}
      </View>

      <View style={calStyles.grid}>
        {cells.map((day, idx) => {
          if (!day) return <View key={`empty-${idx}`} style={calStyles.cell} />;
          if (!viewDate) return null;
          const dateStr = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isSelected = dateStr === selectedDay;
          const dayStatus = dailyStatusMap.get(dateStr);
          const cellStyle: any[] = [calStyles.cell];
          if (isSelected) {
            cellStyle.push(calStyles.cellSelected);
          } else if (dayStatus && STATUS_COLORS[dayStatus]) {
            cellStyle.push({ backgroundColor: STATUS_COLORS[dayStatus], borderRadius: Radius.md });
          }

          return (
            <TouchableOpacity key={`day-${day}`} style={cellStyle} onPress={() => handleDatePress(day)}>
              <Text style={[calStyles.cellText, (isSelected || (!!dayStatus && dayStatus !== 'completed')) && calStyles.cellTextSelected]}>
                {day}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function RideInfoCard({ item, onPress }: { item: PlanningReservation, onPress: () => void }) {
  const time = new Date(item.scheduled_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  return (
    <TouchableOpacity style={rideStyles.card} onPress={onPress}>
      <View style={rideStyles.timeCol}>
        <Text style={rideStyles.timeText}>{time}</Text>
      </View>
      <View style={rideStyles.detailsCol}>
        <View style={rideStyles.route}>
          <AppIcon name="radio-button-on-outline" size={14} color={Colors.bordeaux} />
          <Text style={rideStyles.address} numberOfLines={1}>{item.pickup_address}</Text>
        </View>
        <View style={rideStyles.route}>
          <AppIcon name="location-outline" size={14} color={Colors.bordeaux} />
          <Text style={rideStyles.address} numberOfLines={1}>{item.dest_address}</Text>
        </View>
        <Text style={rideStyles.client}>Client: {item.client?.first_name} {item.client?.last_name}</Text>
      </View>
      <View style={rideStyles.arrowCol}>
        <AppIcon name="chevron-forward-outline" size={20} color={Colors.textMuted} />
      </View>
    </TouchableOpacity>
  );
}

export default function DriverPlanningScreen({ navigation }: any) {
  const { getMyPlanning } = useDriver();
  // `displayDate` est utilisé pour filtrer la liste. null = tout le mois.
  const [displayDate, setDisplayDate] = useState<string | null>(new Date().toISOString().split('T')[0]);
  const [allReservations, setAllReservations] = useState<PlanningReservation[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date()); // Date de référence pour le calendrier et le refresh
  const [isLoading, setIsLoading] = useState(false);
  const fetchAllReservationsForMonth = useCallback(async (date: string) => {
    setIsLoading(true);
    setDisplayDate(null); // Affiche toutes les courses du mois par défaut
    try {
      const result = await getMyPlanning('month', date);
      if (result?.reservations) {
        setAllReservations(result.reservations);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération du planning:", error);
    } finally {
      setIsLoading(false);
    }
  }, [getMyPlanning]);

  useEffect(() => {
    fetchAllReservationsForMonth(new Date().toISOString().split('T')[0]);
  }, [fetchAllReservationsForMonth]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const dateToRefresh = currentDate.toISOString().split('T')[0];
    await fetchAllReservationsForMonth(dateToRefresh);
    setRefreshing(false);
  }, [currentDate, fetchAllReservationsForMonth]);

  const ridesToDisplay = useMemo(() => {
    const sortedReservations = allReservations
      .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());

    if (displayDate) {
      return sortedReservations.filter(r => r.scheduled_at?.startsWith(displayDate));
    }
    return sortedReservations; // Affiche tout le mois
  }, [allReservations, displayDate]);

  const handleDateSelect = (date: string) => {
    setCurrentDate(new Date(date));
    setDisplayDate(date); // Filtre la liste pour ce jour
  };

  const handleMonthChange = (date: string) => {
    setCurrentDate(new Date(date));
    fetchAllReservationsForMonth(date);
  };

  const headerText = displayDate
    ? `Courses pour le ${new Date(displayDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`
    : `Toutes les courses du mois`;

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        {/* Barre de navigation : hamburger | logo | notif */}
        <View style={styles.headerNav}>
          <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())} style={styles.navBtn}>
            <AppIcon name="menu-outline" size={28} color={Colors.white} />
          </TouchableOpacity>
          <Image source={Logo.LogoEasyVTC} style={styles.logo} resizeMode="contain" />
          <TouchableOpacity style={styles.navBtn} onPress={() => navigation.navigate('DriverNotifications')}>
            <AppIcon name="notifications-outline" size={24} color={Colors.white} />
          </TouchableOpacity>
        </View>
        {/* Sous-header : titre */}
      </View>
      <CalendarView 
        onDateSelect={handleDateSelect}
        initialDate={currentDate}
        onMonthChange={handleMonthChange}
        reservations={allReservations} 
      />
      <Text style={styles.listHeader}>
        {headerText}
      </Text>
      {(isLoading && !refreshing) ? (
        <ActivityIndicator style={{ marginTop: 20 }} color={Colors.bordeaux} />
      ) : (
        <FlatList
          data={ridesToDisplay}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <RideInfoCard item={item} onPress={() => navigation.navigate('DriverReservationDetails', { reservationId: item.id })} />
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>Aucune course prévue pour cette date.</Text>}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
      backgroundColor: Colors.bordeaux,
      paddingHorizontal: Spacing.md,
      paddingTop: Platform.OS === 'ios' ? 56 : Spacing.xxl,
      paddingBottom: Spacing.lg,
    },
    headerNav: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: 44,
    },
    navBtn:      { padding: 4, width: 36, alignItems: 'center' },
    logo:        { width: 40, height: 40 },  
  listHeader: {
    fontSize: Fonts.size.md,
    fontWeight: '700',
    color: Colors.textPrimary,
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  listContainer: {
    paddingHorizontal: Spacing.md,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: Spacing.lg,
    color: Colors.textMuted,
  },
});

const calStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    margin: Spacing.md,
    padding: Spacing.sm,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  nav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    marginBottom: Spacing.md,
  },
  navBtn: {
    padding: Spacing.xs,
  },
  navTitle: {
    fontSize: Fonts.size.md,
    fontWeight: 'bold',
    color: Colors.bordeaux,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.sm,
  },
  weekDay: {
    fontSize: Fonts.size.xs,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellSelected: {
    backgroundColor: Colors.bordeaux,
    borderRadius: 100,
  },
  cellText: {
    fontSize: Fonts.size.sm,
    color: Colors.textPrimary,
  },
  cellTextSelected: {
    color: Colors.white,
    fontWeight: 'bold',
  },
});

const rideStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    alignItems: 'center',
    elevation: 1,
  },
  timeCol: {
    marginRight: Spacing.md,
    alignItems: 'center',
  },
  timeText: {
    fontSize: Fonts.size.md,
    fontWeight: 'bold',
    color: Colors.bordeaux,
  },
  detailsCol: {
    flex: 1,
  },
  route: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: 4,
  },
  address: {
    fontSize: Fonts.size.sm,
    color: Colors.textPrimary,
  },
  client: {
    fontSize: Fonts.size.xs,
    color: Colors.textMuted,
    marginTop: 4,
  },
  arrowCol: {
    marginLeft: Spacing.sm,
  },
});
